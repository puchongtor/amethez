/* cms.js — CMS loader for Amethez
 * Reads /data/content.json and fills:
 *   [data-cms-img="key"]   → background-image or <img> src
 *   [data-cms-text="key"]  → innerHTML
 *   [data-cms-logo]        → replaces SVG with logo image
 *   [data-cms-href="key"]  → href attribute
 * Falls back gracefully if JSON missing or slot empty.
 */
(async () => {
  try {
    const r = await fetch('/data/content.json?v=' + Date.now());
    if (!r.ok) return;
    const d = await r.json();
    const imgs  = d.images || {};
    const texts = d.text   || {};

    // Detect current page key from body[data-cms-page] or URL
    const pageKey = document.body.dataset.cmsPage || detectPage();

    // ── IMAGES ──
    document.querySelectorAll('[data-cms-img]').forEach(el => {
      const key = el.dataset.cmsImg;
      const url = imgs[key];
      if (!url) return;
      if (el.tagName === 'IMG') {
        el.src = url;
        el.style.display = '';
      } else {
        el.style.backgroundImage = `url('${url}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        const ph = el.querySelector('.cms-placeholder');
        if (ph) ph.style.display = 'none';
      }
    });

    // ── TEXT ──
    document.querySelectorAll('[data-cms-text]').forEach(el => {
      const key = el.dataset.cmsText;
      // Support both "global.key" and shorthand "key" (prefixed with page)
      const val = texts[key] || texts[`${pageKey}.${key}`] || texts[`global.${key}`];
      if (val !== undefined && val !== '') el.innerHTML = val;
    });

    // ── HREF ──
    document.querySelectorAll('[data-cms-href]').forEach(el => {
      const key = el.dataset.cmsHref;
      const val = texts[key] || texts[`global.${key}`];
      if (val) el.href = val;
    });

    // ── LOGO ──
    const logoUrl = imgs['logo'];
    if (logoUrl) {
      document.querySelectorAll('[data-cms-logo]').forEach(el => {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = 'AMETHEZ';
        img.style.cssText = 'height:32px;width:auto;object-fit:contain';
        el.replaceWith(img);
      });
    }

    // ── FAVICON ──
    const fav = imgs['favicon'];
    if (fav) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = fav;
    }

  } catch (e) { /* silent fail */ }

  function detectPage() {
    const p = location.pathname.replace(/\/$/, '') || '/index';
    const parts = p.split('/');
    const last = parts[parts.length - 1].replace('.html', '') || 'index';
    return last;
  }
})();
