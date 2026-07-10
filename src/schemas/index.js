'use strict';
/* ============================================================
 * schemas/index.js — 신청서 스키마 레지스트리
 * ------------------------------------------------------------
 *  각 스키마 파일이 App.registerSchema(id, def) 로 자기 자신을 등록.
 *  로드 순서상 이 파일이 스키마 파일들보다 먼저 실행되어야 한다.
 * ============================================================ */
(function (App) {

  App.schemas = App.schemas || {};
  App.schemaOrder = App.schemaOrder || [];

  App.registerSchema = function (id, def) {
    def.id = id;
    App.schemas[id] = def;
    if (!App.schemaOrder.includes(id)) App.schemaOrder.push(id);
  };

})(window.App = window.App || {});
