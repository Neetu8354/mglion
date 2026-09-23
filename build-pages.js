// Generates the extra static pages (casino / slot / fantasy / terms / responsible-gaming)
// by reusing the sanitized shell of site/index.html and swapping in page content.
// Run AFTER build.js. Idempotent — safe to re-run.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const INDEX = path.join(SITE, 'index.html');

const CDN = 'https://sitethemedata.com/casino_icons/';
const FRONT = 'https://wver.sprintstaticdata.com/v239/static/front/img/';

/* ------------------------------------------------------------------ */
/* Data harvested from the live site                                    */
/* ------------------------------------------------------------------ */

const CASINO_TILES = [
  'lc/goal2.jpg','lc/worli3.gif','lc/teen62.gif','lc/dolidana.gif','lc/mogambo.gif','lc/teen20v1.jpg',
  'lc/lucky5.jpg','lc/roulette12.jpg','lc/roulette13.jpg','lc/roulette11.jpg','lc/poison.jpg','lc/teenunique.jpg',
  'lc/poison20.jpg','lc/joker120.jpg','lc/joker20.jpg','lc/joker1.jpg','lc/teen20c.jpg','lc/btable2.jpg',
  'lc/ourroullete.jpg','lc/superover3.jpg','lc/goal.jpg','lc/ab4.jpg','lc/lucky15.jpg','lc/superover2.jpg',
  'lc/teen41.jpg','lc/teen42.jpg','lc/sicbo2.jpg','lc/teen33.jpg','lc/sicbo.jpg','lc/ballbyball.jpg',
  'lc/teen32.jpg','lc/teen.jpg','lc/teen20.jpg','lc/teen9.jpg','lc/teen8.jpg','lc/poker.jpg',
  'lc/poker20.jpg','lc/poker6.jpg','lc/baccarat.jpg','lc/baccarat2.jpg','lc/dt20.jpg','lc/dt6.jpg',
  'lc/dtl20.jpg','lc/dt202.jpg','lc/card32.jpg','lc/card32eu.jpg','lc/ab20.jpg','lc/abj.jpg',
  'lc/lucky7.jpg','lc/lucky7eu.jpg','lc/3cardj.jpg','lc/war.jpg','lc/worli.jpg','lc/worli2.jpg',
  'lc/aaa.jpg','lc/btable.jpg','lc/lottcard.jpg','lc/cricketv3.jpg','lc/cmatch20.jpg','lc/cmeter.jpg',
  'lc/teen6.jpg','lc/queen.jpg','lc/race20.jpg','lc/lucky7eu2.jpg','lc/superover.jpg','lc/trap.jpg',
  'lc/patti2.jpg','lc/teensin.jpg','lc/teenmuf.jpg','lc/race17.jpg','lc/teen20b.jpg','lc/trio.jpg',
  'lc/notenum.jpg','lc/teen120.jpg','lc/teen1.jpg','lc/ab3.jpg','lc/aaa2.jpg','lc/race2.jpg',
  'lc/teen3.jpg','lc/dum10.jpg','lc/cmeter1.jpg'
];

const SLOT_TILES = JSON.parse(fs.readFileSync(path.join(ROOT, 'slot-tiles.json'), 'utf8'));

const FANTASY_TILES = [
  'other/dimfantasy/diamondx.jpg',
  'other/dimfantasy/chicken.jpg',
  'other/dimfantasy/color_prediction.jpg'
];

const CASINO_TABS = [
  ['All Casino',35],['Roulette',31],['Teenpatti',20],['Poker',21],['Baccarat',22],
  ['Dragon Tiger',23],['32 Cards',24],['Andar Bahar',26],['Lucky 7',27],['3 Card Judgement',28],
  ['Casino War',29],['Worli',30],['Sports',34],['Bollywood',32],['Lottery',33],
  ['Queen',40],['Race',41],['Others',73]
];

const SLOT_TABS = ['Slot Game','Table Game','Fish Game','Crash Game'];

const CASINO_PROVIDERS = [
  ['Our Casino','4.png'],['Our VIP Casino','45.png'],['Our Premium Casino','52.png'],
  ['Our Virtual','19.png'],['Creedroomz','24.png'],['Evolution','5.png'],['EZUGI','1.png'],
  ['CockFight','6.png'],['Red Carat','42.png'],['Jacktop','43.png'],['Holi','holi.png']
];

