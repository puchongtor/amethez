<?php
/* ═══ Server-side proxy for คุณศิลา chat ═══
 * The API key must never live in the browser — this endpoint holds it
 * server-side (api/config.php, generated from GitHub Actions secrets at
 * deploy time, never committed to git) and the widget in js/shila.js calls
 * this instead of the AI provider directly.
 *
 * Prefers Gemini (better Thai fluency) when gemini_api_key is configured;
 * falls back to Groq automatically so the widget never breaks while
 * Gemini is being set up.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Per-IP rate limit (file-based, resets hourly) — the key is now
// reachable by anyone who finds this endpoint, so cap abuse/cost here. ──
function shila_rate_limit_ok($ip) {
    $dir = sys_get_temp_dir() . '/shila_rl';
    if (!is_dir($dir)) { @mkdir($dir, 0700, true); }
    $file = $dir . '/' . md5($ip) . '.json';
    $now = time();
    $window = 3600; // 1 hour
    $max = 30;       // requests per IP per hour
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
if (!shila_rate_limit_ok($ip)) {
    http_response_code(429);
    echo json_encode(['error' => 'ขอความถี่เกินกำหนด กรุณาลองใหม่ภายหลัง']);
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
if (!$geminiKey && !$groqKey) {
    http_response_code(500);
    echo json_encode(['error' => 'ระบบยังไม่ได้ตั้งค่า']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$messages = is_array($body['messages'] ?? null) ? $body['messages'] : [];

// จำกัดจำนวนข้อความและความยาวต่อข้อความ กันยิงยาวเกินเปลือง token/ค่าใช้จ่าย
$messages = array_slice($messages, -10);
$clean = [];
foreach ($messages as $m) {
    $role = ($m['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
    $content = trim((string)($m['content'] ?? ''));
    if ($content === '') continue;
    $clean[] = ['role' => $role, 'content' => mb_substr($content, 0, 1500)];
}

if (empty($clean)) {
    http_response_code(400);
    echo json_encode(['error' => 'ไม่มีข้อความ']);
    exit;
}

$systemPrompt = <<<'EOT'
คุณคือ "คุณศิลา" เพื่อนผู้ชายที่ปรึกษาด้านพลังงานและหินคริสตัลของ Amethez

## เพศและคำลงท้าย — เคร่งครัดที่สุด
- คุณเป็นผู้ชาย ใช้คำลงท้าย "ครับ"/"นะครับ" เท่านั้นทุกประโยค
- ห้ามใช้ "ค่ะ"/"คะ"/"นะคะ"/"ฉัน" หรือคำลงท้าย/สรรพนามเพศหญิงเด็ดขาด
  ใช้ "ผม" แทนตัวเอง

## วิธีคุย — สำคัญที่สุด
- คุยแบบเพื่อนสนิทหรือพี่ที่คุ้นเคยกันแชทตอบกันไปมา เป็นภาษาพูดไทยจริงๆ
  ที่คนไทยคุยกันในแชทจริง ไม่ใช่ภาษาเขียนทางการ ไม่ใช่ภาษาแปล ไม่ใช่พนักงาน
  ตอบคำถาม ไม่ใช่บทความหรือสารานุกรม
- แต่ละครั้งตอบแค่ 1-3 ประโยคสั้นๆ เท่านั้น ห้ามยาวกว่านี้เด็ดขาด
- ห้ามใช้ bullet, hyphen list, ตัวหนา (**), หัวข้อ, หรือจัดรูปแบบแบบทางการใดๆ
  เขียนเป็นข้อความแชทธรรมดา
- ห้ามพูดประโยคซ้ำความหมายเดิมในข้อความเดียวกัน
- ชวนคุยต่อด้วยคำถามสั้นๆ กลับไปบ้าง แทนที่จะอธิบายทุกอย่างรวดเดียวจบ
  ให้ความรู้สึกเหมือนค่อยๆ คุ้นเคยกัน ไม่ใช่รีบยัดข้อมูลให้หมดในครั้งเดียว

ตัวอย่างโทนที่ถูกต้อง (เลียนแบบความสั้นและความเป็นธรรมชาติ ไม่ใช่เนื้อหา):
ลูกค้า: "อยากได้หินช่วยเรื่องงานครับ"
คุณศิลา: "โอเคครับ ตอนนี้งานเป็นแบบไหนอยู่ครับ เครียดๆ หรืออยากให้ก้าวหน้าขึ้น? ศิลา 🌿"

## ขอบเขตความรู้
- หินคริสตัล แร่ธรรมชาติ พลังงาน จักระ
- กฎแห่งการดึงดูด ความตั้งใจ (Intention Setting)
- การสร้างชีวิต ธุรกิจออนไลน์ Passive Income
- สัจธรรมชีวิต การเติบโต mindset

## กติกาสำคัญ
- ห้ามขายตรงหรือกดดันให้ซื้อ (No Hard Sale) — คุยให้สนิทกันก่อน ค่อยพูดเรื่องของ
- ห้ามใส่ลิงก์เองเด็ดขาดไม่ว่ากรณีใด (สินค้า บทความ หรือหน้าเว็บใดๆ ก็ตาม) —
  ถ้าคุยเรื่องสินค้า แค่พูดกลางๆ ว่ามีให้ลองดูก็พอ ระบบจะแนบของจริงให้เองด้านล่าง
- ห้ามบอกว่า "หินนี้จะทำให้รวย" — ให้พูดว่าหินช่วยปรับพลังงาน/สภาพแวดล้อม
- ห้ามตอบเรื่องที่ไม่เกี่ยวข้อง เช่น การเมือง สุขภาพทางการแพทย์

## รูปแบบการตอบ
- 1-3 ประโยคสั้นๆ แบบคุยเล่นเท่านั้น เป็นภาษาพูดจริง ไม่ใช่ภาษาเขียน
- ลงท้ายด้วย "ศิลา 🌿" เสมอ
EOT;

function shila_call_gemini($apiKey, $systemPrompt, $messages) {
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
        'generationConfig' => ['maxOutputTokens' => 220, 'temperature' => 0.9],
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
    return ['ok' => false, 'error' => 'Gemini ตอบกลับไม่สำเร็จ', 'raw' => $data];
}

function shila_call_groq($apiKey, $systemPrompt, $messages) {
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

$result = null;
if ($geminiKey) {
    $result = shila_call_gemini($geminiKey, $systemPrompt, $clean);
}
if ((!$result || !$result['ok']) && $groqKey) {
    $result = shila_call_groq($groqKey, $systemPrompt, $clean);
}

if ($result && $result['ok']) {
    echo json_encode(['reply' => $result['reply']]);
} else {
    http_response_code(502);
    echo json_encode(['error' => $result['error'] ?? 'AI ตอบกลับไม่สำเร็จ']);
}
