/* ═══ Crystal Atlas Stone Identify ═══
 * Shared client for homepage hero + /identify/
 * Uses /api/identify.php — free-form Gemini vision (no silent color mock).
 */

const AtlasIdentify = (() => {
  const QUOTA_KEY = 'amethez_identify_quota_v1';
  const DAILY_LIMIT = 8;
  const REQUEST_QUEUE_KEY = 'amethez_identify_requests';
  const ALLOW_MOCK = (() => {
    try {
      return new URLSearchParams(location.search).get('mock') === '1'
        || localStorage.getItem('amethez_identify_allow_mock') === '1';
    } catch {
      return false;
    }
  })();

  const AVATARS = {
    hero: '/images/avatars/atlas/atlas-desk-encyclopedia.jpg',
    chat: '/images/avatars/atlas/atlas-smiling-camera.jpg',
    think: '/images/avatars/atlas/atlas-arms-crossed.jpg',
    read: '/images/avatars/atlas/atlas-desk-reading.jpg',
    library: '/images/avatars/atlas/atlas-library-desk.jpg',
    smileB: '/images/avatars/atlas/atlas-smiling-camera-b.jpg',
  };

  const ROCK_CLASS_TH = {
    mineral: 'แร่ธาตุ',
    gemstone: 'อัญมณี',
    rock: 'หิน',
    igneous: 'หินอัคนี',
    sedimentary: 'หินตะกอน',
    metamorphic: 'หินแปร',
    organic: 'ออร์แกนิก',
    fossil: 'ฟอสซิล',
    tektite: 'เทคไทต์',
    bucket: 'หินทั่วไป',
  };

  let catalog = null;
  let lastResult = null;
  let chatHistory = [];
  let selectedStone = null;
  let currentAvatar = AVATARS.chat;

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getQuota() {
    try {
      const raw = JSON.parse(localStorage.getItem(QUOTA_KEY) || '{}');
      if (raw.day !== todayKey()) return { day: todayKey(), count: 0 };
      return raw;
    } catch {
      return { day: todayKey(), count: 0 };
    }
  }

  function bumpQuota() {
    const q = getQuota();
    q.count += 1;
    q.day = todayKey();
    localStorage.setItem(QUOTA_KEY, JSON.stringify(q));
    return q;
  }

  function remainingQuota() {
    return Math.max(0, DAILY_LIMIT - getQuota().count);
  }

  async function loadCatalog() {
    if (catalog) return catalog;
    const res = await fetch('/data/identify-catalog.json');
    const data = await res.json();
    catalog = data.stones || [];
    return catalog;
  }

  function setAvatar(el, role) {
    currentAvatar = AVATARS[role] || AVATARS.chat;
    if (!el) return;
    el.src = currentAvatar;
    el.alt = 'Crystal Atlas';
  }

  function avatarHtml(role) {
    const src = AVATARS[role] || AVATARS.chat;
    return `<img class="atlas-ava" src="${src}" alt="Crystal Atlas" width="40" height="40" loading="lazy">`;
  }

  function compressImage(file, maxSide = 1600, quality = 0.88) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('อ่านรูปไม่สำเร็จ'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxSide / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function colorGuess(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const w = 24, h = 24;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        r /= n; g /= n; b /= n;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        let color = 'multi';
        if (sat < 0.12) {
          color = max < 70 ? 'black' : max > 200 ? 'white' : 'brown';
        } else if (r > g && r > b) color = r > 160 && g > 80 ? 'orange' : 'red';
        else if (b > r && b > g) color = 'blue';
        else if (g > r && g > b) color = 'green';
        else if (r > 140 && g > 110 && b < 90) color = 'yellow';
        else if (r > 100 && b > 100 && g < 90) color = 'purple';
        else if (r > 140 && g > 90 && b > 90) color = 'pink';
        resolve({ color, brightness: max, sat });
      };
      img.onerror = () => resolve({ color: 'multi', brightness: 128, sat: 0.2 });
      img.src = dataUrl;
    });
  }

  /** Dev-only color mock — never used on production path unless ?mock=1 */
  async function mockAnalyze(dataUrl) {
    const stones = await loadCatalog();
    const { color } = await colorGuess(dataUrl);
    const colorMap = {
      purple: ['amethyst', 'sugilite', 'charoite', 'lepidolite'],
      pink: ['rose-quartz', 'rhodonite', 'kunzite', 'rhodochrosite'],
      green: ['moldavite', 'malachite', 'jadeite', 'aventurine', 'chrysoprase'],
      yellow: ['citrine', 'pyrite', 'tiger-eye', 'amber'],
      blue: ['lapis-lazuli', 'blue-kyanite', 'aquamarine', 'turquoise', 'celestite'],
      black: ['tektite', 'black-tourmaline', 'obsidian', 'jet-stone', 'hematite'],
      white: ['clear-quartz', 'moonstone', 'howlite', 'selenite'],
      red: ['ruby', 'garnet', 'carnelian', 'red-jasper'],
      brown: ['tiger-eye', 'picture-jasper', 'smoky-quartz', 'river-pebble'],
      orange: ['carnelian', 'sunstone', 'amber'],
      multi: ['labradorite', 'golden-rutilated-quartz', 'fluorite', 'super-seven'],
    };
    const prefer = colorMap[color] || colorMap.multi;
    const byId = Object.fromEntries(stones.map(s => [s.id, s]));
    const picked = [];
    for (const id of prefer) {
      if (byId[id]) picked.push(byId[id]);
    }
    const sameColor = stones.filter(s => s.color === color && s.tier === 'core' && !picked.includes(s));
    while (picked.length < 4 && sameColor.length) picked.push(sameColor.shift());
    const buckets = ['river-pebble', 'common-quartz', 'unknown-stone']
      .map(id => byId[id]).filter(Boolean);
    while (picked.length < 5 && buckets.length) picked.push(buckets.shift());

    const candidates = picked.slice(0, 5).map((s, i) => ({
      id: s.id,
      name_en: s.name_en,
      name_th: s.name_th,
      confidence: Math.max(35, 78 - i * 11),
      reason: `จากโทนสีและผิวสัมผัสในรูป ใกล้เคียง${s.name_th} — ${((s.visual_cues || '').slice(0, 80))}…`,
      price_range_th: i === 0 ? 'คร่าวๆ หลักร้อยถึงหลักพัน ขึ้นกับขนาดและคุณภาพ (ตลาดไทย)' : '',
      in_catalog: true,
      tier: s.tier,
      meaning_short: s.meaning_short,
      tags: s.tags || [],
      visual_cues: s.visual_cues,
      article_url: s.article_url,
      rock_class: s.rock_class,
      mohs_guess: '',
      lookalikes: [],
      color: s.color,
      emoji: s.emoji || '🪨',
    }));

    const top = candidates[0];
    return {
      atlas_line: top
        ? `ส่งมาให้ดูแล้วค่ะ ตอนนี้เอนไปทาง${top.name_th}เป็นอันดับแรก — ราคาคร่าวๆ มักอยู่ช่วงหลักร้อยถึงหลักพันขึ้นกับขนาดคุณภาพนะคะ`
        : 'ส่งรูปมาให้ดูแล้วค่ะ ลองดูตัวเลือกด้านล่างนะคะ',
      candidates,
      need_more: true,
      follow_up: 'หินก้อนนี้ผิวมันหรือด้านคะ มีมุมเห็นเนื้อหินใกล้ๆ อีกไหม?',
      disclaimer: 'ผลนี้เป็นการตรวจเบื้องต้นจากรูป ไม่ใช่ใบรับรองแล็บ',
      mock: true,
    };
  }

  async function analyze(file, { onProgress } = {}) {
    if (remainingQuota() <= 0) {
      throw new Error('วันนี้สแกนครบโควต้าแล้วค่ะ ลองใหม่พรุ่งนี้ หรือคุยต่อที่ Line @amethez ได้เลย');
    }
    onProgress?.('กำลังเตรียมรูป…');
    const dataUrl = await compressImage(file);
    onProgress?.('Atlas กำลังวิเคราะห์ลักษณะธรณีวิทยา…');

    let result = null;
    try {
      const res = await fetch('/api/identify.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', image: dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.candidates) {
        result = data;
      } else {
        const msg = data.error || 'วิเคราะห์ไม่สำเร็จ ลองถ่ายใหม่ในแสงธรรมชาติค่ะ';
        if (ALLOW_MOCK && (data.fallback || res.status >= 500)) {
          onProgress?.('โหมดทดสอบ (mock)…');
          result = await mockAnalyze(dataUrl);
        } else {
          throw new Error(msg);
        }
      }
    } catch (e) {
      if (ALLOW_MOCK) {
        onProgress?.('โหมดทดสอบ (mock)…');
        result = await mockAnalyze(dataUrl);
      } else {
        throw e instanceof Error ? e : new Error('เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้งนะคะ');
      }
    }

    bumpQuota();
    lastResult = { ...result, preview: dataUrl };
    chatHistory = [];
    selectedStone = null;
    return lastResult;
  }

  async function chat(text) {
    const msg = (text || '').trim();
    if (!msg) return null;
    chatHistory.push({ role: 'user', content: msg });
    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

    const context = {
      selected: selectedStone,
      candidates: lastResult?.candidates || [],
    };

    try {
      const res = await fetch('/api/identify.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: chatHistory, context }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || 'คุยไม่สำเร็จ');
      chatHistory.push({ role: 'assistant', content: data.reply });
      return data.reply;
    } catch {
      const name = selectedStone?.name_th || lastResult?.candidates?.[0]?.name_th || 'ก้อนนี้';
      const lower = msg.toLowerCase();
      let reply;
      if (/รับซื้อ|รับของ|ซื้อหิน|ขายให้|ฝากขาย|ประเมิ|ประเมินราคาเพื่อขาย/.test(msg) || /รับซื้อ/.test(lower)) {
        reply = 'เราเป็นเว็บให้ข้อมูลนะคะ ไม่ใช่ร้านค้า และไม่ได้รับซื้อค่ะ ถ้าจะขาย ลองโพสกลุ่มขายหินในเฟซ หรือลง Shopee ดูได้นะคะ อยากให้ช่วยดูก่อนไหมว่าก้อนนี้น่าจะเป็นอะไร';
      } else if (/ราคา|เท่าไหร|เท่าไร|กี่บาท/.test(msg)) {
        reply = `ราคา${name}ในตลาดไทยมักขึ้นกับขนาด คุณภาพ และแหล่งที่มาค่ะ ช่วงคร่าวๆ อาจตั้งแต่หลักร้อยถึงหลักพันหรือสูงกว่านั้น — ส่งรูปชัดๆ มา เดี๋ยวฉันช่วยไล่ช่วงให้ละเอียดขึ้นนะคะ`;
      } else {
        reply = `จากที่ดูอยู่ ตอนนี้เอนไปทาง${name}ค่ะ อยากรู้มุมไหนเป็นพิเศษ ความหมาย ราคาคร่าวๆ หรือของแท้/ปลอม?`;
      }
      chatHistory.push({ role: 'assistant', content: reply });
      return reply;
    }
  }

  function selectStone(stone) {
    selectedStone = stone;
    return selectedStone;
  }

  function queueCatalogRequest(stone) {
    try {
      const list = JSON.parse(localStorage.getItem(REQUEST_QUEUE_KEY) || '[]');
      list.push({
        id: stone?.id || null,
        name_th: stone?.name_th,
        name_en: stone?.name_en,
        at: new Date().toISOString(),
      });
      localStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(list.slice(-50)));
    } catch { /* ignore */ }
  }

  function confLabel(n) {
    if (n >= 75) return 'สูง';
    if (n >= 55) return 'กลาง';
    return 'ต่ำ';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderCards(container, candidates, { onSelect, onRequest } = {}) {
    if (!container) return;
    container.innerHTML = (candidates || []).map((c, i) => {
      const outOfCatalog = !c.in_catalog;
      const lite = outOfCatalog || c.tier === 'lite';
      const tags = (c.tags || []).slice(0, 3).map(t => `<span class="id-tag">${escapeHtml(t)}</span>`).join('');
      const meaning = c.meaning_short
        ? `<p class="id-meaning">${escapeHtml(c.meaning_short)}</p>`
        : outOfCatalog
          ? `<p class="id-meaning muted">นอกสารานุกรม Amethez — ระบุจากลักษณะธรณีวิทยา</p>`
          : `<p class="id-meaning muted">ความรู้ฉบับย่อ — ยังไม่มีการ์ดละเอียดในคลัง</p>`;
      const price = c.price_range_th
        ? `<p class="id-price">💰 ราคาคร่าวๆ: ${escapeHtml(c.price_range_th)}</p>`
        : '';
      const rockLabel = ROCK_CLASS_TH[c.rock_class] || c.rock_class || '';
      const metaBits = [];
      if (rockLabel) metaBits.push(escapeHtml(rockLabel));
      if (c.mohs_guess) metaBits.push('Mohs ~' + escapeHtml(c.mohs_guess));
      if (c.variety) metaBits.push(escapeHtml(c.variety));
      const meta = metaBits.length
        ? `<p class="id-meta">${metaBits.join(' · ')}</p>`
        : '';
      const looks = (c.lookalikes || []).filter(Boolean).slice(0, 3);
      const lookHtml = looks.length
        ? `<p class="id-lookalikes">คล้ายกับ: ${looks.map(escapeHtml).join(', ')}</p>`
        : '';
      const badge = outOfCatalog
        ? `<span class="id-badge-out">นอกสารานุกรม</span>`
        : `<span class="id-badge-in">ในสารานุกรม</span>`;
      const article = c.article_url
        ? `<a class="id-link" href="${escapeHtml(c.article_url)}">อ่านสารานุกรม →</a>`
        : '';
      const reqBtn = lite
        ? `<button type="button" class="id-req" data-req="${i}">อยากให้ Atlas เก็บหินนี้เข้าคลัง</button>`
        : '';
      return `
        <article class="id-card ${i === 0 ? 'top' : ''} ${outOfCatalog ? 'out' : ''}" data-i="${i}">
          <div class="id-card-top">
            <span class="id-rank">#${i + 1}</span>
            <span class="id-conf conf-${confLabel(c.confidence)}">${confLabel(c.confidence)} · ${c.confidence}%</span>
          </div>
          <div class="id-badges">${badge}</div>
          <h3>${escapeHtml(c.emoji || '🪨')} ${escapeHtml(c.name_th)}</h3>
          <div class="id-en">${escapeHtml(c.name_en)}</div>
          ${meta}
          <p class="id-reason">${escapeHtml(c.reason || c.visual_cues || '')}</p>
          ${lookHtml}
          ${meaning}
          ${price}
          <div class="id-tags">${tags}</div>
          <div class="id-actions">
            <button type="button" class="id-talk" data-select="${i}">คุยกับ Atlas</button>
            ${article}
          </div>
          ${reqBtn}
        </article>`;
    }).join('');

    container.querySelectorAll('[data-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = candidates[+btn.dataset.select];
        selectStone(c);
        onSelect?.(c);
      });
    });
    container.querySelectorAll('[data-req]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = candidates[+btn.dataset.req];
        queueCatalogRequest(c);
        btn.textContent = 'รับเรื่องแล้วค่ะ ✓';
        btn.disabled = true;
        onRequest?.(c);
      });
    });
  }

  return {
    AVATARS,
    loadCatalog,
    analyze,
    chat,
    selectStone,
    getSelected: () => selectedStone,
    getLastResult: () => lastResult,
    getChatHistory: () => chatHistory,
    remainingQuota,
    setAvatar,
    avatarHtml,
    renderCards,
    confLabel,
    queueCatalogRequest,
  };
})();

window.AtlasIdentify = AtlasIdentify;
