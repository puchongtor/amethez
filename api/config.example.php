<?php
// Copy this file to api/config.php and fill in your real key for LOCAL testing.
// api/config.php is gitignored — never commit a real API key.
// In production, GitHub Actions generates api/config.php automatically from
// the GROQ_API_KEY repo secret at deploy time (see .github/workflows/deploy.yml).
return [
    'groq_api_key' => 'YOUR_GROQ_API_KEY_HERE',
    'gemini_api_key' => 'YOUR_GEMINI_API_KEY_HERE', // required for Atlas Identify vision
    'gcloud_tts_key' => '',
];
