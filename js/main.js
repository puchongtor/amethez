/* Amethez — Main JS */

// ── Blog Article Hero Image Injector ──
(async function injectBlogHeroImage(){
  const heroDiv = document.querySelector('.hero-img');
  if(!heroDiv) return;
  try{
    const r = await fetch('/data/blog.json?v='+Date.now());
    const d = await r.json();
    const path = location.pathname;
    const art = d.articles.find(a => a.url && (a.url === path || a.url === path.replace(/\/$/,'')));
    if(!art || !art.thumb) return;
    heroDiv.innerHTML = `<img src="${art.thumb}" alt="${art.title||''}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" onerror="this.parentElement.innerHTML='💎'">`;
    heroDiv.style.padding = '0';
  }catch(e){}
})();

// ── Relevance scoring ──
// Recommended products were picked by "does anything match at all", so a
// product whose only connection is one generic shared tag (e.g. "ม่วง")
// ranked the same as one whose actual name is the stone in question — the
// article and its "แนะนำ" section routinely disagreed. Score every keyword
// match instead: a hit in the product's own name (its real identity) counts
// far more than a hit in its tag list (often broad/reused across products),
// then sort so the closest matches surface first.
//
// One wrinkle found while testing: generic purpose/benefit words ("สมาธิ",
// "พลังงาน", "มงคล", ฯลฯ) are marketing boilerplate stamped on almost every
// listing's title regardless of what stone it actually is (e.g. "...เสริม
// สมาธิ ไม่ต้องล้างพลังงาน" on a completely unrelated kyanite ring) — a name
// hit on one of these carries none of the identity signal a real stone name
// hit does, so it must not get the same weight.
const GENERIC_PURPOSE_WORDS = new Set(['ความสำเร็จ','การเงิน','ความรัก','สุขภาพ','ป้องกัน','สมาธิ',
  'ความสงบ','พลังงาน','ดึงดูด','ฮวงจุ้ย','นอนหลับ','เสริมดวง','มงคล']);
// Second wrinkle: a color/chakra/zodiac word ("เขียว","มงกุฎ") is a real,
// legitimate match — but many unrelated stones share the same color/chakra,
// so it's still weaker evidence than the actual stone name itself. Without
// this tier, e.g. an unrelated green kyanite bracelet tied a genuine
// moldavite listing on the moldavite page purely by both containing "เขียว".
const DESCRIPTOR_WORDS = new Set(['ม่วง','ชมพู','เขียว','ดำ','ขาว','น้ำเงิน','แดง','ส้ม','เหลือง','ทอง',
  'รุ้ง','เทา','น้ำตาล','ใส','มงกุฎ','third eye','คอ','หัวใจ','สุริยะ','ก้นกบ','ราก','solar plexus','sacral',
  'เมษ','พฤษภ','เมถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน']);
function keywordNameWeight(kwRaw){
  const kw = (kwRaw || '').trim().toLowerCase();
  if(GENERIC_PURPOSE_WORDS.has(kw)) return 1;
  if(DESCRIPTOR_WORDS.has(kw)) return 2;
  return 3; // treated as an actual identity term (stone name, product shape, etc.)
}
function scoreProductMatch(product, keywords) {
  const name = (product.name || '').toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());
  let score = 0;
  for (const kwRaw of keywords) {
    const kw = (kwRaw || '').toLowerCase();
    if (!kw) continue;
    if (name.includes(kw)) score += keywordNameWeight(kwRaw);
    if (tags.some(t => t.includes(kw) || kw.includes(t))) score += 1;
  }
  return score;
}

