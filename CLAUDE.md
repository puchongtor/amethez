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
| Master Wuchong | พลังงาน / ความสำเร็จ / การเงิน / สุขภาพ | ลึกซึ้ง จริงจัง | คอร์สเรียน + E-book |
| อาจารย์เมธา | ดวง / สายมู / เทพ | อบอุ่น พี่ใหญ่ | Line OA + สายมู aff |
| Gemma | Sale Page | อบอุ่น น่าซื้อ | Line @masterpuch |
| Max | DIY Workshop | ช่างหนุ่ม มือเปื้อน | อุปกรณ์ DIY |
| Zin | เปิดใจคุยกับหิน | ลึกลับ สนุก | Shopee หิน |

**Phase 1 ทำก่อน:** Crystal Atlas + Master Wuchong + อาจารย์เมธา
**Phase 2 ทีหลัง:** Gemma + Max + Zin

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

