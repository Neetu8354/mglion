// Build a fully static, crash-free snapshot of the saved page.
// - Removes every <script>, <iframe> and <noscript> block
// - Strips inline event handler attributes (onclick, onsubmit, ...)
// - Neutralizes all <a href> / <area href> -> javascript:void(0)
// - Neutralizes <form action> and submit buttons
// - Copies the saved "_files" folder to site/assets and rewrites references
// Result: pure HTML + CSS + images. Clicking anything does nothing.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_HTML = path.join(ROOT, 'MGLION Official _ Get IPL ID, Get Cricket ID & Betting ID India.htm');
const SRC_ASSETS = path.join(ROOT, 'MGLION Official _ Get IPL ID, Get Cricket ID & Betting ID India_files');
const OUT_DIR = path.join(ROOT, 'site');
const OUT_ASSETS = path.join(OUT_DIR, 'assets');
const ASSET_REF = './MGLION Official _ Get IPL ID, Get Cricket ID &amp; Betting ID India_files';

// The saved page was captured mid-animation from a Vue app. Its carousels
// (hooper) stored geometry in inline styles (height:0, translate(-Npx)) and
// relied on JS + bundled CSS that no longer runs. These rules turn every
// carousel into a static, clipped, scrollable strip.
const STATIC_FIX_CSS = `/* Static snapshot fixes: neutralize JS-driven hooper carousels. */
.hooper { height: auto !important; }
.hooper-list { overflow: hidden; }
.hooper-track {
  display: flex !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  list-style: none !important;
}
.hooper-slide { flex-shrink: 0; box-sizing: border-box; opacity: 1 !important; }
.hooper-slide.is-clone { display: none !important; }
/* theme fades non-active slides via JS-cycled classes (wolf-custom.css uses
   !important, so we must match its exact specificity to win) */
.wolf-open-home .right-sidebar .home-casiono-icons .hooper-slide,
.wolf-open-home .right-sidebar .home-casiono-icons .hooper-slide.is-prev,
.wolf-open-home .right-sidebar .home-casiono-icons .hooper-slide.is-next {
  opacity: 1 !important;
}

/* Vertical tickers (fixtures, winner announcements): theme CSS already caps
   .hooper-track height (46px / 162px); the list just clips to it. Anything
   uncapped gets a sane scrollable limit instead of a giant column. */
.hooper.is-vertical .hooper-track { flex-direction: column; }
.hooper.is-vertical .hooper-list { max-height: 400px; overflow-y: auto; }
/* slides were saved mid-animation with height:0 -> restore natural height */
.hooper.is-vertical .hooper-slide { height: auto !important; }

/* Fixture ticker: reclaim the theme's right margin so the narrow sidebar
   fits the fixture name/date on two clean, ellipsized lines. */
.upcoming-fixure .fixure-box { margin-right: 0; }
.upcoming-fixure .fixure-box > div {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Horizontal strips (Now Trending, Our Casino) become swipeable scrollers. */
.hooper:not(.is-vertical) .hooper-list {
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
.hooper:not(.is-vertical) .hooper-track { width: max-content; }
.hooper:not(.is-vertical) .hooper-slide {
  scroll-snap-align: start;
  max-width: 100%;
}

/* "Now Trending" mobile strip: banner slides were saved at the capture-time
   width (539px) — pin each to the viewport width so they fit any screen. */
.point-casino-list:has(> .point-casino-list-title) .hooper-track { width: 100% !important; }
.point-casino-list:has(> .point-casino-list-title) .hooper-slide {
  flex: 0 0 100% !important;
  width: 100% !important;
}
.point-casino-list:has(> .point-casino-list-title) .hooper-slide img {
  width: 100%;
}

/* Hero carousel (bootstrap-vue): JS used to swap .active. Show every slide
   as a full-width snap-scroll strip instead. */
.carousel-inner {
  display: flex !important;
  overflow-x: auto !important;
  scroll-snap-type: x mandatory;
  transform: none !important;
}
.carousel-inner .carousel-item {
  display: block !important;
  float: none !important;
  flex: 0 0 100% !important;
  width: 100% !important;
  margin-right: 0 !important;
  transform: none !important;
  scroll-snap-align: start;
}

/* Reinforce the drawer state class used by static-fix.js. */
.point-menu.show { display: block; }

/* Desktop news ticker: the app saved it with .no-marquee + animation-duration:0s,
   which parks the text off-screen (padding-left:100%). Restore the scroll —
   desktop only, mobile/tablet already have a real duration. */
@media only screen and (min-width: 1280px) {
  .marquee-content.no-marquee { animation-duration: 40s !important; }
}

/* ---- Login modal (opened when a game is clicked) ---- */
.mg-login-modal {
  position: fixed; inset: 0; z-index: 99999;
  display: none; align-items: center; justify-content: center;
  background: rgba(0,0,0,.78); padding: 16px;
}
.mg-login-modal.open { display: flex; }
.mg-login-dialog {
  width: min(430px, 94vw); max-height: 92vh; overflow-y: auto;
  background: #0d0d0d; border: 1px solid #2a2a2a; border-radius: 10px;
  box-shadow: 0 24px 70px rgba(0,0,0,.65);
}
.mg-login-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #222;
  color: #fff; font-size: 21px; font-weight: 600;
}
.mg-login-close {
  width: 36px; height: 36px; border-radius: 50%; flex: 0 0 36px;
  border: 2px solid #e3343f; background: transparent; color: #e3343f;
  font-size: 20px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.mg-login-body { padding: 18px 20px 24px; }
.mg-login-label { display: block; color: #fff; font-size: 14px; margin: 0 0 7px; }
.mg-login-input {
  width: 100%; background: #2b2b2b; border: 1px solid #3d3d3d; border-radius: 3px;
  color: #eee; padding: 12px 14px; margin-bottom: 18px; outline: none;
}
.mg-login-input:focus { border-color: #1da851; }
.mg-login-pass { position: relative; }
.mg-login-eye {
  position: absolute; right: 0; top: 0; height: calc(100% - 18px); width: 46px;
  display: flex; align-items: center; justify-content: center;
  background: #4a4a4a; color: #ddd;
}
.mg-login-check { display: flex; gap: 8px; color: #bbb; font-size: 12px; line-height: 1.5; margin: 0 0 18px; }
.mg-login-check input { margin-top: 2px; accent-color: #1da851; }
.mg-login-check u { color: #2ecc71; text-decoration-color: #2ecc71; }
.mg-login-btn {
  display: block; text-align: center; text-decoration: none;
  background: #15684a; color: #fff; font-weight: 600; font-size: 16px;
  padding: 13px; border-radius: 4px; cursor: pointer;
}
.mg-login-btn:hover { color: #fff; text-decoration: none; filter: brightness(1.12); }
.mg-wa-btn { background: #1da851; }
.mg-login-or {
  display: flex; align-items: center; gap: 12px;
  color: #f0c81c; font-size: 14px; margin: 14px 0;
}
.mg-login-or::before, .mg-login-or::after {
  content: ""; flex: 1; height: 2px; background: #f0c81c; border-radius: 2px;
}
body.mg-modal-open { overflow: hidden; }

/* ---- Floating WhatsApp button ---- */
.mg-wa-float {
  position: fixed; right: 18px; bottom: 18px; z-index: 99998;
  width: 56px; height: 56px; border-radius: 50%;
  background: #25d366; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(0,0,0,.45);
}
.mg-wa-float img { width: 34px; height: 34px; object-fit: contain; }
@media only screen and (max-width: 767px) {
  .mg-wa-float { right: 14px; bottom: 70px; width: 50px; height: 50px; }
}
`;

