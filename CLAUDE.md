# CLAUDE.md — Amethez Project Brief
> อ่านไฟล์นี้ก่อนทำงานทุกครั้ง นี่คือ context ทั้งหมดของโปรเจค

---

## วิสัยทัศน์

**Amethez** คือศูนย์กลางข้อมูลคริสตัลและพลอยที่ใหญ่ที่สุดในไทย
- โมเดล: Broker / Hub — ไม่ใช่ร้านค้าโดยตรง (เหมือน Wongnai แต่สำหรับหิน)
- Domain: amethez.com
- Tagline: Stones · Stories · Soul
- รายได้: Shopee Affiliate + Line OA + คอร์สเรียน + Partner shops

---

## Tech Stack

- Hosting: HostNeverDie Speed Plan (฿799/ปี) — Server ไทย
- Language: HTML + CSS + JS (ไม่ใช้ WordPress)
- Data: JSON files (stones.json, products.json)
- Deploy: GitHub Actions → auto-deploy HostNeverDie FTP
- Schedule: GitHub Actions cron 08:00 / 13:00 / 20:00
- Social: Make.com → Facebook Page + Line OA + Instagram
- Image: Google Flow Premium (฿1,490/เดือน) — prompt จาก Claude
- Domain: amethez.com

---

## Design System

### สี
- Primary: #7c3aed (Purple)
- Gold: #c9a84c
- Background: #faf8f4 (Light mode)
- Text: #1a1228
- Line OA: #06C755

### Typography
- Heading: Playfair Display (serif)
- Body: Sarabun (Thai-friendly)
- Tone: Thai-first, SEO embedded ทุกหน้า

### โลโก้
- Crystal อเมทิสต์ทรงแหลม สีม่วง + ยอดทอง
- ชื่อ AMETHEZ serif สีทอง
- Tagline: Stones · Stories · Soul

---

## Avatar Universe — The Crystal Guides

| Avatar | หมวด | Tone | Monetization |
|--------|------|------|-------------|
| Crystal Atlas | สารานุกรมหิน | Global, Authoritative | Shopee Aff auto-match |
| Master Wuchong | ที่ปรึกษาชีวิตผ่านปรัชญาหิน — ความสำเร็จ / การเงิน / สุขภาพ | ลึกซึ้ง ชวนคิด มีอารมณ์ขันเล็กน้อย | คอร์สเรียน + E-book |
| อาจารย์เมธา | ดวง / หินมงคล / พิธีกรรม / สายมู | อบอุ่น พี่ใหญ่ที่เชื่อใจได้ | Line OA + สายมู aff |
| Gemma | Sale Page | อบอุ่น น่าซื้อ | Line @masterpuch |
| Max | DIY Workshop | ช่างหนุ่ม มือเปื้อน | อุปกรณ์ DIY |
| Zin | เปิดใจคุยกับหิน | ลึกลับ สนุก | Shopee หิน |

**Phase 1 ทำก่อน:** Crystal Atlas + Master Wuchong + อาจารย์เมธา
**Phase 2 ทีหลัง:** Gemma + Max + Zin

### Master Wuchong คือใคร (ปรับให้ชัดเจนขึ้น — 2026-07-22)
"ที่ปรึกษาชีวิต ที่ใช้หินเป็นอุปมา" — **ไม่ใช่นักขายหิน ไม่ใช่ครูสอนหิน** เป็นคนที่มองเห็นบทเรียนชีวิตในธรรมชาติของหิน ทุกบทความเริ่มจากข้อเท็จจริงจริงของหิน/แร่ แล้วโยงเป็นบทเรียนชีวิต เขียนแบบเพื่อนเล่าให้ฟัง ไม่ใช่บรรยายในตำรา อ่านสนุก เข้าถึงคนทั่วไปได้แม้ไม่รู้จักหินมาก่อน ไม่ใช่แค่สายมู — รายละเอียด Concept "ปรัชญาหิน" + โครงสร้างบทความ + ระบบคำคมรายวัน 365 ข้อ ดูใน `WUCHONG_BRIEF.md` และ `WUCHONG_DAILY_WISDOM.md`

