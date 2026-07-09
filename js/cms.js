/* cms.js — CMS image loader for Amethez
 * Reads /data/content.json and fills [data-cms-img] slots on every page.
 * Falls back gracefully if JSON missing or slot empty.
 */
(async () => {
  try {
    const r = await fetch('/data/content.json?v=' + Date.now());
    if (!r.ok) return;
    const d = await r.json();
    const imgs = d.images || {};

    document.querySelectorAll('[data-cms-img]').forEach(el => {
      const key = el.dataset.cmsImg;
      const url = imgs[key];
      if (!url) return;

      if (el.tagName === 'IMG') {
        el.src = url;
        el.style.display = '';
      } else {
        // For div containers: overlay image on top of existing gradient/emoji
        el.style.backgroundImage = `url('${CSS.escape ? url : url}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        // Hide the emoji placeholder if present
        const emoji = el.querySelector('.cms-placeholder');
        if (emoji) emoji.style.display = 'none';
      }
    });

    // Logo image
    const logoImg = imgs['logo'];
    if (logoImg) {
      document.querySelectorAll('[data-cms-logo]').forEach(el => {
        if (el.tagName === 'IMG') { el.src = logoImg; el.style.display = ''; }
        else {
          const img = document.createElement('img');
          img.src = logoImg;
          img.style.cssText = 'height:32px;width:auto;object-fit:contain';
          el.innerHTML = '';
          el.appendChild(img);
        }
      });
    }

    // Favicon
    const fav = imgs['favicon'];
    if (fav) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = fav;
    }

  } catch (e) { /* silent fail — site works without CMS data */ }
})();
