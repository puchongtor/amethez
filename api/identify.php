<?php
/* ═══ Crystal Atlas — Stone Identify + Chat proxy ═══
 * Vision/chat stay server-side (api/config.php). Browser never sees keys.
 * Actions:
 *   POST { action: "analyze", image: "data:image/...;base64,..." }
 *   POST { action: "chat", messages: [...], context: { candidates: [...] } }
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

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'คำขอไม่ถูกต้อง']);
    exit;
}

$action = $body['action'] ?? 'analyze';

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'ระบบยังไม่ได้ตั้งค่า', 'fallback' => true]);
    exit;
}
$config = require $configPath;
$geminiKey = $config['gemini_api_key'] ?? '';
$groqKey = $config['groq_api_key'] ?? '';
if (!$geminiKey && !$groqKey) {
    http_response_code(500);
    echo json_encode(['error' => 'ระบบยังไม่ได้ตั้งค่า', 'fallback' => true]);
    exit;
}

$catalogPath = dirname(__DIR__) . '/data/identify-catalog.json';
$catalog = [];
if (is_file($catalogPath)) {
    $catRaw = json_decode(file_get_contents($catalogPath), true);
    $catalog = is_array($catRaw['stones'] ?? null) ? $catRaw['stones'] : [];
}

function identify_catalog_index($catalog) {
    $byId = [];
    $byName = [];
    foreach ($catalog as $s) {
        $byId[$s['id']] = $s;
        $byName[mb_strtolower($s['name_en'] ?? '')] = $s['id'];
        $byName[mb_strtolower($s['name_th'] ?? '')] = $s['id'];
        foreach ($s['aliases'] ?? [] as $a) {
            $byName[mb_strtolower($a)] = $s['id'];
        }
    }
    return [$byId, $byName];
}

function identify_match_stone($name, $byId, $byName) {
    $key = mb_strtolower(trim((string)$name));
    if ($key === '') return null;
    if (isset($byId[$key])) return $byId[$key];
    if (isset($byName[$key])) return $byId[$byName[$key]] ?? null;
    foreach ($byName as $n => $id) {
        if ($n !== '' && (mb_strpos($key, $n) !== false || mb_strpos($n, $key) !== false)) {
            return $byId[$id] ?? null;
        }
    }
    return null;
}

function identify_call_gemini_json($apiKey, $systemPrompt, $userParts, $maxTokens = 900) {
    $payload = [
        'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
        'contents' => [['role' => 'user', 'parts' => $userParts]],
        'generationConfig' => [
            'maxOutputTokens' => $maxTokens,
            'temperature' => 0.4,
            'responseMimeType' => 'application/json',
        ],
    ];
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . urlencode($apiKey);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 45,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($response === false) return ['ok' => false, 'error' => 'เชื่อมต่อ AI ไม่สำเร็จ: ' . $curlErr];
    $data = json_decode($response, true);
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
    if ($httpCode >= 200 && $httpCode < 300 && $text) {
        $json = json_decode($text, true);
        if (is_array($json)) return ['ok' => true, 'json' => $json, 'raw' => $text];
        return ['ok' => true, 'json' => null, 'raw' => $text];
    }
    return ['ok' => false, 'error' => 'Gemini ตอบกลับไม่สำเร็จ', 'raw' => $data];
}

function identify_call_gemini_text($apiKey, $systemPrompt, $messages, $maxTokens = 220) {
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
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . urlencode($apiKey);
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
        echo json_encode(['error' => 'โหมดวิเคราะห์รูปยังไม่พร้อม', 'fallback' => true]);
        exit;
    }

    $nameList = array_slice(array_map(function ($s) {
        return ($s['name_en'] ?? '') . ' / ' . ($s['name_th'] ?? '') . ' [' . ($s['id'] ?? '') . ']';
    }, $catalog), 0, 120);
    $catalogHint = implode("\n", $nameList);

    $system = <<<EOT
You are Crystal Atlas for Amethez (Thai crystal encyclopedia). Analyze a user photo of a stone/mineral/rock/fossil.
Return ONLY JSON with this shape:
{
  "atlas_line": "1-2 short Thai sentences, conversational, female speaker using ค่ะ/นะคะ, like a knowledgeable friend — NOT an encyclopedia dump",
  "candidates": [
    {
      "id": "catalog id if known else null",
      "name_en": "English name",
      "name_th": "Thai name",
      "confidence": 0-100,
      "reason": "2 short Thai sentences: visual cues why this match",
      "in_catalog": true/false
    }
  ],
  "need_more": false,
  "follow_up": "optional short Thai question to narrow result"
}
Rules:
- Give 3 to 5 candidates sorted by confidence descending.
- Prefer matching catalog ids from the list when possible.
- If unsure, include river-pebble / common-quartz / igneous-rock / sedimentary-rock / metamorphic-rock / fossil-general / unknown-stone buckets.
- Never claim lab certification. This is preliminary visual ID only.
- atlas_line must be Thai, short, warm, confident but not absolute.
Catalog (id hints):
$catalogHint
EOT;

    $parts = [
        ['text' => 'ช่วยดูหินในรูปนี้แบบเบื้องต้น และตอบเป็น JSON ตามสคีมา'],
        ['inline_data' => ['mime_type' => $mime, 'data' => $b64]],
    ];

    $result = identify_call_gemini_json($geminiKey, $system, $parts, 1000);
    if (!$result['ok'] || !is_array($result['json'] ?? null)) {
        http_response_code(502);
        echo json_encode(['error' => $result['error'] ?? 'วิเคราะห์ไม่สำเร็จ', 'fallback' => true]);
        exit;
    }

    $json = $result['json'];
    [$byId, $byName] = identify_catalog_index($catalog);
    $candidates = [];
    foreach (($json['candidates'] ?? []) as $c) {
        if (!is_array($c)) continue;
        $matched = null;
        if (!empty($c['id']) && isset($byId[$c['id']])) $matched = $byId[$c['id']];
        if (!$matched) $matched = identify_match_stone($c['name_en'] ?? '', $byId, $byName);
        if (!$matched) $matched = identify_match_stone($c['name_th'] ?? '', $byId, $byName);

        $entry = [
            'id' => $matched['id'] ?? ($c['id'] ?? null),
            'name_en' => $matched['name_en'] ?? ($c['name_en'] ?? 'Unknown'),
            'name_th' => $matched['name_th'] ?? ($c['name_th'] ?? 'ยังไม่ทราบชื่อ'),
            'confidence' => max(0, min(100, (int)($c['confidence'] ?? 50))),
            'reason' => trim((string)($c['reason'] ?? '')),
            'in_catalog' => (bool)$matched,
            'tier' => $matched['tier'] ?? 'lite',
            'meaning_short' => $matched['meaning_short'] ?? '',
            'tags' => $matched['tags'] ?? [],
            'visual_cues' => $matched['visual_cues'] ?? '',
            'article_url' => $matched['article_url'] ?? null,
            'rock_class' => $matched['rock_class'] ?? null,
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
            'confidence' => 35,
            'reason' => 'จากรูปยังจับลักษณะเด่นไม่พอ อยากได้มุมใกล้ๆ หรือพื้นหลังเรียบกว่านี้อีกหน่อยค่ะ',
            'in_catalog' => (bool)$unk,
            'tier' => 'bucket',
            'meaning_short' => $unk['meaning_short'] ?? '',
            'tags' => $unk['tags'] ?? [],
            'visual_cues' => $unk['visual_cues'] ?? '',
            'article_url' => null,
            'rock_class' => 'mineral',
            'color' => null,
            'emoji' => '🪨',
        ];
    }

    echo json_encode([
        'atlas_line' => trim((string)($json['atlas_line'] ?? 'ส่งรูปมาให้ดูแล้วค่ะ ลองดูตัวเลือกด้านล่างนะคะ')),
        'candidates' => $candidates,
        'need_more' => (bool)($json['need_more'] ?? false),
        'follow_up' => trim((string)($json['follow_up'] ?? '')),
        'disclaimer' => 'ผลนี้เป็นการตรวจเบื้องต้นจากรูป ไม่ใช่ใบรับรองแล็บ',
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
        if (!empty($sel['meaning_short'])) $ctxBits[] = 'ความหมายสั้น: ' . $sel['meaning_short'];
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
คุณคือ "Crystal Atlas" ไกด์สารานุกรมหินของ Amethez — ผู้หญิง อบอุ่น มั่นใจ รู้จริงเรื่องหิน/แร่

## คำลงท้าย
- ใช้ "ค่ะ"/"นะคะ" เท่านั้น ห้ามใช้ครับ
- เรียกตัวเองว่า "Atlas" หรือไม่ต้องใส่สรรพนามก็ได้

## วิธีคุย — สำคัญที่สุด
- ตอบ 1-3 ประโยคสั้นๆ แบบแชทเพื่อน ไม่ใช่บทความ Gemini
- ห้าม bullet / หัวข้อ / ตัวหนา / ลิสต์ยาว
- ถามกลับสั้นๆ ได้เมื่อช่วยแคบผล
- ไม่ฟันธง 100% — ใช้คำว่า น่าจะ / เอนไปทาง / จากรูป
- ถ้าอยากรู้ลึก ชวนไปอ่านหน้าสารานุกรม ห้ามเล่าทั้งหน้าในแชท
- ห้ามใส่ลิงก์เอง
- ห้ามขายตรง
- ย้ำเมื่อจำเป็นว่าเป็นการดูเบื้องต้นจากรูป ไม่ใช่ใบรับรองแล็บ
$ctxBlock
EOT;

    $result = null;
    if ($geminiKey) {
        $result = identify_call_gemini_text($geminiKey, $systemPrompt, $clean, 220);
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
