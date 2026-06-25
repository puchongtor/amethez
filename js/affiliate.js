/**
 * Amethez Affiliate Engine
 * ─────────────────────────────────────────────────────────
 * อ่าน tags จาก meta หรือ data-attribute ของบทความ
 * → ดึง affiliate-products.json
 * → หา match โดย tag overlap score
 * → inject "Smart Offer Box" ท้ายบทความ
 *
 * วิธีเพิ่มในบทความ:
 *   <div id="affiliateAnchor" data-tags="อเมทิสต์,สมาธิ,พลังงาน"></div>
 *   <script src="/js/affiliate.js"></script>
 */

(function () {
  'use strict';

  const AFFILIATE_JSON = '/data/affiliate-products.json';
  const MAX_PRODUCTS   = 3;   // แสดงสูงสุดกี่ชิ้น
  const MIN_SCORE      = 1;   // ต้อง match อย่างน้อยกี่ tag

  const PLATFORM_ICONS = {
    meb:        { label: 'MEB',         color: '#e85d04', icon: '📚' },
    naiin:      { label: 'Naiin',       color: '#7c3aed', icon: '📖' },
    shopee:     { label: 'Shopee',      color: '#ee4d2d', icon: '🛒' },
    skilllane:  { label: 'SkillLane',   color: '#0ea5e9', icon: '🎓' },
    futureskill:{ label: 'FutureSkill', color: '#10b981', icon: '🚀' },
    udemy:      { label: 'Udemy',       color: '#a435f0', icon: '🎓' }
  };

  // ── 1. หา anchor และ tags ─────────────────────────────
  function getPageTags() {
    const anchor = document.getElementById('affiliateAnchor');
    if (!anchor) return [];
    const raw = anchor.dataset.tags || '';
    return raw.split(',').map(t => t.trim()).filter(Boolean);
  }

  // ── 2. คำนวณ match score ──────────────────────────────
  function scoreProduct(product, pageTags) {
    const pTags = product.tags.map(t => t.toLowerCase());
    const mTags = pageTags.map(t => t.toLowerCase());
    return mTags.filter(t => pTags.some(pt => pt.includes(t) || t.includes(pt))).length;
  }

  // ── 3. เลือก + sort products ──────────────────────────
  function selectProducts(products, pageTags) {
    return products
      .filter(p => p.status === 'active')
      .map(p => ({ ...p, _score: scoreProduct(p, pageTags) }))
      .filter(p => p._score >= MIN_SCORE)
      .sort((a, b) => b._score - a._score || b.rating - a.rating)
      .slice(0, MAX_PRODUCTS);
  }

  // ── 4. Render stars ───────────────────────────────────
  function renderStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  // ── 5. Render product card ────────────────────────────
  function renderCard(p) {
    const plat    = PLATFORM_ICONS[p.platform] || { label: p.platform_label, color:'#7c3aed', icon:'🔗' };
    const save    = p.price_original > p.price ? Math.round((1 - p.price/p.price_original)*100) : 0;
    const isCourse = p.category === 'course';
    const catLabel = isCourse ? 'คอร์สออนไลน์' : 'หนังสือแนะนำ';
    const catColor = isCourse ? '#0ea5e9' : '#7c3aed';
    const extra    = isCourse
      ? `<div class="aff-meta-row"><span>⏱ ${p.duration || ''}</span><span>📝 ${p.lessons || 0} บท</span></div>`
      : `<div class="aff-meta-row"><span>✍️ ${p.author || p.instructor || ''}</span></div>`;
    const imgHtml = p.image_url
      ? `<img src="${p.image_url}" alt="${p.title}" class="aff-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const imgFallback = isCourse ? '🎓' : '📚';

    return `
      <div class="aff-card" data-category="${p.category}">
        <div class="aff-img-wrap">
          ${imgHtml}
          <div class="aff-img-fallback" style="${p.image_url?'display:none':'display:flex'}">${imgFallback}</div>
        </div>
        <div class="aff-content">
          <div class="aff-top-row">
            <span class="aff-cat-badge" style="background:${catColor}15;color:${catColor}">${catLabel}</span>
            <span class="aff-platform-badge" style="background:${plat.color}15;color:${plat.color}">${plat.icon} ${plat.label}</span>
          </div>
          <div class="aff-title">${p.title}</div>
          <div class="aff-subtitle">${p.subtitle || ''}</div>
          <div class="aff-cta-text">${p.ai_cta}</div>
          ${extra}
          <div class="aff-rating">
            <span class="aff-stars">${renderStars(p.rating)}</span>
            <span class="aff-rating-num">${p.rating}</span>
            <span class="aff-reviews">(${p.reviews.toLocaleString()} รีวิว)</span>
          </div>
          <div class="aff-price-row">
            <span class="aff-price">฿${p.price.toLocaleString()}</span>
            ${p.price_original > p.price ? `<span class="aff-price-orig">฿${p.price_original.toLocaleString()}</span><span class="aff-save">ลด ${save}%</span>` : ''}
          </div>
          <a href="${p.affiliate_url}" target="_blank" rel="noopener" class="aff-btn"
             onclick="logClick('${p.id}','${p.platform}')">
            ${isCourse ? '🎓 ดูรายละเอียดคอร์ส' : '📚 ดูหนังสือเล่มนี้'} →
          </a>
        </div>
      </div>`;
  }

  // ── 6. Inject section HTML ────────────────────────────
  function injectSection(products, anchor) {
    const hasBooks   = products.some(p => p.category === 'book');
    const hasCourses = products.some(p => p.category === 'course');
    let label = '📖 แนะนำสำหรับบทความนี้';
    if (hasBooks && hasCourses) label = '📚 หนังสือและคอร์สที่เกี่ยวข้อง';
    else if (hasCourses)        label = '🎓 คอร์สที่เกี่ยวข้อง';

    const section = document.createElement('section');
    section.className = 'aff-section';
    section.innerHTML = `
      <div class="aff-header">
        <div class="aff-header-label">${label}</div>
        <div class="aff-header-sub">คัดเลือกโดย Amethez · รายได้ส่วนหนึ่งสนับสนุนการสร้างเนื้อหา</div>
      </div>
      <div class="aff-grid">
        ${products.map(renderCard).join('')}
      </div>
      <div class="aff-disclaimer">
        ⚠️ ลิงค์ด้านบนเป็น Affiliate Link — เมื่อคุณซื้อผ่านลิงค์นี้ Amethez ได้รับค่าคอมมิชชั่นเล็กน้อยโดยไม่มีค่าใช้จ่ายเพิ่มจากคุณ
      </div>`;

    anchor.parentNode.insertBefore(section, anchor.nextSibling);
  }

  // ── 7. Analytics click log (ส่งไป Make.com / GA) ──────
  window.logClick = function(productId, platform) {
    try {
      const payload = { product_id: productId, platform, page: location.pathname, ts: Date.now() };
      // เปลี่ยน URL เป็น Make.com webhook ของคุณ
      navigator.sendBeacon('/api/log-click', JSON.stringify(payload));
    } catch(e) {}
  };

  // ── 8. Main ───────────────────────────────────────────
  async function init() {
    const anchor = document.getElementById('affiliateAnchor');
    if (!anchor) return;

    const pageTags = getPageTags();
    if (!pageTags.length) return;

    try {
      const res  = await fetch(AFFILIATE_JSON);
      const data = await res.json();
      const matched = selectProducts(data.products, pageTags);
      if (matched.length) injectSection(matched, anchor);
    } catch (e) {
      console.warn('[Amethez Affiliate] ไม่สามารถโหลด affiliate-products.json:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
