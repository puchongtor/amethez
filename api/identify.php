<?php
/* ═══ Crystal Atlas — Stone Identify + Chat proxy ═══
 * Vision/chat stay server-side (api/config.php). Browser never sees keys.
 * Actions:
 *   POST { action: "analyze", image: "data:image/...;base64,..." }
 *   POST { action: "chat", messages: [...], context: { candidates: [...] } }
 *
 * Analyze uses free-form geological ID (Rock Identifier style) via Gemini,
 * then optionally enriches matches from data/identify-catalog.json.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

function identify_rate_limit_ok($ip, $bucket, $max, $window) {
    $dir = sys_get_temp_dir() . '/atlas_identify_rl';
    if (!is_dir($dir)) { @mkdir($dir, 0700, true); }
    $file = $dir . '/' . md5($ip . ':' . $bucket) . '.json';
    $now = time();
    $data = ['count' => 0, 'reset' => $now + $window];
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        $decoded = $raw ? json_decode($raw, true) : null;
        if (is_array($decoded) && isset($decoded['count'], $decoded['reset'])) $data = $decoded;
    }
    if ($now > $data['reset']) {
        $data = ['count' => 0, 'reset' => $now + $window];
    }
    $data['count']++;
    @file_put_contents($file, json_encode($data));
    return $data['count'] <= $max;
}

function identify_norm($s) {
    $s = mb_strtolower(trim((string)$s));
    $s = preg_replace('/[\s_\-–—\/\\\\]+/u', ' ', $s);
    $s = preg_replace('/[^\p{L}\p{N}\s]/u', '', $s);
    return trim(preg_replace('/\s+/u', ' ', $s));
}

function identify_catalog_index($catalog) {
    $byId = [];
    $exact = []; // normalized name/alias -> id
    foreach ($catalog as $s) {
        if (empty($s['id'])) continue;
        $byId[$s['id']] = $s;
        $names = array_filter([
            $s['name_en'] ?? '',
            $s['name_th'] ?? '',
            ...($s['aliases'] ?? []),
        ]);
        foreach ($names as $n) {
            $k = identify_norm($n);
            if ($k === '') continue;
            // First exact spelling wins (aliases listed after official names)
            if (!isset($exact[$k])) $exact[$k] = $s['id'];
            $compact = str_replace(' ', '', $k);
            if ($compact !== '' && $compact !== $k && !isset($exact[$compact])) {
                $exact[$compact] = $s['id'];
            }
        }
    }
    return [$byId, $exact];
}

/**
 * Strict catalog match: exact id / exact name / exact alias only.
 * Longest alias wins when several aliases equal the query after normalize.
 * No loose substring matching (avoids "quartz" hijacking every quartz variety).
 */
function identify_match_stone($name, $idHint, $byId, $exact) {
    if (!empty($idHint) && isset($byId[$idHint])) {
        return $byId[$idHint];
    }
    $key = identify_norm($name);
    if ($key === '') return null;
    if (isset($exact[$key]) && isset($byId[$exact[$key]])) {
        return $byId[$exact[$key]];
    }
    $compact = str_replace(' ', '', $key);
    if (isset($exact[$compact]) && isset($byId[$exact[$compact]])) {
        return $byId[$exact[$compact]];
    }

    // Longest exact alias that equals a trailing/leading variety phrase
    // e.g. "Dark Amethyst" → match "amethyst" only if full alias length >= 5
    // and the alias is a complete token sequence inside the query
    $bestId = null;
    $bestLen = 0;
    foreach ($exact as $alias => $id) {
        $len = mb_strlen($alias);
        if ($len < 5) continue;
        if ($alias === $key) {
            if ($len > $bestLen) { $bestLen = $len; $bestId = $id; }
            continue;
        }
        // Token-boundary containment both ways (multi-word safe)
        $pattern = '/(?:^| )' . preg_quote($alias, '/') . '(?:$| )/u';
        if (preg_match($pattern, $key) && $len > $bestLen) {
            $bestLen = $len;
            $bestId = $id;
        }
    }
    if ($bestId && isset($byId[$bestId])) return $byId[$bestId];
    return null;
}

