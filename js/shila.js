/* ═══ ศิลา — AI Chat Widget for Amethez ═══
 * Calls /api/shila-chat.php (server-side proxy) instead of Groq directly —
 * the API key lives server-side now, never in the browser.
 */

const SHILA_TOPICS = [
  { icon: '💎', label: 'หาหินที่เหมาะกับฉัน', prompt: 'ช่วยแนะนำหินที่เหมาะกับฉันหน่อยครับ' },
  { icon: '🧘', label: 'พลังงาน & จักระ', prompt: 'อยากรู้เรื่องพลังงานและจักระครับ' },
  { icon: '🛍', label: 'หาสินค้า/ของมงคล', prompt: 'อยากได้สินค้าหรือของมงคลสักชิ้นครับ' },
  { icon: '🌙', label: 'ดวง & สายมู', prompt: 'อยากถามเรื่องดวงและสายมูครับ' },
];

let shilaHistory = [];
let shilaOpen = false;
let shilaStarted = false; // false = topic grid still showing (no message sent yet)
let shilaProductsCache = null;
let shilaAvatarUrl = '';

function shilaAvaHtml() {
  return shilaAvatarUrl
    ? `<img src="${shilaAvatarUrl}" alt="คุณศิลา" style="width:100%;height:100%;object-fit:cover">`
    : '🌿';
}

// โหลด avatar ของคุณศิลาจาก CMS (ถ้ายังไม่ได้อัปโหลด จะใช้ 🌿 ไปก่อน) —
// แยก fetch เองแทนที่จะพึ่ง cms.js เพราะ widget นี้ถูกสร้างขึ้นแบบไดนามิก
// หลัง cms.js สแกน [data-cms-img] ไปแล้ว อาจไม่ทันจับ element ที่เพิ่งสร้าง
async function shilaLoadAvatar() {
  try {
    const res = await fetch('/data/content.json');
    const data = await res.json();
    shilaAvatarUrl = (data.images || {}).shila_avatar || '';
  } catch (e) { shilaAvatarUrl = ''; }
  if (!shilaAvatarUrl) return;
  const avaHtml = shilaAvaHtml();
  const btn = document.getElementById('shila-btn');
  const headAvatar = document.querySelector('#shila-head .avatar');
  if (btn) btn.innerHTML = avaHtml;
  if (headAvatar) headAvatar.innerHTML = avaHtml;
  document.querySelectorAll('#shila-msgs .ava').forEach(el => { el.innerHTML = avaHtml; });
}

