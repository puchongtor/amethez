/* ═══ ศิลา — AI Chat Widget for Amethez ═══ */

const SHILA_SYSTEM_PROMPT = `คุณคือ "คุณศิลา" จิตวิญญาณแห่งปัญญาญาณและสติจากแบรนด์ Amethez

## บุคลิก
- นิ่ง สงบ ทรงพลัง สัตย์จริง
- พูดจาสุภาพแต่คมคาย ตบเรียกสติได้ดี (High-Vibe)
- ใช้ภาษาไทยเสมอ ไม่เป็นทางการเกินไป รู้สึกเหมือนคุยกับพี่ที่ฉลาดและอบอุ่น
- ตอบกระชับ ไม่เยิ่นเย้อ แต่ลึกและมีน้ำหนัก

## ขอบเขตความรู้
- หินคริสตัล แร่ธรรมชาติ พลังงาน จักระ
- กฎแห่งการดึงดูด ความตั้งใจ (Intention Setting)
- การสร้างชีวิต ธุรกิจออนไลน์ Passive Income
- สัจธรรมชีวิต การเติบโต mindset

## กติกาตอบสำคัญ

### ประเภท 1 — คำถามเรื่องหิน / พลังงาน / ความสับสนชีวิต / ความร่ำรวยด้านพลังงาน
ขั้นตอน:
1. ให้ความรู้เรื่องหินหรือพลังงานอย่างถูกต้อง ไม่งมงาย
2. ปลุกสติให้ลงมือทำ
3. ตบท้ายแนะนำโมลดาไวต์หรือหินที่เหมาะสมจากคลังของ Amethez อย่างเนียน เช่น:
   "หากอยากปรับคลื่นความถี่ในพื้นที่ทำงาน ลองแวะไปส่องเนื้อแท้ของโมลดาไวต์ในสารานุกรมของเราได้ครับ → https://amethez.com/cosmos/moldavite.html"

### ประเภท 2 — คำถามเรื่องอยากรวย / หาเงินออนไลน์ / ทำเว็บ / หนี้สิน / Passive Income
ขั้นตอน:
1. บอกสัจธรรม: ความฝันใหญ่ เขาวงกตก็ใหญ่ตาม ความล้มเหลวคือข้อมูล
2. ชี้ให้เห็นว่า "ท่อน้ำเงิน 24 ชม." ต้องสร้างจากระบบ ไม่ใช่ความหวัง
3. แนะนำการสร้างเว็บตัวตนแบบ Amethez พร้อมลิงก์โฮสติ้งอย่างเนียน เช่น:
   "ถ้าอยากเริ่มสร้างเว็บตัวตนในราคาหลักร้อย ศิลาคัดโฮสติ้งความเร็วสูงไว้ให้ตรงนี้ครับ → https://hostneverdie.com (Referral: amethez)"

## สิ่งที่ห้ามทำ
- ห้ามขายตรงหรือกดดันให้ซื้อ (No Hard Sale)
- ห้ามบอกว่า "หินนี้จะทำให้รวย" — ให้พูดว่าหินช่วยปรับพลังงาน/สภาพแวดล้อม
- ห้ามตอบเรื่องที่ไม่เกี่ยวกับขอบเขตข้างต้น เช่น การเมือง สุขภาพทางการแพทย์

## รูปแบบการตอบ
- ความยาว: 3-5 ประโยคต่อย่อหน้า ไม่เกิน 3 ย่อหน้า
- ลงท้ายด้วย "ศิลา 🌿" เสมอ`;

const SHILA_STORE_KEY = 'shila_chat_history';
const SHILA_MAX_HISTORY = 10; // จำบทสนทนาล่าสุดกี่ข้อความ

let shilaHistory = [];
let shilaOpen = false;

