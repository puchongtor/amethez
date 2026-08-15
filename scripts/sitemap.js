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

const EXCLUDE = ['/admin/', '/scripts/', '/.github/', '/inbox/', '/.claude/'];

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
  '/identify/': '0.95',
  '/identify/index.html': '0.95',
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

let blocked = new Set();
try {
  const rk = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'data', 'rankings.json'), 'utf8'));
  blocked = new Set((rk.articles || [])
    .filter(a => a.status === 'draft' || a.status === 'scheduled')
    .map(a => a.url || ('/stones/rankings/' + a.slug + '.html')));
} catch {}

function hasNoindex(rel) {
  try {
    const html = fs.readFileSync(path.join(PUBLIC_DIR, rel.replace(/^\//, '')), 'utf8');
    return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)
      || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  } catch {
    return false;
  }
}

const files = findHtmlFiles(PUBLIC_DIR).filter(rel => {
  const norm = rel.replace(/\\/g, '/');
  if (blocked.has(norm) || blocked.has(norm.replace(/\.html$/, ''))) return false;
  if (hasNoindex(norm)) return false;
  return true;
});
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
