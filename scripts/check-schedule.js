#!/usr/bin/env node
/**
 * Amethez — Schedule Checker
 * รัน: node scripts/check-schedule.js
 * GitHub Actions เรียกก่อน deploy ทุกครั้ง
 * ตรวจสอบว่ามี content ที่ถึงเวลา publish หรือไม่
 */

const fs = require('fs');
const path = require('path');

const SCHEDULE_FILE = path.join(__dirname, '../data/schedule.json');
const PUBLIC_DIR = path.join(__dirname, '../');

function getNow() {
  const now = new Date();
  // ปรับเป็น TH timezone (UTC+7)
  const thOffset = 7 * 60;
  const utcMinutes = now.getTime() / 1000 / 60;
  const thTime = new Date((utcMinutes + thOffset) * 60 * 1000);
  return thTime;
}

function isTimeToPublish(publishDate, publishTime) {
  const now = getNow();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getUTCHours();

  if (publishDate !== today) return false;

  const [schedHour] = publishTime.split(':').map(Number);
  return currentHour >= schedHour;
}

function main() {
  if (!fs.existsSync(SCHEDULE_FILE)) {
    console.log('No schedule.json found — skipping schedule check');
  } else {
    const schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
    const items = schedule.items || [];
    let published = 0;

    items.forEach(item => {
      if (item.status !== 'scheduled') return;
      if (!isTimeToPublish(item.publish_date, item.publish_time)) return;

      console.log(`Publishing: ${item.title} (${item.publish_date} ${item.publish_time})`);

      if (item.source && item.destination) {
        const src = path.join(PUBLIC_DIR, item.source);
        const dest = path.join(PUBLIC_DIR, item.destination);
        if (fs.existsSync(src)) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(src, dest);
          console.log(`  ✓ Copied ${item.source} → ${item.destination}`);
        }
      }

      item.status = 'published';
      item.published_at = getNow().toISOString();
      published++;
    });

    if (published > 0) {
      fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
      console.log(`\n✓ Published ${published} item(s)`);
    } else {
      console.log('No items scheduled for now');
    }
  }

  publishDueRankings();
}

function publishDueRankings() {
  const rkPath = path.join(PUBLIC_DIR, 'data', 'rankings.json');
  if (!fs.existsSync(rkPath)) return;
  const data = JSON.parse(fs.readFileSync(rkPath, 'utf8'));
  const now = Date.now();
  let n = 0;
  (data.articles || []).forEach(a => {
    if (a.status !== 'scheduled') return;
    const raw = String(a.publishDate || '');
    if (!raw) return;
    const iso = raw.length <= 10
      ? raw + 'T08:00:00+07:00'
      : (/[Z+\-]\d{2}:?\d{2}$/.test(raw) || raw.endsWith('Z') ? raw : raw + ':00+07:00');
    const t = new Date(iso).getTime();
    if (isNaN(t) || t > now) return;
    a.status = 'published';
    n++;
    console.log('Publishing ranking series: ' + a.title);
    const pagePath = path.join(PUBLIC_DIR, (a.url || '/stones/rankings/' + a.slug + '.html').replace(/^\//, ''));
    if (fs.existsSync(pagePath)) {
      let html = fs.readFileSync(pagePath, 'utf8');
      html = html.replace(/\s*<meta name="robots" content="noindex,nofollow">\s*/i, '\n  ');
      fs.writeFileSync(pagePath, html);
    }
  });
  if (n) {
    data.generated = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(rkPath, JSON.stringify(data, null, 2));
    console.log('✓ Published ' + n + ' ranking series episode(s)');
  }
}

main();