function identify_slug($nameEn) {
    $s = strtolower(trim((string)$nameEn));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    $s = trim($s, '-');
    return $s !== '' ? $s : 'unknown-stone';
}

function identify_gemini_model($config) {
    $fromConfig = trim((string)($config['gemini_identify_model'] ?? ''));
    if ($fromConfig !== '') return $fromConfig;
    $fromEnv = trim((string)(getenv('GEMINI_IDENTIFY_MODEL') ?: ''));
    if ($fromEnv !== '') return $fromEnv;
    return 'gemini-2.5-flash';
}

function identify_call_gemini_json($apiKey, $model, $systemPrompt, $userParts, $maxTokens = 1200) {
    $payload = [
        'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
        'contents' => [['role' => 'user', 'parts' => $userParts]],
        'generationConfig' => [
            'maxOutputTokens' => $maxTokens,
            'temperature' => 0.2,
            'responseMimeType' => 'application/json',
        ],
    ];
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        . rawurlencode($model)
        . ':generateContent?key=' . urlencode($apiKey);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 55,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($response === false) return ['ok' => false, 'error' => 'เชื่อมต่อ AI ไม่สำเร็จ: ' . $curlErr, 'http' => 0];
    $data = json_decode($response, true);
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
    if ($httpCode >= 200 && $httpCode < 300 && $text) {
        $json = json_decode($text, true);
        if (is_array($json)) return ['ok' => true, 'json' => $json, 'raw' => $text];
        return ['ok' => true, 'json' => null, 'raw' => $text];
    }
    return ['ok' => false, 'error' => 'Gemini ตอบกลับไม่สำเร็จ', 'raw' => $data, 'http' => $httpCode];
}