### อาจารย์เมธา คือใคร (ปรับให้ชัดเจนขึ้น — 2026-07-22)
"ที่ปรึกษาด้านโหราศาสตร์และหินมงคล ที่รู้ใจคนสายมูและคนรักหิน" — Niche คือ ดวง + หิน + พิธีกรรม ผสมกัน (ไม่มีใครทำแบบนี้ในไทย) ไม่ใช่แค่ดูดวงทั่วไป แต่บอกชัดว่า "วันนี้ควรใช้หินอะไร วางไว้ที่ไหน ทำอะไร" เขียนแบบพี่บอกน้อง อบอุ่น รู้จริง ไม่ขายของจนเกินไป ทุกบทความต้อง "ทำได้เลยวันนี้" อย่างน้อย 1 อย่าง — รายละเอียดโครงสร้างบทความ + Emotional Hook ดวงรายวัน + Birth Star Calculator + topic list 40 บทความ ดูใน `METHA_BRIEF.md`

---

## โครงสร้างเว็บไซต์

```
amethez.com/
├── index.html          ← หน้าหลัก (content-first, light theme)
├── sale.html           ← Sale Page (Gemma)
├── admin/
│   └── index.html      ← Admin Panel (password protected)
├── stones/
│   ├── amethyst.html   ← บทความอเมทิสต์
│   ├── moldavite.html  ← บทความโมลดาไวท์
│   └── [ชื่อหิน].html  ← 300+ หน้า
├── categories/
│   ├── chakra.html     ← หินตามจักระ
│   ├── zodiac.html     ← หินตามราศี
│   └── color.html      ← หินตามสี
├── wuchong/            ← บทความพลังงาน
├── metha/              ← ดวงรายวัน
├── data/
│   ├── stones.json     ← ข้อมูลหินทั้งหมด
│   └── products.json   ← Shopee Aff links + tags
├── css/main.css
├── js/main.js
├── sitemap.xml
└── .github/
    └── workflows/
        └── deploy.yml  ← Auto-deploy + schedule
```

---

## Admin Panel — หน้าหลังบ้าน

### แท็บหลัก
1. **Crystal Atlas** — เพิ่ม/แก้/ลบบทความหิน + ตั้ง publish date/time
2. **Master Wuchong** — บทความพลังงาน + คอร์ส
3. **อาจารย์เมธา** — ดวงรายวัน + schedule ล่วงหน้า
4. **Shopee Links** — วางลิงค์ + Claude วิเคราะห์ tag อัตโนมัติ
5. **Sale Page** — จัดการสินค้า (ชื่อ + ราคา + URL รูป + ลิงค์)
6. **Google Flow** — prompt สำเร็จรูป + upload รูป/วิดีโอ

### Google Flow Workflow (ใน Admin)
```
STEP 1: Claude เตรียม prompt ไว้แล้ว → กด Copy
STEP 2: เปิด Google Flow → วาง → Generate
STEP 3: Upload รูป/วิดีโอกลับมา
STEP 4: กด Publish → Claude Code push GitHub → เว็บขึ้น
```

---

## Shopee Affiliate System

### หลักการ
- เนื้อหาบทความ = ความรู้ล้วนๆ (ไม่มีการขายปน)
- Shopee Section = แยกต่างหากด้านล่างทุกหน้า
- Auto-match จาก tags — ใส่สินค้าครั้งเดียว กระจายทุกบทความที่ตรง

### Data Structure (products.json)
```json
{
  "products": [
    {
      "id": "001",
      "name": "สร้อยข้อมืออเมทิสต์ 8mm",
      "price": 490,
      "url": "https://s.shopee.co.th/xxx",
      "image_url": "https://down-th.img.susercontent.com/...",
      "tags": ["อเมทิสต์", "ม่วง", "สร้อยข้อมือ", "จักระมงกุฎ"],
      "category": "เครื่องประดับ",
      "status": "available"
    }
  ]
}
```

### Tag Categories
- ชื่อหิน: อเมทิสต์, โมลดาไวท์, สะเก็ดดาวไทย, ซิทริน...
- สี: ม่วง, เขียว, ดำ, ทอง...
- จักระ: มงกุฎ, Third Eye, หัวใจ...
- ราศี: กุมภ์, ตุลย์, มีน...
- วัตถุประสงค์: ความสำเร็จ, การเงิน, ความรัก, สุขภาพ...
- อุปกรณ์: ชาร์จหิน, singing bowl, ใบเสจ, เกลือหิมาลัย...

### สินค้าที่มีอยู่แล้ว
- สะเก็ดดาวไทย (Tektite)
- โพรงอเมทิสต์ขนาดใหญ่
- ซิทริน
- เศษหิน Clear Quartz (฿40)
- ร้านคนจีน (ส่งรูปหรือพาไปร้าน)
- Partner: masterpuch (Line OA)

---

## SEO Strategy

