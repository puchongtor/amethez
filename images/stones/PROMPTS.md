# 📸 รูปหิน — Google Flow Prompts & วิธีใช้

## ระบบทำงานอย่างไร
เว็บจะมองหารูปที่ path: `/images/stones/{id}.webp`
- **มีรูป** → แสดงรูปจริง
- **ไม่มีรูป** → แสดง emoji อัตโนมัติ (ไม่ต้องแก้โค้ด)

## วิธีเพิ่มรูป
1. Generate รูปจาก Google Flow ด้วย prompt ด้านล่าง
2. Export เป็น `.webp` ขนาดสี่เหลี่ยมจัตุรัส (แนะนำ 800×800px)
3. ตั้งชื่อไฟล์ตาม `id` ของหิน (เช่น `amethyst.webp`)
4. วางในโฟลเดอร์นี้ (`/images/stones/`)
5. Push ขึ้น GitHub → รูปขึ้นเองทันที

## เคล็ดลับให้ดูเป็นชุดเดียวกัน (สำคัญ!)
ใช้ "ท้าย prompt" เหมือนกันทุกรูป เพื่อให้สไตล์เป็นชุดเดียวกัน:
> `, on clean white background, soft studio lighting, sharp macro focus, professional gemstone product photography, ultra realistic, high detail, no text, square composition`

---

## Prompts รายหิน (photorealistic)

| ไฟล์ | Prompt (วางต่อด้วยท้าย prompt ด้านบน) |
|------|----------------------------------------|
| `amethyst.webp` | A polished deep purple amethyst crystal cluster, violet gradient, natural facets glistening |
| `moldavite.webp` | A raw forest-green moldavite tektite, translucent glassy texture, wrinkled natural surface, glowing |
| `tektite.webp` | A black Thai tektite meteorite stone, glossy dark surface, rough pitted texture |
| `citrine.webp` | A golden-yellow citrine crystal point, transparent, warm sunlight refraction |
| `clear-quartz.webp` | A perfectly clear quartz crystal point, transparent with rainbow inclusions, prismatic light |
| `rudraksha.webp` | A natural brown rudraksha seed bead mala, detailed sacred texture, warm tone |

## หินที่กำลังจะเพิ่ม (coming soon)
| ไฟล์ | Prompt |
|------|--------|
| `rose-quartz.webp` | A soft pink rose quartz tumbled stone, gentle blush color, smooth polished |
| `lapis-lazuli.webp` | A deep blue lapis lazuli stone with golden pyrite flecks, polished |
| `obsidian.webp` | A glossy black obsidian stone, mirror-like volcanic glass surface |
| `garnet.webp` | A deep red garnet gemstone cluster, dark crimson, sparkling facets |
| `moonstone.webp` | A white moonstone cabochon with blue adularescence shimmer, ethereal glow |
| `labradorite.webp` | A labradorite slab flashing blue-green iridescence, dark base |
| `pyrite.webp` | A golden metallic pyrite cube cluster, brassy shine |
| `selenite.webp` | A white selenite tower, fibrous translucent texture, soft inner glow |

---

## รูป Hero ของหน้า Guides (ภาพใหญ่ banner)
ดู prompt ในแต่ละไฟล์ HTML — อยู่ใน comment บนสุด (`<!-- 🎨 GOOGLE FLOW IMAGE PROMPT -->`)
เช่น `guides/cleanse.html`, `guides/healing-color.html` ฯลฯ
รูป hero แนะนำขนาดแนวนอน 1600×900px ตั้งชื่อ `/images/hero/{ชื่อหน้า}.webp`
