'use strict';
/* ============================================================
 * a11y.js — 접근성: 격자칸 키보드 네비게이션 (과제 8 기반)
 * ------------------------------------------------------------
 *  - Backspace(빈 칸) → 이전 칸
 *  - ← / → → 칸 이동
 *  - Home / End → 첫 칸 / 마지막 칸
 *  - 체크(radio/checkbox) 포커스는 render 에서 tabindex·role·aria 부여
 * ============================================================ */
(function (App) {

  App.gridKeydown = function (e, f, i, c) {
    const cell = (n) => document.getElementById('f_' + f.id + '__' + n);

    switch (e.key) {
      case 'Backspace':
        if (!c.value) { const p = cell(i - 1); if (p) { p.focus(); e.preventDefault(); } }
        break;
      case 'ArrowLeft': {
        const p = cell(i - 1); if (p) { p.focus(); e.preventDefault(); } break;
      }
      case 'ArrowRight': {
        const n = cell(i + 1); if (n) { n.focus(); e.preventDefault(); } break;
      }
      case 'Home': { const h = cell(0); if (h) { h.focus(); e.preventDefault(); } break; }
      case 'End': { const t = cell(f.cells - 1); if (t) { t.focus(); e.preventDefault(); } break; }
      default: break;
    }
  };

})(window.App = window.App || {});