const SLOT_PROVIDERS = [
  'Jili','Amigo','Turbo Games','Red Tiger','1X2 Gaming','BB Games','Booongo','Dragoon Soft',
  'Pocket Game','Evoplay','Fantasma Games','Habanero','Hacksaw Gaming','Iron Dog Studio',
  'Kalamba Games','Lady Luck','Nolimit city','OMI Gaming','OneTouch','PlayPearls','Push Gaming',
  'Quickspin','Relax Gaming','RTG Slots','Spearhead Studios','Slotmill','Splitrock Gaming',
  'Thunderkick','Woohoo Games','Yggdrasil','Virtual Games','Kingmidas','EGT'
];

const FANTASY_PROVIDERS = [
  'Dim Fantasy','smart','popok','pascal','our','spribe','scratch','darwin','gemini',
  'studio21','beon','jacktop','Kingmidas'
];

/* ------------------------------------------------------------------ */
/* 1. Download assets                                                   */
/* ------------------------------------------------------------------ */

const DOWNLOADS = [];
const dl = (url, rel) => DOWNLOADS.push([url, path.join(SITE, rel)]);

CASINO_TILES.forEach(f => dl(CDN + f, 'img/casino/' + f));
SLOT_TILES.forEach(f => dl(CDN + f, 'img/casino/' + f));
FANTASY_TILES.forEach(f => dl(CDN + f, 'img/casino/' + f));
FANTASY_PROVIDERS.forEach(n => dl(CDN + 'fantasy/' + encodeURIComponent(n) + '.png', 'img/casino/fantasy/' + n + '.png'));
CASINO_TABS.forEach(([,n]) => dl(FRONT + 'casino-tab-icons/4/' + n + '.png', 'img/casino-tab-icons/4/' + n + '.png'));
CASINO_PROVIDERS.forEach(([,f]) => dl(FRONT + 'icons/' + f, 'img/icons/' + f));

async function downloadAll() {
  let ok = 0, skip = 0, fail = 0;
  for (const [url, dest] of DOWNLOADS) {
    if (fs.existsSync(dest)) { skip++; continue; }
    try {
      const r = await fetch(url);
      if (!r.ok) { fail++; console.error('  ' + r.status + ' ' + url); continue; }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      ok++;
    } catch (e) { fail++; console.error('  ERR ' + url + ' ' + e.message); }
  }
  console.log(`assets: ${ok} downloaded, ${skip} cached, ${fail} failed`);
}

/* ------------------------------------------------------------------ */
/* 2. Page CSS                                                          */
/* ------------------------------------------------------------------ */

const PAGES_CSS = `/* Game pages (casino / slot / fantasy) + content pages */
.pg-wrap { padding: 6px 6px 24px; }
.pg-tabs { display:flex; gap:8px; overflow-x:auto; padding:4px 2px 12px; scrollbar-width:thin; }
.pg-tab {
  flex:0 0 auto; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px;
  min-width:74px; padding:8px 8px; background:#161616; border:1px solid #2b2b2b; border-radius:6px;
  color:#ddd; font-size:12px; line-height:1.2; text-align:center; cursor:pointer; white-space:nowrap;
}
.pg-tab img { width:30px; height:30px; object-fit:contain; }
.pg-tab.active, .pg-tab:hover { border-color:#f0c81c; color:#f0c81c; }
.pg-tab.pg-text-tab { min-width:92px; padding:12px 16px; font-size:14px; }
.pg-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:8px; }
.mg-game-tile {
  display:block; aspect-ratio:16/10.4; background-size:cover; background-position:center;
  border-radius:6px; border:1px solid #232323; cursor:pointer;
}
.mg-game-tile:hover { filter:brightness(1.12); }
.pg-providers { display:flex; flex-direction:column; }
.pg-provider {
  display:flex; align-items:center; gap:10px; padding:13px 14px;
  border-bottom:1px solid #262626; color:#e8e8e8; font-size:14px; text-transform:capitalize; cursor:pointer;
}
.pg-provider img { width:26px; height:26px; object-fit:contain; flex:0 0 26px; }
.pg-provider:hover, .pg-provider.active { background:#1d1d1d; color:#f0c81c; }
.pg-providers-head { padding:13px 14px; font-weight:700; color:#f0c81c; border-bottom:1px solid #262626; }
.pg-content { padding:22px 18px 40px; color:#d8d8d8; font-size:14px; line-height:1.75; }
.pg-content h1,.pg-content h2,.pg-content h3,.pg-content h4 { color:#f0c81c; }
.pg-content a { color:#2ecc71; }
@media only screen and (max-width: 767px) {
  .pg-grid { grid-template-columns:repeat(auto-fill,minmax(106px,1fr)); gap:6px; }
  .pg-wrap { padding:4px 4px 16px; }
}
`;