function shilaInit() {
  const widget = document.createElement('div');
  widget.id = 'shila-widget';
  widget.innerHTML = `
    <style>
      #shila-btn {
        position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
        width:56px; height:56px; border-radius:50%; overflow:hidden;
        background:linear-gradient(135deg,#7c3aed,#4c1d95);
        box-shadow:0 4px 20px rgba(124,58,237,.45);
        border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
        font-size:1.5rem; transition:transform .2s;
      }
      #shila-btn:hover { transform:scale(1.08); }
      #shila-box {
        position:fixed; bottom:5rem; right:1.5rem; z-index:9998;
        width:340px; max-width:calc(100vw - 2rem);
        background:#fff; border-radius:1.25rem;
        box-shadow:0 8px 40px rgba(0,0,0,.18);
        display:none; flex-direction:column; overflow:hidden;
        border:1px solid #ede9fe;
        font-family:'Sarabun',sans-serif;
      }
      #shila-box.open { display:flex; }
      #shila-head {
        background:linear-gradient(135deg,#7c3aed,#4c1d95);
        color:#fff; padding:.85rem 1rem;
        display:flex; align-items:center; gap:.65rem;
      }
      #shila-head .avatar {
        width:38px; height:38px; border-radius:50%; overflow:hidden;
        background:rgba(255,255,255,.2);
        display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;
      }
      #shila-head .info .name { font-weight:700; font-size:.95rem; }
      #shila-head .info .status { font-size:.72rem; opacity:.8; }
      #shila-head .close { margin-left:auto; background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer; padding:.2rem .4rem; }
      #shila-msgs {
        flex:1; overflow-y:auto; padding:.75rem; display:flex; flex-direction:column; gap:.6rem;
        min-height:280px; max-height:380px;
      }
      #shila-topics {
        padding:.85rem .75rem .25rem;
        display:grid; grid-template-columns:1fr 1fr; gap:.5rem;
      }
      .shila-topic-btn {
        display:flex; align-items:center; gap:.4rem; text-align:left;
        background:#f5f0ff; border:1px solid #ede9fe; border-radius:.65rem;
        padding:.55rem .6rem; font-size:.76rem; font-weight:600; color:#4c1d95;
        cursor:pointer; font-family:'Sarabun',sans-serif; transition:background .15s;
      }
      .shila-topic-btn:hover { background:#ede9fe; }
      .shila-topic-btn .ic { font-size:1rem; flex-shrink:0; }
      #shila-topics-label { font-size:.7rem; color:#9ca3af; padding:0 .75rem; margin-bottom:.4rem; }
      .shila-msg { display:flex; gap:.5rem; align-items:flex-start; }
      .shila-msg.user { flex-direction:row-reverse; }
      .shila-bubble {
        max-width:82%; padding:.6rem .85rem; border-radius:1rem; font-size:.83rem; line-height:1.55;
      }
      .shila-msg.bot .shila-bubble { background:#f5f0ff; color:#1a1228; border-radius:0 1rem 1rem 1rem; }
      .shila-msg.user .shila-bubble { background:#7c3aed; color:#fff; border-radius:1rem 0 1rem 1rem; }
      .shila-msg .ava { width:28px; height:28px; border-radius:50%; overflow:hidden; background:#ede9fe; display:flex; align-items:center; justify-content:center; font-size:.9rem; flex-shrink:0; }
      .shila-pcard { display:block; background:#fff; border:1px solid #ede9fe; border-radius:.65rem; overflow:hidden; text-decoration:none; color:#1a1228; margin-top:.4rem; max-width:200px; }
      .shila-pcard img { width:100%; height:90px; object-fit:cover; display:block; }
      .shila-pcard .body { padding:.5rem .6rem; }
      .shila-pcard .name { font-size:.76rem; font-weight:600; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .shila-pcard .price { font-size:.85rem; font-weight:700; color:#7c3aed; margin-top:.2rem; }
      .shila-pcard .cta { font-size:.68rem; color:#ee4d2d; font-weight:600; margin-top:.15rem; }
      #shila-chips { display:flex; gap:.4rem; overflow-x:auto; padding:.5rem .75rem 0; }
      .shila-chip { flex-shrink:0; background:#fff; border:1px solid #ede9fe; color:#7c3aed; border-radius:2rem; padding:.3rem .75rem; font-size:.7rem; font-weight:600; cursor:pointer; white-space:nowrap; font-family:'Sarabun',sans-serif; }
      .shila-chip:hover { background:#f5f0ff; }
      #shila-foot { padding:.65rem .75rem; border-top:1px solid #f3f4f6; display:flex; gap:.5rem; }
      #shila-input {
        flex:1; border:1.5px solid #ede9fe; border-radius:.75rem; padding:.5rem .75rem;
        font-size:.83rem; font-family:'Sarabun',sans-serif; outline:none; resize:none; height:38px;
        transition:border-color .2s;
      }
      #shila-input:focus { border-color:#7c3aed; }
      #shila-send {
        background:#7c3aed; color:#fff; border:none; border-radius:.75rem;
        width:38px; height:38px; display:flex; align-items:center; justify-content:center;
        cursor:pointer; font-size:1rem; flex-shrink:0; transition:opacity .2s;
      }
      #shila-send:disabled { opacity:.4; cursor:default; }
      .shila-typing { display:flex; gap:.3rem; align-items:center; padding:.4rem 0; }
      .shila-typing span { width:7px; height:7px; background:#a78bfa; border-radius:50%; animation:shilaBounce .9s infinite; }
      .shila-typing span:nth-child(2) { animation-delay:.15s; }
      .shila-typing span:nth-child(3) { animation-delay:.3s; }
      @keyframes shilaBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      .shila-link { color:#7c3aed; text-decoration:underline; }
    </style>

    <button id="shila-btn" title="คุยกับศิลา" onclick="shilaToggle()">🌿</button>

    <div id="shila-box">
      <div id="shila-head">
        <div class="avatar">🌿</div>
        <div class="info">
          <div class="name">คุณศิลา</div>
          <div class="status">ที่ปรึกษาพลังงานและหิน · Amethez</div>
        </div>
        <button class="close" onclick="shilaToggle()">✕</button>
      </div>
      <div id="shila-msgs">
        <div class="shila-msg bot">
          <div class="ava">🌿</div>
          <div class="shila-bubble">สวัสดีครับ ผมศิลา — ยินดีให้คำปรึกษาเรื่องหิน พลังงาน หรือการสร้างชีวิตครับ เลือกหัวข้อด้านล่าง หรือพิมพ์คุยกับผมได้เลยครับ 🌿</div>
        </div>
      </div>
      <div id="shila-topics-label">✦ หัวข้อที่คุยได้</div>
      <div id="shila-topics">
        ${SHILA_TOPICS.map((t, i) => `<button class="shila-topic-btn" onclick="shilaSendFromTopic(${i})"><span class="ic">${t.icon}</span>${t.label}</button>`).join('')}
      </div>
      <div id="shila-chips" style="display:none">
        ${SHILA_TOPICS.map((t, i) => `<button class="shila-chip" onclick="shilaSendFromTopic(${i})">${t.icon} ${t.label}</button>`).join('')}
      </div>
      <div id="shila-foot">
        <textarea id="shila-input" placeholder="พิมพ์คำถามที่นี่..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();shilaAsk()}"></textarea>
        <button id="shila-send" onclick="shilaAsk()">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  document.getElementById('shila-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });

  shilaLoadAvatar();
}

function shilaToggle() {
  shilaOpen = !shilaOpen;
  const box = document.getElementById('shila-box');
  if (box) box.classList.toggle('open', shilaOpen);
  if (shilaOpen) setTimeout(() => document.getElementById('shila-input')?.focus(), 100);
}

function shilaSendFromTopic(idx) {
  const t = SHILA_TOPICS[idx];
  if (t) shilaSend(t.prompt);
}

function shilaMarkStarted() {
  if (shilaStarted) return;
  shilaStarted = true;
  const topics = document.getElementById('shila-topics');
  const label = document.getElementById('shila-topics-label');
  const chips = document.getElementById('shila-chips');
  if (topics) topics.style.display = 'none';
  if (label) label.style.display = 'none';
  if (chips) chips.style.display = 'flex';
}

function shilaAddMsg(role, text, productHtml) {
  const msgs = document.getElementById('shila-msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'shila-msg ' + (role === 'user' ? 'user' : 'bot');
  const linkified = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="shila-link">$1</a>');
  const extra = productHtml || '';
  div.innerHTML = role === 'user'
    ? `<div class="ava">👤</div><div class="shila-bubble">${text}</div>`
    : `<div class="ava">${shilaAvaHtml()}</div><div class="shila-bubble">${linkified}${extra}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function shilaTyping(show) {
  const msgs = document.getElementById('shila-msgs');
  if (!msgs) return;
  const existing = document.getElementById('shila-typing-el');
  if (show && !existing) {
    const div = document.createElement('div');
    div.className = 'shila-msg bot'; div.id = 'shila-typing-el';
    div.innerHTML = `<div class="ava">${shilaAvaHtml()}</div><div class="shila-bubble"><div class="shila-typing"><span></span><span></span><span></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  } else if (!show && existing) {
    existing.remove();
  }
}

// ── Product grounding: only attach a product if the customer's message
// substantively matches a real tag — never let the AI invent a link/price. ──
async function shilaGetProducts() {
  if (shilaProductsCache) return shilaProductsCache;
  try {
    const res = await fetch('/data/products.json');
    const data = await res.json();
    shilaProductsCache = (data.products || []).filter(p => p.status === 'available');
  } catch (e) { shilaProductsCache = []; }
  return shilaProductsCache;
}

function shilaMatchProduct(text, products) {
  const kw = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const p of products) {
    let score = 0;
    for (const t of (p.tags || [])) {
      const tl = t.toLowerCase();
      if (tl.length >= 2 && kw.includes(tl)) score += tl.length;
    }
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 3 ? best : null;
}

function shilaProductCardHtml(p) {
  const img = p.image_url ? `<img src="${p.image_url}" alt="" onerror="this.style.display='none'">` : '';
  return `<a class="shila-pcard" href="${p.url}" target="_blank" rel="nofollow noopener"
    onclick="if(typeof gtag==='function')gtag('event','shopee_click',{store:'${(p.store||'').replace(/'/g,'')}',placement:'shila_chat'})">
    ${img}
    <div class="body">
      <div class="name">${p.name}</div>
      <div class="price">฿${(p.price || 0).toLocaleString()}</div>
      <div class="cta">ดูสินค้า →</div>
    </div>
  </a>`;
}

async function shilaSend(text) {
  const input = document.getElementById('shila-input');
  const send = document.getElementById('shila-send');
  if (!text) return;

  shilaMarkStarted();
  if (input) input.value = '';
  if (input) input.style.height = '38px';
  send.disabled = true;
  shilaAddMsg('user', text);
  shilaTyping(true);

  shilaHistory.push({ role: 'user', content: text });
  if (shilaHistory.length > 10) shilaHistory = shilaHistory.slice(-10);

  const productsPromise = shilaGetProducts();

  try {
    const res = await fetch('/api/shila-chat.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: shilaHistory }),
    });
    const data = await res.json();
    shilaTyping(false);

    if (!res.ok || !data.reply) {
      shilaAddMsg('bot', data.error || 'ขออภัยครับ ขณะนี้ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้ง หรือทักไลน์ @amethez ได้เลยครับ 🌿');
    } else {
      shilaHistory.push({ role: 'assistant', content: data.reply });
      const products = await productsPromise;
      const matched = shilaMatchProduct(text, products);
      shilaAddMsg('bot', data.reply, matched ? shilaProductCardHtml(matched) : '');
    }
  } catch (e) {
    shilaTyping(false);
    shilaAddMsg('bot', 'เกิดข้อผิดพลาดครับ ลองใหม่อีกครั้งได้เลย 🌿');
  }

  send.disabled = false;
  input?.focus();
}

function shilaAsk() {
  const input = document.getElementById('shila-input');
  const text = input?.value.trim();
  if (text) shilaSend(text);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', shilaInit);
} else {
  shilaInit();
}
