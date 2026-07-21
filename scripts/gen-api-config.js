/* Generates api/config.php from the GROQ_API_KEY env var at deploy time.
 * Never commit the real key — this file itself is gitignored, only this
 * generator script (which contains no secret) is committed. */
const fs = require('fs');
const path = require('path');

const key = process.env.GROQ_API_KEY || '';
if (!key) {
  console.warn('GROQ_API_KEY not set — skipping api/config.php generation (chat widget will show a setup error).');
  process.exit(0);
}

const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const content = `<?php\nreturn [\n    'groq_api_key' => '${escaped}',\n];\n`;

const apiDir = path.join(process.cwd(), 'api');
fs.mkdirSync(apiDir, { recursive: true });
fs.writeFileSync(path.join(apiDir, 'config.php'), content);
console.log('Generated api/config.php');