function rankProductsByRelevance(products, keywords, limit = Infinity) {
  return products
    .filter(p => p.status === 'available')
    .map(p => ({ p, score: scoreProductMatch(p, keywords) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.p);
}

// ── Shopee Product Loader ──
async function loadShopeeProducts(tags = [], limit = 40) {
  try {
    const res = await fetch('/data/products.json');
    const { products } = await res.json();
    return rankProductsByRelevance(products, tags, limit);
  } catch { return []; }
}

// ให้ปุ่มคัดลอกลิงก์ทำงานได้แม้ถูกเรียกจาก HTML string ที่ต่อด้วย template
// literal (อักขระพิเศษในชื่อ/ลิงก์อาจทำให้ inline onclick พังได้) — เก็บ URL
// ไว้ใน map แล้วอ้างด้วย index แทนการฝัง URL ตรงๆ ในแอตทริบิวต์
let _copyUrlRegistry = [];
function copyTextWithFallback(text){
  if(navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return legacyCopy(text);
}
function legacyCopy(text){
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try{
      document.execCommand('copy') ? resolve() : reject(new Error('execCommand failed'));
    }catch(e){ reject(e); }
    finally{ document.body.removeChild(ta); }
  });
}
function copyAffLinkByIdx(idx, btn){
  const url = _copyUrlRegistry[idx];
  if(!url) return;
  const orig = btn.textContent;
  copyTextWithFallback(url).then(()=>{
    btn.textContent = '✅';
    setTimeout(()=>{ btn.textContent = orig; }, 1200);
  }).catch(()=>{
    btn.textContent = '❌';
    setTimeout(()=>{ btn.textContent = orig; }, 1200);
  });
}

function renderProductCard(p) {
  const fallback = `this.style.display='none';this.nextElementSibling.style.display='flex'`;
  const imgBlock = p.image_url
    ? `<img src="${p.image_url}" alt="" style="width:100%;height:150px;object-fit:cover;display:block" onerror="${fallback}">
       <div style="display:none;align-items:center;justify-content:center;height:150px;background:linear-gradient(135deg,#ede9fe,#f5f0ff);font-size:2rem">💎</div>`
    : `<div style="display:flex;align-items:center;justify-content:center;height:150px;background:linear-gradient(135deg,#ede9fe,#f5f0ff);font-size:2rem">💎</div>`;
  const storeLine = p.store ? `<div style="font-size:.66rem;color:#9ca3af">${p.store}</div>` : '';
  const urlIdx = _copyUrlRegistry.push(p.url) - 1;
  const trackAttr = `onclick="if(typeof gtag==='function')gtag('event','shopee_click',{store:'${(p.store||'').replace(/'/g,"")}'})"`;
  return `<div style="flex:0 0 175px;width:175px;border-radius:.75rem;overflow:hidden;background:#fff;border:1px solid #ede9fe;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(124,58,237,.08)">
    <a href="${p.url}" target="_blank" rel="nofollow noopener" style="display:block;flex-shrink:0" ${trackAttr}>${imgBlock}</a>
    <div style="padding:.6rem .7rem;display:flex;flex-direction:column;gap:.25rem">
      <div style="font-size:.75rem;font-weight:600;line-height:1.35;color:#1a1228;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.name}</div>
      ${storeLine}
      <div style="font-size:.95rem;font-weight:700;color:#7c3aed">฿${p.price.toLocaleString()}</div>
      <div style="display:flex;align-items:center;gap:.35rem;margin-top:.1rem">
        <a href="${p.url}" target="_blank" rel="nofollow noopener" ${trackAttr}
          style="font-size:.72rem;color:#ee4d2d;text-decoration:none;font-weight:600;flex:1;min-width:0">
          &raquo; สั่งซื้อผ่านทาง Shopee
        </a>
        <button onclick="copyAffLinkByIdx(${urlIdx},this)" title="คัดลอกลิงก์"
          style="border:1px solid #ede9fe;background:#f5f0ff;color:#7c3aed;border-radius:.4rem;padding:.2rem .4rem;font-size:.72rem;line-height:1;cursor:pointer;flex-shrink:0">📋</button>
      </div>
    </div>
  </div>`;
}

async function initShopeeSection(containerId, tags) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const section = container.closest('.shopee-section');
  const all = await loadShopeeProducts(tags);
  if (!all.length) { if(section) section.style.display='none'; return; }

  const INIT = 5;
  let showing = INIT;

  // ปรับ header ให้เป็นกลาง ไม่ระบุแหล่งที่มา
  if (section) {
    const h = section.querySelector('h3');
    if (h) h.textContent = '✨ สินค้าแนะนำ';
    const sub = section.querySelector('p');
    if (sub) sub.remove();
  }

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:.75rem;overflow-x:auto;padding-bottom:.75rem;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch';
  row.id = containerId + '_row';

  const moreBtn = document.createElement('button');
  moreBtn.style.cssText = 'display:block;margin:1rem auto 0;background:none;border:1.5px solid #7c3aed;color:#7c3aed;border-radius:2rem;padding:.45rem 1.5rem;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit';
  moreBtn.textContent = `ดูเพิ่มเติม (${all.length - INIT} รายการ)`;

  function renderRow() {
    row.innerHTML = all.slice(0, showing).map(p =>
      `<div style="scroll-snap-align:start;flex-shrink:0">${renderProductCard(p)}</div>`
    ).join('');
    if (showing >= all.length) moreBtn.style.display = 'none';
    else moreBtn.style.display = 'block';
  }

  moreBtn.onclick = () => {
    showing = all.length;
    renderRow();
    row.style.overflowX = 'visible';
    row.style.flexWrap = 'wrap';
  };

  container.innerHTML = '';
  container.appendChild(row);
  if (all.length > INIT) container.appendChild(moreBtn);
  renderRow();
}

// ── Mobile Nav Toggle ──
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
  });
}

// ── FAQ Accordion ──
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ── Stone Search ──
function initStoneSearch() {
  const input = document.getElementById('stoneSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll('.stone-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFAQ();
  initStoneSearch();
});
