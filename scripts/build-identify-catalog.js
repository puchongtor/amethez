/**
 * Build data/identify-catalog.json from data/top-100-stones.json + rock buckets.
 * Re-run: node scripts/build-identify-catalog.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'top-100-stones.json');
const OUT = path.join(ROOT, 'data', 'identify-catalog.json');

const COLOR_EMOJI = {
  purple: '💜',
  violet: '💜',
  green: '💚',
  blue: '💙',
  red: '❤️',
  pink: '💗',
  yellow: '💛',
  gold: '💛',
  orange: '🧡',
  brown: '🤎',
  black: '🖤',
  white: '🤍',
  clear: '💎',
  multi: '✨',
  gray: '🩶',
  grey: '🩶',
  silver: '🩶',
};

const NICKNAMES = {
  amethyst: ['อเมทิส', 'อเมทิสท์', 'หินม่วง'],
  citrine: ['ซิทริน', 'หินเหลือง'],
  'rose-quartz': ['ควอตซ์ชมพู', 'โรสควอตซ์'],
  'clear-quartz': ['ควอตซ์ใส', 'คริสตัลใส'],
  moldavite: ['โมลดาไวท์', 'โมลดาไวต'],
  tektite: ['สะเก็ดดาว', 'เท็กไทต์'],
  'black-obsidian': ['ออบซิเดียน', 'หินภูเขาไฟดำ'],
  turquoise: ['เทอร์ควอยซ์', 'หินฟ้าเขียว'],
  jade: ['หยก', 'เจด'],
  lapis: ['ลาพิส', 'ลาพิส ลาซูลี'],
  'lapis-lazuli': ['ลาพิส', 'ลาพิสลาซูลี'],
  malachite: ['มาลาไคต์'],
  labradorite: ['ลาบราดอไรต์', 'ลาบรา'],
  moonstone: ['มูนสโตน', 'หินจันทร์'],
  sunstone: ['ซันสโตน'],
  tiger: ['ไทเกอร์อาย', 'ตาเสือ'],
  'tigers-eye': ['ไทเกอร์อาย', 'ตาเสือ'],
  'tiger-eye': ['ไทเกอร์อาย', 'ตาเสือ'],
  pyrite: ['ไพไรต์', 'ทองคนโง่'],
  hematite: ['เฮมาไทต์'],
  fluorite: ['ฟลูออไรต์'],
  aquamarine: ['อความารีน', 'อความาริน'],
  garnet: ['การ์เนต'],
  peridot: ['เพอริดอท'],
  opal: ['โอปอล'],
  amber: ['อำพัน'],
  coral: ['ปะการัง'],
  pearl: ['ไข่มุก'],
  diamond: ['เพชร'],
  ruby: ['ทับทิม'],
  sapphire: ['ไพลิน'],
  emerald: ['มรกต'],
  topaz: ['โทแพซ'],
  tourmaline: ['ทัวร์มาลีน'],
  carnelian: ['คาร์เนเลียน'],
  agate: ['อาเกต', 'อะเกต'],
  jasper: ['แจสเปอร์'],
  onyx: ['โอนิกซ์'],
  sodalite: ['โซดาไลต์'],
  amazonite: ['อเมซอนไนต์'],
  aventurine: ['อะเวนทูรีน'],
  kyanite: ['ไคยาไนต์'],
  selenite: ['เซเลไนต์'],
  howlite: ['ฮาวไลต์'],
  apatite: ['อะพาไทต์'],
  prehnite: ['เพรห์ไนต์'],
  chrysoprase: ['คริสโซเพรส'],
  rhodonite: ['โรโดไนต์'],
  rhodochrosite: ['โรโดโครไซต์'],
  bloodstone: ['บลัดสโตน', 'หินเลือด'],
  'smoky-quartz': ['สโมกกี้ควอตซ์', 'ควอตซ์ควัน'],
  'rutilated-quartz': ['ไหมทอง', 'รูทิเลต'],
  'golden-rutilated-quartz': ['ไหมทอง'],
  rudraksha: ['รุทรากษ์', 'ลูกประคำ'],
};

function slugFromId(rawId) {
  if (!rawId) return 'unknown';
  const m = String(rawId).match(/^rank-\d+-(.+)$/i);
  return m ? m[1] : String(rawId);
}

function ensureUniqueIds(entries) {
  const seen = new Map();
  for (const e of entries) {
    let base = e.id;
    let id = base;
    let n = 2;
    while (seen.has(id)) {
      id = `${base}-${n++}`;
    }
    seen.set(id, true);
    e.id = id;
  }
  return entries;
}

function inferChakra(tags, nameEn, nameTh) {
  const blob = [...(tags || []), nameEn || '', nameTh || ''].join(' ').toLowerCase();
  const chakras = [];
  const rules = [
    [/มงกุฎ|crown|sahasrara/, 'มงกุฎ'],
    [/third.?eye|อชนา|ตาที่สาม|ajna/, 'ตาที่สาม'],
    [/คอ|throat|vishuddha|สื่อสาร/, 'คอ'],
    [/หัวใจ|heart|anahata|รัก/, 'หัวใจ'],
    [/สุริยะ|solar|manipura|พลังงานส่วนตัว/, 'สุริยะจักร'],
    [/ศักดิ์สิทธิ์|sacral|svadhisthana|สร้างสรรค์/, 'กระดูกสันหลังส่วนล่าง'],
    [/ราก|root|muladhara|พื้นดิน|ground/, 'ราก'],
  ];
  for (const [re, name] of rules) {
    if (re.test(blob) && !chakras.includes(name)) chakras.push(name);
  }
  return chakras;
}

function rockClass(en, th, col) {
  const blob = `${en || ''} ${th || ''}`.toLowerCase();
  const fossilRe =
    /fossil|ฟอสซิล|ammonite|trilobite|megalodon|petrified|อำพัน|amber|coral|ปะการัง|เปลือกหอย|shell/;
  if (fossilRe.test(blob)) return 'fossil';
  if (/rudraksha|รุทรากษ์|ลูกประคำ/.test(blob)) return 'belief';
  // col is a weak hint only — do not override mineral default for gems
  if (col === 'fossil') return 'fossil';
  return 'mineral';
}

function emojiForColor(col) {
  if (!col) return undefined;
  return COLOR_EMOJI[String(col).toLowerCase()] || '🪨';
}

function aliasesFor(id, nameTh, nameEn) {
  const set = new Set();
  if (nameTh) set.add(nameTh);
  if (nameEn) set.add(nameEn);
  const nicks = NICKNAMES[id] || [];
  for (const n of nicks) set.add(n);
  // light heuristics from English name
  const lower = (nameEn || '').toLowerCase();
  if (lower.includes("tiger") && lower.includes('eye')) {
    set.add('ไทเกอร์อาย');
    set.add('ตาเสือ');
  }
  if (lower.includes('obsidian')) set.add('ออบซิเดียน');
  if (lower.includes('quartz') && nameTh && nameTh.includes('ไหม')) set.add('ไหมทอง');
  return [...set];
}

function loadTop100() {
  const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const stones = data.stones || [];
  return stones.map((s) => {
    const id = slugFromId(s.id);
    const entry = {
      id,
      name_th: s.th || '',
      name_en: s.en || '',
      aliases: aliasesFor(id, s.th, s.en),
      visual_cues: s.desc || '',
      meaning_short: s.belief || '',
      chakra: inferChakra(s.tags, s.en, s.th),
      tags: Array.isArray(s.tags) ? s.tags : [],
      article_url: s.articleUrl != null ? s.articleUrl : null,
      tier: 'core',
      rock_class: rockClass(s.en, s.th, s.col),
      color: s.col || null,
      rank: typeof s.rank === 'number' ? s.rank : null,
    };
    const emoji = emojiForColor(s.col);
    if (emoji) entry.emoji = emoji;
    return entry;
  });
}

function buckets() {
  return [
    {
      id: 'river-pebble',
      name_th: 'หินแม่น้ำ/หินกรวด',
      name_en: 'River Pebble',
      aliases: ['หินแม่น้ำ/หินกรวด', 'River Pebble', 'หินแม่น้ำ', 'หินกรวด', 'ก้อนกรวด'],
      visual_cues:
        'ก้อนกลมมนจากการถูกน้ำฝน/แม่น้ำขัด ผิวเรียบ สีผสมตามแหล่งที่มา มักไม่เป็นแร่มีค่าเฉพาะชนิด',
      meaning_short:
        'เป็นหินธรรมชาติทั่วไป ใช้ชื่นชมความงามจากธรรมชาติ หรือเป็นของตั้ง/ของสะสมที่ให้ความรู้สึกสงบ มั่นคง ไม่ใช่หินมงคลพิเศษที่มีเคลมปาฏิหาริย์',
      chakra: [],
      tags: ['หินแม่น้ำ', 'หินกรวด', 'ธรรมชาติ', 'ทั่วไป'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'river_common',
      color: 'multi',
      emoji: '🪨',
      rank: null,
    },
    {
      id: 'common-quartz',
      name_th: 'ควอตซ์ทั่วไป',
      name_en: 'Common Quartz',
      aliases: ['ควอตซ์ทั่วไป', 'Common Quartz', 'ควอตซ์', 'หินควอตซ์', 'คริสตัลทั่วไป'],
      visual_cues:
        'แร่ซิลิกาที่พบบ่อย ใสถึงขาวขุ่น มีความแข็ง ผิวเป็นแก้ว อาจเป็นผลึกหกเหลี่ยมหรือก้อนดิบ',
      meaning_short:
        'ควอตซ์เป็นแร่พื้นฐานที่พบได้ทั่วไป ใช้เรียนรู้ลักษณะผลึกและเป็นจุดเริ่มต้นของคนสนใจหิน ไม่จำเป็นต้องตีความเป็นปาฏิหาริย์',
      chakra: [],
      tags: ['ควอตซ์', 'แร่พื้นฐาน', 'ทั่วไป'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'mineral',
      color: 'clear',
      emoji: '💎',
      rank: null,
    },
    {
      id: 'igneous-rock',
      name_th: 'หินอัคนี (ภาพรวม)',
      name_en: 'Igneous Rock',
      aliases: ['หินอัคนี (ภาพรวม)', 'Igneous Rock', 'หินอัคนี', 'หินภูเขาไฟ'],
      visual_cues:
        'เกิดจากลาวา/หินหนืดเย็นตัว อาจมีผลึกแทรก รูพรุนจากฟองแก๊ส หรือเนื้อแน่นละเอียด เช่น หินแกรนิต บะซอลต์',
      meaning_short:
        'หมวดหินจากไฟใต้พิภพ เป็นกรอบจำแนกทางธรณีวิทยา ช่วยเข้าใจที่มา ไม่ใช่ชื่อหินชนิดเดียวที่มีพลังพิเศษ',
      chakra: [],
      tags: ['หินอัคนี', 'ธรณีวิทยา', 'ภาพรวม'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'igneous',
      color: null,
      emoji: '🌋',
      rank: null,
    },
    {
      id: 'sedimentary-rock',
      name_th: 'หินชั้น (ภาพรวม)',
      name_en: 'Sedimentary Rock',
      aliases: ['หินชั้น (ภาพรวม)', 'Sedimentary Rock', 'หินตะกอน', 'หินชั้น'],
      visual_cues:
        'เกิดจากการทับถมของตะกอน มักเห็นชั้นชัด อาจมีซากดึกดำบรรพ์ฝัง เนื้อหยาบถึงละเอียด เช่น หินทราย หินปูน',
      meaning_short:
        'หมวดหินจากการสะสมตัวของตะกอนตามกาลเวลา ใช้จำแนกที่มาทางธรณี ไม่ใช่หินมงคลชนิดเดียว',
      chakra: [],
      tags: ['หินชั้น', 'หินตะกอน', 'ธรณีวิทยา', 'ภาพรวม'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'sedimentary',
      color: null,
      emoji: '📚',
      rank: null,
    },
    {
      id: 'metamorphic-rock',
      name_th: 'หินแปร (ภาพรวม)',
      name_en: 'Metamorphic Rock',
      aliases: ['หินแปร (ภาพรวม)', 'Metamorphic Rock', 'หินแปร'],
      visual_cues:
        'หินเดิมถูกความร้อนและความดันเปลี่ยนเนื้อและแร่ใหม่ มักมีริ้วชั้นหรือแร่เรียงตัว เช่น หินอ่อน หินชีสต์',
      meaning_short:
        'หมวดหินที่ “แปรรูป” จากหินเดิมใต้พิภพ ใช้เข้าใจกระบวนการทางธรณี ไม่ได้แปลว่ามีพลังวิเศษโดยอัตโนมัติ',
      chakra: [],
      tags: ['หินแปร', 'ธรณีวิทยา', 'ภาพรวม'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'metamorphic',
      color: null,
      emoji: '🔁',
      rank: null,
    },
    {
      id: 'fossil-general',
      name_th: 'ฟอสซิลทั่วไป',
      name_en: 'Fossil (General)',
      aliases: ['ฟอสซิลทั่วไป', 'Fossil (General)', 'ฟอสซิล', 'ซากดึกดำบรรพ์'],
      visual_cues:
        'ร่องรอยหรือซากสิ่งมีชีวิตโบราณในหิน มองเห็นรูปเปลือก กระดูก ลายใบ หรือโครงสร้างเดิมที่กลายเป็นแร่',
      meaning_short:
        'เป็นหลักฐานทางธรณีกาลและชีววิทยาในอดีต คุณค่าอยู่ที่ประวัติศาสตร์ธรรมชาติและการเรียนรู้ ไม่ใช่เคลมปาฏิหาริย์',
      chakra: [],
      tags: ['ฟอสซิล', 'ซากดึกดำบรรพ์', 'ทั่วไป'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'fossil',
      color: null,
      emoji: '🦴',
      rank: null,
    },
    {
      id: 'volcanic-glass',
      name_th: 'แก้วภูเขาไฟ/ออบซิเดียนกลุ่ม',
      name_en: 'Volcanic Glass',
      aliases: [
        'แก้วภูเขาไฟ/ออบซิเดียนกลุ่ม',
        'Volcanic Glass',
        'แก้วภูเขาไฟ',
        'ออบซิเดียน',
        'obsidian',
      ],
      visual_cues:
        'ลาวาเย็นเร็วจนเป็นแก้ว ผิวมันวาวแตกแบบหอยโข่ง สีดำถึงเข้ม อาจมีลายรุ้งหรือจุดฝัง',
      meaning_short:
        'เป็นหินภูเขาไฟชนิดแก้ว คุณสมบัติเด่นคือเนื้อแก้วและขอบคมเมื่อแตก ในสายสะสมมักพูดถึงการตั้งใจ/ตัดความวุ่นวายแบบเชิงสัญลักษณ์ ไม่ใช่ผลทางการแพทย์',
      chakra: [],
      tags: ['ออบซิเดียน', 'แก้วภูเขาไฟ', 'หินอัคนี'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'igneous',
      color: 'black',
      emoji: '🖤',
      rank: null,
    },
    {
      id: 'unknown-stone',
      name_th: 'ยังระบุไม่ชัด',
      name_en: 'Unidentified Stone',
      aliases: ['ยังระบุไม่ชัด', 'Unidentified Stone', 'ไม่ทราบชนิด', 'unknown'],
      visual_cues:
        'ลักษณะไม่ตรงกับชนิดที่คุ้นชัด ควรดูความแข็ง ความวาว สี ลาย และแหล่งที่พบเพิ่มก่อนฟันธงชื่อ',
      meaning_short:
        'เมื่อยังระบุไม่ได้ ให้เก็บเป็น “ยังไม่ทราบชนิด” ก่อน ดีกว่าเดาชื่อหินมงคลผิด — สังเกตเพิ่มหรือถามผู้เชี่ยวชาญได้',
      chakra: [],
      tags: ['ไม่ทราบชนิด', 'ระบุไม่ได้', 'ทั่วไป'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'mineral',
      color: null,
      emoji: '❓',
      rank: null,
    },
    {
      id: 'limestone-calcite',
      name_th: 'หินปูน/แคลไซต์ทั่วไป',
      name_en: 'Limestone / Calcite',
      aliases: [
        'หินปูน/แคลไซต์ทั่วไป',
        'Limestone / Calcite',
        'หินปูน',
        'แคลไซต์',
        'calcite',
        'limestone',
      ],
      visual_cues:
        'หินตะกอนหรือแร่คาร์บอเนต สีขาวครีมถึงเทา เนื้ออาจเป็นผลึกหรือทึบ ทำปฏิกิริยากับกรดอ่อนได้บ่อย',
      meaning_short:
        'หินปูนและแคลไซต์พบได้ทั่วไปในธรรมชาติและของตกแต่ง คุณค่าหลักอยู่ที่ธรณีวิทยาและการใช้งาน ไม่จำเป็นต้องเคลมปาฏิหาริย์',
      chakra: [],
      tags: ['หินปูน', 'แคลไซต์', 'หินชั้น'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'sedimentary',
      color: 'white',
      emoji: '🤍',
      rank: null,
    },
    {
      id: 'sandstone',
      name_th: 'หินทราย',
      name_en: 'Sandstone',
      aliases: ['หินทราย', 'Sandstone', 'หินทรายธรรมชาติ'],
      visual_cues:
        'หินตะกอนจากเม็ดทรายอัดแน่น มักเห็นเนื้อเม็ด ชั้นสีน้ำตาล แดง เทา หรือครีม ผิวหยาบกว่าหินปูนบางชนิด',
      meaning_short:
        'หินทรายเป็นหินชั้นทั่วไป ใช้ในงานก่อสร้างและภูมิทัศน์ ความหมายเชิงสัญลักษณ์ถ้ามีก็เป็นเรื่องความรู้สึกส่วนบุคคล ไม่ใช่หลักวิทยาศาสตร์',
      chakra: [],
      tags: ['หินทราย', 'หินชั้น', 'ธรณีวิทยา'],
      article_url: null,
      tier: 'bucket',
      rock_class: 'sedimentary',
      color: 'brown',
      emoji: '🤎',
      rank: null,
    },
  ];
}

function main() {
  const core = loadTop100();
  const all = ensureUniqueIds([...core, ...buckets()]);
  const catalog = {
    generated: new Date().toISOString(),
    version: 1,
    stones: all,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${OUT}`);
  console.log(`stones count: ${all.length}`);
  console.log(`core: ${core.length}, buckets: ${buckets().length}`);
}

main();
