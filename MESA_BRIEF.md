# คำสั่งสำหรับ Claude / Cursor — เมษา · Amethez Shorts
> อ่านไฟล์นี้ก่อนทำงานทุกอย่างที่เกี่ยวกับ Amethez Shorts / เมษา
> สร้าง: 2026-08-08

---

## เมษา คือใคร

**บรรณาธิการ Amethez Shorts** — เปลี่ยนคลิปหิน 1 นาที ให้เป็นบทความสั้น อ่านจบไว

- Tone: น่ารัก สนุก ชอบพูด รักหิน — ไม่ใช่บรรยายตำรา ไม่ใช่ที่ปรึกษาชีวิต
- Niche: **ทริป / จุดเด่น / ของแท้-ปลอม / มูลค่า / เรื่องแปลก** จากคลิปตัวละครหิน 3D
- ไม่แข่งกับ Crystal Atlas (สารานุกรมยาว) · Wuchong (ปรัชญา) · เมธา (ดวง)
- หินชนิดเดียวกันมีได้ทั้งหน้า Atlas และหน้า Shorts — ลิงก์ข้ามเสมอ

> ตัวอย่างคลิป: อำพันของแท้/ปลอม · อุกกาบาต · อายุมากน้อยที่ราคาต่างกัน — พูดไม่เกิน ~1 นาที

---

## หมวดบนเว็บ

| | |
|--|--|
| ชื่อหมวด | **Amethez Shorts** |
| คนดูแล | **เมษา** |
| Hub | `/shorts/` |
| บทความ | `/shorts/[slug].html` |
| ข้อมูล | `data/shorts.json` |
| คลิป | `/videos/shorts/[slug].mp4` (หรือ URL ที่ระบุใน JSON) |
| รูปเมษา | `/images/avatars/mesa.png` (slot: `mesa_avatar`) |
| คลังรูป | `/images/avatars/mesa-*.png` + `/images/mesa/` |

### คลังรูปที่ล็อกแล้ว (2026-08-08)

| ไฟล์ | ใช้ที่ |
|------|--------|
| `images/avatars/mesa.png` | **โปรไฟล์หลัก** — expert card, nav, default |
| `images/avatars/mesa-bubble.png` | **กล่องคำพูด** ในบทความ (ใบหน้าชัด) |
| `images/avatars/mesa-hero.png` | Hero หน้า `/shorts/` (โต๊ะหิน + ยิ้ม) |
| `images/avatars/mesa-present.png` | โชว์หินในมือ — การ์ดแนะนำ |
| `images/avatars/mesa-soft.png` | โทนอบอุ่น มองหินในมือ |
| `images/avatars/mesa-cute.png` | โพสต์น่ารัก มือหน้ารูป |
| `images/mesa/mesa-desk-*.png` | ตกแต่ง hub / about |
| `images/mesa/mesa-outdoor-set-*.png` | ชุดถ่ายนอกสถานที่ (คอลลาจ) — ตัดใช้ทีหลังได้ |

---

## หน้าที่ของเมษาในบทความ

1. **เปิดเรื่อง** — ฮุคสั้นๆ แบบพูดกับเพื่อน  
2. **กล่องคำพูด (Mesa Bubble)** — แทรก 1–2 จุดในเนื้อหา: สรุปใจความ / ทริกเล็กน้อย / เตือนของปลอม  
3. **ปิดท้าย** — ชวนไปหน้าสารานุกรมถ้าอยากรู้ลึก + Aff แยกท้าย

อย่าให้เธอขายของในบับเบิล — ขายอยู่บล็อก Aff ท้ายหน้าเท่านั้น

---

## โครงสร้างบทความสั้น (400–800 คำ เป็นหลัก · หนักได้ถึง ~1,200)

```
1. Hero: ชื่อทริป + เมษาแนะนำ 1 บรรทัด
2. ฝังคลิป (lazy load, playsinline, controls)
3. สรุปประเด็น 3–5 ข้อ (หัวใจจากคลิป)
4. Mesa Bubble ×1–2 (ทริก / สรุป)
5. ถ้าเนื้อหาหนัก: ขยาย Deep dive สั้นๆ
6. ลิงก์ → หน้าหิน Atlas ที่เกี่ยวข้อง
7. FAQ 3–4 ข้อ (ถ้าเข้า People Also Ask)
8. Shopee Aff แยกท้าย (data-tags)
```

ห้ามสั้นจนไม่มีสาร · ห้ามยาวแบบสารานุกรมทับ Atlas

---

## Workflow: อัปคลิป → AI จัดการทั้งหมด

### ตอนนี้ (เฟส 1) — ใช้แชทนี้

```
คุณ: อัปคลิป (+ ชื่อหิน / ประเด็น 1 บรรทัดถ้ามี)
  ↓
AI ในแชทนี้:
  1. ดูคลิป + สรุปประเด็น
  2. ตั้ง slug + ชื่อบทความภาษาไทย
  3. เขียน HTML หน้า /shorts/[slug].html (โทนเมษา)
  4. ใส่ Mesa Bubble + ลิงก์ Atlas + aff tags
  5. เพิ่มรายการใน data/shorts.json (featured ตามความเหมาะสม)
  6. ย้าย/อ้างอิงไฟล์คลิปไป videos/shorts/
```

