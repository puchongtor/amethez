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
    process.exit(0);
  }

  const schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
  const items = schedule.items || [];
  let published = 0;

  items.forEach(item => {
    if (item.status !== 'scheduled') return;
    if (!isTimeToPublish(item.publish_date, item.publish_time)) return;

    console.log(`Publishing: ${item.title} (${item.publish_date} ${item.publish_time})`);

    // ถ้ามี source file → copy ไปยัง destination
    if (item.source && item.destination) {
      const src = path.join(PUBLIC_DIR, item.source);
      const dest = path.join(PUBLIC_DIR, item.destination);
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log(`  ✓ Copied ${item.source} → ${item.destination}`);
      }
    }

    // อัปเดต status
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

main();