### เป้าหมาย
- 300+ หน้าแรก = เว็บเริ่มแข็งแกร่ง
- 500+ หน้า = คู่แข่งตามยาก

### Content Structure ต่อหน้า
- ยาว 1,500+ คำ
- มีรูป SVG illustration + รูปจริงจาก Shopee
- Quick Facts table
- Benefits Grid
- Chakra visual
- FAQ 5-6 ข้อ (People Also Ask)
- Internal links
- Schema.org JSON-LD
- Shopee Section แยกด้านล่าง

### Schedule
- วันละ 3 หน้า: 08:00 / 13:00 / 20:00
- GitHub Actions cron อัตโนมัติ
- Make.com โพสต์ Facebook + Line OA ตาม

### Timeline SEO
- เดือน 1-2: Google index
- เดือน 3-4: keyword หางยาวติด, 500+/เดือน
- เดือน 5-8: keyword กลาง หน้า 1-2, 5,000+/เดือน
- เดือน 9-12: 10,000+/เดือน
- เดือน 18-24: keyword หลักหน้า 1

---

## Shopee Affiliate Open API

### เงื่อนไข
1. ยอดคำสั่งซื้อ 1,000+ รายการ/เดือน
2. มีเว็บไซต์ + traffic (Monthly visit, Reach, Engagement)
3. เนื้อหาคุณภาพสูง ห้าม clickbait

### แผน
- ตอนนี้: Shopee Affiliate ทั่วไป (มีแล้ว)
- เดือน 5-6: traffic พอ → สมัคร Open API
- เดือน 6-7: approve → ระบบดึงรูป/ชื่อ/ราคา auto

### เร่ง 1,000 orders
- ขายสินค้าหลายหมวด ไม่ใช่แค่หิน
- อุปกรณ์ดูแลหิน + ของมงคล + เครื่องประดับ + ของแต่งบ้าน
- สินค้าราคาถูก 40-300 บาท ตัดสินใจซื้อง่าย

---

## Line OA

- @amethez — ช่องทางหลักของเว็บ
- @masterpuch — Partner shop (masterpuch เป็นหนึ่งใน partner)
- Sale Page → ติดต่อ @masterpuch
- Amethez = Hub ที่เป็นกลาง, masterpuch = ลูกค้า/partner

---

## GitHub Actions — Auto Deploy

```yaml
# deploy.yml
on:
  schedule:
    - cron: '0 1 * * *'   # 08:00 TH
    - cron: '0 6 * * *'   # 13:00 TH
    - cron: '0 13 * * *'  # 20:00 TH
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check scheduled posts
        run: node scripts/check-schedule.js
      - name: Deploy to HostNeverDie
        uses: SamKirkland/FTP-Deploy-Action@v4
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASS }}
          local-dir: ./public/
          server-dir: /public_html/
```

---

## Make.com — Social Auto-post

```
Trigger: GitHub webhook (new file deployed)
        ↓
Facebook Page: โพสต์ชื่อบทความ + link + hashtag
Line OA: broadcast สมาชิก
Instagram: รูป + caption (ถ้ามี)
```

---

## Google Flow Workflow

### สำหรับแต่ละบทความ
Claude เตรียม prompt 2 แบบ:
1. **รูปนิ่ง** — สำหรับ thumbnail + ประกอบบทความ
2. **วิดีโอสั้น** — สำหรับ TikTok/Reels + embed บทความ

### ตัวอย่าง prompt อเมทิสต์
```
รูป: "Raw amethyst crystal cluster, deep purple violet, 
natural cave formation, dramatic lighting, macro 
photography, white background, 8K detail"

วิดีโอ: "Large Brazilian amethyst geode cave slowly 
revealed by camera zoom, deep purple crystals 
glistening, dramatic lighting, cinematic 4K"
```

---

## บทความ News/Discovery — ข่าว/การค้นพบใหม่จากต่างประเทศ

> Workflow เฉพาะสำหรับบทความประเภทนี้เท่านั้น — สำหรับบทความ Evergreen (พื้นฐานหิน) ใช้ Content Structure ใน SEO Strategy ด้านบนแทน

### บทความประเภทนี้คืออะไร
ดึงข้อมูลจากข่าว/การค้นพบใหม่ในวงการแร่/หินมงคลต่างประเทศ แปลและเรียบเรียงใหม่เป็นภาษาไทย พร้อมเพิ่มบริบทสำหรับคนไทย/สายมู — reference: Techsauce "พบอำพันที่เก่าแก่ที่สุดในโลก อายุ 385 ล้านปี" (ต้นฉบับจาก ScienceAlert, Techsauce ใช้ AI เขียน) Amethez ทำแบบเดียวกันแต่ต้อง **ดีกว่า Techsauce ทุกจุด**