function shilaInit() {
  // ดึง Groq key จาก localStorage (ใช้ร่วมกับ Admin)
  const groqKey = localStorage.getItem('amethez_groq_key') || localStorage.getItem('amethez_gemini_key');

  const widget = document.createElement('div');
  widget.id = 'shila-widget';
  widget.innerHTML = `
    <style>
      #shila-btn {
        position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
        width:56px; height:56px; border-radius:50%;
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
        width:38px; height:38px; border-radius:50%;
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
      .shila-msg { display:flex; gap:.5rem; align-items:flex-start; }
      .shila-msg.user { flex-direction:row-reverse; }
      .shila-bubble {
        max-width:82%; padding:.6rem .85rem; border-radius:1rem; font-size:.83rem; line-height:1.55;
      }
      .shila-msg.bot .shila-bubble { background:#f5f0ff; color:#1a1228; border-radius:0 1rem 1rem 1rem; }
      .shila-msg.user .shila-bubble { background:#7c3aed; color:#fff; border-radius:1rem 0 1rem 1rem; }
      .shila-msg .ava { width:28px; height:28px; border-radius:50%; background:#ede9fe; display:flex; align-items:center; justify-content:center; font-size:.9rem; flex-shrink:0; }
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
      #shila-no-key { padding:1rem; font-size:.8rem; color:#6b7280; text-align:center; line-height:1.6; }
    </style>

    <button id="shila-btn" title="คุยกับศิลา">🌿</button>

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
          <div class="shila-bubble">สวัสดีครับ ผมศิลา — ยินดีให้คำปรึกษาเรื่องหิน พลังงาน หรือการสร้างชีวิตครับ มีอะไรอยู่ในใจไหม? 🌿</div>
        </div>
      </div>
      <div id="shila-foot">
        <textarea id="shila-input" placeholder="พิมพ์คำถามที่นี่..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();shilaAsk()}"></textarea>
        <button id="shila-send" onclick="shilaAsk()">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // auto-resize textarea
  document.getElementById('shila-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });
}

function shilaToggle() {
  shilaOpen = !shilaOpen;
  const box = document.getElementById('shila-box');
  if (box) box.classList.toggle('open', shilaOpen);
  if (shilaOpen) setTimeout(() => document.getElementById('shila-input')?.focus(), 100);
}

function shilaAddMsg(role, text) {
  const msgs = document.getElementById('shila-msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'shila-msg ' + (role === 'user' ? 'user' : 'bot');
  const linkified = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="shila-link">$1</a>');
  div.innerHTML = role === 'user'
    ? `<div class="ava">👤</div><div class="shila-bubble">${text}</div>`
    : `<div class="ava">🌿</div><div class="shila-bubble">${linkified}</div>`;
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
    div.innerHTML = `<div class="ava">🌿</div><div class="shila-bubble"><div class="shila-typing"><span></span><span></span><span></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  } else if (!show && existing) {
    existing.remove();
  }
}

async function shilaAsk() {
  const input = document.getElementById('shila-input');
  const send = document.getElementById('shila-send');
  const text = input?.value.trim();
  if (!text) return;

  const groqKey = localStorage.getItem('amethez_groq_key') || localStorage.getItem('amethez_gemini_key');
  if (!groqKey) {
    shilaAddMsg('bot', 'ขณะนี้ระบบยังไม่พร้อมใช้งานครับ กรุณาติดต่อผ่าน LINE @amethez แทนได้เลย 🌿');
    return;
  }

  input.value = '';
  input.style.height = '38px';
  send.disabled = true;
  shilaAddMsg('user', text);
  shilaTyping(true);

  // เก็บ history
  shilaHistory.push({ role: 'user', content: text });
  if (shilaHistory.length > SHILA_MAX_HISTORY) shilaHistory = shilaHistory.slice(-SHILA_MAX_HISTORY);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SHILA_SYSTEM_PROMPT },
          ...shilaHistory
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || 'ขออภัยครับ ขณะนี้ระบบขัดข้องชั่วคราว 🌿';
    shilaTyping(false);
    shilaHistory.push({ role: 'assistant', content: reply });
    shilaAddMsg('bot', reply);
  } catch (e) {
    shilaTyping(false);
    shilaAddMsg('bot', 'เกิดข้อผิดพลาดครับ ลองใหม่อีกครั้งได้เลย 🌿');
  }

  send.disabled = false;
  input.focus();
}

// เริ่มต้นเมื่อ DOM พร้อม
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', shilaInit);
} else {
  shilaInit();
}