// Minimal interactivity for the static snapshot (loaded as an external file
// so the CSP's script-src 'self' allows it while inline JS stays blocked).
const STATIC_FIX_JS = `// Hamburger drawer: theme shows it via .point-menu.show
(function () {
  function menu() { return document.querySelector('.point-menu'); }

  document.addEventListener('click', function (e) {
    var closest = e.target.closest ? e.target.closest.bind(e.target) : function () { return null; };
    var m = menu();

    // inert "#!" links must not put the hash into the URL
    if (closest('a[href="#!"]')) e.preventDefault();

    // hamburger opens/closes the drawer
    if (m && closest('.menu-button-mobile')) {
      e.preventDefault();
      m.classList.toggle('show');
      return;
    }

    // bootstrap-style dropdowns (sports submenus): toggle sibling .dropdown-menu
    var t = closest('.dropdown-toggle');
    if (t) {
      var dm = t.nextElementSibling;
      if (dm && dm.classList.contains('dropdown-menu')) {
        e.preventDefault();
        dm.classList.toggle('show');
        return;
      }
    }

    // hero carousel arrows scroll the snap strip
    var ctrl = closest('.carousel-control-prev') || closest('.carousel-control-next');
    if (ctrl) {
      e.preventDefault();
      var inner = ctrl.getAttribute('aria-controls')
        ? document.getElementById(ctrl.getAttribute('aria-controls'))
        : null;
      if (!inner) {
        var c = ctrl.closest('.carousel');
        inner = c && c.querySelector('.carousel-inner');
      }
      if (inner) {
        var dir = ctrl.classList.contains('carousel-control-prev') ? -1 : 1;
        inner.scrollBy({ left: dir * inner.clientWidth, behavior: 'smooth' });
      }
      return;
    }

    // lion chat bubble (left) -> WhatsApp
    if (closest('.woot-widget-bubble') || closest('.woot--bubble-holder')) {
      e.preventDefault();
      window.location.href = WHATSAPP_URL;
      return;
    }

    // game tiles / matches -> login modal
    var modal = document.getElementById('mgLoginModal');
    if (modal) {
      if (e.target === modal || closest('.mg-login-close')) {
        e.preventDefault();
        modal.classList.remove('open');
        document.body.classList.remove('mg-modal-open');
        return;
      }
      if (!closest('.mg-login-dialog')) {
        var gameSel = '.home-casiono-icons a, .home-casiono-icons img, .home-casiono-icons li, .point-casino-list a, .point-casino-list img, .our-casino a, .our-casino img, .casino-img, .game-title, .game-name, .game-icons, .game-icon, .match-odd, .sport-tabs a, .carousel-item, .dropdown-menu a, .mg-game-tile, .pg-tab, .pg-provider';
        if (closest(gameSel) && !closest('.dropdown-toggle')) {
          e.preventDefault();
          modal.classList.add('open');
          document.body.classList.add('mg-modal-open');
          return;
        }
      }
    }

    // click outside the open drawer closes it
    if (m && m.classList.contains('show') && !closest('.point-menu')) {
      m.classList.remove('show');
    }
  });

  // Register / Login / Demo / APK -> WhatsApp
  var WHATSAPP_URL = 'https://wa.link/ultra';
  document.querySelectorAll('.register-btn,.login-btn,.btn-demo').forEach(function (b) {
    b.removeAttribute('disabled');
    b.addEventListener('click', function (e) { e.preventDefault(); window.location.href = WHATSAPP_URL; });
  });
  // header login button has no dedicated class: match by label
  document.querySelectorAll('button').forEach(function (b) {
    if (/^\\s*login\\s*$/i.test(b.textContent)) {
      b.removeAttribute('disabled');
      b.addEventListener('click', function (e) { e.preventDefault(); window.location.href = WHATSAPP_URL; });
    }
  });
  document.querySelectorAll('a').forEach(function (a) {
    if (a.querySelector('.dwld-apk')) a.href = WHATSAPP_URL;
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var m = menu();
      if (m) m.classList.remove('show');
      var modal = document.getElementById('mgLoginModal');
      if (modal) {
        modal.classList.remove('open');
        document.body.classList.remove('mg-modal-open');
      }
    }
  });
})();
`;

