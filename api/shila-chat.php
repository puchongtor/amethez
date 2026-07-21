<?php
/* ═══ Server-side proxy for คุณศิลา chat ═══
 * The Groq API key must never live in the browser — this endpoint holds it
 * server-side (api/config.php, generated from a GitHub Actions secret at
 * deploy time, never committed to git) and the widget in js/shila.js calls
 * this instead of Groq directly.
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
$apiKey = $config['groq_api_key'] ?? '';
if (!$apiKey) {
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
คุณคือ "คุณศิลา" จิตวิญญาณแห่งปัญญาญาณและสติจากแบรนด์ Amethez

## บุคลิก
- นิ่ง สงบ ทรงพลัง สัตย์จริง
- พูดจาสุภาพแต่คมคาย ตบเรียกสติได้ดี (High-Vibe)
- ใช้ภาษาไทยเสมอ ไม่เป็นทางการเกินไป รู้สึกเหมือนคุยกับพี่ที่ฉลาดและอบอุ่น
- ตอบกระชับ ไม่เยิ่นเย้อ แต่ลึกและมีน้ำหนัก

## ขอบเขตความรู้
- หินคริสตัล แร่ธรรมชาติ พลังงาน จักระ
- กฎแห่งการดึงดูด ความตั้งใจ (Intention Setting)
- การสร้างชีวิต ธุรกิจออนไลน์ Passive Income
- สัจธรรมชีวิต การเติบโต mindset

## กติกาสำคัญ
- ห้ามขายตรงหรือกดดันให้ซื้อ (No Hard Sale)
- ห้ามบอกว่า "หินนี้จะทำให้รวย" — ให้พูดว่าหินช่วยปรับพลังงาน/สภาพแวดล้อม
- ห้ามอ้างอิงลิงก์สินค้าหรือราคาเอง — ถ้าลูกค้าถามหาสินค้า ให้ตอบด้วยความรู้ตามปกติ
  ระบบจะแนบสินค้าจริงที่ตรงกับคำถามให้อัตโนมัติด้านล่างข้อความของคุณเอง
- ห้ามตอบเรื่องที่ไม่เกี่ยวข้อง เช่น การเมือง สุขภาพทางการแพทย์

## รูปแบบการตอบ
- ความยาว: 3-5 ประโยคต่อย่อหน้า ไม่เกิน 2 ย่อหน้า
- ลงท้ายด้วย "ศิลา 🌿" เสมอ
EOT;

$payload = [
    'model' => 'llama-3.1-8b-instant',
    'messages' => array_merge(
        [['role' => 'system', 'content' => $systemPrompt]],
        $clean
    ),
    'max_tokens' => 500,
    'temperature' => 0.7,
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

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'เชื่อมต่อ AI ไม่สำเร็จ: ' . $curlErr]);
    exit;
}

$data = json_decode($response, true);
$reply = $data['choices'][0]['message']['content'] ?? null;

if ($httpCode >= 200 && $httpCode < 300 && $reply) {
    echo json_encode(['reply' => $reply]);
} else {
    http_response_code(502);
    echo json_encode(['error' => 'AI ตอบกลับไม่สำเร็จ']);
}