**ทำไมไม่ใช้หลังบ้านก่อน:** Admin ยังไม่มีแท็บ Shorts · ปริมาณร้อยคลิปต้องมี pipeline เขียนบทความ — แชทนี้เร็วสุดจนกว่าจะล็อกเทมเพลต

### เฟส 2 (ทีหลัง) — แท็บ Admin “Amethez Shorts”

- อัปคลิปในหลังบ้าน → สถานะ: รอเขียน / พร้อม publish  
- AI หรือปุ่ม Generate สร้างบทความจากคลิป  
- ตั้ง featured สำหรับแถวหน้าแรก  

---

## Google Flow — Prompt หน้าเมษา (ล็อกหน้าตาแล้ว)

> มีรูปจริงแล้วใน `/images/avatars/` — ใช้ชุดนี้เป็น reference เวลาเจนต่อ  
> ลักษณะล็อก: ผมบ๊อบม่วงลาเวนเดอร์ · เสื้อถักม่วงอ่อน · จี้คริสตัล · ยิ้มอบอุ่น น่ารัก รักหิน

### รูปโปรไฟล์หลัก (มีแล้ว → `mesa.png`)
```
Young Thai woman character portrait for crystal brand mascot named Mesa,
cute cheerful talkative vibe, mid-20s, warm smile, bright curious eyes,
short bob or soft layered hair with subtle purple amethyst highlight streak,
casual chic outfit soft lavender and cream, small crystal pendant necklace,
holding or beside a cute glowing crystal, soft studio lighting,
clean light cream background #faf8f4, friendly lifestyle illustration
meets semi-realistic portrait, brand mascot for website avatar,
high detail face, approachable not glamorous model, 8K --ar 1:1
```

### รูปครึ่งตัว / hero (มีแล้ว → `mesa-hero.png`)
```
Same Mesa character, half-body, excited storytelling pose as if introducing
a short video tip about crystals, one hand gesturing toward camera,
cute speech-bubble friendly energy, soft purple and gold accent lighting,
cream background, Amethez brand mascot, warm and fun, 8K --ar 4:5
```

### รูปหัวกล่องคำพูด (ใช้ `mesa-bubble.png` = crop จากโปรไฟล์)
```
Close-up face crop of Mesa character, big friendly smile, eye contact,
soft lavender hair streak, cream background, circular avatar friendly
sticker style suitable for speech bubble UI, high clarity, 8K --ar 1:1
```

---

## HTML — Mesa Bubble (ใช้ซ้ำได้)

```html
<aside class="mesa-bubble" aria-label="เมษาพูด">
  <img class="mesa-bubble-avatar" src="/images/avatars/mesa-bubble.png" alt="เมษา" width="56" height="56" loading="lazy"
       onerror="this.src='/images/avatars/mesa.png'">
  <div class="mesa-bubble-body">
    <div class="mesa-bubble-name">เมษา</div>
    <p>ประโยคทริกหรือสรุปใจความ — สนุก กระชับ ไม่ขายของ</p>
  </div>
</aside>
```

สไตล์อยู่ใน `css/main.css` (คลาส `.mesa-bubble`)

---

## data/shorts.json schema

```json
{
  "shorts": [
    {
      "id": "short-001",
      "slug": "amber-real-vs-fake",
      "title": "อำพันของแท้ vs ของปลอม — ดูยังไงใน 1 นาที",
      "hook": "ก่อนซื้ออำพัน เช็ค 3 จุดนี้ก่อน!",
      "stone": "amber",
      "stone_url": "/stones/amber.html",
      "video": "/videos/shorts/amber-real-vs-fake.mp4",
      "thumb": "/images/shorts/amber-real-vs-fake.jpg",
      "tags": ["อำพัน", "ของแท้", "ของปลอม"],
      "shopee_tags": ["อำพัน"],
      "featured": true,
      "status": "published",
      "publishDate": "2026-08-08",
      "author": "เมษา"
    }
  ]
}
```

---

## จุดวางบนเว็บ

1. `/shorts/` — hub + แนะนำเมษา  
2. `/shorts/[slug].html` — บทความสั้น + คลิป  
3. หน้าแรก — **แถวเดียว** Amethez Shorts (ดึง `featured` จาก JSON)  
4. Nav เมนูเรียนรู้ + อาจารย์  
5. Expert strip — การ์ดเมษา  

---

## ข้อห้าม

```
✗ ยัดคลิปทับบทความยาว Atlas โดยไม่มีบทความ Shorts แยก
✗ ให้เมษาพูดขายของในบับเบิล
✗ เขียนสั้นจนไม่มีประเด็นจากคลิป
✗ คัดลอกสคริปต์คลิปคำต่อคำยาวๆ โดยไม่เรียบเรียง
✗ สร้าง Master คนใหม่ระดับ Wuchong — เมษา = บรรณาธิการ Shorts
```
