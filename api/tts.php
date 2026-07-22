<?php
/* ═══ Server-side proxy for Google Cloud Text-to-Speech ═══
 * Same reasoning as api/shila-chat.php — talk/read.html used to read the
 * TTS API key from the visitor's own localStorage, which only the person
 * who manually typed it in ever had. Every other visitor got silence.
 * The key now lives server-side (api/config.php, generated from a
 * GCLOUD_TTS_KEY GitHub secret at deploy time, never committed).
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Per-IP rate limit (file-based, resets hourly) — TTS is billed per
// character, so this matters even more than the chat proxy. ──
function tts_rate_limit_ok($ip) {
    $dir = sys_get_temp_dir() . '/tts_rl';
    if (!is_dir($dir)) { @mkdir($dir, 0700, true); }
    $file = $dir . '/' . md5($ip) . '.json';
    $now = time();
    $window = 3600; // 1 hour
    $max = 120;      // requests per IP per hour (~a few full sessions)
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
if (!tts_rate_limit_ok($ip)) {
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
$apiKey = $config['gcloud_tts_key'] ?? '';
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'ระบบยังไม่ได้ตั้งค่า']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$text = trim((string)($body['text'] ?? ''));
$voice = (string)($body['voice'] ?? 'th-TH-Chirp3-HD-Charon');
$rate = (float)($body['rate'] ?? 0.82);

if ($text === '') {
    http_response_code(400);
    echo json_encode(['error' => 'ไม่มีข้อความ']);
    exit;
}
// บทตั้งจิตเป็นประโยคสั้นๆ ต่อบรรทัดอยู่แล้ว — จำกัดกันเรียกยาวผิดปกติ
$text = mb_substr($text, 0, 500);

// จำกัด voice ให้เป็นแค่ 4 ตัวที่หน้าเว็บใช้จริง กัน parameter injection แปลกๆ
// ยืนยันเพศจริงจาก Google Cloud TTS voices.list ตรงๆ (2026-07-22) — ของเดิม
// (Neural2-D, Wavenet-A/B) ไม่มีอยู่จริงในรายชื่อเสียงไทยเลย และ Neural2-C ที่
// เหลือก็จริงๆ แล้วเป็นเสียงผู้หญิง ไม่ใช่ผู้ชายตามที่ label ไว้ผิด
$allowedVoices = ['th-TH-Chirp3-HD-Charon', 'th-TH-Chirp3-HD-Puck', 'th-TH-Chirp3-HD-Aoede', 'th-TH-Chirp3-HD-Zephyr'];
if (!in_array($voice, $allowedVoices, true)) $voice = 'th-TH-Chirp3-HD-Charon';
$rate = max(0.6, min(1.1, $rate));

// Chirp3-HD ไม่รองรับ pitch (Google API ปฏิเสธ 400 ถ้าใส่ไป) — ใส่แค่
// speakingRate + volumeGainDb ที่ทดสอบแล้วว่าใช้ได้จริงกับเสียงตระกูลนี้
$payload = [
    'input' => ['text' => $text],
    'voice' => ['languageCode' => 'th-TH', 'name' => $voice],
    'audioConfig' => ['audioEncoding' => 'MP3', 'speakingRate' => $rate, 'volumeGainDb' => 1.0],
];

$ch = curl_init('https://texttospeech.googleapis.com/v1/text:synthesize?key=' . urlencode($apiKey));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 20,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'เชื่อมต่อ TTS ไม่สำเร็จ: ' . $curlErr]);
    exit;
}

$data = json_decode($response, true);
$audioContent = $data['audioContent'] ?? null;

if ($httpCode >= 200 && $httpCode < 300 && $audioContent) {
    echo json_encode(['audioContent' => $audioContent]);
} else {
    http_response_code(502);
    echo json_encode(['error' => 'TTS ตอบกลับไม่สำเร็จ']);
}
