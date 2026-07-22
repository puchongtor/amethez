<?php
/* TEMPORARY diagnostic — lists real th-TH voices from Google Cloud TTS to
 * verify actual genders instead of guessing. Delete after use. */
header('Content-Type: application/json; charset=utf-8');
$config = require __DIR__ . '/config.php';
$apiKey = $config['gcloud_tts_key'] ?? '';
if (!$apiKey) { http_response_code(500); echo json_encode(['error'=>'no key']); exit; }
$ch = curl_init('https://texttospeech.googleapis.com/v1/voices?languageCode=th-TH&key=' . urlencode($apiKey));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
