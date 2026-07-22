'use strict';
/* ============================================================
 * build-form.js — 가족관계등록 신고서 도우미 생성기
 *   engine/base.html + engine/engine.js + forms/<이름>.config.js
 *   + engine/assets/<이름>.b64(배경) → <이름>-helper-v1.html (자체완결)
 *
 *   사용:  node tools/build-form.js <이름> [출력파일]
 *   예:   node tools/build-form.js birth              →  birth-helper-v1.html
 *         node tools/build-form.js birth _gen.html    →  _gen.html (검증용)
 *
 *   ※ 배경 base64는 먼저 만들어 두어야 함:
 *      python tools/prep-bg.py <이름> <서식.pdf>
 * ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const name = process.argv[2];
if (!name) { console.error('사용: node tools/build-form.js <이름>'); process.exit(1); }

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.error('없는 파일: ' + rel); process.exit(1); }
  return fs.readFileSync(p, 'utf8');
}
// </script> 조기 종료 방지
function safe(js) { return js.replace(/<\/script/gi, '<\\/script'); }

const base   = read('engine/base.html');
const engine = read('engine/engine.js');
const config = read('forms/' + name + '.config.js');
const bg     = read('engine/assets/' + name + '.b64').trim();

let html = base
  .replace('/*{{CONFIG}}*/', safe(config))
  .replace('/*{{ENGINE}}*/', safe(engine))
  .replace('__BGDATA__', bg);

if (html.indexOf('/*{{CONFIG}}*/') >= 0 || html.indexOf('/*{{ENGINE}}*/') >= 0 || html.indexOf('__BGDATA__') >= 0) {
  console.error('경고: 치환되지 않은 플레이스홀더가 남아 있습니다.'); process.exit(1);
}

const outRel = process.argv[3] || (name + '-helper-v1.html');
fs.writeFileSync(path.join(ROOT, outRel), html, 'utf8');
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log('✓ 생성 완료: ' + outRel + ' (' + kb + ' KB)');
