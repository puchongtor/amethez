/* ═══ Amethez site feature flags ═══
 * Source of truth: /data/site-features.json (published from Admin)
 * Local test override: localStorage amethez_identify_force_on = "1"
 */
(function () {
  const FEATURES_URL = '/data/site-features.json';
  const FORCE_KEY = 'amethez_identify_force_on';

  function forceOn() {
    try {
      return localStorage.getItem(FORCE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function setForceOn(on) {
    try {
      if (on) localStorage.setItem(FORCE_KEY, '1');
      else localStorage.removeItem(FORCE_KEY);
    } catch { /* ignore */ }
  }

  async function loadFeatures() {
    try {
      const r = await fetch(FEATURES_URL + '?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('features fetch failed');
      return await r.json();
    } catch {
      // Fail closed for Identify — do not expose unready product
      return { identify_enabled: false };
    }
  }

  function removeIdentifyAnchors(root) {
    const scope = root || document;
    scope.querySelectorAll('a[href*="/identify"]').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (!href.includes('/identify')) return;
      const li = a.closest('li');
      if (li && li.parentElement && (li.parentElement.matches('ul.dropdown') || li.parentElement.matches('.footer-col ul') || li.parentElement.matches('ul'))) {
        li.remove();
        return;
      }
      a.remove();
    });
  }

  function applyIdentifyVisibility(enabled) {
    const root = document.documentElement;
    root.classList.toggle('feature-identify-on', enabled);
    root.classList.toggle('feature-identify-off', !enabled);
    root.dataset.identifyEnabled = enabled ? '1' : '0';

    if (enabled) {
      document.querySelectorAll('[data-feature="identify"]').forEach((el) => {
        el.hidden = false;
        el.style.removeProperty('display');
      });
      document.querySelectorAll('[data-feature="identify-fallback"]').forEach((el) => {
        el.hidden = true;
        el.style.display = 'none';
      });
      return;
    }

    // OFF: strip menus/embeds
    document.querySelectorAll('[data-feature="identify"]').forEach((el) => {
      el.hidden = true;
      el.style.display = 'none';
    });
    document.querySelectorAll('[data-feature="identify-fallback"]').forEach((el) => {
      el.hidden = false;
      el.style.removeProperty('display');
    });
    removeIdentifyAnchors(document);

    // Soft-retarget Atlas expert cards that still mention Identify
    document.querySelectorAll('a.ex-card[href*="/identify"]').forEach((a) => {
      a.setAttribute('href', '/stones/');
      const role = a.querySelector('.ex-role');
      if (role) role.textContent = 'สารานุกรมหินโลก';
      const desc = a.querySelector('.ex-desc');
      if (desc) desc.textContent = 'คลังความรู้หินคริสตัล วิทยาศาสตร์ อ้างอิงได้ — โดย Crystal Atlas';
      a.querySelectorAll('.ex-tag').forEach((t) => {
        if (/identify/i.test(t.textContent || '')) t.remove();
      });
    });
  }

  async function init() {
    const features = await loadFeatures();
    const publicOn = !!features.identify_enabled;
    const enabled = publicOn || forceOn();
    applyIdentifyVisibility(enabled);

    // Re-apply after shared nav/footer inject (components.js DOMContentLoaded)
    document.addEventListener('DOMContentLoaded', () => {
      applyIdentifyVisibility(enabled);
      // Nav inject may run in same tick — observe briefly
      const hdr = document.querySelector('.site-header');
      if (hdr && !enabled) {
        const mo = new MutationObserver(() => {
          removeIdentifyAnchors(hdr);
          const ftr = document.querySelector('.site-footer');
          if (ftr) removeIdentifyAnchors(ftr);
        });
        mo.observe(hdr, { childList: true, subtree: true });
        setTimeout(() => mo.disconnect(), 2500);
      }
    });

    window.AmethezFeatures = {
      raw: features,
      identifyEnabled: () => {
        const pub = !!features.identify_enabled;
        return pub || forceOn();
      },
      identifyPublicEnabled: () => !!features.identify_enabled,
      forceIdentifyOn: forceOn,
      setForceIdentifyOn: setForceOn,
      refresh: async () => {
        const next = await loadFeatures();
        Object.assign(features, next);
        applyIdentifyVisibility(!!features.identify_enabled || forceOn());
      },
    };
  }

  // Early CSS hide to reduce flash before fetch completes (default off)
  try {
    const style = document.createElement('style');
    style.textContent = `
      html.feature-identify-off [data-feature="identify"] { display: none !important; }
      html.feature-identify-on [data-feature="identify-fallback"] { display: none !important; }
      html:not(.feature-identify-on):not(.feature-identify-off) [data-feature="identify"] { display: none !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  } catch { /* ignore */ }

  init();
})();
