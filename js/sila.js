/**
 * ศิลา — Amethez Crystal AI Chat
 * Powered by Google Gemini 2.0 Flash
 * Key managed via Admin Panel (localStorage) — NOT in source code
 */
(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────
  const CONFIG = {
    model: 'llama-3.1-8b-instant',
    maxTokens: 600,
    greetDelay: 20000,
    scrollTrigger: 0.35,
    storageKey: 'amethez_gemini_key',
  };

  // ── SITE KNOWLEDGE ───────────────────────────────────────────────
  const SITE_MAP = `
หน้าหลัก: /
สารานุกรมหิน: /stones/encyclopedia.html
อเมทิสต์: /stones/amethyst.html
โรสควอตซ์: /stones/rose-quartz.html
ทัวร์มาลีนดำ: /stones/black-tourmaline.html
โมลดาไวท์: /stones/moldavite.html
จักระ: /categories/chakra.html
ราศี: /categories/zodiac.html
หินตามสี: /categories/color.html
หินตามวัตถุประสงค์: /categories/purpose.html
โพรงอเมทิสต์ (สินค้า): /geode/
รับฝากขาย: /consign.html
`;

  const SYSTEM_PROMPT = `คุณคือ "ศิลา" — ผู้เชี่ยวชาญหินคริสตัลและพลังงานของ Amethez เว็บศูนย์รวมความรู้หินที่ใหญ่ที่สุดในไทย

บุคลิก:
- ลึกซึ้ง อบอุ่น เหมือนพี่สาวที่รู้จักหิน
- พูดภาษาพลังงาน ออร่า จักระ ได้อย่างเป็นธรรมชาติ
- ไม่ hard sell แต่แนะนำสิ่งที่เหมาะกับลูกค้าจริงๆ
- ใช้ภาษาไทย เป็นกันเอง บางครั้งใช้ภาษาพลังงาน

ความรู้หิน (ตอบได้ทุกเรื่อง):
- อเมทิสต์: ม่วง จักระมงกุฎ/ตาที่สาม ความสงบ สมาธิ ความฝัน
- โรสควอตซ์: ชมพู จักระหัวใจ ความรัก เยียวยาจิตใจ
- ทัวร์มาลีนดำ: ดำ จักระราก ปกป้องพลังงานลบ ดูดซับ EMF
- โมลดาไวท์: เขียวจากอวกาศ transformation เร่งพลังงาน
- ซิทริน: เหลือง ความมั่งคั่ง โชคลาภ ดึงดูดเงิน
- คริสตัลใส: ขาวใส แอมพลิฟาย เสริมพลังหินอื่น
- โพรงอเมทิสต์: ฮวงจุ้ย ดูดซับพลังงานลบ วางในบ้าน
- ไพรีต์: สีทอง เงินทอง ความมั่งคั่ง พลังงานสุริยะ
- ลาพิส ลาซูลี: น้ำเงิน ปัญญา ความจริง การสื่อสาร
- โอปอล: หลากสี ความคิดสร้างสรรค์ ความหวัง

แนวทางตอบ:
1. ตอบคำถามด้วยความรู้หินก่อน (2-3 ประโยค)
2. ถ้าเกี่ยวกับหินที่มีบทความ → แนะนำลิงก์: "อ่านเพิ่มที่ [ชื่อหน้า](URL)"
3. ถ้าถามเรื่องซื้อหิน → แนะนำ /geode/
4. ถ้าถามเรื่องจักระ → แนะนำ /categories/chakra.html
5. ถ้าถามเรื่องราศี → แนะนำ /categories/zodiac.html
6. ถ้าอยากฝากขายหิน → แนะนำ /consign.html

หน้าเว็บที่มี:
${SITE_MAP}

format ตอบ: สั้นกระชับ ไม่เกิน 4-5 ประโยค ถ้าแนะนำลิงก์ใช้ markdown [ชื่อ](url)
ห้ามแต่งลิงก์ที่ไม่มีในรายการข้างต้น`;

  // ── STATE ────────────────────────────────────────────────────────
  let messages = [];
  let hasGreeted = false;
  let isLoading = false;
  let products = [];

  // ── API KEY ──────────────────────────────────────────────────────
  function getKey() {
    return localStorage.getItem(CONFIG.storageKey) || '';
  }

  // ── DETECT PAGE CONTEXT ──────────────────────────────────────────
  function detectContext() {
    const path = location.pathname;
    const ctxMap = [
      { test: p => p.includes('amethyst'), greeting: 'สวัสดีค่ะ 💜 กำลังอ่านเรื่องอเมทิสต์อยู่ใช่ไหมคะ? มีอะไรอยากรู้เพิ่มเติมไหมคะ' },
      { test: p => p.includes('rose-quartz'), greeting: 'สวัสดีค่ะ 🩷 โรสควอตซ์เป็นหินแห่งความรักนะคะ มีคำถามไหมคะ?' },
      { test: p => p.includes('black-tourmaline'), greeting: 'สวัสดีค่ะ 🖤 ทัวร์มาลีนดำช่วยปกป้องพลังงานได้ดีมากค่ะ' },
      { test: p => p.includes('moldavite'), greeting: 'สวัสดีค่ะ 🌿 โมลดาไวท์พลังงานแรงมากนะคะ พร้อมรับพลังงานใหม่แล้วใช่ไหมคะ?' },
      { test: p => p.includes('chakra'), greeting: 'สวัสดีค่ะ 🔮 อยากรู้เรื่องจักระกับหินที่เข้ากันไหมคะ?' },
      { test: p => p.includes('geode'), greeting: 'สวัสดีค่ะ 💎 สนใจโพรงอเมทิสต์อยู่ใช่ไหมคะ? มีคำถามได้เลยค่ะ' },
      { test: p => p.includes('consign'), greeting: 'สวัสดีค่ะ 🤝 อยากฝากขายหินกับเราใช่ไหมคะ? ถามได้เลยนะคะ' },
    ];
    const ctx = ctxMap.find(c => c.test(path));
    return ctx?.greeting || 'สวัสดีค่ะ 💜 ศิลาเป็นผู้ช่วยด้านหินคริสตัลของ Amethez ค่ะ มีอะไรให้ช่วยไหมคะ?';
  }

  // ── GEMINI API CALL ──────────────────────────────────────────────
  async function callGroq(userMsg) {
    const key = getKey();
    if (!key) {
      return '⚙️ ยังไม่ได้ตั้งค่า API key ค่ะ กรุณาไปที่ [Admin Panel](/admin/) เพื่อใส่ Groq API key ก่อนนะคะ';
    }

    let productCtx = '';
    if (products.length) {
      const avail = products.filter(p => p.status === 'available').slice(0, 8);
      if (avail.length) {
        productCtx = '\n\nสินค้า Shopee ที่มีตอนนี้:\n' + avail.map(p =>
          `- ${p.name} ฿${p.price} → ${p.url}`
        ).join('\n');
      }
    }

    const history = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const body = {
      model: CONFIG.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + productCtx },
        ...history,
        { role: 'user', content: userMsg }
      ],
      max_tokens: CONFIG.maxTokens,
      temperature: 0.8
    };

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) return '❌ API key ไม่ถูกต้องค่ะ กรุณาตรวจสอบที่ Admin Panel';
      if (res.status === 429) return '⏳ ใช้งานเยอะเกินไปค่ะ รอสักครู่แล้วลองใหม่นะคะ';
      return `❌ เกิดข้อผิดพลาด: ${err?.error?.message || res.statusText}`;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || 'ขอโทษค่ะ ไม่สามารถตอบได้ตอนนี้';
  }

  // ── RENDER MARKDOWN ──────────────────────────────────────────────
  function renderMd(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#a78bfa;text-decoration:underline">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // ── UI BUILD ─────────────────────────────────────────────────────
  function buildUI() {
    const style = document.createElement('style');
    style.textContent = `
      #sila-fab{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:56px;height:56px;
        border-radius:50%;background:linear-gradient(135deg,#7c3aed,#5b21b6);
        border:none;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,.45);
        display:flex;align-items:center;justify-content:center;font-size:1.5rem;
        transition:transform .2s,box-shadow .2s;color:white;}
      #sila-fab:hover{transform:scale(1.08);}
      #sila-notif{position:absolute;top:-3px;right:-3px;width:14px;height:14px;
        background:#ef4444;border-radius:50%;border:2px solid white;display:none;}
      #sila-notif.show{display:block;}

      #sila-panel{position:fixed;bottom:5rem;right:1.5rem;z-index:9998;
        width:340px;max-height:520px;background:white;border-radius:1.25rem;
        box-shadow:0 20px 60px rgba(0,0,0,.2);display:none;flex-direction:column;
        overflow:hidden;border:1px solid #ede8ff;font-family:'Sarabun',sans-serif;}
      #sila-panel.open{display:flex;}

      .s-head{background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:1rem 1.25rem;
        display:flex;align-items:center;gap:.75rem;flex-shrink:0;}
      .s-avatar{width:40px;height:40px;background:rgba(255,255,255,.2);
        border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;}
      .s-name{color:white;font-weight:700;font-size:.95rem;}
      .s-status{color:rgba(255,255,255,.75);font-size:.75rem;display:flex;align-items:center;gap:.35rem;}
      .s-dot{width:7px;height:7px;background:#4ade80;border-radius:50%;animation:s-pulse 2s infinite;}
      @keyframes s-pulse{0%,100%{opacity:1}50%{opacity:.4}}
      .s-close{background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;
        font-size:1.2rem;padding:.25rem;margin-left:auto;}
      .s-close:hover{color:white;}

      #sila-msgs{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;
        gap:.75rem;scroll-behavior:smooth;}
      #sila-msgs::-webkit-scrollbar{width:4px;}
      #sila-msgs::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:2px;}

      .s-bubble{max-width:85%;padding:.65rem .9rem;border-radius:1rem;font-size:.875rem;line-height:1.6;}
      .s-bubble.bot{background:#f5f0ff;color:#1a1228;border-radius:1rem 1rem 1rem .25rem;}
      .s-bubble.usr{background:#7c3aed;color:white;margin-left:auto;border-radius:1rem 1rem .25rem 1rem;}
      .s-bubble.typing{background:#f5f0ff;}
      .s-dots{display:flex;gap:4px;align-items:center;padding:.2rem 0;}
      .s-dots span{width:7px;height:7px;background:#a78bfa;border-radius:50%;
        animation:s-td .9s infinite ease-in-out both;}
      .s-dots span:nth-child(2){animation-delay:.15s;}
      .s-dots span:nth-child(3){animation-delay:.3s;}
      @keyframes s-td{0%,80%,100%{transform:scale(.7);opacity:.4}40%{transform:scale(1);opacity:1}}

      #sila-qbtns{display:flex;gap:.4rem;flex-wrap:wrap;padding:0 1rem .75rem;flex-shrink:0;}
      .s-qbtn{background:#f5f0ff;border:1px solid #d8b4fe;color:#7c3aed;border-radius:2rem;
        padding:.3rem .65rem;font-size:.75rem;cursor:pointer;font-family:'Sarabun',sans-serif;
        white-space:nowrap;transition:all .15s;}
      .s-qbtn:hover{background:#7c3aed;color:white;border-color:#7c3aed;}

      #sila-input-row{display:flex;gap:.5rem;padding:.75rem;border-top:1px solid #f3f0ff;flex-shrink:0;}
      #sila-inp{flex:1;border:1.5px solid #e5e7eb;border-radius:.75rem;padding:.55rem .85rem;
        font-size:.875rem;font-family:'Sarabun',sans-serif;outline:none;resize:none;
        max-height:80px;transition:border-color .2s;line-height:1.4;}
      #sila-inp:focus{border-color:#a78bfa;}
      #sila-send{width:38px;height:38px;background:#7c3aed;border:none;border-radius:.75rem;
        cursor:pointer;display:flex;align-items:center;justify-content:center;
        flex-shrink:0;transition:opacity .2s;}
      #sila-send:hover{opacity:.85;}
      #sila-send:disabled{opacity:.4;cursor:not-allowed;}
      #sila-send svg{width:16px;height:16px;fill:white;}

      @media(max-width:480px){
        #sila-panel{width:calc(100vw - 2rem);right:1rem;}
      }
    `;
    document.head.appendChild(style);

    // FAB button
    const fab = document.createElement('button');
    fab.id = 'sila-fab';
    fab.setAttribute('aria-label', 'เปิดแชทศิลา');
    fab.innerHTML = `💎<span id="sila-notif"></span>`;
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'sila-panel';
    panel.setAttribute('role', 'dialog');
    panel.innerHTML = `
      <div class="s-head">
        <div class="s-avatar">🔮</div>
        <div>
          <div class="s-name">ศิลา · Crystal Guide</div>
          <div class="s-status"><span class="s-dot"></span>ผู้เชี่ยวชาญหินคริสตัล</div>
        </div>
        <button class="s-close" onclick="silaClose()" aria-label="ปิด">✕</button>
      </div>
      <div id="sila-msgs"></div>
      <div id="sila-qbtns"></div>
      <div id="sila-input-row">
        <textarea id="sila-inp" placeholder="ถามเรื่องหินคริสตัล..." rows="1"></textarea>
        <button id="sila-send" onclick="silaSend()" aria-label="ส่ง">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>`;
    document.body.appendChild(panel);

    renderQuickBtns();

    const inp = document.getElementById('sila-inp');
    inp.addEventListener('input', () => {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 80) + 'px';
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); silaSend(); }
    });
  }

  function renderQuickBtns() {
    const btns = [
      ['💜 ความสงบ', 'แนะนำหินเพื่อความสงบและสมาธิ'],
      ['💰 ดึงดูดเงิน', 'หินอะไรช่วยดึงดูดเงินและโชคลาภ?'],
      ['🛡️ ปกป้อง', 'หินปกป้องพลังงานลบที่ดีที่สุดคืออะไร?'],
      ['💎 โพรงอเมทิสต์', 'โพรงอเมทิสต์วางที่ไหนในบ้านดีที่สุด?'],
      ['🔮 หินตามราศี', 'หินประจำราศีของฉันคืออะไร?'],
    ];
    document.getElementById('sila-qbtns').innerHTML = btns.map(([l, q]) =>
      `<button class="s-qbtn" onclick="silaAsk(${JSON.stringify(q)})">${l}</button>`
    ).join('');
  }

  // ── PANEL CONTROLS ───────────────────────────────────────────────
  let panelOpen = false;

  window.silaClose = function () {
    document.getElementById('sila-panel').classList.remove('open');
    panelOpen = false;
  };

  function togglePanel() {
    panelOpen = !panelOpen;
    document.getElementById('sila-panel').classList.toggle('open', panelOpen);
    document.getElementById('sila-notif').classList.remove('show');
    if (panelOpen && !hasGreeted) {
      hasGreeted = true;
      setTimeout(() => addBubble('bot', detectContext()), 300);
      if (!getKey()) {
        setTimeout(() => addBubble('bot',
          '⚙️ หมายเหตุ: ยังไม่ได้ตั้งค่า API key ค่ะ ไปที่ <a href="/admin/" style="color:#a78bfa">Admin Panel</a> แล้วใส่ Gemini key ที่แท็บ "ตั้งค่า" นะคะ'
        ), 1200);
      }
    }
    if (panelOpen) setTimeout(() => document.getElementById('sila-inp')?.focus(), 200);
  }

  // ── BUBBLES ──────────────────────────────────────────────────────
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

  // ── SEND ─────────────────────────────────────────────────────────
  window.silaSend = async function () {
    if (isLoading) return;
    const inp = document.getElementById('sila-inp');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = ''; inp.style.height = 'auto';
    addBubble('usr', text);
    messages.push({ role: 'user', content: text });

    isLoading = true;
    document.getElementById('sila-send').disabled = true;
    const typing = addBubble('bot', '', true);

    try {
      const reply = await callGroq(text);
      typing.remove();
      addBubble('bot', reply);
      messages.push({ role: 'sila', content: reply });
    } catch {
      typing.remove();
      addBubble('bot', '❌ เกิดข้อผิดพลาดค่ะ ลองใหม่อีกครั้งนะคะ');
    } finally {
      isLoading = false;
      document.getElementById('sila-send').disabled = false;
    }
  };

  window.silaAsk = function (q) {
    const inp = document.getElementById('sila-inp');
    if (!inp) return;
    inp.value = q;
    silaSend();
  };

  // ── LOAD PRODUCTS (for recommendations) ─────────────────────────
  async function loadProducts() {
    try {
      const res = await fetch('/data/products.json');
      const data = await res.json();
      products = data.products || [];
    } catch { products = []; }
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────
  function scheduleNotif() {
    setTimeout(() => {
      if (!hasGreeted) document.getElementById('sila-notif')?.classList.add('show');
    }, CONFIG.greetDelay);

    let scrollDone = false;
    window.addEventListener('scroll', () => {
      if (scrollDone || hasGreeted) return;
      const ratio = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
      if (ratio > CONFIG.scrollTrigger) {
        scrollDone = true;
        document.getElementById('sila-notif')?.classList.add('show');
      }
    }, { passive: true });
  }

  // ── BOOT ────────────────────────────────────────────────────────
  function init() {
    buildUI();
    loadProducts();
    scheduleNotif();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
