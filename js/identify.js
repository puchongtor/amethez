/* ═══ Crystal Atlas Stone Identify ═══
 * Shared client for homepage hero + /identify/
 * Uses /api/identify.php with local mock fallback + daily quota.
 */

const AtlasIdentify = (() => {
  const QUOTA_KEY = 'amethez_identify_quota_v1';
  const DAILY_LIMIT = 8;
  const REQUEST_QUEUE_KEY = 'amethez_identify_requests';

  const AVATARS = {
    hero: '/images/avatars/atlas/atlas-desk-encyclopedia.jpg',
    chat: '/images/avatars/atlas/atlas-smiling-camera.jpg',
    think: '/images/avatars/atlas/atlas-arms-crossed.jpg',
    read: '/images/avatars/atlas/atlas-desk-reading.jpg',
    library: '/images/avatars/atlas/atlas-library-desk.jpg',
    smileB: '/images/avatars/atlas/atlas-smiling-camera-b.jpg',
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

  function compressImage(file, maxSide = 1280, quality = 0.82) {
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
      in_catalog: true,
      tier: s.tier,
      meaning_short: s.meaning_short,
      tags: s.tags || [],
      visual_cues: s.visual_cues,
      article_url: s.article_url,
      rock_class: s.rock_class,
      color: s.color,
      emoji: s.emoji || '🪨',
    }));

    const top = candidates[0];
    return {
      atlas_line: top
        ? `จากรูปนี้โทน${color === 'multi' ? 'ผสม' : color} ชัดอยู่ค่ะ ตอนนี้เอนไปทาง${top.name_th}เป็นอันดับแรก — แต่มีตัวใกล้เคียงอีกหน่อย ลองดูการ์ดด้านล่างนะคะ`
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
    onProgress?.('Atlas กำลังดูรูปให้…');

    let result = null;
    try {
      const res = await fetch('/api/identify.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', image: dataUrl }),
      });
      const data = await res.json();
      if (res.ok && data.candidates) {
        result = data;
      } else if (data.fallback || res.status >= 500) {
        onProgress?.('ใช้โหมดดูเบื้องต้นในเครื่องชั่วคราว…');
        result = await mockAnalyze(dataUrl);
      } else {
        throw new Error(data.error || 'วิเคราะห์ไม่สำเร็จ');
      }
    } catch (e) {
      if (e.message && !e.message.includes('Failed') && !e.message.includes('fetch') && !e.message.includes('Network')) {
        // keep specific errors
        if (!result) {
          onProgress?.('ใช้โหมดดูเบื้องต้นในเครื่องชั่วคราว…');
          try { result = await mockAnalyze(dataUrl); }
          catch { throw e; }
        }
      } else {
        onProgress?.('ใช้โหมดดูเบื้องต้นในเครื่องชั่วคราว…');
        result = await mockAnalyze(dataUrl);
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
      const reply = `จากที่ดูอยู่ ตอนนี้เอนไปทาง${name}ค่ะ อยากรู้มุมไหนเป็นพิเศษ ความหมาย การดูแล หรือของแท้/ปลอม?`;
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

  function renderCards(container, candidates, { onSelect, onRequest } = {}) {
    if (!container) return;
    container.innerHTML = (candidates || []).map((c, i) => {
      const lite = !c.in_catalog || c.tier === 'lite';
      const tags = (c.tags || []).slice(0, 3).map(t => `<span class="id-tag">${t}</span>`).join('');
      const meaning = c.meaning_short
        ? `<p class="id-meaning">${c.meaning_short}</p>`
        : `<p class="id-meaning muted">ความรู้ฉบับย่อ — ยังไม่มีการ์ดละเอียดในคลัง</p>`;
      const article = c.article_url
        ? `<a class="id-link" href="${c.article_url}">อ่านสารานุกรม →</a>`
        : '';
      const reqBtn = lite
        ? `<button type="button" class="id-req" data-req="${i}">อยากให้ Atlas เก็บหินนี้เข้าคลัง</button>`
        : '';
      return `
        <article class="id-card ${i === 0 ? 'top' : ''}" data-i="${i}">
          <div class="id-card-top">
            <span class="id-rank">#${i + 1}</span>
            <span class="id-conf conf-${confLabel(c.confidence)}">${confLabel(c.confidence)} · ${c.confidence}%</span>
          </div>
          <h3>${c.emoji || '🪨'} ${c.name_th}</h3>
          <div class="id-en">${c.name_en}</div>
          <p class="id-reason">${c.reason || c.visual_cues || ''}</p>
          ${meaning}
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
