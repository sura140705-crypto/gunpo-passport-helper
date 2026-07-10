'use strict';
/* ============================================================
 * state.js — 전역 애플리케이션 상태 (메모리 전용, 무저장)
 * ============================================================ */
(function (App) {

  const state = {
    view: 'intro',        // intro | form | finish
    schemaId: null,
    step: 0,              // 위저드 현재 단계
    data: {},             // { fieldId: value, groupId: selectedFieldId }
    errors: {},           // { fieldId: 'error message' }
    activeField: null,    // 현재 포커스된 필드 id (가이드 연동)
    zoom: 1.0,
    romanTouched: {},     // 사용자가 직접 수정한 자동완성 필드
    wizard: {},           // 스키마별 마법사 선택값 (예: 증명서 종류)
    idleTimer: null
  };

  App.state = state;

  // 작성 데이터만 초기화 (스키마 선택은 유지하지 않음)
  App.clearData = function () {
    state.data = {};
    state.errors = {};
    state.activeField = null;
    state.romanTouched = {};
    state.wizard = {};
    state.step = 0;
  };

  // 전체 초기화 → 시작 화면
  App.resetAll = function () {
    App.clearData();
    state.schemaId = null;
    state.view = 'intro';
    if (App.closeModal) App.closeModal();
    if (App.render) App.render();
  };

})(window.App = window.App || {});
