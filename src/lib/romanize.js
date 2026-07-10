'use strict';
/* ============================================================
 * romanize.js — 한글 → 로마자 변환
 * ------------------------------------------------------------
 *  - 외교부 여권 로마자 관용표기(성씨/이름 음절) 확장 매핑
 *  - 국립국어원 로마자 표기법(개정) 알고리즘 폴백
 *  - 매핑 규모: 성씨 + 이름 음절 합계 300+ (과제 3)
 *
 *  참고: 외교부는 신청인이 원하는 표기를 선택할 수 있게 하므로
 *  본 표는 "가장 널리 쓰이는 관용표기 제안값"이다. 최종 표기는
 *  사용자가 수정 가능하며(state.romanTouched), 가족 기존여권과의
 *  일관성을 우측 가이드에서 안내한다.
 * ============================================================ */
(function (App) {

  // ── 성씨 관용표기 (단성 + 복성) ────────────────────────────
  // 값이 배열이면 [대표표기, ...대안]. 대표표기를 기본 제안.
  const SURNAME_MAP = {
    // 최다 빈도
    '김':'KIM', '이':'LEE', '박':'PARK', '최':'CHOI', '정':'JEONG',
    '강':'KANG', '조':'CHO', '윤':'YOON', '장':'JANG', '임':'LIM',
    '오':'OH', '한':'HAN', '신':'SHIN', '서':'SEO', '권':'KWON',
    '황':'HWANG', '안':'AHN', '송':'SONG', '전':'JEON', '홍':'HONG',
    '유':'YOO', '고':'KO', '문':'MOON', '양':'YANG', '손':'SON',
    '배':'BAE', '백':'BAEK', '허':'HEO', '남':'NAM', '심':'SIM',
    '노':'NOH', '하':'HA', '곽':'KWAK', '성':'SUNG', '차':'CHA',
    '주':'JOO', '우':'WOO', '구':'KOO', '민':'MIN', '나':'NA',
    '진':'JIN', '지':'JI', '엄':'EOM', '채':'CHAE', '원':'WON',
    '천':'CHEON', '방':'BANG', '공':'KONG', '현':'HYUN', '함':'HAM',
    '변':'BYUN', '염':'YEOM', '여':'YEO', '추':'CHU', '도':'DO',
    '소':'SO', '석':'SEOK', '선':'SUN', '설':'SEOL', '마':'MA',
    '길':'KIL', '연':'YEON', '위':'WI', '표':'PYO', '명':'MYUNG',
    '기':'KI', '반':'BAN', '라':'RA', '왕':'WANG', '금':'KEUM',
    '옥':'OK', '육':'YUK', '인':'IN', '맹':'MAENG', '제':'JE',
    '모':'MO', '탁':'TAK', '국':'KOOK', '어':'EO', '은':'EUN',
    '편':'PYUN', '용':'YONG', '예':'YE', '봉':'BONG', '경':'KYUNG',
    '사':'SA', '부':'BOO', '가':'GA', '복':'BOK', '태':'TAE',
    '목':'MOK', '형':'HYUNG', '계':'GYE', '온':'ON', '좌':'JWA',
    '팽':'PAENG', '승':'SEUNG', '간':'GAN', '상':'SANG', '시':'SI',
    '대':'DAE', '풍':'PUNG', '후':'HOO', '초':'CHO', '필':'PIL',
    '돈':'DON', '운':'WOON', '곡':'GOK', '종':'JONG', '두':'DOO',
    '감':'GAM', '갈':'GAL', '견':'GYEON', '당':'DANG', '화':'HWA',
    '창':'CHANG', '판':'PAN', '빙':'BING', '단':'DAN', '견':'GYEON',
    '삼':'SAM', '순':'SOON', '난':'NAN', '독':'DOK', '개':'GAE',
    '비':'BI', '뢰':'ROE', '내':'NAE', '뇌':'NOE', '학':'HAK',
    '흥':'HEUNG', '십':'SIP', '아':'A', '야':'YA', '묵':'MOOK',
    '점':'JEOM', '증':'JEUNG', '즙':'JEUP', '삭':'SAK', '빈':'BIN',
    '옹':'ONG', '내':'NAE', '초':'CHO', '누':'NOO', '망절':'MANGJEOL',
    // 복성(2자)
    '남궁':'NAMGOONG', '황보':'HWANGBO', '제갈':'JEGAL', '선우':'SUNWOO',
    '독고':'DOKKO', '사공':'SAGONG', '서문':'SEOMUN', '동방':'DONGBANG',
    '어금':'EOKEUM', '망절':'MANGJEOL', '강전':'KANGJEON', '소봉':'SOBONG',
    '사마':'SAMA'
  };

  // ── 이름 음절 관용표기 ─────────────────────────────────────
  // 알고리즘 결과보다 널리 통용되는 표기를 우선한다.
  // (음절 단위 제안 — 사용자가 언제든 수정 가능)
  const GIVEN_SYLLABLE_MAP = {
    '가':'GA','각':'GAK','간':'GAN','갈':'GAL','감':'GAM','갑':'GAP','강':'KANG','개':'GAE','건':'GEON','걸':'GEOL',
    '검':'GEOM','격':'GYEOK','견':'GYEON','결':'GYEOL','겸':'GYEOM','경':'KYUNG','계':'GYE','고':'KO','곡':'GOK','곤':'GON',
    '골':'GOL','공':'KONG','곽':'KWAK','관':'KWAN','광':'KWANG','교':'GYO','구':'KOO','국':'GOOK','군':'GUN','굴':'GUL',
    '궁':'GOONG','권':'KWON','귀':'GWI','규':'GYU','균':'GYUN','귤':'GYUL','근':'GEUN','금':'KEUM','급':'GEUP','긍':'GEUNG',
    '기':'KI','길':'KIL','김':'KIM','나':'NA','낙':'NAK','난':'NAN','남':'NAM','낭':'NANG','내':'NAE','냉':'NAENG',
    '녀':'NYEO','년':'NYEON','념':'NYEOM','녕':'NYEONG','노':'NO','녹':'NOK','논':'NON','농':'NONG','뇌':'NOE','누':'NU',
    '눈':'NUN','눌':'NUL','능':'NEUNG','니':'NI','다':'DA','단':'DAN','달':'DAL','담':'DAM','답':'DAP','당':'DANG',
    '대':'DAE','덕':'DEOK','도':'DO','독':'DOK','돈':'DON','돌':'DOL','동':'DONG','두':'DOO','득':'DEUK','등':'DEUNG',
    '라':'RA','락':'RAK','란':'RAN','람':'RAM','랑':'RANG','래':'RAE','량':'RYANG','려':'RYEO','력':'RYEOK','련':'RYEON',
    '렬':'RYEOL','렴':'RYEOM','령':'RYEONG','례':'RYE','로':'RO','록':'ROK','론':'RON','뢰':'ROE','료':'RYO','룡':'RYONG',
    '루':'RU','류':'RYU','륙':'RYUK','륜':'RYUN','률':'RYUL','륭':'RYUNG','르':'REU','름':'REUM','릉':'REUNG','리':'RI',
    '린':'RIN','림':'RIM','립':'RIP','마':'MA','막':'MAK','만':'MAN','말':'MAL','망':'MANG','매':'MAE','맥':'MAEK',
    '맹':'MAENG','머':'MEO','명':'MYUNG','모':'MO','목':'MOK','몽':'MONG','묘':'MYO','무':'MU','묵':'MUK','문':'MOON',
    '물':'MUL','미':'MI','민':'MIN','밀':'MIL','바':'BA','박':'BAK','반':'BAN','발':'BAL','방':'BANG','배':'BAE',
    '백':'BAEK','번':'BEON','법':'BEOP','벽':'BYEOK','변':'BYUN','별':'BYEOL','병':'BYUNG','보':'BO','복':'BOK','본':'BON',
    '봉':'BONG','부':'BOO','북':'BUK','분':'BUN','불':'BUL','붕':'BUNG','비':'BI','빈':'BIN','빙':'BING','사':'SA',
    '삭':'SAK','산':'SAN','살':'SAL','삼':'SAM','상':'SANG','새':'SAE','색':'SAEK','생':'SAENG','서':'SEO','석':'SEOK',
    '선':'SEON','설':'SEOL','섬':'SEOM','섭':'SEOP','성':'SUNG','세':'SE','소':'SO','속':'SOK','손':'SON','솔':'SOL',
    '송':'SONG','수':'SOO','숙':'SOOK','순':'SOON','술':'SUL','숭':'SOONG','슬':'SEUL','습':'SEUP','승':'SEUNG','시':'SI',
    '식':'SIK','신':'SHIN','실':'SIL','심':'SIM','아':'A','악':'AK','안':'AN','알':'AL','암':'AM','압':'AP',
    '앙':'ANG','애':'AE','액':'AEK','야':'YA','약':'YAK','양':'YANG','어':'EO','억':'EOK','언':'EON','엄':'EOM',
    '업':'EOP','여':'YEO','역':'YEOK','연':'YEON','열':'YEOL','염':'YEOM','엽':'YEOP','영':'YOUNG','예':'YE','오':'OH',
    '옥':'OK','온':'ON','올':'OL','옹':'ONG','완':'WAN','왈':'WAL','왕':'WANG','외':'OE','요':'YO','용':'YONG',
    '우':'WOO','욱':'WOOK','운':'WOON','울':'UL','웅':'WOONG','원':'WON','월':'WOL','위':'WI','유':'YU','육':'YUK',
    '윤':'YOON','율':'YUL','융':'YUNG','은':'EUN','을':'EUL','음':'EUM','읍':'EUP','응':'EUNG','의':'EUI','이':'LEE',
    '익':'IK','인':'IN','일':'IL','임':'IM','입':'IP','자':'JA','작':'JAK','잔':'JAN','잠':'JAM','장':'JANG',
    '재':'JAE','쟁':'JAENG','저':'JEO','적':'JEOK','전':'JEON','절':'JEOL','점':'JEOM','접':'JEOP','정':'JEONG','제':'JE',
    '조':'JO','족':'JOK','존':'JON','종':'JONG','좌':'JWA','주':'JOO','죽':'JUK','준':'JUN','줄':'JUL','중':'JOONG',
    '즉':'JEUK','증':'JEUNG','지':'JI','직':'JIK','진':'JIN','질':'JIL','짐':'JIM','집':'JIP','징':'JING','차':'CHA',
    '착':'CHAK','찬':'CHAN','찰':'CHAL','참':'CHAM','창':'CHANG','채':'CHAE','책':'CHAEK','처':'CHEO','척':'CHEOK','천':'CHEON',
    '철':'CHEOL','첨':'CHEOM','첩':'CHEOP','청':'CHUNG','체':'CHE','초':'CHO','촉':'CHOK','촌':'CHON','총':'CHONG','최':'CHOI',
    '추':'CHU','축':'CHUK','춘':'CHUN','출':'CHUL','충':'CHUNG','측':'CHEUK','치':'CHI','칙':'CHIK','친':'CHIN','칠':'CHIL',
    '침':'CHIM','칭':'CHING','쾌':'KWAE','타':'TA','탁':'TAK','탄':'TAN','탈':'TAL','탐':'TAM','탑':'TAP','탕':'TANG',
    '태':'TAE','택':'TAEK','탱':'TAENG','터':'TEO','토':'TO','통':'TONG','퇴':'TOE','투':'TU','특':'TEUK','파':'PA',
    '판':'PAN','팔':'PAL','패':'PAE','팽':'PAENG','편':'PYUN','평':'PYEONG','폐':'PYE','포':'PO','폭':'POK','표':'PYO',
    '품':'POOM','풍':'PUNG','피':'PI','필':'PIL','핍':'PIP','하':'HA','학':'HAK','한':'HAN','할':'HAL','함':'HAM',
    '합':'HAP','항':'HANG','해':'HAE','핵':'HAEK','행':'HAENG','향':'HYANG','허':'HEO','헌':'HEON','험':'HEOM','혁':'HYUK',
    '현':'HYUN','혈':'HYEOL','혐':'HYEOM','협':'HYEOP','형':'HYUNG','혜':'HYE','호':'HO','혹':'HOK','혼':'HON','홀':'HOL',
    '홍':'HONG','화':'HWA','확':'HWAK','환':'HWAN','활':'HWAL','황':'HWANG','회':'HOE','획':'HOEK','횡':'HOENG','효':'HYO',
    '후':'HOO','훈':'HOON','훤':'HWON','훼':'HWE','휘':'HWI','휴':'HYU','흉':'HYUNG','흑':'HEUK','흔':'HEUN','흘':'HEUL',
    '흠':'HEUM','흥':'HEUNG','희':'HEE','힐':'HIL'
  };

  // ── 국립국어원 로마자 표기법(개정) 알고리즘 ────────────────
  const CHO  = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const JONG = ['','k','k','kt','n','nt','nh','t','l','lk','lm','lp','lt','lt','lp','lh','m','p','ps','t','t','ng','t','t','k','t','p','t'];

  function syllableAlgo(ch) {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return '';
    const cho  = Math.floor(code / 588);
    const jung = Math.floor((code % 588) / 28);
    const jong = code % 28;
    return (CHO[cho] + JUNG[jung] + JONG[jong]).toUpperCase();
  }

  // 이름 한 음절 → 관용표기 우선, 없으면 알고리즘
  function romanizeSyllable(ch) {
    return GIVEN_SYLLABLE_MAP[ch] || syllableAlgo(ch);
  }

  /**
   * 성명 로마자 변환
   * @param {string} kor  한글 성명 (예: "홍길동", "남궁민수")
   * @param {object} [opt] { hyphen:boolean } 이름 음절 하이픈 연결 여부
   * @returns {string} "SURNAME, GIVEN" 형식
   */
  function romanizeName(kor, opt) {
    opt = opt || {};
    if (!kor) return '';
    kor = kor.replace(/\s+/g, '').trim();
    if (!kor) return '';

    // 복성(2자) 우선 매칭 → 단성
    let surname = '';
    let given = kor;
    if (kor.length >= 3 && SURNAME_MAP[kor.slice(0, 2)]) {
      surname = SURNAME_MAP[kor.slice(0, 2)];
      given = kor.slice(2);
    } else if (SURNAME_MAP[kor[0]]) {
      surname = SURNAME_MAP[kor[0]];
      given = kor.slice(1);
    }

    const parts = [];
    for (const ch of given) {
      const r = romanizeSyllable(ch);
      if (r) parts.push(r);
    }
    const givenRoman = parts.join(opt.hyphen ? '-' : '');

    if (surname && givenRoman) return surname + ', ' + givenRoman;
    if (surname) return surname;
    return givenRoman;
  }

  App.romanize = romanizeName;
  App.romanizeName = romanizeName;      // 별칭
  App.SURNAME_MAP = SURNAME_MAP;
  App.GIVEN_SYLLABLE_MAP = GIVEN_SYLLABLE_MAP;

})(window.App = window.App || {});
