'use strict';
/* ============================================================
 * build.js — 무의존 번들러
 *   모듈 소스(styles.css + src/**.js + assets/*.svg)를
 *   배포용 단일 자체완결 HTML(dist/작성도우미.html)로 번들.
 *   실행:  node build.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(OUT_DIR, '작성도우미.html');

// index.html 과 동일한 로드 순서
const JS_ORDER = [
  'src/core/state.js',
  'src/lib/romanize.js',
  'src/lib/validate.js',
  'src/lib/juso.js',
  'src/schemas/index.js',
  'src/schemas/passport.js',
  'src/schemas/family.js',
  'src/schemas/land.js',
  'src/schemas/seal.js',
  'src/core/render.js',
  'src/core/a11y.js',
  'src/core/app.js'
];

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// </script> 조기 종료 방지
function safe(js) { return js.replace(/<\/script/gi, '<\\/script'); }

function build() {
  const css = read('src/styles.css');

  // 자산(SVG) 수집: 스키마 파일에서 bg: '...' 추출
  const assetIds = new Set();
  JS_ORDER.filter(f => f.startsWith('src/schemas/')).forEach(f => {
    const m = read(f).match(/bg:\s*'([^']+)'/g) || [];
    m.forEach(s => assetIds.add(s.match(/bg:\s*'([^']+)'/)[1]));
  });
  const assets = {};
  assetIds.forEach(id => { assets[id] = read('src/assets/' + id + '.svg'); });

  const jsBundle = JS_ORDER.map(f =>
    `\n/* ===== ${f} ===== */\n` + read(f)
  ).join('\n');

  const bootstrap = `
/* ===== bootstrap (빌드 주입) ===== */
window.App.assets = ${JSON.stringify(assets)};
window.App.start();
`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>민원실 신청서 작성 도우미</title>
<meta name="description" content="시청 민원실 신청서 작성 도우미 — 어르신 친화, 양식 위 작성, 무저장">
<style>
${css}
</style>
</head>
<body>
<a href="#app" class="skip-link" style="position:absolute;left:-999px;">본문 바로가기</a>
<div id="app" role="application" aria-label="신청서 작성 도우미"></div>
<script>
'use strict';
window.App = window.App || {};
${safe(jsBundle)}
${safe(bootstrap)}
</script>
</body>
</html>
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, html, 'utf8');

  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`✓ 빌드 완료: dist/작성도우미.html (${kb} KB)`);
  console.log(`  포함 스크립트 ${JS_ORDER.length}개, 자산 ${Object.keys(assets).length}개 [${Object.keys(assets).join(', ')}]`);
}

build();
