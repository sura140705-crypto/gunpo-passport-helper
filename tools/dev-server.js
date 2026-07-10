'use strict';
/* ============================================================
 * dev-server.js — 무의존 정적 개발 서버
 *   실행:  node tools/dev-server.js  (기본 포트 5173)
 *   접속:  http://localhost:5173
 * ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 5173;

const TYPES = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.pdf':'application/pdf',
  '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon'
};

/* ── 좌표 저장: 스키마 소스(.js)의 기하 속성을 제자리 패치 ──
 *  좌표 편집기(coord-editor.html)가 POST /__save-coords 로 호출.
 *  body: { schemaId, coords:{ fieldId:{x,y,w,h,cells,cellW,gap,sep} } }
 *  각 필드 객체 리터럴(id:'…' ~ 다음 id:'… 직전) 안에서
 *  이미 존재하는 key:number 만 새 값으로 치환한다(신규 키 삽입 없음).
 */
const GEOM_KEYS = ['x', 'y', 'w', 'h', 'cells', 'cellW', 'gap', 'sep'];

function patchSchemaCoords(schemaId, coords) {
  const rel = 'src/schemas/' + schemaId + '.js';
  const file = path.join(ROOT, rel);
  let src = fs.readFileSync(file, 'utf8');
  const patched = [], missedFields = [], missedKeys = [];

  Object.keys(coords).forEach((fid) => {
    const marker = "id:'" + fid + "'";
    const start = src.indexOf(marker);
    if (start < 0) { missedFields.push(fid); return; }
    let next = src.indexOf("id:'", start + marker.length);
    const end = next < 0 ? src.length : next;
    let region = src.slice(start, end);

    GEOM_KEYS.forEach((key) => {
      if (!(key in coords[fid])) return;
      const val = coords[fid][key];
      const re = new RegExp('(\\b' + key + ':\\s*)(-?\\d+(?:\\.\\d+)?)');
      if (re.test(region)) region = region.replace(re, '$1' + val);
      else missedKeys.push(fid + '.' + key);
    });

    src = src.slice(0, start) + region + src.slice(end);
    patched.push(fid);
  });

  fs.writeFileSync(file, src, 'utf8');
  return { file: rel, patched, missedFields, missedKeys };
}

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);

  // ── 좌표 저장 엔드포인트 ──
  if (req.method === 'POST' && rel === '/__save-coords') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const { schemaId, coords } = JSON.parse(body);
        if (!/^[a-z0-9_-]+$/i.test(schemaId || '')) throw new Error('잘못된 schemaId');
        const result = patchSchemaCoords(schemaId, coords || {});
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, ...result }));
        console.log(`✓ 좌표 저장: ${result.file} — 필드 ${result.patched.length}개 갱신`);
        if (result.missedFields.length) console.log('  누락 필드:', result.missedFields.join(', '));
        if (result.missedKeys.length) console.log('  누락 키:', result.missedKeys.join(', '));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
        console.error('✗ 좌표 저장 실패:', e.message);
      }
    });
    return;
  }

  if (rel === '/') rel = '/index.html';
  const file = path.join(ROOT, rel);

  // 루트 밖 접근 차단
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); return res.end('404 Not Found: ' + rel); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`민원실 도우미 개발 서버:  http://localhost:${PORT}`);
  console.log(`(종료: Ctrl+C)`);
});
