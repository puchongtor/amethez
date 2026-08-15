#!/usr/bin/env node
/**
 * สุ่มดึงไฟล์บทความจาก inbox/rankings แล้วสร้างดราฟต์ซีรีส์
 *
 * ใช้:
 *   node scripts/ingest-ranking-series.js           # สุ่มสูงสุด 5 ไฟล์
 *   node scripts/ingest-ranking-series.js --count 1
 *   node scripts/ingest-ranking-series.js --file inbox/rankings/foo.md
 *
 * รองรับ .md .txt และ .pdf (PDF ต้องมี pdftotext ในเครื่อง หรือวางไฟล์ .md คู่กัน)
 * ไฟล์ที่ประมวลผลแล้วย้ายไป inbox/rankings/processed/
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const RS = require('../js/ranking-series.js');

const ROOT = path.join(__dirname, '..');
const INBOX = path.join(ROOT, RS.SERIES.inbox);
const PROCESSED = path.join(INBOX, 'processed');
const JSON_PATH = path.join(ROOT, 'data', 'rankings.json');
const PAGE_DIR = path.join(ROOT, 'stones', 'rankings');

function listInbox() {
  if (!fs.existsSync(INBOX)) fs.mkdirSync(INBOX, { recursive: true });
  if (!fs.existsSync(PROCESSED)) fs.mkdirSync(PROCESSED, { recursive: true });
  return fs.readdirSync(INBOX)
    .filter(f => /\.(md|txt|pdf)$/i.test(f) && !/^readme/i.test(f) && !/^_/i.test(f) && fs.statSync(path.join(INBOX, f)).isFile())
    .map(f => path.join(INBOX, f));
}

function extractPdf(file) {
  try {
    return execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, '-'], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (e) {
    const mdTwin = file.replace(/\.pdf$/i, '.md');
    const txtTwin = file.replace(/\.pdf$/i, '.txt');
    if (fs.existsSync(mdTwin)) return fs.readFileSync(mdTwin, 'utf8');
    if (fs.existsSync(txtTwin)) return fs.readFileSync(txtTwin, 'utf8');
    throw new Error('อ่าน PDF ไม่ได้ — ติดตั้ง pdftotext หรือวางไฟล์ .md ชื่อเดียวกันไว้ในโฟลเดอร์เดียวกัน');
  }
}

function readSource(file) {
  if (/\.pdf$/i.test(file)) return extractPdf(file);
  return fs.readFileSync(file, 'utf8');
}

function loadRankings() {
  if (!fs.existsSync(JSON_PATH)) {
    return { generated: new Date().toISOString().slice(0, 10), series: RS.SERIES, articles: [] };
  }
  return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
}

function saveRankings(data) {
  data.generated = new Date().toISOString().slice(0, 10);
  data.series = Object.assign({}, RS.SERIES, data.series || {});
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
}

function nextEpisode(articles) {
  const nums = (articles || []).map(a => Number(a.episode) || 0);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

function ingestFile(file, data) {
  const raw = readSource(file);
  const article = RS.parseSeriesArticle(raw, { sourceFile: path.basename(file) });
  if ((data.articles || []).some(a => a.slug === article.slug || a.id === article.id)) {
    article.id = article.slug + '-' + Date.now().toString(36);
    article.slug = article.id;
    article.url = '/stones/rankings/' + article.slug + '.html';
    article.heroImgSlot = 'ranking_' + article.slug.replace(/-/g, '_') + '_hero';
    (article.items || []).forEach((it, i) => {
      it.imgSlot = 'ranking_' + article.slug.replace(/-/g, '_') + '_item' + (i + 1) + '_hero';
    });
  }
  article.episode = nextEpisode(data.articles);
  article.status = 'draft';
  article.imageStatus = 'pending';
  const html = RS.buildFullRankingPage(article);
  fs.mkdirSync(PAGE_DIR, { recursive: true });
  fs.writeFileSync(path.join(PAGE_DIR, article.slug + '.html'), html);
  data.articles = data.articles || [];
  data.articles.unshift({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    focusKeyword: article.focusKeyword,
    relatedKeywords: article.relatedKeywords,
    heroImgSlot: article.heroImgSlot,
    heroPrompt: article.heroPrompt,
    heroCaption: article.heroCaption,
    heroAlt: article.heroAlt,
    items: (article.items || []).map(it => ({
      label: it.label, prompt: it.prompt, caption: it.caption, alt: it.alt, imgSlot: it.imgSlot
    })),
    url: article.url,
    publishDate: '',
    status: 'draft',
    series: RS.SERIES.id,
    episode: article.episode,
    imageStatus: 'pending',
    shopeeTags: article.shopeeTags,
    sourceFile: article.sourceFile
  });
  const dest = path.join(PROCESSED, path.basename(file));
  fs.renameSync(file, dest);
  return article;
}

function parseArgs(argv) {
  const out = { count: RS.SERIES.draftsPerDay, file: '' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--count') out.count = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (argv[i] === '--file') out.file = argv[++i];
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const data = loadRankings();
  let files = args.file ? [path.resolve(args.file)] : listInbox();
  if (!files.length) {
    console.log('ไม่มีไฟล์ใน ' + INBOX);
    console.log('วาง .md / .txt / .pdf ตามฟอร์มบทความ แล้วรันใหม่');
    process.exit(0);
  }
  if (!args.file) files = RS.shufflePick(files, args.count);
  const made = [];
  for (const file of files) {
    try {
      const article = ingestFile(file, data);
      made.push(article);
      console.log('✓ draft: ' + article.title);
      console.log('  ' + article.url);
    } catch (e) {
      console.error('✗ ' + path.basename(file) + ': ' + e.message);
    }
  }
  saveRankings(data);
  console.log('\nสร้างดราฟต์ ' + made.length + ' ตอน — เปิด Admin → จัดอันดับหินคริสตัล เพื่อเจนรูปและกดยืนยัน');
}

main();
