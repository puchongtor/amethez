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
  return `
    <div class="card product-card">
      <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23f5f0ff\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%237c3aed\'%3E💎%3C/text%3E%3C/svg%3E'">
      <div class="product-name">${p.name}</div>
      <div class="product-price">฿${p.price.toLocaleString()}</div>
      <a href="${p.url}" target="_blank" rel="nofollow noopener" class="btn btn-primary">
        🛒 ดูบน Shopee
      </a>
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
