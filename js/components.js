/* ═══ Amethez Shared Nav + Footer ═══ */

const NAV_HTML = `
<div class="container nav-inner">
  <a href="/" class="logo">
    <svg viewBox="0 0 36 36" fill="none" data-cms-logo>
      <polygon points="18,2 30,12 26,30 10,30 6,12" fill="#7c3aed" opacity="0.9"/>
      <polygon points="18,2 30,12 18,8" fill="#c9a84c" opacity="0.95"/>
      <polygon points="18,8 30,12 18,28" fill="#a78bfa"/>
      <polygon points="18,8 6,12 18,28" fill="#7c3aed"/>
    </svg>
    <span data-cms-logo-text>AMETHEZ <small class="logo-tagline">Stones · Stories · Soul</small></span>
  </a>
  <button class="nav-toggle" aria-label="เมนู" onclick="document.querySelector('.nav-links').classList.toggle('open')">
    <span></span><span></span><span></span>
  </button>
  <nav><ul class="nav-links">
    <li class="has-drop"><a href="/stones/">📖 สารานุกรมหิน</a>
      <ul class="dropdown">
        <li><a href="/stones/">🔤 หิน A–Z ทั้งหมด</a></li>
        <li><div class="drop-sep"></div></li>
        <li><a href="/categories/chakra.html">🧘 ค้นหาตามจักระ</a></li>
        <li><a href="/categories/zodiac.html">♈ ค้นหาตามราศี</a></li>
        <li><a href="/categories/planet.html">🪐 ค้นหาตามดาวเคราะห์</a></li>
        <li><a href="/categories/element.html">🔥 ค้นหาตามธาตุ</a></li>
        <li><a href="/categories/color.html">🎨 ค้นหาตามสี</a></li>
        <li><a href="/categories/purpose.html">✨ ค้นหาตามวัตถุประสงค์</a></li>
      </ul>
    </li>
    <li class="has-drop"><a href="/blog/">📖 เรียนรู้</a>
      <ul class="dropdown">
        <li><a href="/blog/">บทความ</a></li>
        <li><a href="/video/">🎬 Crystal Talks</a></li>
      </ul>
    </li>
    <li class="has-drop"><a href="/wuchong/">🧙 อาจารย์</a>
      <ul class="dropdown">
        <li><a href="/wuchong/">Master Wuchong</a></li>
        <li><a href="/metha/">อาจารย์เมธา</a></li>
        <li><a href="/cosmos/">☄️ Dr. Cosmos</a></li>
      </ul>
    </li>
    <li class="has-drop"><a href="/shop/" class="nav-shop">🛒 ร้านค้า</a>
      <ul class="dropdown">
        <li><a href="/shop/">✦ Crystal Market</a></li>
        <li><a href="/shop/catalog/">✦ Crystal Catalog</a></li>
        <li><a href="/shop/collection.html">✦ Private Collection</a></li>
        <li><a href="/consign.html">✦ รับฝากขาย</a></li>
        <li><div class="drop-sep"></div></li>
        <li><a href="/shop/academy.html">✦ Crystal Academy</a></li>
      </ul>
    </li>
    <li><a href="/talk/" class="nav-ritual">🔮 ห้องคลื่นเสียง Manifest</a></li>
  </ul></nav>
</div>`;

