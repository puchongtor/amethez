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

// ── Shopee Product Loader ──
async function loadShopeeProducts(tags = [], limit = 40) {
  try {
    const res = await fetch('/data/products.json');
    const { products } = await res.json();
    const nameLower = p => (p.name||'').toLowerCase();
    const tagsLower = p => (p.tags||[]).map(t => t.toLowerCase());
    const matched = products.filter(p => {
      if(p.status !== 'available') return false;
      const nl = nameLower(p), tl = tagsLower(p);
      return tags.some(t => {
        const tl2 = t.toLowerCase();
        return nl.includes(tl2) || tl.some(pt => pt.includes(tl2) || tl2.includes(pt));
      });
    });
    return matched.slice(0, limit);
  } catch { return []; }
}

function renderProductCard(p) {
  const fallback = `this.style.display='none';this.nextElementSibling.style.display='flex'`;
  const imgBlock = p.image_url
    ? `<img src="${p.image_url}" alt="" style="width:100%;height:150px;object-fit:cover;display:block" onerror="${fallback}">
       <div style="display:none;align-items:center;justify-content:center;height:150px;background:linear-gradient(135deg,#ede9fe,#f5f0ff);font-size:2rem">💎</div>`
    : `<div style="display:flex;align-items:center;justify-content:center;height:150px;background:linear-gradient(135deg,#ede9fe,#f5f0ff);font-size:2rem">💎</div>`;
  return `<div style="flex:0 0 175px;width:175px;border-radius:.75rem;overflow:hidden;background:#fff;border:1px solid #ede9fe;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(124,58,237,.08)">
    <a href="${p.url}" target="_blank" rel="nofollow noopener" style="display:block;flex-shrink:0">${imgBlock}</a>
    <div style="padding:.6rem .7rem;display:flex;flex-direction:column;gap:.25rem">
      <div style="font-size:.75rem;font-weight:600;line-height:1.35;color:#1a1228;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.name}</div>
      <div style="font-size:.95rem;font-weight:700;color:#7c3aed">฿${p.price.toLocaleString()}</div>
      <a href="${p.url}" target="_blank" rel="nofollow noopener"
        style="font-size:.72rem;color:#ee4d2d;text-decoration:none;font-weight:600;margin-top:.1rem">
        &raquo; สั่งซื้อผ่านทาง Shopee
      </a>
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
