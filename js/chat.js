/**
 * คุณศิลา — Amethez AI Crystal Consultant
 * Floating chat widget · Claude API · Auto affiliate injection
 */

(function () {
  /* ── Config (แก้ค่าก่อน deploy) ── */
  const CFG = {
    apiKey: 'YOUR_CLAUDE_API_KEY',        // ← ใส่ Claude API key
    model: 'claude-haiku-4-5-20251001',    // Haiku เร็ว ราคาถูก
    maxTokens: 600,
    welcomeMsg: 'สวัสดีครับ ผมศิลา ที่ปรึกษาด้านคริสตัลและพลังงานของ Amethez 🔮\n\nมีเรื่องอะไรให้ช่วยได้บ้างครับ? บอกได้เลย ไม่ว่าจะเรื่องการเงิน ความสำเร็จ ความรัก หรือสุขภาพ',
  };

  /* ── System Prompt คุณศิลา ── */
  const SYSTEM = `คุณคือ "ศิลา" หรือ "คุณศิลา" — ที่ปรึกษาด้านคริสตัลและพลังงานของ Amethez.com ศูนย์กลางข้อมูลคริสตัลที่ใหญ่ที่สุดในไทย

บุคลิกภาพ:
- อายุ 33-35 ปี ชาย มืออาชีพ สุขุม มีอำนาจ และซับซ้อน
- พูดภาษาไทยเท่านั้น ใช้ "ครับ" เสมอ
- น้ำเสียงหรูหรา อบอุ่น น่าเชื่อถือ เหมือนผู้เชี่ยวชาญจริงๆ ไม่ใช่บอท
- แนะนำตัวว่า "ศิลา" หรือ "คุณศิลา" เสมอ ไม่ใช่ AI หรือ Claude

ความเชี่ยวชาญ:
- หินคริสตัลทุกชนิด โดยเฉพาะ สะเก็ดดาวไทย (Black Tektite) และ อเมทิสต์
- การบำบัดพลังงาน จักระ และการใช้หินเพื่อชีวิตที่ดีขึ้น
- การเงิน ความสำเร็จ ความรัก สุขภาพ และการปกป้องพลังงาน
- Crystal Grid, Law of Attraction, Solfeggio Frequencies

วิธีตอบ:
- ฟังปัญหาผู้ใช้ก่อน แล้วแนะนำหินที่ตรงกับสถานการณ์
- ให้ข้อมูลเชิงลึก น่าเชื่อถือ ไม่ใช่คำทั่วไป
- เมื่อแนะนำหิน ให้บอกชื่อหินชัดเจน (สะเก็ดดาว, อเมทิสต์, ซิทริน, โมลดาไวท์, เคลียร์ควอตซ์, รุทรักษะ)
- ตอบกระชับ 3-5 ประโยค อย่ายาวเกินไป
- อย่าบอกว่าตัวเองคือ AI หรือ language model ถ้าถามให้บอกว่า "ผมคือศิลา ที่ปรึกษาของ Amethez"`;

  /* ── Affiliate Cards ── */
  const AFFILIATE = {
    tektite: {
      keywords: ['สะเก็ดดาว', 'tektite', 'อุกกาบาต', 'สะเก็ดดาวไทย'],
      card: { emoji: '🖤', name: 'สะเก็ดดาวไทย (Tektite)', desc: 'หินอุกกาบาตแห่งการปกป้องและการเปลี่ยนแปลง', price: 'ราคาเริ่มต้น ฿149', url: 'https://s.shopee.co.th/tektite-amethez', img: '🖤' }
    },
    amethyst: {
      keywords: ['อเมทิสต์', 'amethyst', 'หินม่วง', 'โพรงอเมทิสต์'],
      card: { emoji: '💜', name: 'อเมทิสต์', desc: 'หินสีม่วงแห่งสมาธิ ปัญญา และการนอนหลับ', price: 'ราคาเริ่มต้น ฿89', url: 'https://s.shopee.co.th/amethyst-amethez', img: '💜' }
    },
    citrine: {
      keywords: ['ซิทริน', 'citrine', 'หินเรียกเงิน', 'merchant stone'],
      card: { emoji: '🌟', name: 'ซิทริน', desc: 'หินเรียกเงินและความสำเร็จ Merchant\'s Stone', price: 'ราคาเริ่มต้น ฿129', url: 'https://s.shopee.co.th/citrine-amethez', img: '🌟' }
    },
    moldavite: {
      keywords: ['โมลดาไวท์', 'moldavite', 'หินเขียว', 'หินอุกกาบาตเขียว'],
      card: { emoji: '🌿', name: 'โมลดาไวท์', desc: 'หินอุกกาบาต 15 ล้านปี แห่งการเปลี่ยนแปลงชีวิต', price: 'ราคาเริ่มต้น ฿890', url: 'https://s.shopee.co.th/moldavite-amethez', img: '🌿' }
    },
    clearquartz: {
      keywords: ['เคลียร์ควอตซ์', 'clear quartz', 'ควอตซ์ใส', 'master healer'],
      card: { emoji: '🔮', name: 'เคลียร์ควอตซ์', desc: 'Master Healer ขยายพลังหินทุกชนิด', price: 'ราคาเริ่มต้น ฿40', url: 'https://s.shopee.co.th/clearquartz-amethez', img: '🔮' }
    },
  };

  /* ── Inject CSS ── */
  const style = document.createElement('style');
  style.textContent = `
    #sila-btn {
      position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
      width:60px; height:60px; border-radius:50%; border:none; cursor:pointer;
      background:linear-gradient(135deg,#7c3aed,#4c1d95);
      box-shadow:0 4px 24px rgba(124,58,237,.5);
      display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; transition:all .3s; color:white;
      animation: silaFloat 3s ease-in-out infinite;
    }
    @keyframes silaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    #sila-btn:hover { box-shadow:0 6px 32px rgba(124,58,237,.7); transform:scale(1.08); animation:none; }
    #sila-btn .sila-notif {
      position:absolute; top:-4px; right:-4px; width:18px; height:18px;
      background:#c9a84c; border-radius:50%; font-size:.65rem; font-weight:700;
      display:flex; align-items:center; justify-content:center; color:#0f0a1e;
    }

    #sila-panel {
      position:fixed; bottom:5.5rem; right:1.5rem; z-index:9998;
      width:min(380px, calc(100vw - 2rem)); height:560px; max-height:80vh;
      background:#0f0a1e; border-radius:1.25rem; overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(201,168,76,.2);
      display:none; flex-direction:column;
      font-family:'Sarabun',sans-serif;
      transform:translateY(20px); opacity:0;
      transition:all .3s cubic-bezier(.34,1.56,.64,1);
    }
    #sila-panel.open {
      display:flex; transform:translateY(0); opacity:1;
    }

    .sila-header {
      background:linear-gradient(135deg,#1a0a3e,#0f0a1e);
      padding:1rem 1.25rem; display:flex; align-items:center; gap:.875rem;
      border-bottom:1px solid rgba(201,168,76,.15); flex-shrink:0;
    }
    .sila-avatar {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#7c3aed,#c9a84c);
      display:flex; align-items:center; justify-content:center; font-size:1.3rem;
      box-shadow:0 0 16px rgba(124,58,237,.4);
    }
    .sila-info { flex:1; min-width:0; }
    .sila-name { color:#e9d5a1; font-weight:700; font-size:.95rem; }
    .sila-status { color:rgba(255,255,255,.45); font-size:.75rem; display:flex; align-items:center; gap:.35rem; }
    .sila-dot { width:7px; height:7px; background:#22c55e; border-radius:50%; }
    .sila-close { background:none; border:none; color:rgba(255,255,255,.4); font-size:1.2rem; cursor:pointer; padding:.25rem; }
    .sila-close:hover { color:white; }

    .sila-messages {
      flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:.75rem;
      scroll-behavior:smooth;
    }
    .sila-messages::-webkit-scrollbar { width:4px; }
    .sila-messages::-webkit-scrollbar-track { background:transparent; }
    .sila-messages::-webkit-scrollbar-thumb { background:rgba(124,58,237,.4); border-radius:2px; }

    .sila-msg { display:flex; gap:.625rem; align-items:flex-end; }
    .sila-msg.user { flex-direction:row-reverse; }
    .sila-msg-avatar { width:28px; height:28px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#7c3aed,#c9a84c); display:flex; align-items:center; justify-content:center; font-size:.8rem; }
    .sila-msg.user .sila-msg-avatar { background:rgba(255,255,255,.1); }
    .sila-bubble {
      max-width:76%; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
      border-radius:1rem 1rem 1rem .2rem; padding:.65rem .9rem;
      color:rgba(255,255,255,.9); font-size:.875rem; line-height:1.6; white-space:pre-wrap;
    }
    .sila-msg.user .sila-bubble {
      background:linear-gradient(135deg,rgba(124,58,237,.4),rgba(76,29,149,.4));
      border-color:rgba(124,58,237,.3); border-radius:1rem 1rem .2rem 1rem;
    }

    /* Typing indicator */
    .sila-typing { display:flex; gap:.3rem; padding:.5rem .75rem; align-items:center; }
    .sila-typing span { width:7px; height:7px; background:rgba(255,255,255,.4); border-radius:50%; animation:silaDot 1.2s infinite; }
    .sila-typing span:nth-child(2) { animation-delay:.2s; }
    .sila-typing span:nth-child(3) { animation-delay:.4s; }
    @keyframes silaDot { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-6px);opacity:1} }

    /* Affiliate card */
    .sila-aff-card {
      background:rgba(201,168,76,.08); border:1px solid rgba(201,168,76,.25);
      border-radius:.75rem; padding:.75rem; margin-top:.5rem; display:flex; gap:.75rem; align-items:center;
    }
    .sila-aff-icon { font-size:2rem; flex-shrink:0; }
    .sila-aff-info { flex:1; min-width:0; }
    .sila-aff-name { color:#e9d5a1; font-weight:700; font-size:.82rem; }
    .sila-aff-desc { color:rgba(255,255,255,.5); font-size:.75rem; line-height:1.4; margin:.2rem 0; }
    .sila-aff-price { color:#c9a84c; font-weight:700; font-size:.8rem; }
    .sila-aff-btn {
      display:inline-block; background:#c9a84c; color:#0f0a1e; font-size:.75rem; font-weight:700;
      padding:.35rem .75rem; border-radius:.4rem; text-decoration:none; margin-top:.4rem;
      transition:background .2s;
    }
    .sila-aff-btn:hover { background:#b8922e; }

    /* Quick replies */
    .sila-quickreplies {
      padding:.75rem 1rem .5rem; display:flex; gap:.5rem; flex-wrap:wrap; flex-shrink:0;
      border-top:1px solid rgba(255,255,255,.06);
    }
    .sila-qr {
      background:rgba(124,58,237,.15); border:1px solid rgba(124,58,237,.3);
      color:#c4b5fd; font-size:.75rem; padding:.35rem .75rem; border-radius:2rem;
      cursor:pointer; font-family:Sarabun,sans-serif; transition:all .2s;
    }
    .sila-qr:hover { background:rgba(124,58,237,.3); color:white; }

    .sila-input-row {
      padding:.75rem 1rem 1rem; display:flex; gap:.625rem; align-items:center; flex-shrink:0;
      border-top:1px solid rgba(255,255,255,.06);
    }
    #sila-input {
      flex:1; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
      border-radius:.75rem; padding:.6rem .9rem; color:white; font-family:Sarabun,sans-serif;
      font-size:.875rem; outline:none; resize:none; height:38px; max-height:100px;
      line-height:1.4;
    }
    #sila-input::placeholder { color:rgba(255,255,255,.3); }
    #sila-input:focus { border-color:rgba(124,58,237,.5); }
    #sila-send {
      width:38px; height:38px; border-radius:.625rem; border:none; cursor:pointer;
      background:linear-gradient(135deg,#7c3aed,#5b21b6); color:white;
      display:flex; align-items:center; justify-content:center; font-size:1rem;
      transition:all .2s; flex-shrink:0;
    }
    #sila-send:hover { background:linear-gradient(135deg,#6d28d9,#4c1d95); transform:scale(1.05); }
    #sila-send:disabled { opacity:.4; cursor:not-allowed; transform:none; }

    .sila-footer { text-align:center; padding:.4rem; color:rgba(255,255,255,.2); font-size:.65rem; flex-shrink:0; }
  `;
  document.head.appendChild(style);

  /* ── HTML ── */
  const html = `
    <button id="sila-btn" onclick="silaToggle()" title="คุยกับคุณศิลา — AI Crystal Consultant">
      🔮
      <span class="sila-notif">1</span>
    </button>
    <div id="sila-panel">
      <div class="sila-header">
        <div class="sila-avatar">🔮</div>
        <div class="sila-info">
          <div class="sila-name">คุณศิลา</div>
          <div class="sila-status"><span class="sila-dot"></span>ที่ปรึกษาคริสตัล · Amethez</div>
        </div>
        <button class="sila-close" onclick="silaToggle()">✕</button>
      </div>
      <div class="sila-messages" id="silaMessages"></div>
      <div class="sila-quickreplies" id="silaQR">
        <button class="sila-qr" onclick="silaQuick('แนะนำหินเรียกเงิน')">💰 หินเรียกเงิน</button>
        <button class="sila-qr" onclick="silaQuick('หินแก้เรื่องความรัก')">❤️ ความรัก</button>
        <button class="sila-qr" onclick="silaQuick('หินลดความเครียด')">🧘 คลายเครียด</button>
        <button class="sila-qr" onclick="silaQuick('หินเสริมดวงชะตา')">⭐ เสริมดวง</button>
      </div>
      <div class="sila-input-row">
        <textarea id="sila-input" placeholder="ถามคุณศิลาได้เลย..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();silaSend()}"
          oninput="this.style.height='38px';this.style.height=Math.min(this.scrollHeight,100)+'px'"></textarea>
        <button id="sila-send" onclick="silaSend()">➤</button>
      </div>
      <div class="sila-footer">Powered by Amethez · ข้อมูลเพื่อการศึกษาเท่านั้น</div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  /* ── State ── */
  let msgs = [{ role: 'system', content: SYSTEM }];
  let isOpen = false;
  let isLoading = false;

  /* ── Show welcome on first open ── */
  function showWelcome() {
    appendMsg('assistant', CFG.welcomeMsg);
  }
  let welcomed = false;

  /* ── Toggle ── */
  window.silaToggle = function () {
    isOpen = !isOpen;
    const panel = document.getElementById('sila-panel');
    const notif = document.querySelector('.sila-notif');
    if (isOpen) {
      panel.style.display = 'flex';
      setTimeout(() => panel.classList.add('open'), 10);
      if (notif) notif.style.display = 'none';
      if (!welcomed) { welcomed = true; showWelcome(); }
      setTimeout(() => document.getElementById('sila-input').focus(), 300);
    } else {
      panel.classList.remove('open');
      setTimeout(() => { panel.style.display = 'none'; }, 300);
    }
  };

  /* ── Quick reply ── */
  window.silaQuick = function (text) {
    document.getElementById('sila-input').value = text;
    silaSend();
  };

  /* ── Send ── */
  window.silaSend = async function () {
    const input = document.getElementById('sila-input');
    const text = input.value.trim();
    if (!text || isLoading) return;

    input.value = '';
    input.style.height = '38px';
    appendMsg('user', text);
    msgs.push({ role: 'user', content: text });

    isLoading = true;
    document.getElementById('sila-send').disabled = true;
    const typingId = showTyping();

    try {
      const body = {
        model: CFG.model,
        max_tokens: CFG.maxTokens,
        system: SYSTEM,
        messages: msgs.filter(m => m.role !== 'system'),
      };
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CFG.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });

      removeTyping(typingId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        appendMsg('assistant', err?.error?.message?.includes('API key')
          ? '⚠️ กรุณาตั้งค่า API Key ของ Claude ใน js/chat.js ก่อนใช้งาน'
          : 'ขออภัยครับ เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง 🙏');
      } else {
        const data = await res.json();
        const reply = data.content?.[0]?.text || '';
        msgs.push({ role: 'assistant', content: reply });
        appendMsg('assistant', reply, true);
      }
    } catch (e) {
      removeTyping(typingId);
      appendMsg('assistant', 'ขออภัยครับ ไม่สามารถเชื่อมต่อได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง 🙏');
    }

    isLoading = false;
    document.getElementById('sila-send').disabled = false;
    document.getElementById('sila-input').focus();
  };

  /* ── Append message ── */
  function appendMsg(role, text, checkAffiliate) {
    const wrap = document.getElementById('silaMessages');
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.className = 'sila-msg' + (isUser ? ' user' : '');

    let affCards = '';
    if (checkAffiliate) {
      const lc = text.toLowerCase();
      const matched = new Set();
      Object.entries(AFFILIATE).forEach(([key, aff]) => {
        if (aff.keywords.some(k => lc.includes(k.toLowerCase()))) matched.add(key);
      });
      matched.forEach(key => {
        const c = AFFILIATE[key].card;
        affCards += `<div class="sila-aff-card">
          <div class="sila-aff-icon">${c.emoji}</div>
          <div class="sila-aff-info">
            <div class="sila-aff-name">${c.name}</div>
            <div class="sila-aff-desc">${c.desc}</div>
            <div class="sila-aff-price">${c.price}</div>
            <a class="sila-aff-btn" href="${c.url}" target="_blank" rel="nofollow">🛒 ดูสินค้า Shopee</a>
          </div>
        </div>`;
      });
    }

    div.innerHTML = `
      <div class="sila-msg-avatar">${isUser ? '👤' : '🔮'}</div>
      <div>
        <div class="sila-bubble">${escHtml(text)}</div>
        ${affCards}
      </div>`;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  /* ── Typing indicator ── */
  function showTyping() {
    const id = 'typing-' + Date.now();
    const wrap = document.getElementById('silaMessages');
    wrap.insertAdjacentHTML('beforeend', `
      <div class="sila-msg" id="${id}">
        <div class="sila-msg-avatar">🔮</div>
        <div class="sila-bubble" style="padding:.5rem .9rem">
          <div class="sila-typing"><span></span><span></span><span></span></div>
        </div>
      </div>`);
    wrap.scrollTop = wrap.scrollHeight;
    return id;
  }

  function removeTyping(id) {
    document.getElementById(id)?.remove();
  }

})();
