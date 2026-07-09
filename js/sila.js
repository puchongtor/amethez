/**
 * ศิลา — Amethez Crystal AI Chat
 * Powered by Groq (llama-3.1-8b-instant)
 *
 * พฤติกรรม:
 *  - โหลดหน้า → แสดงแค่ 💎 FAB
 *  - greeting สั้นๆ ลอยเหนือ 💎 ชั่วคราว (5 วิ) ไม่เข้า chat
 *  - กด 💎 → เปิด panel, บันทึก sessionStorage
 *  - กด − → ปิด, บันทึก sessionStorage ว่าปิดแล้ว
 *  - เปลี่ยนหน้าระหว่างคุย → panel ยังเปิดอยู่ (ถ้าไม่ได้กด −)
 */
(function () {
  'use strict';

  const CONFIG = {
    model: 'llama-3.1-8b-instant',
    maxTokens: 600,
    keyStore: 'amethez_gemini_key',
    historyStore: 'sila_history',
    stateStore: 'sila_open',   // sessionStorage — 'true' | 'false'
    maxHistory: 60,
  };

  const SYSTEM_PROMPT = `คุณคือ "ศิลา" — ผู้เชี่ยวชาญหินคริสตัลของ Amethez และนักขายมืออาชีพที่ลูกค้าไม่รู้สึกว่าถูกขาย

═══ บุคลิก ═══
อบอุ่น ลึกซึ้ง เหมือนเพื่อนผู้หญิงที่รู้เรื่องหินดีมาก พูดภาษาไทยกันเอง ใช้คำว่า "ค่ะ" ลงท้าย
มีความรู้เรื่องพลังงาน ออร่า จักระ อย่างจริงจัง ไม่ใช่แค่ขาย

═══ ความรู้หิน ═══
อเมทิสต์(สงบ/สมาธิ/นอนหลับ) โรสควอตซ์(ความรัก/ดึงดูด) ทัวร์มาลีนดำ(ปกป้องพลังลบ)
โมลดาไวท์(transformation/เปลี่ยนชีวิต) ซิทริน(เงิน/โชคลาภ/ดึงดูดความมั่งคั่ง)
คริสตัลใส(แอมพลิฟายพลังหินอื่น) โพรงอเมทิสต์(ฮวงจุ้ย/ชาร์จหิน) ลาพิสลาซูลี(ปัญญา/สื่อสาร)
สะเก็ดดาว Tektite(พลังจักรวาล/transformation) ไพรีต์(ความมั่งคั่ง/ดึงดูดเงิน)

═══ กลยุทธ์การตอบ (สำคัญมาก) ═══

รอบที่ 1-2 (ข้อความแรกๆ):
→ ตอบด้วยความรู้อย่างเดียว ไม่แตะเรื่องขายเลย
→ ทำให้รู้สึกว่าได้รับความรู้ฟรีจากผู้เชี่ยวชาญ
→ ถามคำถามกลับเพื่อเข้าใจสถานการณ์ของเขามากขึ้น เช่น "ตอนนี้ใช้หินอะไรอยู่บ้างคะ?" "เป้าหมายหลักคืออะไรค่ะ?"

รอบที่ 3+ (หลังคุยมาสักพัก):
→ ถ้า topic เกี่ยวข้องกับหินที่มีขาย ให้ถามเบาๆ ครั้งเดียว เช่น
   "อ้อ ถามเพิ่มนะคะ — ตอนนี้มีสะเก็ดดาวไทยแท้และโพรงอเมทิสต์อยู่ด้วยค่ะ สนใจดูไหมคะ?"
   "นึกขึ้นมาว่าของที่คุยกันอยู่นี้ เรามีอยู่พอดีเลยนะคะ ☺️"
→ ถ้าเขาไม่สนใจ → ไม่พูดถึงอีก คุยต่อตามปกติ

ถ้าลูกค้าถามเองว่า "มีขายไหม / ราคาเท่าไหร่ / ซื้อได้ที่ไหน":
→ ตอบได้ทันที บอกราคา และส่งลิงค์ Shopee ถ้ามี
→ บอกโปรหรือของที่มีตอนนี้ได้เลย

สินค้าที่มี (ใช้เมื่อเหมาะสมเท่านั้น):
- สะเก็ดดาวไทย Tektite แท้ 100% ราคา ฿199 → https://s.shopee.co.th/xxx-tektite
- ติดต่อ Line: @masterpuch สำหรับโพรงอเมทิสต์และของพิเศษ

═══ รูปแบบการตอบ ═══
- ตอบสั้นกระชับ 2-4 ประโยค ไม่ยาวเกิน
- ถามกลับ 1 คำถามต่อตอบ เพื่อให้บทสนทนาไหลต่อ
- ใช้ emoji เบาๆ 1-2 ตัว
- หน้าเว็บ: /stones/amethyst.html | /stones/rose-quartz.html | /stones/black-tourmaline.html | /stones/moldavite.html | /categories/chakra.html | /geode/ | /consign.html
- ห้ามแต่งลิงก์ที่ไม่มีในรายการ`;

  // ── TIP MESSAGES (สั้น 1 ประโยค แสดงเหนือ FAB ชั่วคราว) ────────
  const PAGE_TIPS = [
    { test: p => p.includes('amethyst'),       tip: '💜 สงสัยเรื่องอเมทิสต์? ถามได้เลยค่ะ' },
    { test: p => p.includes('rose-quartz'),    tip: '🩷 โรสควอตซ์ — ถามเรื่องความรักได้นะคะ' },
    { test: p => p.includes('black-tourmaline'),tip: '🖤 ทัวร์มาลีนดำ ปกป้องพลังงานค่ะ' },
    { test: p => p.includes('moldavite'),      tip: '☄️ โมลดาไวท์มาจากอวกาศ อยากรู้ไหมคะ?' },
    { test: p => p.includes('chakra'),         tip: '🔮 อยากรู้จักระไหนเป็นพิเศษไหมคะ?' },
    { test: p => p.includes('zodiac'),         tip: '⭐ บอกราศีมาได้เลยค่ะ' },
    { test: p => p.includes('geode'),          tip: '💎 ช่วยเลือกโพรงอเมทิสต์ได้ค่ะ' },
    { test: p => p.includes('consign'),        tip: '🤝 อยากฝากขายหิน? ถามได้เลยค่ะ' },
  ];
  const DEFAULT_TIPS = [
    'สวัสดีค่ะ 💜 มีอะไรให้ศิลาช่วยไหมคะ?',
    '✨ มีหินที่สนใจไหมคะ? ถามได้เลย',
    '🔮 ศิลาพร้อมช่วยเรื่องหินทุกอย่างค่ะ',
  ];

  function getPageTip() {
    const p = location.pathname;
    const match = PAGE_TIPS.find(pg => pg.test(p));
    if (match) return match.tip;
    return DEFAULT_TIPS[Math.floor(Math.random() * DEFAULT_TIPS.length)];
  }

  // ── HISTORY ──────────────────────────────────────────────────────
  let messages = [];

  function saveHistory() {
    try { localStorage.setItem(CONFIG.historyStore, JSON.stringify(messages.slice(-CONFIG.maxHistory))); } catch {}
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(CONFIG.historyStore);
      if (raw) messages = JSON.parse(raw);
    } catch { messages = []; }
  }

  // ── SESSION STATE ─────────────────────────────────────────────────
  function isOpenState() {
    return sessionStorage.getItem(CONFIG.stateStore) === 'true';
  }
  function saveOpenState(val) {
    sessionStorage.setItem(CONFIG.stateStore, val ? 'true' : 'false');
  }

  // ── API ──────────────────────────────────────────────────────────
  let isLoading = false;
  let products = [];

  function getKey() { return localStorage.getItem(CONFIG.keyStore) || ''; }

  async function callGroq(userMsg) {
    const key = getKey();
    if (!key) return '⚙️ ยังไม่ได้ตั้งค่า API key ค่ะ ไปที่ [Admin Panel](/admin/) แท็บ "ตั้งค่า" นะคะ';

    let productCtx = '';
    if (products.length) {
      const avail = products.filter(p => p.status === 'available').slice(0, 6);
      if (avail.length) productCtx = '\n\nสินค้าที่มี:\n' + avail.map(p => `- ${p.name} ฿${p.price} → ${p.url}`).join('\n');
    }

    const history = messages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // บอก AI ว่าอยู่รอบที่เท่าไหร่ เพื่อควบคุมจังหวะการ soft-sell
    const userTurnCount = messages.filter(m => m.role === 'user').length;
    const turnCtx = userTurnCount <= 2
      ? '\n\n[รอบนี้: ตอบความรู้อย่างเดียว ยังไม่พูดเรื่องสินค้า]'
      : userTurnCount === 3
      ? '\n\n[รอบนี้: ถ้า topic เกี่ยวข้อง ถามเบาๆ ว่าสนใจดูของที่มีไหม — ครั้งเดียวเท่านั้น]'
      : '\n\n[รอบนี้: ตามกระแสลูกค้า ถ้าเขาสนใจซื้อค่อยบอก ถ้าไม่สนใจคุยต่อปกติ]';

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT + productCtx + turnCtx }, ...history, { role: 'user', content: userMsg }],
        max_tokens: CONFIG.maxTokens,
        temperature: 0.85
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) return '❌ API key ไม่ถูกต้องค่ะ ตรวจสอบที่ Admin Panel';
      if (res.status === 429) return '⏳ ใช้งานเยอะเกินไปค่ะ รอสักครู่แล้วลองใหม่นะคะ';
      return `❌ เกิดข้อผิดพลาด: ${err?.error?.message || res.statusText}`;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || 'ขอโทษค่ะ ไม่สามารถตอบได้ตอนนี้';
  }

  // ── RENDER ───────────────────────────────────────────────────────
  function renderMd(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#a78bfa;text-decoration:underline">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function addBubble(role, text, typing = false) {
    const msgs = document.getElementById('sila-msgs');
    const div = document.createElement('div');
    div.className = `s-bubble ${role}${typing ? ' typing' : ''}`;
    if (typing) {
      div.innerHTML = `<div class="s-dots"><span></span><span></span><span></span></div>`;
    } else {
      div.innerHTML = role === 'bot' ? renderMd(text) : text.replace(/</g, '&lt;');
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  // ── UI ───────────────────────────────────────────────────────────
  let panelOpen = false;
  let tipTimer  = null;

  function buildUI() {
    const style = document.createElement('style');
    style.textContent = `
      #sila-fab{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:52px;height:52px;
        border-radius:50%;background:linear-gradient(135deg,#7c3aed,#5b21b6);
        border:none;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,.45);
        display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:white;
        transition:transform .2s;}
      #sila-fab:hover{transform:scale(1.1);}
      #sila-notif{position:absolute;top:-3px;right:-3px;width:12px;height:12px;
        background:#ef4444;border-radius:50%;border:2px solid white;display:none;}
      #sila-notif.show{display:block;}

      /* Floating tip bubble above FAB */
      #sila-tip{position:fixed;bottom:4.75rem;right:1.5rem;z-index:9998;
        background:white;border:1px solid #ede8ff;border-radius:.85rem .85rem .85rem .2rem;
        padding:.5rem .9rem;font-size:.8rem;color:#1a1228;line-height:1.45;
        font-family:'Sarabun',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.12);
        max-width:210px;cursor:pointer;white-space:nowrap;
        animation:tip-in .25s ease;display:none;}
      #sila-tip.show{display:block;}
      @keyframes tip-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      #sila-tip::after{content:'';position:absolute;bottom:-6px;left:14px;
        border:6px solid transparent;border-top-color:white;border-bottom:none;}

      /* Chat panel */
      #sila-panel{position:fixed;bottom:5rem;right:1.5rem;z-index:9997;
        width:340px;max-height:520px;background:#ffffff !important;border-radius:1.25rem;
        box-shadow:0 20px 60px rgba(0,0,0,.2);flex-direction:column;
        overflow:hidden;border:1px solid #ede8ff;font-family:'Sarabun',sans-serif;
        display:none;transition:opacity .2s;color:#1a1228 !important;}
      #sila-panel.open{display:flex;}
      #sila-panel *{box-sizing:border-box;}
      #sila-msgs{background:#ffffff !important;}
      #sila-input-row{background:#ffffff !important;}

      .s-head{background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:.75rem 1rem;
        display:flex;align-items:center;gap:.65rem;flex-shrink:0;}
      .s-avatar{width:34px;height:34px;background:rgba(255,255,255,.2);border-radius:50%;
        display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
      .s-info{flex:1;min-width:0;}
      .s-name{color:white;font-weight:700;font-size:.88rem;}
      .s-status{color:rgba(255,255,255,.75);font-size:.7rem;display:flex;align-items:center;gap:.3rem;margin-top:1px;}
      .s-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;flex-shrink:0;animation:s-pulse 2s infinite;}
      @keyframes s-pulse{0%,100%{opacity:1}50%{opacity:.4}}
      .s-head-btns{display:flex;gap:.15rem;}
      .s-hbtn{background:none;border:none;color:rgba(255,255,255,.65);cursor:pointer;
        font-size:.9rem;padding:.3rem .4rem;border-radius:.3rem;line-height:1;transition:all .15s;font-family:sans-serif;}
      .s-hbtn:hover{color:white;background:rgba(255,255,255,.15);}

      #sila-msgs{flex:1;overflow-y:auto;padding:.85rem;display:flex;flex-direction:column;
        gap:.65rem;scroll-behavior:smooth;}
      #sila-msgs::-webkit-scrollbar{width:3px;}
      #sila-msgs::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:2px;}

      .s-bubble{max-width:86%;padding:.55rem .8rem;border-radius:1rem;font-size:.855rem;line-height:1.6;word-break:break-word;}
      .s-bubble.bot{background:#f5f0ff;color:#1a1228;border-radius:1rem 1rem 1rem .2rem;}
      .s-bubble.usr{background:#7c3aed;color:white;margin-left:auto;border-radius:1rem 1rem .2rem 1rem;}
      .s-bubble.typing{background:#f5f0ff;}
      .s-dots{display:flex;gap:4px;align-items:center;padding:.15rem 0;}
      .s-dots span{width:6px;height:6px;background:#a78bfa;border-radius:50%;
        animation:s-td .9s infinite ease-in-out both;}
      .s-dots span:nth-child(2){animation-delay:.15s;}
      .s-dots span:nth-child(3){animation-delay:.3s;}
      @keyframes s-td{0%,80%,100%{transform:scale(.7);opacity:.4}40%{transform:scale(1);opacity:1}}

      #sila-input-row{display:flex;gap:.45rem;padding:.6rem .7rem;border-top:1px solid #f0ebff;flex-shrink:0;}
      #sila-inp{flex:1;border:1.5px solid #e5e7eb;border-radius:.65rem;padding:.45rem .75rem;
        font-size:.855rem;font-family:'Sarabun',sans-serif;outline:none;resize:none;
        max-height:72px;transition:border-color .2s;line-height:1.4;
        -webkit-appearance:none;appearance:none;overflow:hidden;
        color:#1a1228 !important;background:#ffffff !important;}
      #sila-inp:focus{border-color:#a78bfa;}
      #sila-inp::placeholder{color:#9ca3af !important;}
      #sila-send{width:34px;height:34px;background:#7c3aed;border:none;border-radius:.65rem;
        cursor:pointer;display:flex;align-items:center;justify-content:center;
        flex-shrink:0;transition:opacity .2s;align-self:flex-end;}
      #sila-send:hover{opacity:.85;}
      #sila-send:disabled{opacity:.35;cursor:not-allowed;}
      #sila-send svg{width:14px;height:14px;fill:white;}

      @media(max-width:480px){
        #sila-panel{width:calc(100vw - 2rem);right:1rem;max-height:65vh;}
        #sila-tip{max-width:170px;font-size:.75rem;}
      }
    `;
    document.head.appendChild(style);

    // FAB
    const fab = document.createElement('button');
    fab.id = 'sila-fab';
    fab.setAttribute('aria-label', 'เปิดแชทศิลา');
    fab.innerHTML = `💎<span id="sila-notif"></span>`;
    fab.addEventListener('click', togglePanel);
    document.body.appendChild(fab);

    // Tip bubble
    const tip = document.createElement('div');
    tip.id = 'sila-tip';
    tip.addEventListener('click', () => { hideTip(); openPanel(); });
    document.body.appendChild(tip);

    // Panel — hidden via inline style by default
    const panel = document.createElement('div');
    panel.id = 'sila-panel';
    panel.style.cssText = 'display:none';
    panel.innerHTML = `
      <div class="s-head">
        <div class="s-avatar">🔮</div>
        <div class="s-info">
          <div class="s-name">ศิลา · Crystal Guide</div>
          <div class="s-status"><span class="s-dot"></span>ผู้เชี่ยวชาญหินคริสตัล</div>
        </div>
        <div class="s-head-btns">
          <button class="s-hbtn" id="sila-clear-btn" title="ล้างแชท">🗑</button>
          <button class="s-hbtn" id="sila-min-btn" title="ปิด" style="font-size:1.3rem;font-weight:900;line-height:1;padding:.2rem .5rem">−</button>
        </div>
      </div>
      <div id="sila-msgs"></div>
      <div id="sila-input-row">
        <textarea id="sila-inp" placeholder="ถามเรื่องหินคริสตัล..." rows="1"></textarea>
        <button id="sila-send" aria-label="ส่ง">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>`;
    document.body.appendChild(panel);

    // ปิด panel ด้วย inline style โดยตรง (ไม่ใช้ CSS class)
    panel.querySelector('#sila-min-btn').addEventListener('click', () => {
      panel.style.display = 'none';
      panelOpen = false;
      saveOpenState(false);
    });
    panel.querySelector('#sila-clear-btn').addEventListener('click', () => {
      if (!confirm('ล้างประวัติแชทกับศิลาทั้งหมด?')) return;
      messages = [];
      localStorage.removeItem(CONFIG.historyStore);
      document.getElementById('sila-msgs').innerHTML = '';
      addBubble('bot', 'ลบประวัติแชทแล้วค่ะ 🌸 มีอะไรให้ช่วยไหมคะ?');
    });

    panel.querySelector('#sila-send').addEventListener('click', silaSend);

    const inp = panel.querySelector('#sila-inp');
    inp.addEventListener('input', () => {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 72) + 'px';
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); silaSend(); }
    });
  }

  function openPanel() {
    panelOpen = true;
    const panel = document.getElementById('sila-panel');
    panel.style.display = 'flex';
    document.getElementById('sila-notif').classList.remove('show');
    saveOpenState(true);
    hideTip();
    const msgs = document.getElementById('sila-msgs');
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => document.getElementById('sila-inp')?.focus(), 150);
  }

  function closePanel() {
    panelOpen = false;
    document.getElementById('sila-panel').style.display = 'none';
    saveOpenState(false);
  }

  function togglePanel() {
    if (panelOpen) closePanel();
    else openPanel();
  }

  // ── TIP BUBBLE ───────────────────────────────────────────────────
  function showTip(text) {
    const el = document.getElementById('sila-tip');
    el.textContent = text;
    el.classList.add('show');
    tipTimer = setTimeout(hideTip, 5000);
  }

  function hideTip() {
    clearTimeout(tipTimer);
    const el = document.getElementById('sila-tip');
    if (el) el.classList.remove('show');
  }

  // ── SEND ─────────────────────────────────────────────────────────
  async function silaSend() {
    if (isLoading) return;
    const inp = document.getElementById('sila-inp');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = ''; inp.style.height = 'auto';

    addBubble('usr', text);
    messages.push({ role: 'user', content: text });
    saveHistory();

    isLoading = true;
    document.getElementById('sila-send').disabled = true;
    const typing = addBubble('bot', '', true);

    try {
      const reply = await callGroq(text);
      typing.remove();
      addBubble('bot', reply);
      messages.push({ role: 'sila', content: reply });
      saveHistory();
    } catch {
      typing.remove();
      addBubble('bot', '❌ เกิดข้อผิดพลาดค่ะ ลองใหม่อีกครั้งนะคะ');
    } finally {
      isLoading = false;
      document.getElementById('sila-send').disabled = false;
    }
  }

  window.silaSend = silaSend;

  // ── LOAD PRODUCTS ────────────────────────────────────────────────
  async function loadProducts() {
    try {
      const res = await fetch('/data/products.json');
      products = (await res.json()).products || [];
    } catch { products = []; }
  }

  // ── BOOT ────────────────────────────────────────────────────────
  function init() {
    loadHistory();
    buildUI();
    loadProducts();

    // Restore previous chat messages (ไม่มี greeting ใน chat)
    if (messages.length > 0) {
      messages.forEach(m => addBubble(m.role === 'user' ? 'usr' : 'bot', m.content));
    } else {
      // ครั้งแรกที่เปิด — ทักทายใน chat เบาๆ
      addBubble('bot', 'สวัสดีค่ะ 💜 ศิลาพร้อมช่วยเรื่องหินคริสตัลค่ะ ถามได้เลยนะคะ');
    }

    // เปิด panel เฉพาะถ้า user กำลังคุยอยู่ (มีประวัติ) และเปิดค้างไว้
    // ถ้าเพิ่งเปิดหน้าใหม่โดยไม่เคยกด 💎 — ซ่อนไว้เสมอ
    if (isOpenState() && messages.length > 0) {
      openPanel();
    } else {
      // แสดง tip สั้นๆ เหนือ FAB หลัง 3 วิ
      setTimeout(() => {
        if (!panelOpen) showTip(getPageTip());
      }, 3000);
    }

    // Notif dot หลัง 25s ถ้าไม่ได้เปิด
    setTimeout(() => {
      if (!panelOpen) document.getElementById('sila-notif')?.classList.add('show');
    }, 25000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