/* ------------------------------------------------------------------ */
/* 3. DOM surgery helpers                                               */
/* ------------------------------------------------------------------ */

// Find element whose class attribute contains `cls`; returns offsets of
// the element and its inner content, or null.
function findElement(html, cls) {
  const re = new RegExp(
    '<(\\w+)\\s[^>]*class="[^"]*\\b' + cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b[^"]*"[^>]*>',
    'i'
  );
  const m = re.exec(html);
  if (!m) return null;
  const tag = m[1].toLowerCase();
  const start = m.index;
  const innerStart = start + m[0].length;
  const tagRe = new RegExp('<\\/?' + tag + '(\\s[^>]*)?>', 'gi');
  tagRe.lastIndex = innerStart;
  let depth = 1, mm;
  while ((mm = tagRe.exec(html))) {
    depth += mm[0][1] === '/' ? -1 : 1;
    if (depth === 0) return { start, innerStart, innerEnd: mm.index, end: mm.index + mm[0].length };
  }
  return null;
}

function replaceInner(html, cls, inner) {
  const el = findElement(html, cls);
  if (!el) { console.error('  !! element not found:', cls); return html; }
  return html.slice(0, el.innerStart) + inner + html.slice(el.innerEnd);
}

function hideElement(html, cls) {
  const el = findElement(html, cls);
  if (!el) { console.error('  !! element not found:', cls); return html; }
  const openTag = html.slice(el.start, el.innerStart).replace(/>$/, ' style="display:none">');
  return html.slice(0, el.start) + openTag + html.slice(el.innerStart);
}

// Rewrite the inert "#!" nav/footer links to clean extensionless local pages.
function wireLinks(h) {
  h = h.replace(/<a href="#!"([^>]*)>\s*Live Casino\s*<\/a>/g, '<a href="casino"$1> Live Casino </a>');
  h = h.replace(/<a href="#!"([^>]*)>\s*Slot\s*<\/a>/g, '<a href="slot"$1> Slot </a>');
  h = h.replace(/<a href="#!"([^>]*)>\s*Fantasy Games\s*<\/a>/g, '<a href="fantasy"$1> Fantasy Games </a>');
  h = h.replace(/<a href="#!"([^>]*)>\s*Terms and Conditions\s*<\/a>/g, '<a href="terms"$1> Terms and Conditions </a>');
  h = h.replace(/<a href="#!"([^>]*)>\s*Responsible Gaming\s*<\/a>/g, '<a href="responsible-gaming"$1> Responsible Gaming </a>');
  return h;
}

/* ------------------------------------------------------------------ */
/* 4. Page fragments                                                    */
/* ------------------------------------------------------------------ */

const img = (rel, alt='') => `./img/${rel}" alt="${alt}`;

function providerList(items, withIcons) {
  return '<div class="pg-providers">' + items.map(p => {
    const [name, icon] = withIcons ? [p[0], p[1]] : [p, null];
    return `<div class="pg-provider">${icon ? `<img src="${img('icons/' + icon)}">` : ''}<span>${name}</span></div>`;
  }).join('') + '</div>';
}

function fantasyProviderList() {
  return '<div class="pg-providers"><div class="pg-providers-head">Providers</div>' +
    FANTASY_PROVIDERS.map(n =>
      `<div class="pg-provider"><img src="${img('casino/fantasy/' + n + '.png')}"><span>${n}</span></div>`
    ).join('') + '</div>';
}

function gameGrid(tiles, base) {
  return '<div class="pg-grid">' + tiles.map(f =>
    `<div class="mg-game-tile" style="background-image:url('${base}${f}')"></div>`
  ).join('') + '</div>';
}

function casinoTabs() {
  return '<div class="pg-tabs">' + CASINO_TABS.map(([name, n], i) =>
    `<div class="pg-tab${i===0?' active':''}"><img src="${img('casino-tab-icons/4/' + n + '.png')}"><span>${name}</span></div>`
  ).join('') + '</div>';
}

function slotTabs() {
  return '<div class="pg-tabs">' + SLOT_TABS.map((t, i) =>
    `<div class="pg-tab pg-text-tab${i===0?' active':''}"><span>${t}</span></div>`
  ).join('') + '</div>';
}

function wrapCenter(inner) {
  return `<div class="home-container"><div class="point-middle home-new"><div class="pg-wrap">${inner}</div></div></div>`;
}

function loadContentPage(file) {
  // harvested innerHTML is a JSON-escaped full document; real content starts at .wrapper
  let raw = fs.readFileSync(file, 'utf8');
  try { raw = JSON.parse(raw); } catch (_) { /* already plain html */ }
  const wi = raw.indexOf('<div class="wrapper"');
  if (wi >= 0) raw = raw.slice(wi);
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/https?:\/\/sitethemedata\.com\/sitethemes\/mglion\.com\/front\/logo\.png/gi, './assets/logo.png')
    .replace(/href="[^"]*"/gi, 'href="#!"');
}

