<?php
/* ═══ Amethez — Google Gemini / Imagen series image generator ═══
 * POST { prompt, aspect: "1:1"|"16:9" }
 * Returns { ok:true, image:"data:image/png;base64,..." } or { ok:false, error }
 * Key stays server-side in api/config.php (never sent to the browser).
 */
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

function series_rate_limit_ok($ip, $max = 30, $window = 3600) {
    $dir = sys_get_temp_dir() . '/amethez_img_rl';
    if (!is_dir($dir)) { @mkdir($dir, 0700, true); }
    $file = $dir . '/' . md5($ip) . '.json';
    $now = time();
    $data = ['count' => 0, 'reset' => $now + $window];
    if (is_file($file)) {
        $decoded = json_decode(@file_get_contents($file), true);
        if (is_array($decoded)) $data = $decoded;
    }
    if ($now > ($data['reset'] ?? 0)) $data = ['count' => 0, 'reset' => $now + $window];
    $data['count']++;
    @file_put_contents($file, json_encode($data));
    return $data['count'] <= $max;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!series_rate_limit_ok($ip)) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'เจนรูปบ่อยเกินไป ลองใหม่ในอีกชั่วโมง']);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'ระบบยังไม่ได้ตั้งค่า Gemini API']);
    exit;
}
$config = require $configPath;
$apiKey = $config['gemini_api_key'] ?? '';
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'ยังไม่มี Gemini API key']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'คำขอไม่ถูกต้อง']);
    exit;
}

$prompt = trim((string)($body['prompt'] ?? ''));
$aspect = (string)($body['aspect'] ?? '1:1');
if (!in_array($aspect, ['1:1', '16:9', '4:3', '3:4', '9:16'], true)) $aspect = '1:1';
if (mb_strlen($prompt) < 20) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Prompt สั้นเกินไป']);
    exit;
}
if (mb_strlen($prompt) > 8000) $prompt = mb_substr($prompt, 0, 8000);

function series_curl_json($url, $payload, $timeout = 90) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => $timeout,
    ]);
    $response = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($response === false) return ['http' => 0, 'data' => null, 'err' => $err];
    return ['http' => $http, 'data' => json_decode($response, true), 'err' => '', 'raw' => $response];
}

function series_try_imagen($apiKey, $prompt, $aspect) {
    $models = ['imagen-4.0-generate-001', 'imagen-3.0-generate-002'];
    foreach ($models as $model) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':predict?key=' . urlencode($apiKey);
        $res = series_curl_json($url, [
            'instances' => [['prompt' => $prompt]],
            'parameters' => [
                'sampleCount' => 1,
                'aspectRatio' => $aspect,
                'personGeneration' => 'dont_allow',
            ],
        ]);
        $b64 = $res['data']['predictions'][0]['bytesBase64Encoded'] ?? null;
        if ($res['http'] >= 200 && $res['http'] < 300 && $b64) {
            $mime = $res['data']['predictions'][0]['mimeType'] ?? 'image/png';
            return ['ok' => true, 'b64' => $b64, 'mime' => $mime, 'model' => $model];
        }
    }
    return ['ok' => false];
}

function series_try_gemini_image($apiKey, $prompt, $aspect) {
    $models = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];
    $sizeHint = $aspect === '16:9'
        ? 'Compose as a wide 16:9 cinematic editorial frame.'
        : 'Compose as a square 1:1 editorial frame.';
    foreach ($models as $model) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent?key=' . urlencode($apiKey);
        $res = series_curl_json($url, [
            'contents' => [[
                'role' => 'user',
                'parts' => [['text' => $sizeHint . "\n\n" . $prompt]],
            ]],
            'generationConfig' => [
                'responseModalities' => ['TEXT', 'IMAGE'],
            ],
        ]);
        $parts = $res['data']['candidates'][0]['content']['parts'] ?? [];
        foreach ($parts as $part) {
            $inline = $part['inlineData'] ?? $part['inline_data'] ?? null;
            if (!empty($inline['data'])) {
                return [
                    'ok' => true,
                    'b64' => $inline['data'],
                    'mime' => $inline['mimeType'] ?? $inline['mime_type'] ?? 'image/png',
                    'model' => $model,
                ];
            }
        }
    }
    return ['ok' => false, 'detail' => $res['data'] ?? $res['err']];
}

$img = series_try_imagen($apiKey, $prompt, $aspect);
if (empty($img['ok'])) $img = series_try_gemini_image($apiKey, $prompt, $aspect);

if (empty($img['ok']) || empty($img['b64'])) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'เจนรูปไม่สำเร็จ ลองใหม่หรือใส่รูปเองแทน']);
    exit;
}

$mime = $img['mime'] ?: 'image/png';
echo json_encode([
    'ok' => true,
    'model' => $img['model'] ?? '',
    'image' => 'data:' . $mime . ';base64,' . $img['b64'],
]);
