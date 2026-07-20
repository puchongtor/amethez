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
        <li><a href="/stones/a-z.html">🔤 หิน A–Z ทั้งหมด</a></li>
        <li><a href="/stones/rankings/">🏆 จัดอันดับหินคริสตัล</a></li>
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
  <button class="nav-search-btn" aria-label="ค้นหา" onclick="openGlobalSearch()">🔍</button>
</div>`;

const SEARCH_MODAL_HTML = `
<div class="gs-overlay" id="gsOverlay" onclick="if(event.target===this) closeGlobalSearch()">
  <div class="gs-box">
    <button class="gs-close" aria-label="ปิด" onclick="closeGlobalSearch()">✕</button>
    <div class="gs-tabs">
      <button id="gsTabArticle" class="gs-tab on" onclick="switchGSMode('article')">📖 บทความ</button>
      <button id="gsTabProduct" class="gs-tab" onclick="switchGSMode('product')">💎 หาสินค้า</button>
    </div>
    <div id="gsModeArticle">
      <div class="gs-input-row">
        <span class="gs-icon" onclick="const v=document.getElementById('gsSearchInput').value.trim(); if(v) gsDoSearch(v);">🔍</span>
        <input id="gsSearchInput" class="gs-input" type="search" placeholder="ค้นหาบทความหิน เช่น อเมทิสต์, ความรัก, จักระหัวใจ...">
      </div>
      <div class="gs-hints-label">🔥 คำค้นยอดนิยม</div>
      <div class="gs-hints">
        <span class="gs-hint" onclick="gsDoSearch('ป้องกัน')">ป้องกัน</span>
        <span class="gs-hint" onclick="gsDoSearch('จักระ')">จักระ</span>
        <span class="gs-hint" onclick="gsDoSearch('ความรัก')">ความรัก</span>
        <span class="gs-hint" onclick="gsDoSearch('สมาธิ')">สมาธิ</span>
        <span class="gs-hint" onclick="gsDoSearch('การเงิน')">การเงิน</span>
        <span class="gs-hint" onclick="gsDoSearch('ความสำเร็จ')">ความสำเร็จ</span>
        <span class="gs-hint" onclick="gsDoSearch('อเมทิสต์')">อเมทิสต์</span>
        <span class="gs-hint" onclick="gsDoSearch('เพชร')">เพชร</span>
        <span class="gs-hint" onclick="gsDoSearch('สุขภาพ')">สุขภาพ</span>
        <span class="gs-hint" onclick="gsDoSearch('โชคลาภ')">โชคลาภ</span>
      </div>
    </div>
    <div id="gsModeProduct" style="display:none">
      <div class="gs-input-row">
        <span class="gs-icon" onclick="document.getElementById('gsFindBtn').click()">🔍</span>
        <input id="gsQSearch" class="gs-input" type="search" placeholder="ค้นหาสินค้า เช่น อเมทิสต์, กำไล, พระพิฆเนศ...">
      </div>
      <a id="gsFindBtn" href="/shop/" class="gs-find-btn">🔍 ค้นหาสินค้า</a>
    </div>
  </div>
