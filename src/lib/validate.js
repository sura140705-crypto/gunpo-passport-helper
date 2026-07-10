'use strict';
/* ============================================================
 * validate.js — 공통 검증기 / 포매터
 * ------------------------------------------------------------
 *  실제 여권 서식은 대부분 격자칸이며 "‘-’ 없이 숫자만 기재"를
 *  요구하므로 전화·주민번호는 숫자 문자열로 저장하고 검증한다.
 * ============================================================ */
(function (App) {

  const digits = (v) => String(v || '').replace(/\D/g, '');
  const upper  = (v) => String(v || '').toUpperCase();

  const validators = {
    // 공통
    required: (v) => (!v || !String(v).trim()) ? '필수 입력 항목입니다.' : null,

    // 한글 성명 (2~6자)
    nameKor: (v) => !v ? '한글 성명을 입력하세요.'
      : (!/^[가-힣]{1,6}$/.test(v) ? '한글로 최대 6자까지 입력하세요.' : null),

    // 주민등록번호 13자리 (숫자만)
    jumin: (v) => {
      const d = digits(v);
      if (d.length !== 13) return '주민등록번호 13자리를 정확히 입력하세요.';
      return null;
    },

    // 휴대전화 (숫자만, 10~11자리, 01x 시작)
    phone: (v) => {
      const d = digits(v);
      if (!/^01\d{8,9}$/.test(d)) return '휴대전화 번호를 정확히 입력하세요. (숫자만)';
      return null;
    },

    // 일반 전화 (숫자만, 9~11자리)
    tel: (v) => {
      const d = digits(v);
      if (d && !/^\d{9,11}$/.test(d)) return '전화번호를 숫자만 정확히 입력하세요.';
      return null;
    },

    // 로마자 (영대문자/공백/하이픈)
    roman: (v) => !v ? '로마자 성명을 입력하세요.'
      : (!/^[A-Z\s,\-]+$/.test(v) ? '영문 대문자로 입력하세요.' : null)
  };

  const formatters = {
    digits: digits,
    upper: upper,
    // 화면 표시용 주민번호 (000000-0000000)
    juminDisplay: (v) => {
      const d = digits(v).slice(0, 13);
      return d.length > 6 ? d.slice(0, 6) + '-' + d.slice(6) : d;
    },
    // 화면 표시용 휴대전화 (010-0000-0000)
    phoneDisplay: (v) => {
      const d = digits(v).slice(0, 11);
      if (d.length < 4) return d;
      if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
      return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    }
  };

  App.validators = validators;
  App.formatters = formatters;
  App.digits = digits;

})(window.App = window.App || {});