const FOOTER_HTML = `
<div class="container">
  <div class="footer-grid">
    <div class="footer-brand">
      <a href="/" class="logo" style="color:#c9a84c;margin-bottom:.75rem;display:flex">
        <svg viewBox="0 0 36 36" fill="none" style="width:28px;height:28px;margin-right:.5rem">
          <polygon points="18,2 30,12 26,30 10,30 6,12" fill="#7c3aed" opacity="0.9"/>
          <polygon points="18,2 30,12 18,8" fill="#c9a84c" opacity="0.95"/>
          <polygon points="18,8 30,12 18,28" fill="#a78bfa"/>
          <polygon points="18,8 6,12 18,28" fill="#7c3aed"/>
        </svg>
        AMETHEZ
      </a>
      <p>ศูนย์กลางข้อมูลคริสตัลและพลอยที่ใหญ่ที่สุดในไทย<br>Stones · Stories · Soul</p>
      <div style="display:flex;gap:.75rem;margin-top:1rem">
        <a href="https://line.me/R/ti/p/@masterpuch" style="background:#06C755;color:white;padding:.4rem .9rem;border-radius:.5rem;font-size:.8rem;font-weight:700;text-decoration:none">LINE @masterpuch</a>
        <a href="https://www.facebook.com/amethez" style="background:#1877f2;color:white;padding:.4rem .9rem;border-radius:.5rem;font-size:.8rem;font-weight:700;text-decoration:none">Facebook</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>สำรวจ</h4>
      <ul>
        <li><a href="/stones/">📖 สารานุกรมหิน A–Z</a></li>
        <li><a href="/blog/">📖 บทความ</a></li>
        <li><a href="/video/">🎬 Crystal Talks</a></li>
        <li><a href="/stories/">📚 เรื่องเล่าหินทั่วโลก</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>อาจารย์</h4>
      <ul>
        <li><a href="/wuchong/">🧙 Master Wuchong</a></li>
        <li><a href="/metha/">🌟 อาจารย์เมธา</a></li>
        <li><a href="/cosmos/">☄️ Dr. Cosmos</a></li>
        <li><a href="/talk/">🔮 ห้องคลื่นเสียง Manifest</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>ร้านค้า</h4>
      <ul>
        <li><a href="/shop/">✦ Crystal Market</a></li>
        <li><a href="/shop/catalog/">✦ Crystal Catalog</a></li>
        <li><a href="/shop/collection.html">✦ Private Collection</a></li>
        <li><a href="/consign.html">✦ รับฝากขาย</a></li>
        <li><a href="/shop/academy.html">✦ Crystal Academy</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Amethez</h4>
      <ul>
        <li><a href="/about/">เกี่ยวกับเรา</a></li>
        <li><a href="/about/#contact">ติดต่อเรา</a></li>
        <li><a href="/stones/">สารานุกรมหิน</a></li>
        <li><a href="/sitemap.xml">Sitemap</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2025 Amethez · Stones · Stories · Soul &nbsp;|&nbsp;
    <a href="/about/" style="color:rgba(255,255,255,.5)">เกี่ยวกับเรา</a> &nbsp;|&nbsp;
    <a href="https://line.me/R/ti/p/@masterpuch" style="color:#06C755">Line @masterpuch</a></p>
  </div>
</div>`;

/* ─── Google Analytics 4 ─── */
(function(){
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-TBQ8F1GZ3B';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-TBQ8F1GZ3B');
})();

/* ─── Inject on load ─── */
document.addEventListener('DOMContentLoaded', () => {
  // Nav
  const hdr = document.querySelector('.site-header');
  if (hdr) {
    hdr.innerHTML = NAV_HTML;
    // Mark active page
    const path = location.pathname;
    hdr.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href !== '/' && path.startsWith(href)) {
        a.style.color = '#7c3aed';
        a.style.fontWeight = '700';
      }
    });
    // Gold color for shop
    const shopA = hdr.querySelector('.nav-shop');
    if (shopA) shopA.style.color = '#c9a84c';
    // Teal for ritual
    const ritualA = hdr.querySelector('.nav-ritual');
    if (ritualA) ritualA.style.color = '#0d9488';
  }

  // Footer
  const ftr = document.querySelector('.site-footer');
  if (ftr) ftr.innerHTML = FOOTER_HTML;

  // Blog Article Hero Image — inject thumbnail from blog.json
  const heroDiv = document.querySelector('.hero-img');
  if (heroDiv) {
    (async () => {
      try {
        const r = await fetch('/data/blog.json?v='+Date.now());
        const d = await r.json();
        const path = location.pathname;
        const art = d.articles.find(a => a.url && (a.url === path || a.url === path.replace(/\/$/, '')));
        if (art && art.thumb) {
          heroDiv.style.padding = '0';
          heroDiv.innerHTML = `<img src="${art.thumb}" alt="${(art.title||'').replace(/"/g,'')}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" onerror="this.parentElement.innerHTML='💎'">`;
        }
      } catch(e) {}
    })();
  }
});