</div>`;

const SEARCH_MODAL_STYLE = `
.nav-search-btn { background:none; border:none; font-size:1.1rem; cursor:pointer; padding:.4rem .6rem; margin-left:.25rem; border-radius:.5rem; transition:background .15s; flex-shrink:0; }
.nav-search-btn:hover { background:#f3effa; }
.gs-overlay { display:none; position:fixed; inset:0; background:rgba(26,18,40,.55); z-index:9999; padding:8vh 1.25rem 1.25rem; overflow-y:auto; }
.gs-overlay.open { display:block; }
.gs-box { max-width:600px; margin:0 auto; background:white; border-radius:1.25rem; padding:1.75rem; position:relative; box-shadow:0 20px 60px rgba(0,0,0,.3); font-family:Sarabun,sans-serif; }
.gs-close { position:absolute; top:1rem; right:1rem; background:none; border:none; font-size:1.1rem; color:#9b89bb; cursor:pointer; padding:.25rem .5rem; }
.gs-close:hover { color:#1a1228; }
.gs-tabs { display:flex; background:#f0ebff; border-radius:.75rem; padding:.25rem; gap:.25rem; max-width:280px; margin:0 auto 1.25rem; }
.gs-tab { flex:1; padding:.55rem 1.25rem; border:none; border-radius:.55rem; font-family:Sarabun,sans-serif; font-size:.88rem; font-weight:700; cursor:pointer; background:transparent; color:#7c3aed; }
.gs-tab.on { background:#7c3aed; color:white; }
.gs-input-row { position:relative; }
.gs-icon { position:absolute; left:1.1rem; top:50%; transform:translateY(-50%); font-size:1.1rem; cursor:pointer; z-index:1; }
.gs-input { width:100%; padding:.9rem 1.25rem .9rem 3rem; border:2px solid #e5e7eb; border-radius:3rem; font-family:Sarabun,sans-serif; font-size:.95rem; outline:none; box-sizing:border-box; }
.gs-input:focus { border-color:#7c3aed; }
.gs-hints-label { text-align:center; font-size:.75rem; color:#6b7280; margin-top:.85rem; margin-bottom:.4rem; }
.gs-hints { display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center; }
.gs-hint { background:#f5f0ff; color:#7c3aed; font-size:.78rem; padding:.25rem .75rem; border-radius:2rem; cursor:pointer; border:1px solid #e9e0f5; }
.gs-hint:hover { background:#7c3aed; color:white; }
.gs-find-btn { display:flex; align-items:center; justify-content:center; gap:.5rem; width:100%; padding:.85rem; margin-top:1rem; background:linear-gradient(135deg,#7c3aed,#6d28d9); color:white; border-radius:.75rem; font-family:Sarabun,sans-serif; font-size:.95rem; font-weight:700; text-decoration:none; box-sizing:border-box; }
@media(max-width:480px){ .gs-box { padding:1.25rem; } }
`;

const FOOTER_HTML = `
<div class="container">
  <div class="footer-grid">
    <div class="footer-brand">
      <a href="/" class="logo" style="color:#c9a84c;margin-bottom:.75rem;display:flex;align-items:center">
        <svg viewBox="0 0 36 36" fill="none" data-cms-logo style="width:28px;height:28px;margin-right:.5rem">
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
        <li><a href="/stones/rankings/">🏆 จัดอันดับหินคริสตัล</a></li>
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
    <p style="font-size:.7rem;color:rgba(255,255,255,.4);line-height:1.7;max-width:720px;margin:0 auto .9rem;padding:0 .5rem">
      *Disclaimer: Amethez.com เป็นแพลตฟอร์มสื่อกลางในการคัดสรรและแนะนำพิกัดร้านค้าคุณภาพเพื่ออำนวยความสะดวกแก่ผู้บริโภคเท่านั้น เครื่องหมายการค้า โลโก้ และลิขสิทธิ์ทั้งหมดเป็นสิทธิ์ของเจ้าของแบรนด์นั้น ๆ โดยทางเราไม่มีส่วนเกี่ยวข้องหรือมีส่วนรับผิดชอบต่อข้อตกลง การซื้อขาย หรือการบริการใด ๆ ของทางร้านค้าดังกล่าว
    </p>
    <p>© 2026 Amethez · Stones · Stories · Soul &nbsp;|&nbsp;
    <a href="/about/" style="color:rgba(255,255,255,.5)">เกี่ยวกับเรา</a> &nbsp;|&nbsp;
    <a href="https://line.me/R/ti/p/@masterpuch" style="color:#06C755">Line @masterpuch</a></p>
  </div>
</div>`;

/* ─── Global search popup (nav icon → modal, same as homepage's search but works from any page) ─── */
function openGlobalSearch(){
  document.getElementById('gsOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('gsSearchInput').focus();
}
function closeGlobalSearch(){
  document.getElementById('gsOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function switchGSMode(mode){
  const isProduct = mode === 'product';
  document.getElementById('gsModeArticle').style.display = isProduct ? 'none' : '';
  document.getElementById('gsModeProduct').style.display = isProduct ? '' : 'none';
  document.getElementById('gsTabArticle').classList.toggle('on', !isProduct);
  document.getElementById('gsTabProduct').classList.toggle('on', isProduct);
  if (isProduct) { updateGSFinderLink(); document.getElementById('gsQSearch').focus(); }
  else document.getElementById('gsSearchInput').focus();
}
function updateGSFinderLink(){
  const kw = document.getElementById('gsQSearch')?.value.trim();
  document.getElementById('gsFindBtn').href = '/shop/' + (kw ? '?q=' + encodeURIComponent(kw) : '');
}
function gsDoSearch(kw){
  window.location.href = '/search.html?q=' + encodeURIComponent(kw);
}

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

  // Global search popup — inject once, wire up events
  if (hdr && !document.getElementById('gsOverlay')) {
    const styleTag = document.createElement('style');
    styleTag.textContent = SEARCH_MODAL_STYLE;
    document.head.appendChild(styleTag);
    document.body.insertAdjacentHTML('beforeend', SEARCH_MODAL_HTML);

    document.getElementById('gsSearchInput').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.value.trim()) gsDoSearch(e.target.value.trim());
    });
    document.getElementById('gsQSearch').addEventListener('input', updateGSFinderLink);
    document.getElementById('gsQSearch').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('gsFindBtn').click(); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('gsOverlay').classList.contains('open')) closeGlobalSearch();
    });
  }

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
