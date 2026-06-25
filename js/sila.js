/* ==========================================
   คุณศิลา — AI Companion System v1.0
   ========================================== */

(function () {
  'use strict';

  const CONFIG = {
    apiKey: 'YOUR_CLAUDE_API_KEY',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 500,
    webhookUrl: 'YOUR_MAKE_WEBHOOK_URL',
    greetDelay: 30000,
    scrollTrigger: 0.4,
    idleTimeout: 600000,
    minMessagesForAnalytics: 2,
  };

  const PAGE_CONTEXTS = [
    { match: '/stones/amethyst',    stone: 'อเมทิสต์',       topic: 'หินอเมทิสต์ สีม่วง ช่วยนอนหลับ ลดความเครียด เปิดจักระมงกุฎ',         greeting: 'อเมทิสต์วางข้างหมอนตอนนอนช่วยได้จริงๆ ครับ 😌 มีคำถามไหม?' },
    { match: '/stones/moldavite',   stone: 'โมลดาไวท์',      topic: 'หินโมลดาไวท์ อุกกาบาต การเปลี่ยนแปลง พลังงานสูงมาก',                  greeting: 'โมลดาไวท์พลังสูงมากครับ บางคนรู้สึกได้ทันทีเลย 🌿 มีคำถามไหม?' },
    { match: '/stones/citrine',     stone: 'ซิทริน',          topic: 'ซิทริน หินเรียกเงิน โชคลาภ ความสำเร็จ การเงิน',                        greeting: 'ซิทรินวางไว้มุมเงินบ้านเสริมโชคได้ครับ 💛 สนใจเรื่องอะไรเป็นพิเศษ?' },
    { match: '/stones/tektite',     stone: 'สะเก็ดดาวไทย',   topic: 'สะเก็ดดาวไทย Tektite หินอุกกาบาต หายาก ราคาถูก',                       greeting: 'สะเก็ดดาวไทยหายากแล้วนะครับ ของดีราคาไม่แรง 🌑' },
    { match: '/stones/clear-quartz',stone: 'เคลียร์ควอตซ์',  topic: 'เคลียร์ควอตซ์ ชาร์จหิน ขยายพลังงาน หินพื้นฐาน',                       greeting: 'เคลียร์ควอตซ์ใช้คู่กับหินอื่นได้ทุกตัวเลยครับ 🔮' },
    { match: '/stones/rudraksha',   stone: 'รุทราษ',          topic: 'รุทราษ ลูกประคำ เทพเจ้า ศาสนา',                                         greeting: 'รุทราษเม็ดแท้หาได้ยากนะครับ มีคำถามเรื่องไหนไหม? 🙏' },
    { match: '/stones/',            stone: null,               topic: 'คริสตัลและพลอย สรรพคุณ วิธีใช้',                                         greeting: 'มีอะไรให้ผมช่วยเรื่องหินไหมครับ? 🔮' },
    { match: '/categories/chakra',  stone: null,               topic: 'จักระ 7 ศูนย์ หินประจำจักระ พลังงาน',                                    greeting: 'จักระไหนอยากเสริมเป็นพิเศษครับ? แนะนำหินให้ได้เลย' },
    { match: '/categories/zodiac',  stone: null,               topic: 'ราศี หินประจำราศี ดวงชะตา',                                              greeting: 'บอกราศีได้เลยครับ ผมแนะนำหินที่ตรงให้' },
    { match: '/categories/',        stone: null,               topic: 'การเลือกหินตามหมวดหมู่',                                                  greeting: 'ยังไม่แน่ใจจะเลือกหินอะไร ให้ผมช่วยแนะนำได้ครับ 🔮' },
    { match: '/wuchong/',           stone: null,               topic: 'พลังงาน ความสำเร็จ การเงิน สุขภาพ Master Wuchong',                        greeting: 'มีเรื่องพลังงานหรือการเงินอะไรให้ช่วยไหมครับ? 💪' },
    { match: '/metha/',             stone: null,               topic: 'ดวงรายวัน สายมู เทพ อาจารย์เมธา',                                         greeting: 'ดูดวงกับอาจารย์เมธาได้เลยครับ 🙏 มีเรื่องอะไรอยากรู้?' },
    { match: '/talk/',              stone: null,               topic: 'บทตั้งจิต การใช้หิน เสียงบำบัด ฟังเสียง',                                greeting: 'ลองเปิดฟังเสียงบทตั้งจิตไปด้วยนะครับ ช่วยได้จริงๆ 🔊' },
    { match: '/guides/',            stone: null,               topic: 'วิธีใช้หิน คู่มือ ล้างหิน ชาร์จหิน',                                     greeting: 'มีคำถามเรื่องการใช้หินไหมครับ? ผมช่วยได้เลย 📖' },
    { match: '/sale',               stone: null,               topic: 'สินค้า ราคา การสั่งซื้อ Shopee',                                           greeting: 'มีสินค้าอะไรให้ผมช่วยแนะนำไหมครับ? 🛒' },
  ];

  const DEFAULT_CTX = { stone: null, topic: 'คริสตัลและพลอย พลังงาน', greeting: 'สวัสดีครับ 🙏 ผมศิลา ยินดีช่วยเรื่องหินและพลังงานได้เลยครับ' };

  const AFFILIATES = {
    amethyst:    { keywords: ['อเมทิสต์','amethyst','หินม่วง'],              emoji:'💜', name:'อเมทิสต์',      desc:'เม็ดเล็กวางข้างหมอน หรือพกพา',           price:'฿89+',   url:'https://s.shopee.co.th/amethyst-amethez' },
    tektite:     { keywords: ['สะเก็ดดาว','tektite','อุกกาบาต'],             emoji:'🌑', name:'สะเก็ดดาวไทย', desc:'ของแท้ หายาก คุ้มมากครับ',               price:'฿150+',  url:'https://s.shopee.co.th/tektite-amethez' },
    citrine:     { keywords: ['ซิทริน','citrine','หินเรียกเงิน'],            emoji:'💛', name:'ซิทริน',        desc:'วางมุมเงิน หรือพกในกระเป๋าสตางค์',       price:'฿120+',  url:'https://s.shopee.co.th/citrine-amethez' },
    moldavite:   { keywords: ['โมลดาไวท์','moldavite'],                       emoji:'🌿', name:'โมลดาไวท์',     desc:'หินพลังงานสูงสุด เหมาะคนพร้อมรับ',       price:'฿890+',  url:'https://s.shopee.co.th/moldavite-amethez' },
    clearquartz: { keywords: ['เคลียร์ควอตซ์','clear quartz','ควอตซ์ใส'],   emoji:'🔮', name:'Clear Quartz',  desc:'หินพื้นฐาน ราคาถูก ใช้ได้ทุกอย่าง',     price:'฿40+',   url:'https://s.shopee.co.th/clearquartz-amethez' },
    rudraksha:   { keywords: ['รุทราษ','rudraksha'],                           emoji:'🙏', name:'รุทราษ',        desc:'ลูกประคำเม็ดแท้ คุณภาพดี',               price:'฿350+',  url:'https://s.shopee.co.th/rudraksha-amethez' },
  };

  // ── State ────────────────────────────────────────
  let messages = [];
  let pageCtx = DEFAULT_CTX;
  let hasGreeted = false;
  let greetTimer = null;
  let idleTimer = null;
  let sessionStart = Date.now();
  let isMobile = () => window.innerWidth < 768;

  // ── Init ─────────────────────────────────────────
  function init() {
    pageCtx = detectContext();
    buildUI();
    attachEvents();
    scheduleGreeting();
  }

  function detectContext() {
    const path = window.location.pathname;
    for (const ctx of PAGE_CONTEXTS) {
      if (path.includes(ctx.match)) return { ...ctx, path };
    }
    return { ...DEFAULT_CTX, path };
  }

  // ── Build UI ─────────────────────────────────────
  function buildUI() {
    const root = document.createElement('div');
    root.id = 'sila-root';
    root.innerHTML = `
      <div id="sila-panel">
        <div id="sila-header">
          <div id="sila-ava">🔮</div>
          <div>
            <div id="sila-name">คุณศิลา</div>
            <div id="sila-status">● ออนไลน์ตลอด</div>
          </div>
        </div>
        <div id="sila-msgs"></div>
        <div id="sila-input-row">
          <input id="sila-inp" placeholder="พิมพ์ถามศิลา..." autocomplete="off">
          <button id="sila-send">➤</button>
        </div>
      </div>

      <div id="sila-fab-wrap">
        <div id="sila-tooltip"></div>
        <button id="sila-fab" aria-label="คุยกับคุณศิลา">🔮</button>
      </div>

      <div id="sila-overlay"></div>
      <div id="sila-sheet">
        <div id="sila-sheet-handle"></div>
        <div id="sila-sheet-header">
          <div id="sila-sheet-ava">🔮</div>
          <div>
            <div id="sila-sheet-name">คุณศิลา</div>
            <div id="sila-sheet-status">● ออนไลน์ตลอด</div>
          </div>
          <button id="sila-sheet-close" aria-label="ปิด">✕</button>
        </div>
        <div id="sila-sheet-msgs"></div>
        <div id="sila-sheet-input-row">
          <input id="sila-sheet-inp" placeholder="พิมพ์ถามศิลา..." autocomplete="off">
          <button id="sila-sheet-send">➤</button>
        </div>
      </div>`;
    document.body.appendChild(root);

    if (!isMobile()) document.body.classList.add('sila-desktop');
  }

  // ── Events ───────────────────────────────────────
  function attachEvents() {
    q('sila-send').onclick = () => sendMsg('desktop');
    q('sila-inp').onkeydown = e => e.key === 'Enter' && sendMsg('desktop');

    q('sila-fab').onclick = openSheet;
    q('sila-sheet-close').onclick = closeSheet;
    q('sila-overlay').onclick = closeSheet;
    q('sila-sheet-send').onclick = () => sendMsg('mobile');
    q('sila-sheet-inp').onkeydown = e => e.key === 'Enter' && sendMsg('mobile');

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      document.body.classList.toggle('sila-desktop', !isMobile());
    });
    window.addEventListener('beforeunload', () => {
      if (messages.length >= CONFIG.minMessagesForAnalytics * 2) sendAnalytics(true);
    });
  }

  // ── Proactive Greeting ────────────────────────────
  function scheduleGreeting() {
    greetTimer = setTimeout(() => { if (!hasGreeted) doGreet(); }, CONFIG.greetDelay);
  }

  function onScroll() {
    if (hasGreeted) return;
    const pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
    if (pct >= CONFIG.scrollTrigger) {
      clearTimeout(greetTimer);
      doGreet();
    }
  }

  function doGreet() {
    hasGreeted = true;
    if (isMobile()) {
      showTooltip(pageCtx.greeting);
    } else {
      addBubble('sila', pageCtx.greeting, 'sila-msgs');
    }
    resetIdle();
  }

  function showTooltip(text) {
    const tip = q('sila-tooltip');
    tip.textContent = text;
    tip.style.opacity = '1';
    setTimeout(() => {
      tip.style.opacity = '0';
    }, 6000);
  }

  // ── Send Message ──────────────────────────────────
  function sendMsg(mode) {
    const inpId = mode === 'desktop' ? 'sila-inp' : 'sila-sheet-inp';
    const inp = q(inpId);
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';

    addBubble('user', text, mode === 'desktop' ? 'sila-msgs' : 'sila-sheet-msgs');
    messages.push({ role: 'user', content: text });
    resetIdle();
    callClaude(mode);
  }

  // ── Claude API ────────────────────────────────────
  async function callClaude(mode) {
    const msgsEl = mode === 'desktop' ? 'sila-msgs' : 'sila-sheet-msgs';
    const typingEl = addTyping(msgsEl);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CONFIG.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: CONFIG.model,
          max_tokens: CONFIG.maxTokens,
          system: buildSystem(),
          messages: messages,
        }),
      });

      const data = await res.json();
      typingEl.remove();
      const reply = data.content?.[0]?.text || 'ขอโทษครับ ลองใหม่นะครับ 🙏';
      messages.push({ role: 'assistant', content: reply });
      addBubble('sila', reply, msgsEl);
      injectAffiliateCard(reply, msgsEl);

    } catch {
      typingEl.remove();
      addBubble('sila', 'ขอโทษครับ เชื่อมต่อไม่ได้ชั่วขณะ ลองใหม่นะครับ 🙏', msgsEl);
    }
  }

  function buildSystem() {
    return `คุณคือ "คุณศิลา" ผู้ช่วย AI ของเว็บ Amethez.com — ศูนย์ข้อมูลคริสตัลและพลอยไทย

ตัวตน: ผู้รู้เรื่องหินและพลังงาน อายุ 33 ปี พูดภาษาไทยกลาง ใช้ "ผม" และ "ครับ"
บุคลิก: เหมือนเพื่อนที่รู้เรื่องหิน ไม่ใช่พนักงานขาย ไม่เร่ง ไม่กดดัน อบอุ่น เป็นกันเอง

หน้าที่:
- ตอบคำถามเรื่องหิน พลังงาน การใช้งาน สรรพคุณ
- แนะนำบทความในเว็บที่เกี่ยวข้อง (stones/, categories/, guides/, talk/, wuchong/, metha/)
- ถ้าถามราคา บอกว่า "มีใน Shopee ครับ ราคาไม่แรง" แล้วให้รายละเอียดถ้าสนใจจริง
- ถ้าถามเรื่องฟังเสียงบทตั้งจิต บอก link /amethez/talk/
- ห้ามแต่งข้อมูลผิดความเป็นจริง

Context: ${pageCtx.topic}${pageCtx.stone ? '\nหินที่กำลังอ่าน: ' + pageCtx.stone : ''}

ตอบสั้นๆ 1-3 ประโยค เป็นธรรมชาติ ไม่เป็นทางการเกินไป`;
  }

  // ── UI Helpers ────────────────────────────────────
  function addBubble(role, text, containerId) {
    const el = document.createElement('div');
    el.className = role === 'sila' ? 'sila-bubble-sila' : 'sila-bubble-user';
    el.textContent = text;
    const c = q(containerId);
    c.appendChild(el);
    c.scrollTop = c.scrollHeight;
    return el;
  }

  function addTyping(containerId) {
    const el = document.createElement('div');
    el.className = 'sila-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    const c = q(containerId);
    c.appendChild(el);
    c.scrollTop = c.scrollHeight;
    return el;
  }

  function injectAffiliateCard(text, containerId) {
    for (const aff of Object.values(AFFILIATES)) {
      if (aff.keywords.some(kw => text.includes(kw))) {
        setTimeout(() => {
          const card = document.createElement('div');
          card.className = 'sila-aff-card';
          card.innerHTML = `
            <div class="sila-aff-title">${aff.emoji} ${aff.name}</div>
            <div class="sila-aff-desc">${aff.desc}</div>
            <div class="sila-aff-footer">
              <span class="sila-aff-price">${aff.price}</span>
              <a href="${aff.url}" target="_blank" rel="noopener" class="sila-aff-btn"
                 onclick="window._silaTrack && window._silaTrack('${aff.name}')">🛒 ดูใน Shopee</a>
            </div>`;
          const c = q(containerId);
          c.appendChild(card);
          c.scrollTop = c.scrollHeight;
        }, 350);
        break;
      }
    }
  }

  // ── Mobile Sheet ──────────────────────────────────
  function openSheet() {
    const sheet = q('sila-sheet');
    const overlay = q('sila-overlay');
    sheet.style.display = 'flex';
    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      sheet.classList.add('sila-sheet-open');
      overlay.classList.add('sila-overlay-show');
    });
    if (!hasGreeted) {
      hasGreeted = true;
      setTimeout(() => addBubble('sila', pageCtx.greeting, 'sila-sheet-msgs'), 400);
    }
    setTimeout(() => q('sila-sheet-inp').focus(), 350);
  }

  function closeSheet() {
    const sheet = q('sila-sheet');
    const overlay = q('sila-overlay');
    sheet.classList.remove('sila-sheet-open');
    overlay.classList.remove('sila-overlay-show');
    setTimeout(() => {
      sheet.style.display = 'none';
      overlay.style.display = 'none';
    }, 320);
  }

  // ── Idle & Analytics ──────────────────────────────
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (messages.length >= CONFIG.minMessagesForAnalytics * 2) sendAnalytics(false);
    }, CONFIG.idleTimeout);
  }

  async function sendAnalytics(beacon) {
    if (!CONFIG.webhookUrl || CONFIG.webhookUrl === 'YOUR_MAKE_WEBHOOK_URL') return;
    if (messages.length < CONFIG.minMessagesForAnalytics * 2) return;

    try {
      const transcript = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'ลูกค้า' : 'ศิลา'}: ${m.content}`)
        .join('\n');

      const summaryRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CONFIG.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: CONFIG.model,
          max_tokens: 350,
          system: 'วิเคราะห์บทสนทนา ตอบเป็น JSON เท่านั้น ไม่มีคำอื่น',
          messages: [{
            role: 'user',
            content: `วิเคราะห์บทสนทนานี้:\n${transcript}\n\nตอบเป็น JSON:\n{"interested_in":["สิ่งที่สนใจ"],"questions":["คำถามสำคัญ"],"pain_points":["ปัญหา/ข้อกังวล"],"suggestions":["ข้อเสนอแนะสำหรับเว็บ"],"new_product_gaps":["สินค้าที่ถามแต่ไม่มี"],"clicked_shopee":false,"sentiment":"positive/neutral/negative","summary":"สรุป 1 ประโยค"}`,
          }],
        }),
      });

      const sd = await summaryRes.json();
      let summary = {};
      try { summary = JSON.parse(sd.content?.[0]?.text || '{}'); } catch {}

      const payload = JSON.stringify({
        ...summary,
        page: pageCtx.path,
        timestamp: new Date().toISOString(),
        session_min: Math.round((Date.now() - sessionStart) / 60000),
        messages: messages.length,
      });

      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.webhookUrl, payload);
      } else {
        fetch(CONFIG.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
      }
    } catch {}
  }

  window._silaTrack = function (name) {
    messages.push({ role: 'system', content: `[คลิก Shopee: ${name}]` });
  };

  // ── Util ──────────────────────────────────────────
  function q(id) { return document.getElementById(id); }

  // ── Boot ─────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
