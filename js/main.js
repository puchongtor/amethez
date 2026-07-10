/* Amethez — Main JS */

// ── Shopee Product Loader ──
async function loadShopeeProducts(tags = [], limit = 4) {
  try {
    const res = await fetch('/data/products.json');
    const { products } = await res.json();
    const filtered = products
      .filter(p => p.status === 'available' && tags.some(t => p.tags.includes(t)))
      .slice(0, limit);
    return filtered.length ? filtered : products.filter(p => p.status === 'available').slice(0, limit);
  } catch { return []; }
}

function renderProductCard(p) {
  const imgHtml = p.image_url
    ? `<img src="${p.image_url}" alt="" style="width:100%;height:160px;object-fit:cover;display:block;border-radius:.6rem .6rem 0 0"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  return `
    <div class="card product-card" style="border-radius:.75rem;overflow:hidden;display:flex;flex-direction:column">
      ${imgHtml}
      <div style="display:${p.image_url?'none':'flex'};align-items:center;justify-content:center;height:120px;background:linear-gradient(135deg,#ede9fe,#f5f0ff);font-size:2.5rem">💎</div>
      <div style="padding:.85rem;flex:1;display:flex;flex-direction:column;gap:.4rem">
        <div class="product-name" style="font-size:.82rem;font-weight:600;line-height:1.4;color:#1a1228">${p.name}</div>
        <div class="product-price" style="font-size:1rem;font-weight:700;color:#7c3aed;margin-top:auto">฿${p.price.toLocaleString()}</div>
        <a href="${p.url}" target="_blank" rel="nofollow noopener" class="btn btn-primary" style="text-align:center;margin-top:.5rem;font-size:.82rem;padding:.5rem">
          🛒 ดูบน Shopee
        </a>
      </div>
    </div>`;
}

async function initShopeeSection(containerId, tags) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const products = await loadShopeeProducts(tags);
  if (!products.length) { container.closest('.shopee-section')?.remove(); return; }
  container.innerHTML = products.map(renderProductCard).join('');
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
