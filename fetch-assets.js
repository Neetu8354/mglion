// Download assets that the saved CSS references but the browser didn't capture
// (fonts, icon webfonts, css background images).
const fs = require('fs');
const path = require('path');
const https = require('https');

const SITE = path.join(__dirname, 'site');
const SPRINT = 'https://wver.sprintstaticdata.com/v238/static/front';
const FA = 'https://use.fontawesome.com/releases/v5.7.0';

const files = [
  // [urlBase, urlPath, localRelativePath]
  ...[
    'fonts/SFPRODISPLAYBLACKITALIC.woff', 'fonts/SFPRODISPLAYBOLD.woff',
    'fonts/SFPRODISPLAYHEAVYITALIC.woff', 'fonts/SFPRODISPLAYMEDIUM.woff',
    'fonts/SFPRODISPLAYREGULAR.woff', 'fonts/SFPRODISPLAYSEMIBOLDITALIC.woff',
    'fonts/SFPRODISPLAYTHINITALIC.woff', 'fonts/SFPRODISPLAYULTRALIGHTITALIC.woff',
    'fonts/SFPRODISPLAYLIGHTITALIC.woff',
    'fonts/ab.ttf', 'fonts/advent-bold.ttf', 'fonts/advent-medium.ttf',
    'fonts/advent-regular.ttf', 'fonts/advent-thin.ttf', 'fonts/american-captain.OTF',
    'fonts/antonio.ttf', 'fonts/card.ttf', 'fonts/dfont.eot', 'fonts/dfont.svg',
    'fonts/dfont.ttf', 'fonts/dfont.woff', 'fonts/droidsans-bold.ttf',
    'fonts/droidsans.ttf', 'fonts/long.ttf', 'fonts/numeric.ttf',
    'fonts/timer.woff', 'fonts/timer.woff2', 'fonts/worli.woff', 'fonts/worli.woff2',
    'img/animation-bg.png', 'img/arrow-down.svg', 'img/arrow-right.png',
    'img/arrow-up.svg', 'img/balls/score-bg.png', 'img/calendar.png', 'img/coin.png',
    'img/coupon-blue.png', 'img/curve-left.png', 'img/curve-right.png', 'img/icon.svg',
    'img/last-result1.png', 'img/last-result2.png', 'img/last-result3.png',
    'img/last-result4.png', 'img/loading.svg', 'img/lock.svg', 'img/login-bg.jpg',
    'img/lottery/lottery-pattern.png', 'img/payment-bg.png', 'img/payment/pattern1.png',
    'img/payment2.png', 'img/trape-back.png', 'img/trape-bg.png',
    'img/vcasino-bg-mobile.jpg', 'img/vcasino-bg.jpg', 'img/vcasino-bg2.jpg',
    'img/virtual-casino/coins/coins-bg-2d.png', 'img/virtual-casino/coins/coins-bg.png',
    'img/vtrap-bg.png', 'img/wave2.svg',
    'images/vendor/vue-phone-number-input/dist/flags.9c96e0ed.png',
    'css/SFPRODISPLAYLIGHTITALIC.woff',
    'plugin/owl/assets/owl.video.play.png',
  ].map(p => [SPRINT, p, p]),
  ...[
    'webfonts/fa-brands-400.woff2', 'webfonts/fa-brands-400.woff', 'webfonts/fa-brands-400.ttf',
    'webfonts/fa-regular-400.woff2', 'webfonts/fa-regular-400.woff', 'webfonts/fa-regular-400.ttf',
    'webfonts/fa-solid-900.woff2', 'webfonts/fa-solid-900.woff', 'webfonts/fa-solid-900.ttf',
  ].map(p => [FA, p, p]),
];

function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetch(res.headers.location));
      }
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

// Hero banner backgrounds are remote URLs in the saved DOM — pull them local.
const SRC_HTM = path.join(__dirname, 'MGLION Official _ Get IPL ID, Get Cricket ID & Betting ID India.htm');
const BANNER_BASE = 'https://sitethemedata.com/sitethemes/mglion.com/front/banners/';
const bannerFiles = [
  ...new Set(
    (fs.readFileSync(SRC_HTM, 'utf8').match(
      /sitethemedata\.com\/sitethemes\/mglion\.com\/front\/banners\/[A-Za-z0-9._-]+/g
    ) || []).map(u => u.split('/').pop())
  ),
].map(name => ['', `__BANNER__${name}`, `img/banners/${name}`]);

(async () => {
  let ok = 0, miss = [];
  for (const [base, p, local] of [...files, ...bannerFiles]) {
    const dest = path.join(SITE, local);
    const url = p.startsWith('__BANNER__') ? BANNER_BASE + p.slice(10) : `${base}/${p}`;
    const data = await fetch(url);
    if (data) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, data);
      ok++;
    } else {
      miss.push(url);
    }
  }
  console.log(`downloaded ${ok}/${files.length + bannerFiles.length}`);
  if (miss.length) console.log('missing:\n' + miss.join('\n'));
})();
