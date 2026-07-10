'use strict';
/* ============================================================
 * render.js — 화면 렌더링
 *   시작화면 / 2단 위저드(좌: 실시간 서식, 우: 단계별 안내·입력) / 검토·발급
 * ============================================================ */
(function (App) {
  const state = App.state;
  const $ = (id) => document.getElementById(id);
  const schema = () => App.schemas[state.schemaId];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[<>"'&]/g,
      c => ({ '<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;' }[c]));
  }
  App.esc = esc;
  const brk = (s) => esc(s).replace(/\n/g, '<br>');

  // ── 진입점 ────────────────────────────────────────────────
  function render() {
    if (state.view === 'form') renderForm();
    else renderIntro();
  }
  App.render = render;

  function renderHeader(crumb) {
    return `
      <header>
        <div class="hgroup">
          <h1 tabindex="0" role="button" onclick="App.goHome()" onkeydown="if(event.key==='Enter')App.goHome()">시청 민원실 작성 도우미</h1>
          ${crumb ? `<span class="crumb">› ${esc(crumb)}</span>` : ''}
        </div>
        <div class="controls">
          <span class="label">글자 크기</span>
          <button class="ctl-btn" onclick="App.changeFontSize(-2)" aria-label="글자 작게">가-</button>
          <button class="ctl-btn" onclick="App.changeFontSize(2)" aria-label="글자 크게">가+</button>
          ${state.view !== 'intro' ? '<button class="ctl-btn" onclick="App.confirmReset()">처음으로</button>' : ''}
        </div>
      </header>`;
  }

  // ── 시작 화면 ─────────────────────────────────────────────
  function renderIntro() {
    const items = App.schemaOrder.map((id) => {
      const s = App.schemas[id];
      const disabled = s.disabled ? 'disabled' : '';
      const attrs = s.disabled
        ? 'aria-disabled="true"'
        : `tabindex="0" role="button" onclick="App.selectSchema('${id}')" onkeydown="if(event.key==='Enter')App.selectSchema('${id}')"`;
      const badgeCls = s.disabled ? 'soon' : (s.badge === '약식' ? 'simple' : '');
      return `
        <div class="menu-item ${disabled}" ${attrs}>
          <span class="badge ${badgeCls}">${esc(s.badge || (s.disabled ? '준비중' : '정식'))}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.sub || '')}</p>
        </div>`;
    }).join('');

    App.app.innerHTML = `
      ${renderHeader('')}
      <main class="intro">
        <h2>어떤 민원을 신청하시나요?</h2>
        <p class="sub">아래 신청서를 선택하시면 작성 도우미가 시작됩니다.<br>
        입력하신 내용은 화면에서만 사용되며 시청 시스템에 저장되지 않습니다.</p>
        <div class="menu-grid">${items}</div>
        <p class="sub" style="margin-top:36px;font-size:15px;">
          ※ 글자가 작게 보이시면 우측 상단 [가+] 버튼을 눌러 키우실 수 있습니다.
        </p>
      </main>`;
  }

  // ── 작성 화면 (2단 위저드) ────────────────────────────────
  function renderForm() {
    const s = schema();
    const svg = App.assets[s.bg] || '';
    App.app.innerHTML = `
      ${renderHeader(s.title)}
      <main class="wiz">
        <section class="wiz-form" aria-label="신청서 미리보기">
          <div class="wiz-form-bar">
            <div class="title">${esc(s.title)} · 미리보기</div>
            <div class="zoom-ctl">
              <span class="zlabel">화면 크기</span>
              <button class="ctl-btn" onclick="App.changeZoom(-0.1)" aria-label="화면 축소">축소</button>
              <span id="zoomVal">100%</span>
              <button class="ctl-btn" onclick="App.changeZoom(0.1)" aria-label="화면 확대">확대</button>
            </div>
          </div>
          <div class="wiz-canvas-scroll">
            <div class="canvas-sizer" id="canvasSizer">
              <div class="form-canvas" id="canvas">
                ${svg}
                <div id="gridLayer" aria-hidden="true"></div>
                <div id="valueLayer" aria-hidden="true"></div>
                <div id="stepHighlight"></div>
              </div>
            </div>
          </div>
        </section>
        <aside class="wiz-panel" id="wizPanel" aria-live="polite"></aside>
      </main>`;

    App.renderGridCells();
    App.renderValueLayer();
    App.gotoStep(state.step || 0);
    App.fitPreview();
    window.addEventListener('resize', App.fitPreview);
  }

  // ── 단계 필드 목록(원래 순서 유지) ────────────────────────
  App.stepFieldIds = function (step) {
    const s = schema();
    const ids = new Set(step.fields || []);
    (step.groups || []).forEach(g => s.fields.forEach(f => { if (f.group === g) ids.add(f.id); }));
    return s.fields.filter(f => ids.has(f.id)).map(f => f.id);   // 스키마 순서대로
  };
  App.stepOfField = function (fid) {
    const s = schema();
    for (let i = 0; i < s.steps.length; i++) {
      if (App.stepFieldIds(s.steps[i]).includes(fid)) return i;
    }
    return 0;
  };

  // ── 우측 단계 패널 ────────────────────────────────────────
  App.renderStep = function (i) {
    const s = schema(), steps = s.steps, st = steps[i];
    const last = i === steps.length - 1;
    const fields = st.fields ? st.fields.map(id => s.fields.find(f => f.id === id)) : [];
    const groups = st.groups || [];
    const rendered = new Set();
    let controls = '';

    App.stepFieldIds(st).forEach(fid => {
      const f = s.fields.find(x => x.id === fid);
      if (f.group) {
        if (rendered.has(f.group)) return;
        rendered.add(f.group);
        controls += groupControl(s, f.group);
      } else {
        controls += fieldControl(f);
      }
    });

    const dots = steps.map((_, k) =>
      `<span class="dot ${k === i ? 'on' : ''} ${k < i ? 'done' : ''}"></span>`).join('');

    $('wizPanel').innerHTML = `
      <div class="step-top">
        <div class="dots" aria-hidden="true">${dots}</div>
        <div class="step-count">단계 ${i + 1} / ${steps.length}</div>
      </div>
      <h2 class="step-title">${esc(st.title)}${st.required ? ' <span class="req">*필수</span>' : ''}</h2>
      <div class="step-help">${brk(st.help || '')}</div>
      <div class="step-controls">${controls}</div>
      <div class="step-err" id="stepErr"></div>
      <div class="step-nav">
        ${i > 0 ? '<button class="btn" onclick="App.prevStep()">← 이전</button>' : '<span></span>'}
        ${last
          ? '<button class="btn primary large" onclick="App.openReview()">작성 완료 · 검토하기</button>'
          : '<button class="btn primary large" onclick="App.nextStep()">다음 →</button>'}
      </div>
      <div class="step-progress">필수 항목 <strong>${App.countFilled()} / ${App.countRequired()}</strong> 작성 완료</div>`;

    App.wireStep(st);
    App.highlightStep(i);
  };

  function groupControl(s, g) {
    const members = s.fields.filter(f => f.group === g);
    const req = (s.requiredGroups || []).includes(g);
    const sel = state.data[g];
    const guide = (members[0] && members[0].guide) || {};
    const cond = s.groupCond && s.groupCond[g];
    const enabled = !cond || cond(state.data);
    const opts = members.map(m =>
      `<button type="button" class="opt ${sel === m.id ? 'on' : ''}" data-group="${g}" data-id="${m.id}"
        aria-pressed="${sel === m.id}" ${enabled ? '' : 'disabled'}>${esc(m.label)}</button>`).join('');
    return `
      <div class="q ${enabled ? '' : 'q-disabled'}" data-group="${g}">
        <div class="q-label">${esc((s.groupLabels || {})[g] || g)}${req ? '<span class="req"> *</span>' : ''}</div>
        ${enabled && guide.body ? `<div class="q-help">${esc(guide.body)}</div>` : ''}
        ${!enabled ? '<div class="q-help">여행증명서를 선택하면 활성화됩니다.</div>' : ''}
        <div class="opts">${opts}</div>
      </div>`;
  }

  function fieldControl(f) {
    const g = f.guide || {};
    const v = state.data[f.id] || '';
    const err = state.errors[f.id] ? 'err' : '';
    const maxlen = f.type === 'grid' ? ` maxlength="${f.cells}"` : (f.maxlength ? ` maxlength="${f.maxlength}"` : '');
    const im = f.digitsOnly ? ' inputmode="numeric"' : '';
    const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '';
    return `
      <div class="q" data-field="${f.id}">
        <label class="q-label" for="in_${f.id}">${esc(f.label)}${f.required ? '<span class="req"> *</span>' : ''}</label>
        ${g.body ? `<div class="q-help">${esc(g.body)}${g.example ? ` <b class="q-ex">${esc(g.example)}</b>` : ''}</div>` : ''}
        <input id="in_${f.id}" class="q-input ${err}" value="${esc(v)}"${maxlen}${im}${ph}
          autocomplete="off" spellcheck="false" aria-label="${esc(f.label)}">
        ${g.warn ? `<div class="q-warn">⚠ ${esc(g.warn)}</div>` : ''}
      </div>`;
  }

  // ── 좌측 서식에 값 배치(정적 텍스트) ──────────────────────
  App.cellLefts = function (f) {
    const arr = []; let cx = f.x;
    for (let i = 0; i < f.cells; i++) {
      if (f.sep && i === f.sep) cx += 12;
      arr.push(cx);
      cx += f.cellW + f.gap;
    }
    return arr;
  };
  App.cellCenters = function (f) {
    return App.cellLefts(f).map(lx => lx + f.cellW / 2);
  };

  // 격자칸을 규칙적으로 직접 그림(칸 = 값 위치, 동일 좌표 → 정렬 정확)
  App.renderGridCells = function () {
    const s = schema();
    let html = '';
    s.fields.forEach(f => {
      if (f.type !== 'grid') return;
      App.cellLefts(f).forEach(lx => {
        html += `<div class="gcell" style="left:${lx}px;top:${f.y}px;width:${f.cellW}px;height:${f.h}px;"></div>`;
      });
    });
    const el = $('gridLayer');
    if (el) el.innerHTML = html;
  };

  App.renderValueLayer = function () {
    const s = schema();
    let html = '';
    s.fields.forEach(f => {
      if (f.type === 'grid') {
        const v = String(state.data[f.id] || '');
        if (!v) return;
        const cx = App.cellCenters(f);
        const fs = Math.round(Math.min(f.cellW, f.h) * 0.72);
        for (let i = 0; i < f.cells && i < v.length; i++) {
          if (v[i] === ' ') continue;
          html += `<span class="pv pv-cell" style="left:${cx[i]}px;top:${f.y + f.h / 2}px;font-size:${fs}px;">${esc(v[i])}</span>`;
        }
      } else if (f.type === 'text') {
        const v = state.data[f.id] || '';
        if (!v) return;
        html += `<span class="pv pv-text" style="left:${f.x + 3}px;top:${f.y + f.h / 2}px;max-width:${(f.w || 200) - 6}px;">${esc(v)}</span>`;
      }
    });
    // 체크(그룹/단독) → 선택된 위치에 ✔
    (function () {
      const groups = {};
      s.fields.forEach(f => { if (f.type === 'check' && f.group) (groups[f.group] = groups[f.group] || []).push(f); });
      Object.keys(groups).forEach(g => {
        const selId = state.data[g];
        const f = selId && groups[g].find(x => x.id === selId);
        if (f) html += checkMark(f);
      });
      s.fields.forEach(f => { if (f.type === 'check' && !f.group && state.data[f.id]) html += checkMark(f); });
    })();
    const layer = $('valueLayer');
    if (layer) layer.innerHTML = html;
  };
  function checkMark(f) {
    return `<span class="pv pv-check" style="left:${f.x + f.w / 2}px;top:${f.y + f.h / 2}px;font-size:${Math.round(f.h * 1.05)}px;">✔</span>`;
  }

  // ── 현재 단계 위치 강조(좌측 서식) ────────────────────────
  App.highlightStep = function (i) {
    const s = schema(), st = s.steps[i];
    const fs = App.stepFieldIds(st).map(id => s.fields.find(f => f.id === id));
    if (!fs.length) { const h = $('stepHighlight'); if (h) h.style.display = 'none'; return; }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    fs.forEach(f => {
      const w = f.type === 'grid' ? (f.cells * (f.cellW + f.gap) + (f.sep ? 12 : 0)) : (f.w || 14);
      const h = f.h || 14;
      x0 = Math.min(x0, f.x); y0 = Math.min(y0, f.y);
      x1 = Math.max(x1, f.x + w); y1 = Math.max(y1, f.y + h);
    });
    const pad = 6;
    const el = $('stepHighlight');
    if (!el) return;
    el.style.display = 'block';
    el.style.left = (x0 - pad) + 'px'; el.style.top = (y0 - pad) + 'px';
    el.style.width = (x1 - x0 + pad * 2) + 'px'; el.style.height = (y1 - y0 + pad * 2) + 'px';
  };

  // ── 진행률 ────────────────────────────────────────────────
  App.countRequired = function () {
    const s = schema();
    return s.fields.filter(f => f.required).length + (s.requiredGroups || []).length;
  };
  App.countFilled = function () {
    const s = schema();
    const f1 = s.fields.filter(f => f.required && String(state.data[f.id] || '').trim()).length;
    const g1 = (s.requiredGroups || []).filter(g => state.data[g]).length;
    return f1 + g1;
  };
  App.updateProgress = function () {
    const bar = document.querySelector('.step-progress');
    if (bar) bar.innerHTML = `필수 항목 <strong>${App.countFilled()} / ${App.countRequired()}</strong> 작성 완료`;
  };

  // ── 검토 모달 ─────────────────────────────────────────────
  App.openReview = function () {
    const s = schema();
    const results = [];

    (s.requiredGroups || []).forEach(g => {
      if (!state.data[g]) results.push({ status:'err', label:(s.groupLabels||{})[g] || g, msg:'선택되지 않았습니다.', target:g });
      else {
        const sel = s.fields.find(f => f.id === state.data[g]);
        results.push({ status:'ok', label:(s.groupLabels||{})[g] || g, msg:`[${sel ? sel.label : ''}] 선택됨` });
      }
    });

    s.fields.forEach(f => {
      if (f.type === 'check') return;
      const v = state.data[f.id] || '';
      if (f.required && !String(v).trim()) {
        results.push({ status:'err', label:f.label, msg:'입력되지 않았습니다.', target:f.id });
      } else if (f.validate) {
        const err = f.validate(v);
        if (err) results.push({ status:'err', label:f.label, msg:err, target:f.id });
        else if (v) results.push({ status:'ok', label:f.label, msg:'정상 입력됨' });
      } else if (v) {
        results.push({ status:'ok', label:f.label, msg:'입력됨' });
      }
    });

    (s.reviewNotes ? s.reviewNotes(state.data) : []).forEach(w =>
      results.push({ status:'warn', label:'안내', msg:w }));

    const hasError = results.some(r => r.status === 'err');
    const okN = results.filter(r => r.status === 'ok').length;
    const errN = results.filter(r => r.status === 'err').length;
    const warnN = results.filter(r => r.status === 'warn').length;

    const items = results.map(r => {
      const icon = r.status === 'ok' ? '✓' : (r.status === 'warn' ? '!' : '✗');
      const jump = r.target ? `<button class="jump" onclick="App.jumpTo('${r.target}')">이동</button>` : '';
      return `<div class="check-item ${r.status}"><div class="icon" aria-hidden="true">${icon}</div>
        <div class="text"><span class="field-name">${esc(r.label)}</span> — ${esc(r.msg)}</div>${jump}</div>`;
    }).join('');

    App.openModal('reviewModal', `
      <h2>${hasError ? '작성 내용을 확인해주세요' : '작성 내용 검토 완료'}</h2>
      <div class="modal-sub">정상 ${okN}건 · 오류 ${errN}건 · 안내 ${warnN}건</div>
      ${items}
      <div class="modal-actions">
        <button class="btn" onclick="App.closeModal()">계속 작성</button>
        <button class="btn primary large" onclick="App.goFinish()" ${hasError ? 'disabled' : ''}>
          ${hasError ? '오류 수정 후 진행 가능' : '발급 단계로 진행 →'}
        </button>
      </div>`);
  };

  App.jumpTo = function (idOrGroup) {
    App.closeModal();
    const step = App.stepOfField(idOrGroup);
    App.gotoStep(step);
    setTimeout(() => { const el = $('in_' + idOrGroup); if (el) el.focus(); }, 60);
  };

  // ── 발급 단계 ─────────────────────────────────────────────
  App.goFinish = function () {
    App.closeModal();
    App.openModal('finishModal', `
      <h2>작성이 완료되었습니다</h2>
      <div class="modal-sub">아래 방법 중 하나를 선택해주세요.</div>
      <div class="finish-grid">
        <button class="finish-card" onclick="App.doPrint('A4')"><h3>일반용지 프린터로 인쇄</h3>
          <p>A4 일반 용지에 출력합니다. 작성 확인용·임시 보관용에 적합합니다.</p></button>
        <button class="finish-card" onclick="App.doPrint('OFFICIAL')"><h3>신청서 전용 프린터로 인쇄</h3>
          <p>여권 신청서 전용 용지에 출력합니다. 접수 제출용입니다.</p></button>
        <button class="finish-card" onclick="App.doSavePDF()"><h3>PDF로 저장</h3>
          <p>USB·이메일로 가져가실 때 사용하세요. 댁에서 인쇄도 가능합니다.</p></button>
        <button class="finish-card" onclick="App.closeModal()"><h3>다시 검토하기</h3>
          <p>작성 내용을 한 번 더 확인하고 싶으시면 선택하세요.</p></button>
      </div>
      <div class="note warn" style="margin-top:18px;">
        <strong>인쇄 후 안내</strong><br>
        ① 출력물의 성명 옆에 검은색 펜으로 서명 또는 도장을 찍어주세요.<br>
        ② 사진(3.5×4.5cm, 6개월 이내)은 창구에서 부착합니다.<br>
        ③ 본인 신분증과 함께 접수 창구에 제출해주세요.
      </div>
      <div class="modal-actions">
        <button class="btn danger" onclick="App.confirmReset()">완료 후 화면 초기화</button>
      </div>`);
  };

  // ── 모달 유틸 ─────────────────────────────────────────────
  App.openModal = function (id, inner) {
    App.closeModal();
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = id;
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="modal">${inner}</div>`;
    document.body.appendChild(m);
    const first = m.querySelector('button');
    if (first) first.focus();
  };
  App.closeModal = function () {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  };

})(window.App = window.App || {});
