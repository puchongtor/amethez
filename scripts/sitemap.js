#!/usr/bin/env node
/**
 * Amethez — Sitemap Generator
 * สร้าง sitemap.xml อัตโนมัติจากทุกไฟล์ .html
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://amethez.com';
const PUBLIC_DIR = path.join(__dirname, '..');
const OUTPUT = path.join(PUBLIC_DIR, 'sitemap.xml');

const EXCLUDE = ['/admin/', '/scripts/', '/.github/'];

function findHtmlFiles(dir, baseDir = dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const relDir = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/') + '/';
      if (EXCLUDE.some(ex => relDir.startsWith(ex))) continue;
      results.push(...findHtmlFiles(fullPath, baseDir));
    } else if (item.endsWith('.html')) {
      const rel = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push(rel);
    }
  }
  return results;
}

const PRIORITY = {
  '/index.html': '1.0',
  '/stones/': '0.9',
  '/categories/': '0.8',
  '/wuchong/': '0.8',
  '/metha/': '0.8',
  '/sale.html': '0.7',
};

function getPriority(url) {
  for (const [key, val] of Object.entries(PRIORITY)) {
    if (url.includes(key)) return val;
  }
  return '0.7';
}

const files = findHtmlFiles(PUBLIC_DIR);
const today = new Date().toISOString().split('T')[0];

const urls = files.map(file => {
  const url = file === '/index.html' ? '/' : file.replace('/index.html', '/').replace('.html', '.html');
  return `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.includes('/stones/') || url.includes('/metha/') ? 'daily' : 'weekly'}</changefreq>
    <priority>${getPriority(url)}</priority>
  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

fs.writeFileSync(OUTPUT, xml);
console.log(`✓ Sitemap generated: ${files.length} URLs → sitemap.xml`);