function stripAttr(tag, names) {
  for (const n of names) {
    tag = tag.replace(new RegExp('\\s' + n + '\\s*=\\s*"[^"]*"', 'gi'), '');
    tag = tag.replace(new RegExp("\\s" + n + "\\s*=\\s*'[^']*'", 'gi'), '');
    tag = tag.replace(new RegExp('\\s' + n + '\\s*=\\s*[^\\s>]+', 'gi'), '');
  }
  return tag;
}

let html = fs.readFileSync(SRC_HTML, 'utf8');
const before = html.length;

// 1. Remove script / iframe / noscript blocks entirely
html = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
html = html.replace(/<script\b[^>]*\/?>/gi, '');
html = html.replace(/<iframe\b[\s\S]*?(<\/iframe\s*>|$)/gi, '');
html = html.replace(/<noscript\b[\s\S]*?(<\/noscript\s*>|$)/gi, '');

// 2. Clean every tag: drop inline handlers, neutralize links/forms
html = html.replace(/<[a-zA-Z][^<>]*>/g, (tag) => {
  // strip on* event handler attributes
  tag = tag.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  tag = tag.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  tag = tag.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
  tag = stripAttr(tag, ['formaction', 'formmethod', 'formtarget', 'target']);

  const name = (tag.match(/^<([a-zA-Z]+)/) || [])[1];
  if (name === 'a' || name === 'area') {
    tag = tag.replace(/\shref\s*=\s*"[^"]*"/i, ' href="#!"');
    tag = tag.replace(/\shref\s*=\s*'[^']*'/i, " href='#!'");
    tag = tag.replace(/\shref\s*=\s*[^\s>]+/i, ' href="#!"');
  } else if (name === 'form') {
    tag = stripAttr(tag, ['action', 'method', 'target']);
  }
  return tag;
});