### แหล่งข้อมูล
**ค้นก่อน:** ScienceAlert.com, Mindat.org, GIA.edu, Geology.com, Science Daily (Mineralogy)

**รูปที่ใช้ได้ถูกกฎหมาย:** Wikimedia Commons (เช็ค CC ทีละรูป), USGS (สาธารณสมบัติ), Mindat.org (เช็ครายรูป)

**ห้ามดึงรูปจาก:** บทความข่าว (BBC, National Geographic, ScienceAlert), GIA journals, Instagram/Facebook ร้านหิน — **ถ้าหารูป CC ไม่ได้ → สร้าง SVG illustration แทนทันที**

### Workflow
```
1. Claude ค้นหาข่าว/การค้นพบใหม่จากต่างประเทศ
        ↓
2. Claude เขียนบทความยาว ภาษาไทย (เขียนใหม่ทั้งหมด ห้าม copy แปลตรงๆ + ใส่ลิงก์อ้างอิงต้นฉบับ)
        ↓
3. Claude หารูป Wikimedia Commons ที่เกี่ยวข้อง ถ้าไม่มี → สร้าง SVG illustration
        ↓
4. Claude เตรียม Google Flow prompt (รูปและวิดีโอ)
        ↓
5. Claude บันทึกลง articles.json สถานะ "รอรูป"
        ↓
6. Admin Panel แสดง 🔴 รอรูป
        ↓
7. Puchong กด Copy prompt → เปิด Google Flow → Generate
        ↓
8. Puchong Upload รูป/วิดีโอกลับ Admin Panel
        ↓
9. สถานะเปลี่ยนเป็น 🟡 รอ publish → ขึ้นเว็บตาม schedule อัตโนมัติ
```

### โฟลเดอร์เก็บบทความ
```
amethez.com/news/[ชื่อบทความ-เป็นภาษาอังกฤษ-slug].html
```
ตัวอย่าง: `news/amber-385-million-years-china.html`, `news/moldavite-price-surge-2026.html`

### โครงสร้างบทความ (1,500–2,000+ คำ ห้ามสั้นกว่านี้)
1. **HOOK** (2-3 ย่อหน้าแรก) — ต้องโดนใจคนทั่วไป ไม่ใช่คนรู้เรื่องหินอย่างเดียว ห้ามขึ้นต้นด้วยชื่อวิทยาศาสตร์/สูตรเคมี
2. **STORY** (400–600 คำ) — เล่าแบบสารคดี: ใครค้นพบ ที่ไหน เกิดอะไรขึ้น ทำไมสำคัญ
3. **DEEP DIVE** (300–500 คำ) — ข้อมูลวิทยาศาสตร์จริง ตัวเลขจริง อ้างอิงแหล่งที่มาชัดเจน
4. **THAI CONTEXT** (200–300 คำ) — จุดที่ Techsauce ไม่มี: เชื่อมความเชื่อไทย/สายมู, หาซื้อได้ที่ไหนในไทย ราคาเท่าไหร่, เชื่อมจักระ/ราศีถ้าเกี่ยวข้อง
5. **Quick Facts table** — ชื่อ / อายุ-ยุค / แหล่งค้นพบ / ผู้ค้นพบ / ความสำคัญ
6. **FAQ 5-6 ข้อ** — เพื่อติด People Also Ask
7. **Internal links** — ไปบทความหินที่เกี่ยวข้อง + หน้า Category ที่ตรง
8. **Schema.org JSON-LD** (`@type: Article`, author = Crystal Atlas — Amethez)
9. **อ้างอิงท้ายบทความ** — ลิงก์ต้นฉบับเสมอ (`<div class="references">`)
10. **Shopee Section แยกชัดเจน** — auto-match จาก products.json ตาม tags เหมือนบทความ Evergreen อื่นๆ

### Google Flow Prompt (2 แบบต่อบทความ)
```
รูปนิ่ง: "[ชื่อหิน/แร่] [ลักษณะเด่น], [สี], [บริบทการค้นพบ], dramatic lighting,
macro photography style, [background], product photography, 8K detail --ar 16:9"

วิดีโอ: "[บริบทการค้นพบ] cinematic reveal, [สี/ลักษณะ], dramatic lighting,
slow motion, documentary style, 4K"
```