function identify_call_gemini_text($apiKey, $model, $systemPrompt, $messages, $maxTokens = 220) {
    $contents = [];
    foreach ($messages as $m) {
        $contents[] = [
            'role' => $m['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $m['content']]],
        ];
    }
    $payload = [
        'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
        'contents' => $contents,
        'generationConfig' => ['maxOutputTokens' => $maxTokens, 'temperature' => 0.85],
    ];
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        . rawurlencode($model)
        . ':generateContent?key=' . urlencode($apiKey);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 25,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($response === false) return ['ok' => false, 'error' => 'เชื่อมต่อ AI ไม่สำเร็จ: ' . $curlErr];
    $data = json_decode($response, true);
    $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
    if ($httpCode >= 200 && $httpCode < 300 && $reply) return ['ok' => true, 'reply' => $reply];
    return ['ok' => false, 'error' => 'Gemini ตอบกลับไม่สำเร็จ'];
}

function identify_call_groq_text($apiKey, $systemPrompt, $messages) {
    $payload = [
        'model' => 'llama-3.1-8b-instant',
        'messages' => array_merge([['role' => 'system', 'content' => $systemPrompt]], $messages),
        'max_tokens' => 180,
        'temperature' => 0.8,
    ];
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 25,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($response === false) return ['ok' => false, 'error' => 'เชื่อมต่อ AI ไม่สำเร็จ: ' . $curlErr];
    $data = json_decode($response, true);
    $reply = $data['choices'][0]['message']['content'] ?? null;
    if ($httpCode >= 200 && $httpCode < 300 && $reply) return ['ok' => true, 'reply' => $reply];
    return ['ok' => false, 'error' => 'AI ตอบกลับไม่สำเร็จ'];
}

function identify_enrich_candidates($rawCandidates, $catalog) {
    [$byId, $exact] = identify_catalog_index($catalog);
    $candidates = [];

    foreach ($rawCandidates as $c) {
        if (!is_array($c)) continue;

        $nameEn = trim((string)($c['species_en'] ?? $c['name_en'] ?? ''));
        $nameTh = trim((string)($c['species_th'] ?? $c['name_th'] ?? ''));
        $variety = trim((string)($c['variety'] ?? ''));
        if ($variety !== '' && $nameEn !== '' && stripos($nameEn, $variety) === false) {
            $displayEn = $nameEn . ' (' . $variety . ')';
        } else {
            $displayEn = $nameEn !== '' ? $nameEn : 'Unknown';
        }
        if ($nameTh === '') $nameTh = 'ยังไม่ทราบชื่อ';

        $matched = identify_match_stone($nameEn, $c['id'] ?? null, $byId, $exact);
        if (!$matched && $nameTh !== 'ยังไม่ทราบชื่อ') {
            $matched = identify_match_stone($nameTh, null, $byId, $exact);
        }

        $lookalikes = [];
        if (is_array($c['lookalikes'] ?? null)) {
            foreach (array_slice($c['lookalikes'], 0, 4) as $lk) {
                $lookalikes[] = is_string($lk) ? trim($lk) : '';
            }
            $lookalikes = array_values(array_filter($lookalikes));
        }

        $rockClass = trim((string)($c['rock_class'] ?? ($matched['rock_class'] ?? 'mineral')));
        $mohs = trim((string)($c['mohs_guess'] ?? ''));

        $entry = [
            'id' => $matched['id'] ?? identify_slug($nameEn),
            'name_en' => $matched['name_en'] ?? $displayEn,
            'name_th' => $matched['name_th'] ?? $nameTh,
            'species_en' => $nameEn !== '' ? $nameEn : ($matched['name_en'] ?? $displayEn),
            'species_th' => $nameTh,
            'variety' => $variety,
            'confidence' => max(0, min(100, (int)($c['confidence'] ?? 50))),
            'reason' => trim((string)($c['reason'] ?? '')),
            'price_range_th' => trim((string)($c['price_range_th'] ?? '')),
            'in_catalog' => (bool)$matched,
            'tier' => $matched['tier'] ?? 'lite',
            'meaning_short' => $matched['meaning_short'] ?? '',
            'tags' => $matched['tags'] ?? [],
            'visual_cues' => $matched['visual_cues'] ?? '',
            'article_url' => $matched['article_url'] ?? null,
            'rock_class' => $rockClass !== '' ? $rockClass : null,
            'mohs_guess' => $mohs,
            'lookalikes' => $lookalikes,
            'color' => $matched['color'] ?? null,
            'emoji' => $matched['emoji'] ?? '🪨',
        ];
        $candidates[] = $entry;
        if (count($candidates) >= 5) break;
    }

    if (!$candidates) {
        $unk = $byId['unknown-stone'] ?? null;
        $candidates[] = [
            'id' => 'unknown-stone',
            'name_en' => 'Unidentified Stone',
            'name_th' => 'ยังระบุไม่ชัด',
            'species_en' => 'Unidentified Stone',
            'species_th' => 'ยังระบุไม่ชัด',
            'variety' => '',
            'confidence' => 35,
            'reason' => 'จากรูปยังจับลักษณะเด่นไม่พอ อยากได้มุมใกล้ๆ แสงธรรมชาติ หรือพื้นหลังเรียบกว่านี้อีกหน่อยค่ะ',
            'price_range_th' => '',
            'in_catalog' => (bool)$unk,
            'tier' => 'bucket',
            'meaning_short' => $unk['meaning_short'] ?? '',
            'tags' => $unk['tags'] ?? [],
            'visual_cues' => $unk['visual_cues'] ?? '',
            'article_url' => null,
            'rock_class' => 'mineral',
            'mohs_guess' => '',
            'lookalikes' => [],
            'color' => null,
            'emoji' => '🪨',
        ];
    }

    return $candidates;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'คำขอไม่ถูกต้อง']);
    exit;
}

$action = $body['action'] ?? 'analyze';

/* Feature flag — Identify paused until accuracy is ready */
$featuresPath = dirname(__DIR__) . '/data/site-features.json';
$identifyEnabled = false;
if (is_file($featuresPath)) {
    $feat = json_decode(@file_get_contents($featuresPath), true);
    $identifyEnabled = is_array($feat) && !empty($feat['identify_enabled']);
}
// Optional header for admin machine tests after enabling local force-on + publish still off
$forceHeader = strtolower((string)($_SERVER['HTTP_X_AMETHEZ_IDENTIFY_FORCE'] ?? '')) === '1';
if (!$identifyEnabled && !$forceHeader) {
    http_response_code(503);
    echo json_encode([
        'error' => 'Atlas Identify ปิดปรับปรุงชั่วคราว เพื่อทดสอบความแม่นยำภายในก่อนเปิดสาธารณะค่ะ',
        'disabled' => true,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'ระบบยังไม่ได้ตั้งค่า']);
    exit;
}
$config = require $configPath;
$geminiKey = $config['gemini_api_key'] ?? '';
$groqKey = $config['groq_api_key'] ?? '';
$geminiModel = identify_gemini_model($config);
if (!$geminiKey && !$groqKey) {
    http_response_code(500);
    echo json_encode(['error' => 'ระบบยังไม่ได้ตั้งค่า']);
    exit;
}

