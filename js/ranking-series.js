/* ranking-series.js — parser + HTML builder for Amethez stone-story series
 * Works in browser (admin) and Node (scripts/ingest-ranking-series.js)
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RankingSeries = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SERIES = {
    id: 'stone-stories',
    name: 'ซีรีส์เรื่องราวจากโลกของหินและคริสตัล',
    tagline: 'สำรวจเรื่องราวของหิน แร่ คริสตัล อัญมณี อุกกาบาต และฟอสซิล ผ่านบทความที่คัดเลือก 5 เรื่องเด่นในแต่ละหัวข้อ พร้อมข้อมูลอ้างอิงที่ตรวจสอบได้ ภาพประกอบจาก AI หรือภาพจริงจากแหล่งที่ได้รับอนุญาต',
    draftsPerDay: 5,
    publishPerDay: 2,
    publishTimes: ['08:00', '20:00'],
    inbox: 'inbox/rankings'
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function slugify(s) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0E00-\u0E7F]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || ('series-' + Date.now());
  }

  function pickField(text, label) {
    const re = new RegExp('\\*\\*' + label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + ':\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\*[A-Zก-๙]|\\n## |\\n---|$)', 'i');
    const m = text.match(re);
    if (!m) return '';
    return m[1].replace(/`/g, '').replace(/^[-–]\s*/gm, '').trim();
  }

  function splitSections(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const sections = [];
    let cur = { heading: '', body: [] };
    for (const line of lines) {
      const h = line.match(/^#{1,3}\s+(.+)$/);
      if (h) {
        if (cur.heading || cur.body.length) sections.push({ heading: cur.heading, body: cur.body.join('\n').trim() });
        cur = { heading: h[1].trim(), body: [] };
      } else {
        cur.body.push(line);
      }
    }
    if (cur.heading || cur.body.length) sections.push({ heading: cur.heading, body: cur.body.join('\n').trim() });
    return sections;
  }

  function paras(text) {
    return String(text || '')
      .split(/\n\s*\n/)
      .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(p => p && !/^---+$/.test(p) && !p.startsWith('**Caption') && !p.startsWith('**Alt'));
  }

  function parseList(text) {
    return String(text || '').split('\n')
      .map(l => l.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim())
      .filter(Boolean);
  }

  function parseImageBlock(body) {
    const caption = (body.match(/\*\*Caption:\*\*\s*([\s\S]*?)(?=\n\*\*|\n## |$)/i) || [])[1] || '';
    const alt = (body.match(/\*\*Alt Text:\*\*\s*([\s\S]*?)(?=\n\*\*|\n## |$)/i) || [])[1] || '';
    const prompt = body
      .replace(/\*\*Caption:\*\*[\s\S]*$/i, '')
      .replace(/\*\*Alt Text:\*\*[\s\S]*$/i, '')
      .trim();
    return {
      prompt: prompt.trim(),
      caption: caption.replace(/\s+/g, ' ').trim() || 'ภาพประกอบสร้างด้วย AI ไม่ใช่ภาพถ่ายจริงของชิ้นงาน',
      alt: alt.replace(/\s+/g, ' ').trim()
    };
  }

  function isItemHeading(h) {
    return /^\d+[\.\)]\s+/.test(h) || /^IMAGE PROMPT\s*\d+/i.test(h);
  }

  function parseSeriesArticle(raw, extras) {
    const text = String(raw || '').replace(/\r\n/g, '\n').trim();
    const sections = splitSections(text);
    const titleSec = sections.find(s => s.heading && !/^SEO$/i.test(s.heading) && !/^IMAGE/i.test(s.heading) && !/^แหล่งอ้างอิง/.test(s.heading) && !/^HERO/i.test(s.heading)) || { heading: '', body: '' };
    const title = (titleSec.heading || pickField(text, 'SEO Title') || 'บทความซีรีส์หิน').trim();
    const slugRaw = pickField(text, 'URL Slug') || slugify(pickField(text, 'SEO Title') || title);
    const slug = slugify(slugRaw.replace(/meteorites-from-other-worlds/i, 'meteorites-from-other-worlds') || slugRaw);

    const introSecs = [];
    const itemSecs = [];
    const extraSecs = [];
    let hero = { prompt: '', caption: '', alt: '' };
    const imagePrompts = [];
    const references = [];

    sections.forEach((s, i) => {
      const h = s.heading || '';
      if (!h && i === 0) return;
      if (/^SEO$/i.test(h) || /Focus Keyword|Related Keywords|Suggested Excerpt/i.test(h)) return;
      if (/^HERO IMAGE/i.test(h)) { hero = parseImageBlock(s.body); return; }
      if (/^IMAGE PROMPT/i.test(h)) {
        const img = parseImageBlock(s.body);
        const label = h.replace(/^IMAGE PROMPT\s*\d+\s*:?\s*/i, '').trim();
        imagePrompts.push({ label, ...img });
        return;
      }
      if (/แหล่งอ้างอิง/.test(h)) {
        parseList(s.body).forEach(line => {
          const url = (line.match(/https?:\/\/\S+/) || [])[0] || '';
          references.push({ text: line.replace(url, '').replace(/\s+—\s+$/, '').trim(), url });
        });
        return;
      }
      if (/^\d+[\.\)]\s+/.test(h)) { itemSecs.push(s); return; }
      if (i <= 1 && !/บทสรุป|เรารู้|มาถึงโลก|คำถาม/.test(h)) { introSecs.push(s); return; }
      extraSecs.push(s);
    });

    while (itemSecs.length < 5 && extraSecs.length) {
      const maybe = extraSecs.find(s => s.heading && s.body);
      if (!maybe) break;
      itemSecs.push(maybe);
      extraSecs.splice(extraSecs.indexOf(maybe), 1);
    }

    const items = itemSecs.slice(0, 5).map((s, i) => {
      const img = imagePrompts[i] || {};
      return {
        label: s.heading.replace(/^\d+[\.\)]\s+/, '').trim(),
        body: paras(s.body),
        prompt: img.prompt || '',
        caption: img.caption || 'ภาพประกอบสร้างด้วย AI ไม่ใช่ภาพถ่ายจริงของชิ้นงาน',
        alt: img.alt || ('ภาพประกอบ ' + s.heading),
        imgSlot: 'ranking_' + slug.replace(/-/g, '_') + '_item' + (i + 1) + '_hero',
        img: ''
      };
    });

    const intro = introSecs.map(s => paras(s.body)).flat().filter(Boolean);
    if (!intro.length) intro.push(...paras(titleSec.body));

    const related = pickField(text, 'Related Keywords')
      .split(/\n|,/)
      .map(x => x.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);

    return {
      id: slug,
      slug,
      title,
      excerpt: pickField(text, 'Suggested Excerpt') || intro[0] || '',
      seoTitle: pickField(text, 'SEO Title') || title,
      metaDescription: pickField(text, 'Meta Description') || intro[0] || '',
      focusKeyword: pickField(text, 'Focus Keyword') || '',
      relatedKeywords: related,
      heroImgSlot: 'ranking_' + slug.replace(/-/g, '_') + '_hero',
      heroPrompt: hero.prompt,
      heroCaption: hero.caption || 'ภาพปกเป็นภาพประกอบสร้างด้วย AI ไม่ใช่ภาพถ่ายจริงของชิ้นงาน',
      heroAlt: hero.alt || title,
      items,
      extra: extraSecs.map(s => ({ heading: s.heading, paras: paras(s.body) })),
      intro,
      references,
      url: '/stones/rankings/' + slug + '.html',
      status: 'draft',
      series: SERIES.id,
      imageStatus: 'pending',
      publishDate: '',
      shopeeTags: related.slice(0, 5),
      sourceFile: (extras && extras.sourceFile) || '',
      created: new Date().toISOString()
    };
  }

  function itemHtml(item, i) {
    const parasHtml = (item.body || []).map(p => '<p>' + p + '</p>').join('\n      ');
    const alt = esc(item.alt || item.label || '');
    const caption = esc(item.caption || 'ภาพประกอบสร้างด้วย AI ไม่ใช่ภาพถ่ายจริงของชิ้นงาน');
    return `<article class="series-split">
    <div class="series-split-text">
      <div class="series-split-num">${i + 1}</div>
      <h2>${esc(item.label)}</h2>
      ${parasHtml}
    </div>
    <figure class="series-split-figure">
      <div class="series-split-img">
        <img data-cms-img="${esc(item.imgSlot)}" alt="${alt}" loading="lazy" onerror="this.style.display='none'">
        <span class="series-split-ph cms-placeholder">✦</span>
      </div>
      <figcaption class="series-split-caption">${caption}</figcaption>
    </figure>
  </article>`;
  }

  function extraHtml(sec) {
    if (/มาถึงโลก/.test(sec.heading)) {
      const steps = (sec.paras || []).filter(p => /^\d+[\.\)]/.test(p) || p.length < 80);
      const rest = (sec.paras || []).filter(p => !steps.includes(p));
      const lis = (steps.length ? steps : (sec.paras || []).slice(0, 5)).map((p, i) =>
        `<li><span>${i + 1}</span><div>${esc(p.replace(/^\d+[\.\)]\s*/, ''))}</div></li>`).join('');
      return `<section class="series-section">
    <h2>${esc(sec.heading)}</h2>
    ${rest[0] ? '<p>' + rest[0] + '</p>' : ''}
    <ol class="series-steps">${lis}</ol>
    ${rest.slice(1).map(p => '<p>' + p + '</p>').join('\n    ')}
  </section>`;
    }
    if (/เรารู้/.test(sec.heading)) {
      const chips = (sec.paras || []).filter(p => p.length < 80).map(p =>
        '<span class="series-chip">' + esc(p.replace(/^[-*]\s*/, '')) + '</span>').join('');
      const long = (sec.paras || []).filter(p => p.length >= 80);
      return `<section class="series-section">
    <h2>${esc(sec.heading)}</h2>
    ${long[0] ? '<p>' + long[0] + '</p>' : ''}
    <div class="series-chips">${chips}</div>
    ${long.slice(1).map(p => '<p>' + p + '</p>').join('\n    ')}
  </section>`;
    }
    return `<section class="series-section">
    <h2>${esc(sec.heading)}</h2>
    ${(sec.paras || []).map(p => '<p>' + p + '</p>').join('\n    ')}
  </section>`;
  }

  function buildSeriesBodyHtml(article) {
    const intro = (article.intro || []).map(p => '<p' + (article.intro[0] === p ? ' class="series-intro"' : '') + '>' + p + '</p>').join('\n  ');
    const items = (article.items || []).map(itemHtml).join('\n\n  ');
    const extras = (article.extra || []).filter(s => !/คำถามที่พบบ่อย|FAQ/i.test(s.heading)).map(extraHtml).join('\n\n  ');
    const refs = (article.references || []).map(r => {
      if (r.url) return `<li>${esc(r.text)} — <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></li>`;
      return `<li>${esc(r.text || r)}</li>`;
    }).join('\n      ');
    return `
  ${intro}

  ${items}

  ${extras}

  ${refs ? `<div class="references">
    <h2>แหล่งอ้างอิง</h2>
    <ol>
      ${refs}
    </ol>
    <p class="series-note">ภาพประกอบในบทความนี้สร้างด้วย AI เพื่อประกอบเรื่อง ไม่ใช่ภาพถ่ายจริงของชิ้นงานตัวอย่าง</p>
  </div>` : ''}
`;
  }

  function buildFullRankingPage(article, opts) {
    const o = opts || {};
    const noindex = article.status !== 'published';
    const episode = article.episode ? ' · ตอนที่ ' + article.episode : '';
    const title = article.seoTitle || article.title;
    const desc = article.metaDescription || article.excerpt || '';
    const body = article.body || buildSeriesBodyHtml(article);
    const tags = (article.shopeeTags || article.relatedKeywords || []).slice(0, 6);
    const tagJs = JSON.stringify(tags);
    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${noindex ? '<meta name="robots" content="noindex,nofollow">\n  ' : ''}<title>${esc(title)} | Amethez</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="https://amethez.com${esc(article.url)}">
  <meta property="og:site_name" content="Amethez">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="https://amethez.com${esc(article.url)}">
  <meta property="og:locale" content="th_TH">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/main.css">
</head>
<body data-cms-page="ranking-${esc(article.slug)}">
<header class="site-header"></header>
<section class="article-hero">
  <div class="container">
    <div class="article-hero-inner">
      <div class="hero-text">
        <div style="font-size:.85rem;color:rgba(255,255,255,.55);margin-bottom:.85rem">
          <a href="/" style="color:rgba(255,255,255,.55)">หน้าหลัก</a> ›
          <a href="/stones/rankings/" style="color:rgba(255,255,255,.55)">คอลัมน์และเรื่องเล่า</a> › ${esc(article.title)}
        </div>
        <div class="series-kicker" style="color:#c9a84c">${esc(SERIES.name)}${episode}</div>
        <h1 data-cms-text="title">${esc(article.title)}</h1>
        <p style="font-size:1.1rem;color:rgba(255,255,255,.82);margin:.75rem 0 1rem" data-cms-text="subtitle">${esc(article.excerpt)}</p>
      </div>
    </div>
  </div>
</section>
<div class="container" style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem 0">
  <figure class="series-split-figure">
    <div class="series-split-img" style="aspect-ratio:16/9;border-radius:1.25rem">
      <img data-cms-img="${esc(article.heroImgSlot)}" alt="${esc(article.heroAlt || article.title)}" loading="eager" onerror="this.style.display='none'">
      <span class="series-split-ph cms-placeholder">✦</span>
    </div>
    <figcaption class="series-split-caption">${esc(article.heroCaption || 'ภาพปกเป็นภาพประกอบสร้างด้วย AI ไม่ใช่ภาพถ่ายจริงของชิ้นงาน')}</figcaption>
  </figure>
</div>
<div class="article-body series-body" data-cms-text="body">
${body}
</div>
<div class="container">
  <div class="shopee-section">
    <h3>สินค้าแนะนำ</h3>
    <div class="grid-4" id="shopeeProducts"></div>
  </div>
</div>
<footer class="site-footer"></footer>
<script src="/js/main.js"></script>
<script>initShopeeSection('shopeeProducts', ${tagJs});</script>
<script src="/js/cms.js"></script>
<script src="/js/components.js"></script>
<script src="/js/shila.js"></script>
</body>
</html>
`;
  }

  function bangkokYmd(d) {
    const t = d ? new Date(d) : new Date();
    const th = new Date(t.getTime() + 7 * 60 * 60 * 1000);
    return th.toISOString().slice(0, 10);
  }

  function addDaysYmd(ymd, n) {
    const [y, m, d] = String(ymd).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return dt.toISOString().slice(0, 10);
  }

  function nextPublishSlots(articles, count) {
    const perDay = SERIES.publishPerDay;
    const times = SERIES.publishTimes;
    const used = {};
    (articles || []).forEach(a => {
      if (a.status !== 'scheduled' && a.status !== 'published') return;
      const day = String(a.publishDate || '').slice(0, 10);
      const time = String(a.publishDate || '').slice(11, 16) || times[0];
      if (!day) return;
      used[day] = used[day] || new Set();
      used[day].add(time);
    });
    const out = [];
    let day = bangkokYmd();
    let guard = 0;
    while (out.length < count && guard < 60) {
      used[day] = used[day] || new Set();
      for (const tm of times) {
        if (out.length >= count) break;
        if (!used[day].has(tm)) {
          used[day].add(tm);
          out.push({ date: day, time: tm, datetime: day + 'T' + tm });
        }
      }
      day = addDaysYmd(day, 1);
      guard++;
    }
    return out;
  }

  function shufflePick(arr, n) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  }

  return {
    SERIES,
    esc,
    slugify,
    parseSeriesArticle,
    buildSeriesBodyHtml,
    buildFullRankingPage,
    nextPublishSlots,
    shufflePick
  };
});