### บันทึกลง articles.json
```json
{
  "id": "news-001",
  "type": "news",
  "title": "พบอำพันที่เก่าแก่ที่สุดในโลก อายุ 385 ล้านปี ก่อนยุคไดโนเสาร์",
  "slug": "amber-385-million-years-china",
  "author": "Crystal Atlas",
  "scheduled_date": "2026-07-20",
  "scheduled_time": "13:00",
  "status": "รอรูป",
  "flow_prompt_image": "Ancient amber fossil specimen...",
  "flow_prompt_video": "Ancient amber fossil slowly revealed...",
  "source_url": "https://www.sciencealert.com/...",
  "tags": ["อำพัน", "ฟอสซิล", "การค้นพบใหม่", "จีน", "385 ล้านปี"],
  "shopee_tags": ["อำพัน", "หินฟอสซิล"]
}
```

### ข้อห้ามเด็ดขาด
```
✗ ห้าม copy แปลตรงๆ จากต้นฉบับ (ผิดลิขสิทธิ์)
✗ ห้ามดึงรูปจาก ScienceAlert/BBC/NatGeo/GIA โดยตรง
✗ ห้ามเขียนสั้นกว่า 1,500 คำ
✗ ห้ามลงบทความพร้อมกันหลายชิ้น (ทยอยลง 1-2 ชิ้น/วัน)
✗ ห้ามไม่มีลิงก์อ้างอิงต้นฉบับ
✗ ห้าม Hook แบบวิชาการ (ชื่อวิทยาศาสตร์ สูตรเคมี ขึ้นก่อน)
```

### ต้องดีกว่า Techsauce ทุกครั้ง
| จุด | Techsauce | Amethez ต้องดีกว่า |
|-----|-----------|-------------------|
| Hook | ข่าวสรุปทั่วไป | Hook ที่ดึงคนทั่วไปและสายมู |
| ความยาว | ~800 คำ | 1,500-2,000+ คำ |
| Thai Context | ไม่มี | มีทุกบทความ (ราคาในไทย, ซื้อที่ไหน, เชื่อมสายมู) |
| FAQ | ไม่มี | 5-6 ข้อ ติด People Also Ask |
| Shopee Section | ไม่มี | มีแยกท้ายหน้าทุกครั้ง |
| SEO Target | Tech/Business คนทั่วไป | สายมู/คริสตัล คนหาหินมงคล |

---

## อาจารย์เมธา — Schedule System

- เขียนดวงสต็อกล่วงหน้า 30 วัน
- ตั้ง publish date ในหลังบ้าน
- GitHub Actions publish ตามวันเวลาอัตโนมัติ
- ไม่ต้องมานั่งเขียนทุกวัน
- สายมูล้วน ไม่ต้องเกี่ยวกับหิน

---

## ค่าใช้จ่ายรวม/เดือน

| บริการ | ราคา |
|--------|------|
| HostNeverDie Speed | ฿67 |
| Google Flow Premium | ฿1,490 |
| Claude Pro + Code | ~฿700 |
| Make.com | ฟรี |
| GitHub | ฟรี |
| **รวม** | **฿2,257/เดือน** |

---

## งานของ Puchong ต่อ 1 บทความ

```
1. ส่งข้อมูลหินให้ Claude    2 นาที
2. กด Generate Google Flow   2 นาที
3. Upload กลับ Admin Panel   1 นาที
──────────────────────────────────
รวม 5 นาที — ระบบทำที่เหลือเอง
```

---

## สถานะปัจจุบัน

- [x] วางแผน Avatar Universe ครบ
- [x] ออกแบบ Design System
- [x] วางโครงสร้างเว็บ
- [x] HostNeverDie Speed Plan
- [x] Shopee Affiliate (ทั่วไป) มีแล้ว
- [x] Line OA @masterpuch มีแล้ว
- [x] Google Sheet สินค้า มีแล้ว
- [x] Claude Code พร้อม
- [ ] GitHub repo สร้าง
- [ ] Admin Panel สร้าง
- [ ] บทความแรก
- [ ] GitHub Actions deploy
- [ ] Make.com เชื่อม
- [ ] เปิดตัว amethez.com

---

## คำสั่งแรกที่ต้องทำ

```bash
# 1. สร้าง folder โปรเจค
mkdir amethez && cd amethez

# 2. git init
git init

# 3. สร้างโครงสร้างไฟล์ทั้งหมด
# (Claude Code จะทำให้)

# 4. push ขึ้น GitHub
git remote add origin https://github.com/[username]/amethez.git
git push -u origin main
```

