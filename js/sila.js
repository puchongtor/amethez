/**
 * ศิลา — Amethez Crystal AI Chat
 * Powered by Groq (llama-3.1-8b-instant)
 */
(function () {
  'use strict';

  const CONFIG = {
    model: 'llama-3.1-8b-instant',
    maxTokens: 600,
    keyStore: 'amethez_gemini_key',
    historyStore: 'sila_history',
    maxHistory: 60,
  };

  const SYSTEM_PROMPT = `คุณคือ "ศิลา" — ผู้เชี่ยวชาญหินคริสตัลและพลังงานของ Amethez เว็บศูนย์รวมความรู้หินที่ใหญ่ที่สุดในไทย

บุคลิก: ลึกซึ้ง อบอุ่น เหมือนเพื่อนที่รู้จักหิน พูดภาษาพลังงาน ออร่า จักระ ใช้ภาษาไทยเป็นกันเอง

ความรู้หิน: อเมทิสต์(สงบ/สมาธิ) โรสควอตซ์(ความรัก) ทัวร์มาลีนดำ(ปกป้อง) โมลดาไวท์(transformation) ซิทริน(เงิน/โชค) คริสตัลใส(แอมพลิฟาย) โพรงอเมทิสต์(ฮวงจุ้ย) ไพรีต์(ความมั่งคั่ง) ลาพิสลาซูลี(ปัญญา)

แนวทาง: ตอบด้วยความรู้ก่อน แนะนำลิงก์ markdown ถ้าเกี่ยวข้อง ตอบสั้นกระชับ 3-4 ประโยค
หน้าเว็บ: / | /stones/amethyst.html | /stones/rose-quartz.html | /stones/black-tourmaline.html | /stones/moldavite.html | /categories/chakra.html | /categories/zodiac.html | /geode/ | /consign.html
ห้ามแต่งลิงก์ที่ไม่มีในรายการ`;

  // ── PAGE GREETINGS ──────────────────────────────────────────────
  const PAGE_GREETINGS = [
    { test: p => p.includes('amethyst'),
      msgs: ['💜 อ่านเรื่องอเมทิสต์กันอยู่เหรอคะ? หินนี้ดีมากเลยนะ ช่วยเรื่องสมาธิและการนอนหลับได้ดีค่ะ',
             '✨ อเมทิสต์หน้านี้ครบมากเลยค่ะ มีอะไรอยากถามเพิ่มไหมคะ?'] },
    { test: p => p.includes('rose-quartz'),
      msgs: ['🩷 โรสควอตซ์หินแห่งความรักค่ะ กำลังมองหาเพื่อตัวเองหรือให้คนพิเศษอยู่คะ?',
             '💗 อ่านเรื่องโรสควอตซ์อยู่ใช่ไหมคะ? มีอะไรสงสัยถามได้เลยนะคะ'] },
    { test: p => p.includes('black-tourmaline'),
      msgs: ['🖤 ทัวร์มาลีนดำปกป้องพลังงานลบได้ดีมากเลยค่ะ กำลังมองหาหินปกป้องอยู่ใช่ไหมคะ?',
             '🛡️ หน้านี้มีข้อมูลทัวร์มาลีนดำครบเลยนะคะ ถามเพิ่มได้เลยค่ะ'] },
    { test: p => p.includes('moldavite'),
      msgs: ['🌿 โมลดาไวท์มาจากอวกาศค่ะ พลังงานแรงมากๆ เลย พร้อมรับการเปลี่ยนแปลงแล้วใช่ไหมคะ?',
             '☄️ สนใจโมลดาไวท์เหรอคะ? หินนี้เร่งพลังงานชีวิตได้มากเลยนะคะ'] },
    { test: p => p.includes('chakra'),
      msgs: ['🔮 กำลังเรียนรู้เรื่องจักระอยู่เหรอคะ? แต่ละจักระมีหินที่เหมาะกันต่างกันไปเลยค่ะ',
             '✨ หน้าจักระนี้ครบมากเลยนะคะ อยากรู้เรื่องจักระไหนเป็นพิเศษไหมคะ?'] },
    { test: p => p.includes('zodiac'),
      msgs: ['⭐ กำลังดูหินตามราศีอยู่เหรอคะ? บอกราศีมาได้เลย ศิลาแนะนำให้ค่ะ',
             '🌙 แต่ละราศีมีหินเสริมดวงต่างกันเลยนะคะ ราศีอะไรอยู่คะ?'] },
    { test: p => p.includes('geode'),
      msgs: ['💎 โพรงอเมทิสต์ที่นี่สวยมากเลยนะคะ มีคำถามเรื่องขนาดหรือการวางในบ้านไหมคะ?',
             '🏠 กำลังเลือกโพรงอเมทิสต์อยู่ใช่ไหมคะ? ให้ศิลาช่วยแนะนำได้เลยค่ะ'] },
    { test: p => p.includes('consign'),
      msgs: ['🤝 อยากฝากขายหินกับ Amethez เหรอคะ? มีข้อสงสัยอะไรถามได้เลยนะคะ',
             '💼 เรารับฝากขายหินหลายประเภทเลยค่ะ มีอะไรอยากรู้เพิ่มไหมคะ?'] },
  ];

  const DEFAULT_GREETINGS = [
    'สวัสดีค่ะ 💜 ศิลาอยู่ตรงนี้เสมอเลยนะคะ มีอะไรอยากรู้เรื่องหินคริสตัลถามได้เลยค่ะ',
    'ยินดีต้อนรับสู่ Amethez ค่ะ ✨ มีหินที่สนใจตัวไหนไหมคะ?',
    'สวัสดีค่ะ 🔮 วันนี้กำลังมองหาหินเพื่ออะไรอยู่คะ?',
  ];

  function getPageGreeting() {
    const p = location.pathname;
    const match = PAGE_GREETINGS.find(pg => pg.test(p));
    const pool = match ? match.msgs : DEFAULT_GREETINGS;
    return pool[Math.floor(Math.random() * pool.length)];
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

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT + productCtx }, ...history, { role: 'user', content: userMsg }],
        max_tokens: CONFIG.maxTokens,
        temperature: 0.8
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

  function buildUI() {
    const style = document.createElement('style');
    style.textContent = `
      #sila-fab{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:56px;height:56px;
        border-radius:50%;background:linear-gradient(135deg,#7c3aed,#5b21b6);
        border:none;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,.45);
        display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;}
      #sila-fab:hover{transform:scale(1.08);}
      #sila-notif{position:absolute;top:-3px;right:-3px;width:14px;height:14px;
        background:#ef4444;border-radius:50%;border:2px solid white;display:none;}
      #sila-notif.show{display:block;}

      #sila-panel{position:fixed;bottom:5rem;right:1.5rem;z-index:9998;
        width:350px;max-height:560px;background:white;border-radius:1.25rem;
        box-shadow:0 20px 60px rgba(0,0,0,.2);flex-direction:column;
        overflow:hidden;border:1px solid #ede8ff;font-family:'Sarabun',sans-serif;
        display:none;}
      #sila-panel.open{display:flex;}

      .s-head{background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:.85rem 1.1rem;
        display:flex;align-items:center;gap:.7rem;flex-shrink:0;}
      .s-avatar{width:38px;height:38px;background:rgba(255,255,255,.2);border-radius:50%;
        display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;}
      .s-info{flex:1;min-width:0;}
      .s-name{color:white;font-weight:700;font-size:.9rem;}
      .s-status{color:rgba(255,255,255,.75);font-size:.72rem;display:flex;align-items:center;gap:.3rem;margin-top:1px;}
      .s-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;flex-shrink:0;animation:s-pulse 2s infinite;}
      @keyframes s-pulse{0%,100%{opacity:1}50%{opacity:.4}}
      .s-head-btns{display:flex;gap:.2rem;}
      .s-hbtn{background:none;border:none;color:rgba(255,255,255,.65);cursor:pointer;
        font-size:.9rem;padding:.3rem .45rem;border-radius:.35rem;line-height:1;transition:all .15s;font-family:sans-serif;}
      .s-hbtn:hover{color:white;background:rgba(255,255,255,.15);}

      #sila-msgs{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;
        gap:.7rem;scroll-behavior:smooth;}
      #sila-msgs::-webkit-scrollbar{width:4px;}
      #sila-msgs::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:2px;}

      .s-bubble{max-width:86%;padding:.6rem .85rem;border-radius:1rem;font-size:.875rem;line-height:1.65;word-break:break-word;}
      .s-bubble.bot{background:#f5f0ff;color:#1a1228;border-radius:1rem 1rem 1rem .2rem;}
      .s-bubble.usr{background:#7c3aed;color:white;margin-left:auto;border-radius:1rem 1rem .2rem 1rem;}
      .s-bubble.page-greet{background:#f0fdf4;border-left:3px solid #4ade80;border-radius:.5rem;
        font-size:.82rem;color:#166534;max-width:100%;}
      .s-bubble.typing{background:#f5f0ff;}
      .s-dots{display:flex;gap:4px;align-items:center;padding:.15rem 0;}
      .s-dots span{width:7px;height:7px;background:#a78bfa;border-radius:50%;
        animation:s-td .9s infinite ease-in-out both;}
      .s-dots span:nth-child(2){animation-delay:.15s;}
      .s-dots span:nth-child(3){animation-delay:.3s;}
      @keyframes s-td{0%,80%,100%{transform:scale(.7);opacity:.4}40%{transform:scale(1);opacity:1}}

      #sila-input-row{display:flex;gap:.5rem;padding:.65rem .75rem;border-top:1px solid #f0ebff;flex-shrink:0;}
      #sila-inp{flex:1;border:1.5px solid #e5e7eb;border-radius:.7rem;padding:.5rem .8rem;
        font-size:.875rem;font-family:'Sarabun',sans-serif;outline:none;resize:none;
        max-height:80px;transition:border-color .2s;line-height:1.4;}
      #sila-inp:focus{border-color:#a78bfa;}
      #sila-send{width:36px;height:36px;background:#7c3aed;border:none;border-radius:.7rem;
        cursor:pointer;display:flex;align-items:center;justify-content:center;
        flex-shrink:0;transition:opacity .2s;align-self:flex-end;}
      #sila-send:hover{opacity:.85;}
      #sila-send:disabled{opacity:.35;cursor:not-allowed;}
      #sila-send svg{width:15px;height:15px;fill:white;}

      @media(max-width:480px){
        #sila-panel{width:calc(100vw - 2rem);right:1rem;max-height:70vh;}
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

    // Panel
    const panel = document.createElement('div');
    panel.id = 'sila-panel';
    panel.innerHTML = `
      <div class="s-head">
        <div class="s-avatar">🔮</div>
        <div class="s-info">
          <div class="s-name">ศิลา · Crystal Guide</div>
          <div class="s-status"><span class="s-dot"></span>ผู้เชี่ยวชาญหินคริสตัล</div>
        </div>
        <div class="s-head-btns">
          <button class="s-hbtn" id="sila-clear-btn" title="ล้างแชท">🗑</button>
          <button class="s-hbtn" id="sila-min-btn" title="ย่อ">&#8722;</button>
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

    // ใช้ addEventListener แทน onclick inline
    panel.querySelector('#sila-min-btn').addEventListener('click', () => {
      panelOpen = false;
      panel.classList.remove('open');
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
      inp.style.height = Math.min(inp.scrollHeight, 80) + 'px';
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); silaSend(); }
    });
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById('sila-panel');
    panel.classList.toggle('open', panelOpen);
    document.getElementById('sila-notif').classList.remove('show');

    if (panelOpen) {
      const msgs = document.getElementById('sila-msgs');
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(() => document.getElementById('sila-inp')?.focus(), 150);
    }
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

    // Restore previous messages
    if (messages.length > 0) {
      messages.forEach(m => addBubble(m.role === 'user' ? 'usr' : 'bot', m.content));
    }

    // Page greeting — ทักทายทุกหน้า เหมือนเพื่อนเดินด้วยกัน
    const greeting = getPageGreeting();
    const greetEl = addBubble('page-greet', greeting);
    // เก็บ greeting ไว้ใน messages ด้วยเพื่อให้ AI มี context
    messages.push({ role: 'sila', content: greeting });
    saveHistory();

    // Notif dot หลัง 20s ถ้าไม่ได้เปิด
    setTimeout(() => {
      if (!panelOpen) document.getElementById('sila-notif')?.classList.add('show');
    }, 20000);

    let scrollDone = false;
    window.addEventListener('scroll', () => {
      if (scrollDone || panelOpen) return;
      const ratio = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
      if (ratio > 0.35) { scrollDone = true; document.getElementById('sila-notif')?.classList.add('show'); }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