// 3. Submit buttons become inert buttons
html = html.replace(/type\s*=\s*(['"])submit\1/gi, 'type="button"');

// 4. Point the saved "_files" references at ./assets, and remote banner
//    backgrounds at ./img/banners (downloaded by fetch-assets.js)
html = html.split(ASSET_REF + '/').join('./assets/');
html = html.split(ASSET_REF).join('./assets');
html = html.split('https://sitethemedata.com/sitethemes/mglion.com/front/banners/')
  .join('./img/banners/');

// Rename extension-less / oddly-named assets so static hosts (Vercel adds
// X-Content-Type-Options: nosniff) serve them with a valid CSS MIME type.
const ASSET_RENAMES = {
  'animate.css@3.5.1': 'animate-3.5.1.css',
  'css2': 'css2.css',
};
for (const [from, to] of Object.entries(ASSET_RENAMES)) {
  html = html.split(`./assets/${from}"`).join(`./assets/${to}"`);
  html = html.split(`./assets/${from}'`).join(`./assets/${to}'`);
}

// Drop hero slides whose banner image no longer exists on the CDN
// (fetch-assets.js downloads what is still available).
html = html.replace(
  /<div role="listitem" class="carousel-item[^"]*"[^>]*?url\(&quot;\.\/img\/banners\/([^&")]+)&quot;\);?"[^>]*>[\s\S]*?<\/div>/g,
  (tag, file) =>
    fs.existsSync(path.join(OUT_DIR, 'img', 'banners', file)) ? tag : ''
);

// 5. Local favicon instead of the remote one
html = html.replace(
  /<link rel="icon"[^>]*>/i,
  '<link rel="icon" href="./assets/logo.png">'
);

// 6. CSP: only same-origin static resources + our own external script file.
//    Inline scripts and remote code still can never run.
html = html.replace(
  /<head>/i,
  '<head><meta http-equiv="Content-Security-Policy" content="script-src \'self\'; object-src \'none\'; frame-src \'none\'; base-uri \'none\'; form-action \'none\'">'
);
// Google Search Console verification for this deployment
html = html.replace(
  /<meta name="google-site-verification"[^>]*>/i,
  '<meta name="google-site-verification" content="wFQitoEEuuVeT44tH3N_EJGWd6UIlcXug3iCST2c3bE" />'
);

