'use strict';
/* ============================================================
 * juso.js — 도로명주소 검색 (행정안전부 주소정보누리집)
 * ------------------------------------------------------------
 *  운영 전환 절차 (과제 4):
 *   1) https://business.juso.go.kr 에서 "도로명주소 개발자센터"
 *      회원가입 → 신청 → 승인키(confmKey) 발급
 *   2) CONFIG.JUSO_KEY 에 발급키 입력, CONFIG.USE_DEMO = false
 *   3) API 방식 선택:
 *      (a) 서버 프록시  : 브라우저 → 자체 서버 → addrLinkApi (CORS 우회, 키 은닉)
 *      (b) 팝업 JS API : juso 팝업창에서 선택 → postMessage 로 수신 (키오스크 권장)
 *
 *  ※ addrLinkApi.do 는 브라우저 직접 호출 시 CORS 제한이 있어
 *    운영 배포에서는 (a) 서버 프록시 또는 (b) 팝업 방식을 권장한다.
 *    본 모듈은 세 경로(데모/프록시/팝업)의 골격을 모두 제공한다.
 * ============================================================ */
(function (App) {

  const CONFIG = {
    USE_DEMO: true,                 // 운영 시 false
    JUSO_KEY: '',                   // 발급 confmKey
    // (a) 서버 프록시 엔드포인트(자체 서버). 비어있으면 직접 호출 시도.
    PROXY_URL: '',                  // 예: '/api/juso'
    API_URL: 'https://business.juso.go.kr/addrlink/addrLinkApi.do',
    // (b) 팝업 방식
    POPUP_URL: 'https://business.juso.go.kr/addrlink/addrLinkUrl.do',
    countPerPage: 10
  };

  const DEMO_ADDR = [
    { road:'세종특별자치시 한누리대로 2130', jibun:'세종특별자치시 보람동 245', zip:'30151' },
    { road:'서울특별시 중구 세종대로 110', jibun:'서울특별시 중구 태평로1가 31', zip:'04524' },
    { road:'서울특별시 종로구 사직로 161', jibun:'서울특별시 종로구 세종로 1', zip:'03045' },
    { road:'경기도 군포시 청백리길 6', jibun:'경기도 군포시 산본동 1141', zip:'15845' },
    { road:'경기도 군포시 산본로 323', jibun:'경기도 군포시 산본동 1146', zip:'15807' },
    { road:'경기도 수원시 영통구 도청로 30', jibun:'경기도 수원시 영통구 이의동 1', zip:'16508' },
    { road:'부산광역시 연제구 중앙대로 1001', jibun:'부산광역시 연제구 연산동 1000', zip:'47545' },
    { road:'인천광역시 남동구 정각로 29', jibun:'인천광역시 남동구 구월동 1138', zip:'21554' },
    { road:'대전광역시 서구 둔산로 100', jibun:'대전광역시 서구 둔산동 1420', zip:'35242' },
    { road:'강원특별자치도 춘천시 중앙로 1', jibun:'강원특별자치도 춘천시 봉의동 15', zip:'24266' }
  ];

  // 통합 검색 진입점 — 콜백(cb)에 [{road, jibun, zip}] 전달
  function search(keyword, cb) {
    if (!keyword || keyword.trim().length < 2) { cb([]); return; }
    keyword = keyword.trim();

    if (CONFIG.USE_DEMO) {
      const r = DEMO_ADDR.filter(a => a.road.includes(keyword) || a.jibun.includes(keyword));
      setTimeout(() => cb(r), 120);
      return;
    }
    return searchReal(keyword, cb);
  }

  // 실연동: 프록시 우선, 없으면 직접 호출(CORS 실패 가능)
  function searchReal(keyword, cb) {
    const base = CONFIG.PROXY_URL || CONFIG.API_URL;
    const url = base +
      '?confmKey=' + encodeURIComponent(CONFIG.JUSO_KEY) +
      '&currentPage=1' +
      '&countPerPage=' + CONFIG.countPerPage +
      '&keyword=' + encodeURIComponent(keyword) +
      '&resultType=json';

    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const common = j && j.results && j.results.common;
        if (common && common.errorCode && common.errorCode !== '0') {
          console.warn('[juso] API 오류:', common.errorCode, common.errorMessage);
          cb([]); return;
        }
        const list = ((j.results && j.results.juso) || []).map((a) => ({
          road: a.roadAddr,
          jibun: a.jibunAddr,
          zip: a.zipNo
        }));
        cb(list);
      })
      .catch((err) => {
        console.warn('[juso] 직접 호출 실패(CORS 가능). 팝업/프록시 방식을 사용하세요.', err);
        cb([]);
      });
  }

  // (b) 팝업 방식: juso 창에서 선택 → onPick({road, jibun, zip})
  //  운영 시 별도 콜백 페이지(jusoPopup.html)와 postMessage 연동 필요.
  function openPopup(onPick) {
    if (CONFIG.USE_DEMO) {
      console.info('[juso] 데모 모드에서는 팝업 대신 인라인 검색을 사용합니다.');
      return;
    }
    const w = window.open('', 'jusoPopup', 'width=570,height=420,scrollbars=yes');
    const form = document.createElement('form');
    form.method = 'post';
    form.action = CONFIG.POPUP_URL;
    form.target = 'jusoPopup';
    form.innerHTML =
      '<input type="hidden" name="confmKey" value="' + CONFIG.JUSO_KEY + '">' +
      '<input type="hidden" name="returnUrl" value="' + location.origin + '/jusoPopup.html">' +
      '<input type="hidden" name="resultType" value="4">';
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    window._jusoOnPick = onPick;   // jusoPopup.html 콜백에서 사용
  }

  App.juso = { CONFIG, search, openPopup, DEMO_ADDR };

})(window.App = window.App || {});
