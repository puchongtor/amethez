<?php
/* TEMPORARY diagnostic — lists real th-TH voices from Google Cloud TTS to
 * verify actual genders instead of guessing. Delete after use. */
header('Content-Type: application/json; charset=utf-8');
$config = require __DIR__ . '/config.php';
$apiKey = $config['gcloud_tts_key'] ?? '';
if (!$apiKey) { http_response_code(500); echo json_encode(['error'=>'no key']); exit; }
if (($_GET['test'] ?? '') === 'chirp') {
    $payload = [
        'input' => ['text' => 'ทดสอบเสียง'],
        'voice' => ['languageCode' => 'th-TH', 'name' => 'th-TH-Chirp3-HD-Charon'],
        'audioConfig' => ['audioEncoding' => 'MP3', 'speakingRate' => 0.82, 'pitch' => -1.0, 'volumeGainDb' => 1.0],
    ];
    $ch = curl_init('https://texttospeech.googleapis.com/v1/text:synthesize?key=' . urlencode($apiKey));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo json_encode(['httpCode' => $code, 'body' => json_decode($response, true)]);
    exit;
}

$ch = curl_init('https://texttospeech.googleapis.com/v1/voices?languageCode=th-TH&key=' . urlencode($apiKey));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