/* ------------------------------------------------------------------ */
/* 5. Generate                                                          */
/* ------------------------------------------------------------------ */

function makePage(shell, { title, sidebar, center }) {
  let h = shell;
  if (title) h = h.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  if (sidebar !== undefined) {
    // keep the brand logo box at the top of the left sidebar
    const logo = findElement(h, 'logo-box');
    const logoHtml = logo ? h.slice(logo.start, logo.end) : '';
    h = replaceInner(h, 'sidebar-left', logoHtml + sidebar);
  }
  h = replaceInner(h, 'center-container', center);
  h = hideElement(h, 'right-sidebar');
  // page stylesheet after the existing static-fix link
  h = h.replace(
    '<link rel="stylesheet" href="./static-fix.css">',
    '<link rel="stylesheet" href="./static-fix.css"><link rel="stylesheet" href="./pages.css">'
  );
  return wireLinks(h);
}

async function main() {
  await downloadAll();
  fs.writeFileSync(path.join(SITE, 'pages.css'), PAGES_CSS, 'utf8');

  const shell = fs.readFileSync(INDEX, 'utf8');

  const pages = {
    'casino.html': {
      title: 'Live Casino | MGLION',
      sidebar: providerList(CASINO_PROVIDERS, true),
      center: wrapCenter(casinoTabs() + gameGrid(CASINO_TILES, './img/casino/'))
    },
    'slot.html': {
      title: 'Slot Games | MGLION',
      sidebar: providerList(SLOT_PROVIDERS, false),
      center: wrapCenter(slotTabs() + gameGrid(SLOT_TILES, './img/casino/'))
    },
    'fantasy.html': {
      title: 'Fantasy Games | MGLION',
      sidebar: fantasyProviderList(),
      center: wrapCenter(gameGrid(FANTASY_TILES, './img/casino/'))
    },
    'terms.html': {
      title: 'Terms and Conditions | MGLION',
      center: wrapCenter(`<div class="pg-content">${loadContentPage(path.join(ROOT,'terms-content.html'))}</div>`)
    },
    'responsible-gaming.html': {
      title: 'Responsible Gaming | MGLION',
      center: wrapCenter(`<div class="pg-content">${loadContentPage(path.join(ROOT,'rg-content.html'))}</div>`)
    }
  };

  for (const [file, def] of Object.entries(pages)) {
    fs.writeFileSync(path.join(SITE, file), makePage(shell, def), 'utf8');
    console.log('wrote site/' + file);
  }

  // wire nav/footer links on the homepage too
  fs.writeFileSync(INDEX, wireLinks(shell), 'utf8');
  console.log('updated site/index.html links');

  // sitemap + robots (clean slugs)
  const BASE = 'https://www.mglion247.live';
  const routes = ['', 'casino', 'slot', 'fantasy', 'terms', 'responsible-gaming'];
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(SITE, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes.map(r =>
      `  <url><loc>${BASE}/${r}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${r === '' ? '1.0' : '0.8'}</priority></url>`
    ).join('\n') +
    '\n</urlset>\n', 'utf8');
  fs.writeFileSync(path.join(SITE, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: ' + BASE + '/sitemap.xml\n', 'utf8');
  console.log('wrote sitemap.xml + robots.txt');
}

main().catch(e => { console.error(e); process.exit(1); });
