# Google Flow Prompt — การ์ดหินอเมทิสต์ (ใบแรก)
> ใช้เจนภาพการ์ดเต็มใบตามลายเซ็น Amethez  
> อัตราส่วน: **2:3** (portrait)  
> ไฟล์เป้าหมาย: `/images/cards/stones/amethyst-card.jpg`

---

## Prompt หลัก (คัดลอกทั้งก้อน)

```
Design a premium vertical collectible crystal information card, aspect ratio 2:3, clean modern minimalist product design for brand "Amethez".

CARD LAYOUT top to bottom, exact structure:

1) TOP SERIES BAR (small):
Left text: "AMETHEZ STONE CARD"
Right text: "017 / 300"
Elegant thin spacing, muted charcoal gray.

2) HERO IMAGE AREA (upper third):
Photorealistic raw deep purple violet amethyst crystal cluster geode, atmospheric lighting, soft purple-to-gold glow, dark mystical background with subtle gold light, NOT plain white cutout, macro photography, museum quality, 8K detail, rounded soft frame inside the card.

3) STONE NAME (centered):
Large Thai title: "อเมทิสต์"
Small English caps under it with letter spacing: "AMETHYST"
Typography: elegant serif for Thai, refined sans for English. Colors: near-black ink and royal purple #7c3aed.

4) SIGNATURE THAI LINE (centered, italic):
「สำเร็จจากสมาธิและปัญญา」
Gold accent brackets #c9a84c, deep purple text. Clear meaning — success from meditation and wisdom.

5) KEYWORDS (centered, small):
"KEYWORDS  สมาธิ · ปัญญา · การนอนหลับ"

6) TWO BOXES side by side:
LEFT box labeled "SCIENCE":
- สูตร SiO₂
- ความแข็ง Mohs 7
- แหล่ง บราซิล · อุรุกวัย

RIGHT box labeled "SOUL":
- จักระ Third Eye · Crown
- ราศี กุมภ์ · มีน
- ธาตุ Air · Water

Soft white cards, thin borders, readable Thai + English terms.

7) DAILY USE strip with gold left accent:
Label "ใช้วันนี้"
Text: "วางหัวเตียงทิศเหนือ · เหมาะวันเสาร์ · สีประจำ ม่วง"

8) PAIRING line:
"หินคู่  เข้ากัน Clear Quartz · Rose Quartz · ระวัง Moldavite ถ้ามือใหม่"

9) QR ZONE (bottom content area):
Small scannable-looking QR placeholder on left + text:
"สแกนอ่านฉบับเต็ม"
"amethez.com/stones/amethyst"

10) BRAND FOOTER BAND (full width bottom):
Rich purple gradient bar (#5b21b6 to #7c3aed).
Left: crystal logo mark (pointed amethyst crystal purple with gold tip) + "AMETHEZ" in gold serif + small tagline "Stones · Stories · Soul"
Right: "amethez.com" in white.

OVERALL STYLE:
Cream/off-white card paper #fffcf8, soft shadow, rounded corners, luxury spiritual but clean (not cluttered occult), generous whitespace, premium Thai crystal brand aesthetic, gold #c9a84c and purple #7c3aed accents only, no other characters, no avatars, no people, no watermarks except brand band, sharp typography, print-ready, 8K --ar 2:3
```

---

## Negative prompt (ถ้ามีช่องใส่)

```
blurry text, misspelled Thai, garbled letters, comic style, anime, people, hands, mascot, cartoon crystal face, cluttered layout, neon glow spam, busy mandala background, stock watermark, low resolution, tilted card, multiple cards, collage
```

---

## ถ้าตัวอักษรไทยเพี้ยน — ใช้ Prompt สำรอง (รูปอย่างเดียว)

เจนเฉพาะโซนรูปด้านบน แล้วเอามาประกอบข้อความทีหลัง:

```
Photorealistic deep purple violet amethyst crystal cluster for a premium collectible card hero image, atmospheric dark purple background with soft gold rim light, dramatic museum lighting, macro detail, natural facets glistening, elegant mystical mood, no text, no logo, no people, vertical composition suitable for upper third of a 2:3 card, 8K --ar 3:2
```

---

## Checklist หลังเจน

- [ ] อัตราส่วนใกล้ 2:3  
- [ ] มีชื่อ อเมทิสต์ + AMETHYST  
- [ ] มี「สำเร็จจากสมาธิและปัญญา」  
- [ ] มีกล่อง Science / Soul  
- [ ] มีแบนด์ล่าง AMETHEZ + amethez.com  
- [ ] ไม่มีอวาตาร์ / คน  
- [ ] เซฟเป็น `amethyst-card.jpg` → วาง `/images/cards/stones/`
