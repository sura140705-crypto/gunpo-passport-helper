# 민원실 신청서 작성 도우미

시청 민원실 **키오스크용** 신청서 작성 도우미. 어르신 친화(큰 글씨·고대비·큰 버튼),
**양식 위 작성**(SVG 배경 + 절대좌표 입력), 우측 실시간 가이드, **메모리 전용·무저장**.

## 아키텍처

개발은 모듈 소스로, **배포는 자체완결 단일 HTML**(서버 불필요)로 번들한다.
전역 `window.App` 네임스페이스에 클래식 스크립트로 부착 → 빌드 시 단순 병합.

```
gunpo_minwon/
├── index.html               개발 진입점 (모듈 로드 + SVG fetch 부팅)
├── build.js                 무의존 번들러 → dist/작성도우미.html
├── src/
│   ├── styles.css
│   ├── core/   state·render·a11y·app
│   ├── lib/    romanize(성명 로마자)·validate·juso(주소)
│   ├── schemas/ index(레지스트리)·passport·family·land·seal
│   └── assets/  passport.svg (실제 양식 모사)
├── tools/
│   ├── dev-server.js         무의존 정적 개발 서버 (+좌표 저장 엔드포인트)
│   └── coord-editor.html     좌표 편집기 (드래그·리사이즈·미세이동 → 스키마 저장)
├── dist/                     빌드 산출물 (배포용)
└── draft/                    타 AI 초안(참고용), 여권신청서.pdf(실제 서식)
```

## 개발 / 빌드

```bash
node tools/dev-server.js      # http://localhost:5173 (기본)
node build.js                 # dist/작성도우미.html 생성
```
> 개발 모드는 SVG를 `fetch` 하므로 정적 서버가 필요하다(`file://` 불가).
> **배포본(dist)** 은 모든 자산이 인라인되어 `file://` 로도 단독 실행된다.

## 스키마 확장

신청서 하나 = `src/schemas/<id>.js` 한 파일. `App.registerSchema(id, def)` 로 등록.
필드 타입: `text` / `grid`(문자당 한 칸) / `check`(group 지정 시 라디오) / `addr`(주소검색).
좌표(x,y,w,h)는 해당 `assets/<bg>.svg` 의 viewBox(794×1123, A4) 기준.

## 주소 API(juso) 운영 전환

`src/lib/juso.js` `CONFIG`:
1. business.juso.go.kr 에서 `confmKey` 발급 → `JUSO_KEY` 입력
2. `USE_DEMO = false`
3. 방식 선택: 서버 프록시(`PROXY_URL`) 또는 팝업(`POPUP_URL`) — 키오스크는 팝업 권장

## 좌표 편집기

양식 위 필드 좌표를 스캔본과 대조해 정밀화하는 개발 도구.

```bash
node tools/dev-server.js
# → http://localhost:5173/tools/coord-editor.html
```
- 필드 박스를 **드래그**해 이동, **핸들**로 크기(비격자: w·h / 격자: cellW·h) 조정,
  선택 후 **화살표키** 1px·**Shift+화살표** 10px 미세 이동, 우측 패널에서 수치 직접 입력.
- **[스키마 파일에 저장]** → dev-server가 `src/schemas/<id>.js` 의 기하 값(x,y,w,h,cells,cellW,gap,sep)만
  **제자리 치환**(라벨·가이드·검증 로직 보존). 서버 없이 열었으면 **[JSON 복사]** 로 수동 반영.
- 편집 대상은 `bg`+`fields` 를 가진 스키마(현재 passport)만 노출.

## 과제 진행 현황

- [x] 1. SCHEMAS `/schemas/*.js` 모듈 분리
- [x] 3. 외교부 관용표기 매핑 300+ (현재 558: 성씨 154 + 이름음절 404)
- [x] 4. juso 실연동 구조(데모/프록시/팝업 골격), 키는 추후
- [x] 2. SVG 외부화 + **좌표 편집기**(`tools/coord-editor.html`, 드래그·저장) 완료
- [ ] 5. 가족관계증명서 스키마 + 증명서 종류 마법사
- [ ] 6. 토지대장·인감증명 약식 양식
- [ ] 7. 인쇄 정합: 실제 외교부 표준 양식과 픽셀 단위 정합(좌표 편집기로 튜닝)
- [x] 8. 접근성 기반: 격자 키보드 네비게이션, ARIA 라벨, 포커스 가시성 (지속 보강)

## 실제 서식 기준

`draft/여권신청서.pdf` (여권법 시행규칙 제3조 별지 제1호서식)에 맞춰 스키마·SVG 구성.
좌표는 근사값이며 좌표 편집기로 스캔본과 대조해 정밀화한다.