$catalogPath = dirname(__DIR__) . '/data/identify-catalog.json';
$catalog = [];
if (is_file($catalogPath)) {
    $catRaw = json_decode(file_get_contents($catalogPath), true);
    $catalog = is_array($catRaw['stones'] ?? null) ? $catRaw['stones'] : [];
}

/* ── ANALYZE ── */
if ($action === 'analyze') {
    if (!identify_rate_limit_ok($ip, 'analyze', 12, 86400)) {
        http_response_code(429);
        echo json_encode(['error' => 'วันนี้สแกนครบโควต้าแล้ว ลองใหม่พรุ่งนี้ หรือทัก Line @amethez ได้ค่ะ', 'quota' => true]);
        exit;
    }

    $image = (string)($body['image'] ?? '');
    if (!preg_match('#^data:(image/(jpeg|jpg|png|webp));base64,(.+)$#i', $image, $m)) {
        http_response_code(400);
        echo json_encode(['error' => 'รูปไม่ถูกต้อง ส่งเป็น JPEG/PNG/WebP นะคะ']);
        exit;
    }
    $mime = strtolower($m[1]) === 'image/jpg' ? 'image/jpeg' : strtolower($m[1]);
    $b64 = $m[3];
    if (strlen($b64) > 6500000) {
        http_response_code(413);
        echo json_encode(['error' => 'รูปใหญ่ไปหน่อย ลองบีบอัดหรือถ่ายใหม่ค่ะ']);
        exit;
    }

    if (!$geminiKey) {
        http_response_code(503);
        echo json_encode(['error' => 'โหมดวิเคราะห์รูปยังไม่พร้อม กรุณาลองใหม่ภายหลังค่ะ']);
        exit;
    }

    $system = <<<'EOT'
You are Crystal Atlas, a careful field mineralogist + friendly Thai guide for Amethez (knowledge hub — NOT a shop).

Identify the specimen in the photo using geological visual diagnostics — like a Rock Identifier app.
You may name ANY real rock, mineral, crystal, gemstone, fossil, or meteorite/tektite.
Do NOT limit yourself to a short shop catalog. Prefer the most precise species/variety that the photo supports.

Analyze (when visible): color & zoning, luster (vitreous/waxy/metallic/earthy), transparency, crystal habit / cleavage / fracture, grain size, banding/foliation/vesicles, matrix vs crystal, polish vs rough, weathering.

Return ONLY JSON:
{
  "atlas_line": "1-2 short Thai sentences, female voice (ค่ะ/นะคะ), warm, hooky — what it might be + rough price vibe",
  "candidates": [
    {
      "id": null,
      "species_en": "English species or rock name",
      "species_th": "Thai common name (transliterate if needed)",
      "variety": "optional variety e.g. Rose / Smoky / or empty",
      "rock_class": "mineral|gemstone|igneous|sedimentary|metamorphic|fossil|tektite|organic|rock",
      "mohs_guess": "e.g. 7 or 3-4 or empty if unknown",
      "confidence": 0-100,
      "reason": "2 short Thai sentences citing visual cues (luster/habit/grain/etc.)",
      "lookalikes": ["English names of confusing lookalikes"],
      "price_range_th": "rough Thai market vibe text, or empty",
      "in_catalog": false
    }
  ],
  "need_more": false,
  "follow_up": "optional short Thai question to narrow (hardness feel, streak, wet vs dry, another angle)"
}

Rules:
- Give 3–5 candidates sorted by confidence descending.
- Use full mineralogy knowledge; common pebbles may be granite / basalt / limestone / quartzite / chalcedony — name them honestly.
- If unsure, lower confidence and add lookalikes; do not invent rare gem certainty from a blurry phone photo.
- Never claim lab certification. Preliminary visual ID only.
- Price is rough Thai market vibe only (not an appraisal / not for buying).
- atlas_line must be Thai, short, human — not an encyclopedia dump.
- Leave "id" null unless you are highly sure it is a classic healing-stone name (amethyst, rose quartz, etc.); matching to Amethez encyclopedia happens server-side.
EOT;

    $parts = [
        ['text' => 'Identify this specimen with free-form geological vision. Respond as JSON only.'],
        ['inline_data' => ['mime_type' => $mime, 'data' => $b64]],
    ];

    $result = identify_call_gemini_json($geminiKey, $geminiModel, $system, $parts, 1400);

    // Fallback if 2.5 model unavailable on this key
    if (!$result['ok'] && $geminiModel !== 'gemini-2.0-flash') {
        $result = identify_call_gemini_json($geminiKey, 'gemini-2.0-flash', $system, $parts, 1400);
        if ($result['ok']) $geminiModel = 'gemini-2.0-flash';
    }

    if (!$result['ok'] || !is_array($result['json'] ?? null)) {
        http_response_code(502);
        echo json_encode(['error' => $result['error'] ?? 'วิเคราะห์ไม่สำเร็จ ลองถ่ายใหม่ในแสงธรรมชาติค่ะ']);
        exit;
    }

    $json = $result['json'];
    $rawCandidates = is_array($json['candidates'] ?? null) ? $json['candidates'] : [];
    $candidates = identify_enrich_candidates($rawCandidates, $catalog);

    echo json_encode([
        'atlas_line' => trim((string)($json['atlas_line'] ?? 'ส่งรูปมาให้ดูแล้วค่ะ ลองดูตัวเลือกด้านล่างนะคะ')),
        'candidates' => $candidates,
        'need_more' => (bool)($json['need_more'] ?? false),
        'follow_up' => trim((string)($json['follow_up'] ?? '')),
        'disclaimer' => 'ผลนี้เป็นการตรวจเบื้องต้นจากรูป ไม่ใช่ใบรับรองแล็บ',
        'model' => $geminiModel,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ── CHAT ── */
if ($action === 'chat') {
    if (!identify_rate_limit_ok($ip, 'chat', 40, 3600)) {
        http_response_code(429);
        echo json_encode(['error' => 'คุยถี่ไปนิด พักแป๊บแล้วลองใหม่นะคะ']);
        exit;
    }

    $messages = is_array($body['messages'] ?? null) ? $body['messages'] : [];
    $messages = array_slice($messages, -10);
    $clean = [];
    foreach ($messages as $m) {
        $role = ($m['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
        $content = trim((string)($m['content'] ?? ''));
        if ($content === '') continue;
        $clean[] = ['role' => $role, 'content' => mb_substr($content, 0, 1200)];
    }
    if (!$clean) {
        http_response_code(400);
        echo json_encode(['error' => 'ไม่มีข้อความ']);
        exit;
    }

    $ctx = is_array($body['context'] ?? null) ? $body['context'] : [];
    $ctxBits = [];
    if (!empty($ctx['selected'])) {
        $sel = $ctx['selected'];
        $ctxBits[] = 'หินที่ผู้ใช้เลือกคุย: ' . ($sel['name_th'] ?? '') . ' / ' . ($sel['name_en'] ?? '') . ' (id=' . ($sel['id'] ?? '') . ')';
        if (!empty($sel['rock_class'])) $ctxBits[] = 'ประเภท: ' . $sel['rock_class'];
        if (!empty($sel['mohs_guess'])) $ctxBits[] = 'Mohs คร่าวๆ: ' . $sel['mohs_guess'];
        if (!empty($sel['meaning_short'])) $ctxBits[] = 'ความหมายสั้น: ' . $sel['meaning_short'];
        if (!empty($sel['in_catalog'])) $ctxBits[] = 'มีในสารานุกรม Amethez';
        else $ctxBits[] = 'นอกสารานุกรม — ระบุจากลักษณะธรณีวิทยา';
    }
    if (!empty($ctx['candidates']) && is_array($ctx['candidates'])) {
        $names = [];
        foreach (array_slice($ctx['candidates'], 0, 5) as $c) {
            $names[] = ($c['name_th'] ?? '') . ' (' . ($c['confidence'] ?? '?') . '%)';
        }
        $ctxBits[] = 'ตัวเลือกจากสแกน: ' . implode(', ', $names);
    }
    $ctxBlock = $ctxBits ? ("\n\nบริบทรอบนี้:\n- " . implode("\n- ", $ctxBits)) : '';

    $systemPrompt = <<<EOT
คุณคือ "Crystal Atlas" ไกด์ความรู้หินของ Amethez — ผู้หญิง อบอุ่น มั่นใจ คุยเหมือนคนจริง

## ตัวตน
- Amethez เป็นศูนย์ข้อมูล / ฮับความรู้หิน ไม่ใช่ร้านค้า และไม่ได้รับซื้อหิน
- คุณช่วยดูเบื้องต้นจากรูป บอกชื่อที่เป็นไปได้ ความหมายสั้นๆ และราคาตลาดคร่าวๆ ได้
- ระบุได้ทั้งหิน/แร่ทั่วไป ไม่จำกัดแค่หินมงคลในคลัง

## คำลงท้าย
- ใช้ "ค่ะ"/"นะคะ" เท่านั้น ห้ามใช้ครับ
- เรียกตัวเองว่า "ฉัน" หรือ "Atlas" ก็ได้

## วิธีคุย — สำคัญที่สุด
- ตอบ 1-3 ประโยคสั้นๆ แบบแชทเพื่อน ไม่ใช่บทความยาว
- ห้าม bullet / หัวข้อ / ตัวหนา / ลิสต์ยาว
- ถามกลับสั้นๆ ได้เมื่อช่วยแคบผล
- ไม่ฟันธง 100% — ใช้คำว่า น่าจะ / เอนไปทาง / จากรูป / คร่าวๆ
- ราคาพูดได้แค่ช่วงประมาณ (เช่น หลักร้อย–หลักพัน ขึ้นกับขนาดคุณภาพ) ห้ามประเมินเพื่อรับซื้อ
- ถ้าอยากรู้ลึก ชวนไปอ่านสารานุกรม ห้ามเล่าทั้งหน้าในแชท
- ห้ามใส่ลิงก์เอง ห้ามขายตรง

## ถ้าถูกถามว่ารับซื้อไหม / รับหินไหม / อยากขายให้ร้าน
- บอกชัดว่าเราเป็นเว็บให้ข้อมูล ไม่ใช่ร้านค้า และไม่ได้รับซื้อ
- แล้วแนะนำช่องทางขายแบบเพื่อนช่วยคิด เช่น โพสในกลุ่มขายหินบนเฟซบุ๊ก หรือลงขายบน Shopee (และตลาดออนไลน์อื่นที่เขาถนัด)
- โทนอบอุ่น ไม่เย็นชา ไม่ด่า ไม่ผลักไส

## ตัวอย่างโทน
ลูกค้า: "รับซื้อไหมคะ"
Atlas: "เราเป็นเว็บให้ข้อมูลนะคะ ไม่ได้รับซื้อค่ะ ถ้าจะขาย ลองโพสกลุ่มขายหินในเฟซ หรือลง Shopee ดูได้นะคะ อยากให้ช่วยดูก่อนไหมว่าก้อนนี้น่าจะเป็นอะไร"
$ctxBlock
EOT;

    $result = null;
    if ($geminiKey) {
        $result = identify_call_gemini_text($geminiKey, $geminiModel, $systemPrompt, $clean, 220);
        if ((!$result || !$result['ok']) && $geminiModel !== 'gemini-2.0-flash') {
            $result = identify_call_gemini_text($geminiKey, 'gemini-2.0-flash', $systemPrompt, $clean, 220);
        }
    }
    if ((!$result || !$result['ok']) && $groqKey) {
        $result = identify_call_groq_text($groqKey, $systemPrompt, $clean);
    }

    if ($result && $result['ok']) {
        echo json_encode(['reply' => $result['reply']], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(502);
        echo json_encode(['error' => $result['error'] ?? 'AI ตอบกลับไม่สำเร็จ']);
    }
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'action ไม่รู้จัก']);
