/* Generates api/config.php from GROQ_API_KEY / GEMINI_API_KEY /
 * GCLOUD_TTS_KEY env vars at deploy time. Never commit the real keys —
 * this file itself is gitignored, only this generator script (which
 * contains no secrets) is committed. */
const fs = require('fs');
const path = require('path');

function esc(key) {
  return key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const groqKey = process.env.GROQ_API_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';
const ttsKey = process.env.GCLOUD_TTS_KEY || '';

if (!groqKey && !geminiKey && !ttsKey) {
  console.warn('No API keys set — skipping api/config.php generation (chat + TTS will show setup errors).');
  process.exit(0);
}

const content = `<?php\nreturn [\n    'groq_api_key' => '${esc(groqKey)}',\n    'gemini_api_key' => '${esc(geminiKey)}',\n    'gcloud_tts_key' => '${esc(ttsKey)}',\n];\n`;

const apiDir = path.join(process.cwd(), 'api');
fs.mkdirSync(apiDir, { recursive: true });
fs.writeFileSync(path.join(apiDir, 'config.php'), content);
console.log('Generated api/config.php' + (geminiKey ? ' (Gemini primary)' : ' (Groq only)') + (ttsKey ? ' + TTS' : ' (no TTS key)'));