// 7. Static fixes for JS-driven widgets (hooper carousels) — see static-fix.css
html = html.replace(
  /<\/head>/i,
  '<link rel="stylesheet" href="./static-fix.css"></head>'
);
// Login modal (shown when a game is clicked) + floating WhatsApp button.
// Markup lives in the HTML so the floating button works even with JS off.
html = html.replace(
  /<\/body>/i,
  `
<div class="mg-login-modal" id="mgLoginModal" aria-hidden="true">
  <div class="mg-login-dialog" role="dialog" aria-label="Login">
    <div class="mg-login-head"><span>Login</span>
      <button type="button" class="mg-login-close" aria-label="Close">&times;</button>
    </div>
    <div class="mg-login-body">
      <label class="mg-login-label">Username</label>
      <input type="text" class="mg-login-input" placeholder="Enter Username">
      <label class="mg-login-label">Password</label>
      <div class="mg-login-pass">
        <input type="password" class="mg-login-input" placeholder="Enter Password">
        <span class="mg-login-eye"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></span>
      </div>
      <label class="mg-login-check"><input type="checkbox" checked>
        <span>I am at least <u>18 years</u> of age and I have read, accept and agree to the <u>Terms and Conditions</u>, <u>Responsible Gaming</u>, <u>GamCare</u>, <u>Gambling Therapy</u></span>
      </label>
      <a href="https://wa.link/ultra" class="mg-login-btn">Login</a>
      <div class="mg-login-or"><span>or</span></div>
      <a href="https://wa.link/ultra" class="mg-login-btn mg-wa-btn">Get ID on Whatsapp</a>
    </div>
  </div>
</div>
<a href="https://wa.link/ultra" class="mg-wa-float" aria-label="Chat on WhatsApp"><img src="./assets/whatsapp.png" alt="WhatsApp"></a>
<script src="./static-fix.js" defer></script></body>`
);

fs.mkdirSync(OUT_ASSETS, { recursive: true });
fs.cpSync(SRC_ASSETS, OUT_ASSETS, { recursive: true, force: true });
for (const [from, to] of Object.entries(ASSET_RENAMES)) {
  const f = path.join(OUT_ASSETS, from);
  if (fs.existsSync(f)) fs.renameSync(f, path.join(OUT_ASSETS, to));
}
// Prune unreferenced leftovers from the browser save (dead scripts/iframes —
// the page is pure HTML/CSS/JS-free, nothing links to them).
for (const f of fs.readdirSync(OUT_ASSETS)) {
  if (/\.download$/.test(f) || /^(js(\(1\))?|sweetalert2@11|v31edd.*|saved_resource\.html|widget\.html)$/.test(f)) {
    const p = path.join(OUT_ASSETS, f);
    try {
      fs.rmSync(p, { force: true });
    } catch (e) {
      // transient Windows file lock (AV scan / indexer) — retry once after a beat
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400);
      try { fs.rmSync(p, { force: true }); } catch (_) { /* leave it; harmless */ }
    }
  }
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'static-fix.css'), STATIC_FIX_CSS, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'static-fix.js'), STATIC_FIX_JS, 'utf8');

const stats = {
  inputBytes: before,
  outputBytes: html.length,
  scriptsLeft: (html.match(/<script/gi) || []).length,
  iframesLeft: (html.match(/<iframe/gi) || []).length,
  realHrefsLeft: (html.match(/<a\b[^>]*href="(?!#!)[^"]*"/gi) || []).length,
  assetRefs: (html.match(/\.\/assets\//g) || []).length,
};
console.log(stats);
console.log('Done -> ' + path.join(OUT_DIR, 'index.html'));
