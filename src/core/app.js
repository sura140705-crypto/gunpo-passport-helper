'use strict';
/* ============================================================
 * app.js — 위저드 진행 · 입력 처리 · 자동완성 · 미리보기 · 인쇄 · 부팅
 * ============================================================ */
(function (App) {
  const state = App.state;
  const $ = (id) => document.getElementById(id);
  const schema = () => App.schemas[state.schemaId];

  // ── 스키마 선택 ───────────────────────────────────────────
  App.selectSchema = function (id) {
    const s = App.schemas[id];
    if (!s || s.disabled) return;
    state.schemaId = id;
    App.clearData();
    state.step = 0;
    state.view = 'form';
    App.render();
    App.resetIdleTimer();
  };

  // ── 단계 이동 ─────────────────────────────────────────────
  App.gotoStep = function (i) {
    const steps = schema().steps;
    state.step = Math.max(0, Math.min(steps.length - 1, i));
    App.renderStep(state.step);
    scrollToHighlight();
    App.resetIdleTimer();
  };
  function scrollToHighlight() {
    const hl = $('stepHighlight'), scroll = document.querySelector('.wiz-canvas-scroll');
    if (hl && scroll && hl.style.display !== 'none') {
      scroll.scrollTo({ top: Math.max(0, (parseFloat(hl.style.top) || 0) * state.zoom - 40), behavior: 'smooth' });
    }
  }
  App.nextStep = function () {
    if (!App.validateStep(state.step)) return;
    App.gotoStep(state.step + 1);
  };
  App.prevStep = function () { App.gotoStep(state.step - 1); };

  // 현재 단계의 필수/형식 검증 (통과 못하면 진행 차단)
  App.validateStep = function (i) {
    const s = schema(), st = s.steps[i];
    const problems = [];
    (st.groups || []).forEach(g => {
      if ((s.requiredGroups || []).includes(g) && !state.data[g]) {
        problems.push(`‘${(s.groupLabels || {})[g] || g}’를 선택해 주세요.`);
      }
    });
    App.stepFieldIds(st).forEach(fid => {
      const f = s.fields.find(x => x.id === fid);
      if (!f || f.group) return;
      const v = state.data[f.id] || '';
      if (f.required && !String(v).trim()) {
        problems.push(`‘${f.label}’를 입력해 주세요.`);
        markErr(f.id);
      } else if (v && f.validate) {
        const e = f.validate(v);
        if (e) { problems.push(`‘${f.label}’: ${e}`); markErr(f.id); }
      }
    });
    const box = $('stepErr');
    if (problems.length) {
      if (box) box.innerHTML = problems.map(p => `<div>• ${App.esc(p)}</div>`).join('');
      return false;
    }
    if (box) box.innerHTML = '';
    return true;
  };
  function markErr(id) {
    state.errors[id] = true;
    const el = $('in_' + id);
    if (el) el.classList.add('err');
  }

  // ── 이벤트 배선 (현재 단계 컨트롤) ────────────────────────
  App.wireStep = function (st) {
    const s = schema();
    document.querySelectorAll('#wizPanel .opt').forEach(btn => {
      btn.addEventListener('click', () => App.onRadio(btn.dataset.group, btn.dataset.id));
    });
    document.querySelectorAll('#wizPanel .q-input').forEach(el => {
      const f = s.fields.find(x => x.id === el.id.slice(3));
      if (!f) return;
      el.addEventListener('input', () => App.onInput(f, el));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); App.nextStep(); } });
    });
  };

  // ── 입력 처리 ─────────────────────────────────────────────
  App.onRadio = function (g, id) {
    const s = schema();
    state.data[g] = id;
    // 조건부 그룹 정리: 조건이 거짓이 된 그룹의 선택 해제
    if (s.groupCond) {
      Object.keys(s.groupCond).forEach(cg => {
        if (!s.groupCond[cg](state.data)) delete state.data[cg];
      });
    }
    // 현재 단계 재렌더(활성/비활성·선택 반영) — 스크롤은 하지 않음
    App.renderStep(state.step);
    App.renderValueLayer();
    App.updateProgress();
    App.resetIdleTimer();
  };

  App.onInput = function (f, el) {
    let v = el.value;
    if (f.digitsOnly) v = v.replace(/\D/g, '');
    if (f.upper) v = v.toUpperCase();
    if (f.type === 'grid') v = v.slice(0, f.cells);
    if (v !== el.value) el.value = v;
    state.data[f.id] = v;
    delete state.errors[f.id];
    el.classList.remove('err');
    App.onValueChanged(f);
    App.renderValueLayer();
    App.updateProgress();
    App.resetIdleTimer();
  };

  // 값 세팅(자동완성) — 상태 + (렌더돼 있으면) 입력창 반영
  App.setInputValue = function (id, val) {
    const f = schema().fields.find(x => x.id === id);
    if (!f) return;
    let v = String(val || '');
    if (f.upper) v = v.toUpperCase();
    if (f.digitsOnly) v = v.replace(/\D/g, '');
    if (f.type === 'grid') v = v.slice(0, f.cells);
    state.data[id] = v;
    const el = $('in_' + id);
    if (el) el.value = v;
  };

  // ── 자동완성 (한글성명 → 로마자 / 서명란) ─────────────────
  App.onValueChanged = function (f) {
    const d = state.data;
    if (f.id === 'romanSur' || f.id === 'romanGiven') state.romanTouched.roman = true;

    if (f.id === 'nameKor') {
      if (!state.romanTouched.roman && App.romanizeName) {
        const r = App.romanizeName(d.nameKor || '');
        const parts = r.split(',');
        App.setInputValue('romanSur', (parts[0] || '').trim());
        App.setInputValue('romanGiven', (parts[1] || '').trim().replace(/-/g, ''));
      }
      App.setInputValue('signName1', d.nameKor || '');
      App.setInputValue('signName2', d.nameKor || '');
    }
  };

  // ── 화면 유틸 ─────────────────────────────────────────────
  App.goHome = function () {
    if (state.view === 'intro') return;
    if (confirm('작성 중인 내용이 모두 사라집니다. 처음 화면으로 가시겠습니까?')) App.resetAll();
  };
  App.confirmReset = function () {
    if (confirm('정말로 초기화하시겠습니까? 작성하신 내용은 모두 삭제됩니다.')) App.resetAll();
  };

  App.changeFontSize = function (delta) {
    const root = document.documentElement;
    const cur = parseInt(getComputedStyle(root).getPropertyValue('--base')) || 18;
    root.style.setProperty('--base', Math.max(14, Math.min(28, cur + delta)) + 'px');
  };

  // ── 미리보기 확대/축소 ────────────────────────────────────
  function applyZoom() {
    const c = $('canvas'), sizer = $('canvasSizer'), z = state.zoom;
    if (c) c.style.transform = 'scale(' + z + ')';
    if (sizer) { sizer.style.width = (794 * z) + 'px'; sizer.style.height = (1123 * z) + 'px'; }
    const lbl = $('zoomVal'); if (lbl) lbl.textContent = Math.round(z * 100) + '%';
  }
  App.changeZoom = function (delta) {
    state.zoom = Math.max(0.4, Math.min(1.6, +(state.zoom + delta).toFixed(2)));
    applyZoom();
  };
  App.fitPreview = function () {
    const scroll = document.querySelector('.wiz-canvas-scroll');
    if (!scroll) return;
    const avail = scroll.clientWidth - 20;
    state.zoom = Math.max(0.4, Math.min(1.3, +(avail / 794).toFixed(2)));
    applyZoom();
  };

  // ── 인쇄 ─────────────────────────────────────────────────
  App.doPrint = function (type) {
    alert(type === 'A4'
      ? '인쇄 창에서 [일반용지 프린터]를 선택해주세요.'
      : '인쇄 창에서 [신청서 전용 프린터]를 선택해주세요.');
    App.closeModal();
    setTimeout(() => window.print(), 200);
  };
  App.doSavePDF = function () {
    alert('인쇄 창에서 프린터를 [PDF로 저장]으로 선택해주세요.');
    App.closeModal();
    setTimeout(() => window.print(), 200);
  };

  // ── 유휴 자동 초기화 (보안) ───────────────────────────────
  App.resetIdleTimer = function () {
    if (state.idleTimer) clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => {
      if (state.view !== 'intro') {
        alert('3분간 입력이 없어 보안을 위해 화면을 초기화합니다.');
        App.resetAll();
      }
    }, 3 * 60 * 1000);
  };

  // ── 부팅 ─────────────────────────────────────────────────
  App.start = function () {
    App.app = document.getElementById('app');
    App.render();
    App.resetIdleTimer();
    window.addEventListener('afterprint', () => {
      setTimeout(() => {
        if (confirm('인쇄가 완료되었습니까?\n\n[확인]을 누르시면 화면이 초기화됩니다.')) App.resetAll();
      }, 500);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') App.closeModal(); });
  };

})(window.App = window.App || {});
