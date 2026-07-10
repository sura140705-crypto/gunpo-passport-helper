'use strict';
/* ============================================================
 * schemas/passport.js — 여권 발급 신청서 (여권법 시행규칙 별지 제1호서식, 개정 2026.6.1)
 * ------------------------------------------------------------
 *  좌표(x,y,w,h)는 passport.svg(viewBox 794×1123, A4) 기준.
 *  passport.svg 는 국가법령정보센터 공식 PDF에서 추출한 벡터 서식이며,
 *  본 스키마의 입력칸 좌표·칸수도 그 공식 서식에서 정밀 추출한 값이다.
 *  SVG가 격자칸(□·박스)을 이미 그리므로 입력 필드는 투명 오버레이로 얹는다.
 *  좌표 미세정렬은 tools/coord-editor(실제 서식 겹쳐보기)로 수행.
 * ============================================================ */
(function (App) {
  const V = App.validators;

  App.registerSchema('passport', {
    title: '여권 발급 신청서',
    sub: '신규 · 재발급 · 기간연장',
    badge: '정식',
    bg: 'passport',                 // assets/passport.svg
    paper: { w: 794, h: 1123 },

    fields: [
      /* ── 여권 선택란 (행1: 종류+면수) ───────────────── */
      { id:'kind_normal', type:'check', group:'kind', label:'일반', sec:'여권 선택', x:185, y:140.8, w:14, h:14,
        guide:{ title:'여권 종류', body:'대부분의 시민은 [일반]을 선택합니다.', warn:'관용·외교관 여권은 해당 기관을 통해 신청합니다.' } },
      { id:'kind_official', type:'check', group:'kind', label:'관용', x:237.9, y:140.8, w:14, h:14 },
      { id:'kind_diplo', type:'check', group:'kind', label:'외교관', x:285.3, y:140.8, w:14, h:14 },
      { id:'kind_emerg', type:'check', group:'kind', label:'긴급', x:345.3, y:140.8, w:14, h:14,
        guide:{ title:'긴급여권', body:'긴급한 사유가 있을 때 발급하는 단수여권입니다. 창구 문의 후 선택하세요.' } },
      { id:'kind_travel', type:'check', group:'kind', label:'여행증명서', x:392.7, y:140.8, w:14, h:14,
        guide:{ title:'여행증명서', body:'여권을 대신하는 증명서로, 왕복 또는 편도를 함께 선택합니다.' } },
      { id:'travel_round', type:'check', group:'travelType', label:'왕복', x:478.6, y:140.8, w:14, h:14 },
      { id:'travel_one', type:'check', group:'travelType', label:'편도', x:526, y:140.8, w:14, h:14 },

      { id:'pages_26', type:'check', group:'pages', label:'26면', x:668.5, y:140.8, w:14, h:14,
        guide:{ title:'여권 면수', body:'26면(₩49,000) 또는 58면(₩52,000) 중 선택합니다.', body2:'여행이 잦으시면 58면을 권장합니다.' } },
      { id:'pages_58', type:'check', group:'pages', label:'58면', x:712.2, y:140.8, w:14, h:14 },

      /* ── 여권 선택란 (행2: 기간+5년옵션) ─────────────── */
      { id:'period_10', type:'check', group:'period', label:'10년', x:185, y:168.2, w:14, h:14,
        guide:{ title:'여권 기간', body:'만 18세 이상은 보통 [10년]을 선택합니다.', warn:'8세 미만은 5년만 가능합니다.' } },
      { id:'period_1', type:'check', group:'period', label:'단수(1년)', x:235.6, y:168.2, w:14, h:14 },
      { id:'period_remain', type:'check', group:'period', label:'잔여기간', x:319.4, y:168.2, w:14, h:14 },
      { id:'period_5', type:'check', group:'period', label:'5년', x:585.2, y:168.2, w:14, h:14,
        guide:{ title:'5년 여권', body:'만 8세 이상 18세 미만은 5년 여권을 받습니다. 담당자 문의 후 선택하세요.' } },
      { id:'period_5u', type:'check', group:'period', label:'5년미만', x:635.7, y:168.2, w:14, h:14 },

      /* ── 필수 기재란 · 신청인 ───────────────────────── */
      { id:'nameKor', type:'grid', label:'한글성명', x:315.5, y:223.1, cells:8, cellW:38, gap:2, h:35.4, required:true,
        validate:(v)=>V.nameKor(v),
        guide:{ title:'한글성명', body:'주민등록상의 성명을 한 칸에 한 글자씩 정확히 적습니다.', example:'예) 홍길동, 김민수',
                warn:'신분증과 한 글자라도 다르면 접수되지 않습니다.' } },

      { id:'jumin', type:'grid', label:'주민번호', x:315.5, y:258.5, cells:13, cellW:28, gap:2, h:31.5, sep:6, digitsOnly:true, required:true,
        validate:(v)=>V.jumin(v),
        guide:{ title:'주민등록번호', body:'앞 6자리(생년월일)와 뒤 7자리를 숫자만 정확히 입력합니다.', example:'예) 900101 · 1234567' } },

      { id:'selfPhone', type:'grid', label:'본인연락처', x:315.5, y:290, cells:13, cellW:25, gap:2, h:31.5, digitsOnly:true, required:true,
        validate:(v)=>V.phone(v),
        guide:{ title:'본인연락처', body:'휴대전화 번호를 ‘-’ 없이 숫자만 입력합니다. 진행 안내 문자가 발송됩니다.', example:'예) 01012345678',
                warn:'미성년자는 방문 신청이 필요합니다.' } },

      /* ── 긴급연락처 (다른 사람의 연락처) ────────────── */
      { id:'emgName', type:'grid', label:'긴급연락처 성명', x:315.5, y:339.9, cells:8, cellW:26, gap:2, h:37.3, required:true,
        guide:{ title:'긴급연락처 · 성명', body:'본인이 아닌 가족·지인의 이름을 적습니다. 해외 사고 발생 시 지원을 위한 연락처입니다.',
                warn:'본인 연락처가 아닌 다른 사람의 연락처를 기재하세요.' },
        validate:(v)=>V.required(v) },
      { id:'emgRel', type:'grid', label:'관계', x:629, y:339.9, cells:4, cellW:28, gap:2, h:37.3, required:true,
        guide:{ title:'관계 (신청인의)', body:'신청인과의 관계를 적습니다. 예) 부, 모, 배우자, 자녀' },
        validate:(v)=>V.required(v) },
      { id:'emgPhone', type:'grid', label:'긴급연락처 전화번호', x:315.5, y:377.2, cells:13, cellW:25, gap:2, h:37.3, digitsOnly:true, required:true,
        guide:{ title:'긴급연락처 · 전화번호', body:'가족·지인의 연락 가능한 번호를 ‘-’ 없이 숫자만 입력합니다.' },
        validate:(v)=>V.phone(v) },

      /* ── 추가 기재란 (신규/개명 시 로마자) ──────────── */
      { id:'romanSur', type:'grid', label:'로마자 성', x:179.6, y:450.1, cells:16, cellW:30, gap:2, h:33.9, upper:true, autofill:'romanSur',
        guide:{ title:'로마자 성 (대문자)', body:'여권을 처음 신청하거나 로마자성명을 변경할 때만 기재합니다. 한글성명 입력 시 자동 제안됩니다.',
                example:'홍 → HONG',
                warn:'가족 중 기존 여권 보유자가 있으면 동일한 성(姓) 표기를 사용해야 합니다.' } },
      { id:'romanGiven', type:'grid', label:'로마자 이름', x:179.6, y:484, cells:16, cellW:30, gap:2, h:34.1, upper:true, autofill:'romanGiven',
        guide:{ title:'로마자 이름 (대문자)', body:'외교부 권장 표기로 자동 제안되며, 원하는 표기로 수정할 수 있습니다.',
                example:'길동 → GILDONG',
                warn:'한 번 등록된 로마자성명은 변경이 매우 어렵습니다. 신중히 확인하세요.' } },

      /* ── 선택 기재란 ────────────────────────────────── */
      { id:'spouseSur', type:'grid', label:'배우자 로마자 성', x:179.6, y:579.5, cells:10, cellW:27, gap:2, h:33.5, upper:true,
        guide:{ title:'배우자의 로마자 성(姓)', body:'원하는 경우에만 기재합니다. 여권에 ‘spouse of 배우자 로마자 성’ 형태로 표기됩니다.' } },
      { id:'braille_y', type:'check', group:'braille', label:'점자여권 희망', x:183.6, y:621.9, w:14, h:14,
        guide:{ title:'점자여권', body:'시각장애인일 경우에만 네모 칸에 표시합니다.' } },
      { id:'braille_n', type:'check', group:'braille', label:'점자여권 희망 안 함', x:247.3, y:621.9, w:14, h:14 },
      { id:'mail_y', type:'check', group:'mail', label:'우편배송 희망', x:183.3, y:652, w:14, h:14,
        guide:{ title:'우편배송 서비스', body:'희망 시 등기(5,500원, 수취인지정)로 배송됩니다. 상세주소는 창구에서 확인·기재합니다.' } },
      { id:'mail_n', type:'check', group:'mail', label:'우편배송 희망 안 함', x:247, y:652, w:14, h:14 },

      /* ── 서약 및 서명 ───────────────────────────────── */
      { id:'signName1', type:'text', label:'신청인 성명(서명)', x:392, y:727, w:250, h:22, required:true, autofill:'copyKor',
        guide:{ title:'신청인 성명', body:'한글성명과 동일하게 입력합니다(자동 복사). 인쇄 후 옆에 서명 또는 날인하세요.',
                warn:'미성년자는 방문 신청자(부 또는 모)가 서명합니다. 서명은 이름을 정자로 기재합니다.' },
        validate:(v)=>V.required(v) },

      /* ── 행정정보 공동이용 동의서 (개정판: 서명만) ──── */
      { id:'signName2', type:'text', label:'동의서 신청인 성명', x:392, y:849, w:250, h:22, autofill:'copyKor',
        guide:{ title:'동의서 신청인 성명', body:'위 성명과 동일하게 입력합니다(자동 복사). 인쇄 후 서명 또는 날인하세요.',
                body2:'행정정보 공동이용에 동의하지 않으면 관련 서류(가족관계·주민등록 등)를 직접 제출해야 합니다.' } }
    ],

    // 그룹(라디오) 라벨
    groupLabels: {
      kind:'여권 종류', travelType:'여행증명서 구분', pages:'여권 면수',
      period:'여권 기간', braille:'점자여권', mail:'우편배송 서비스'
    },
    // 필수 그룹
    requiredGroups: ['kind', 'period'],

    // 조건부 활성 그룹 — 조건이 거짓이면 선택 불가(비활성) + 기존 선택 해제
    groupCond: {
      travelType: (d) => d.kind === 'kind_travel'   // 여행증명서 선택 시에만 왕복/편도
    },

    // 검토 단계 조건부 안내
    reviewNotes: (data) => {
      const notes = [];
      if (data.kind === 'kind_emerg') notes.push('긴급여권은 담당자 확인이 필요합니다.');
      if (data.kind === 'kind_travel' && !data.travelType) notes.push('여행증명서는 왕복/편도를 함께 선택해야 합니다.');
      if (data.mail === 'mail_y') notes.push('우편배송을 희망하셨습니다. 상세주소는 접수 창구에서 확인·기재합니다.');
      if (!data.romanSur && !data.romanGiven) notes.push('로마자성명은 신규·개명 시에만 작성합니다. 재발급이면 비워두어도 됩니다.');
      return notes;
    },

    // 단계별 안내 위저드 — 우측 패널이 이 순서로 진행(각 항목 상세 설명 포함)
    steps: [
      { title:'여권 종류', required:true, groups:['kind','travelType'],
        help:'발급받으실 여권의 종류를 골라주세요. 대부분의 시민은 [일반]입니다.\n· 관용·외교관 여권은 소속 기관을 통해 신청합니다.\n· 긴급여권·여행증명서는 특별한 경우이니 창구에 문의하세요.\n※ 단수여권·여행증명서는 유효기간이 1년 이내로 제한됩니다.' },
      { title:'여권 면수', required:true, groups:['pages'],
        help:'여권의 면수(페이지 수)를 골라주세요.\n· 26면 — 수수료 49,000원\n· 58면 — 수수료 52,000원\n해외여행이 잦으시면 58면을 권장합니다.' },
      { title:'여권 기간', required:true, groups:['period'],
        help:'여권의 유효기간을 골라주세요.\n· 만 18세 이상 — 보통 [10년]\n· 만 8세 이상 18세 미만 — [5년]\n· 만 8세 미만 — [5년 미만]\n※ 18세 미만은 법정대리인(부 또는 모)의 동의서가 필요합니다.' },
      { title:'신청인 정보', fields:['nameKor','jumin','selfPhone'],
        help:'여권을 발급받으실 본인의 정보를 적어주세요.\n신분증(주민등록증 등)과 한 글자도 다르지 않게 정확히 입력해야 접수됩니다.\n※ 연락처는 국내 휴대전화로 적어야 유효기간 만료 등 안내 문자를 받을 수 있습니다.' },
      { title:'긴급 연락처', fields:['emgName','emgRel','emgPhone'],
        help:'해외에서 사고가 났을 때 연락할 사람의 정보를 적어주세요.\n※ 본인이 아닌 다른 사람(가족·지인)의 연락처를 적어야 합니다.\n거짓으로 기재하면 관련 법에 따라 처벌받을 수 있습니다.' },
      { title:'로마자 성명', fields:['romanSur','romanGiven'],
        help:'여권을 처음 신청하거나 로마자 성명을 바꿀 때만 적습니다.\n한글성명을 입력하시면 외교부 권장 표기가 자동으로 제안되며, 원하시면 고칠 수 있습니다.\n※ 한 번 정한 로마자 성명은 바꾸기가 매우 어려우니 신중히 확인하세요.\n※ 가족 중 여권 보유자가 있으면 같은 성(姓) 표기를 권장합니다.\n재발급이면 비워두고 [다음]을 누르세요.' },
      { title:'선택 사항', fields:['spouseSur'], groups:['braille','mail'],
        help:'원하시는 경우에만 작성합니다. 없으면 [다음]을 누르세요.\n· 배우자 로마자 성 — 여권에 “spouse of ○○○” 형태로 표기\n· 점자여권 — 시각장애인만\n· 우편배송 — 등기(5,500원)로 받아보기(상세주소는 창구에서 확인)' },
      { title:'서명', fields:['signName1','signName2'],
        help:'신청인 성명은 한글성명과 동일하게 자동으로 채워집니다.\n인쇄한 뒤 성명 옆에 검은색 펜으로 서명 또는 날인해 주세요.\n※ 미성년자는 부 또는 모가 서명합니다.' }
    ]
  });

})(window.App = window.App || {});
