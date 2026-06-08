# 건강보험 피부양자 요건 계산기

소득·재산·관계를 입력하면 건강보험 피부양자 등록 가능 여부를 판정하는 정적 웹사이트.
HTML + CSS + 바닐라 JS로만 구성되어 별도 빌드 없이 그대로 배포 가능.

---

## 📁 파일 구조

```
site/
├── index.html      메인 페이지 (계산기 + 소개 + 자격안내 + FAQ + SEO)
├── privacy.html    개인정보처리방침 (애드센스 심사 필수)
├── styles.css      공유 스타일시트 (디자인 시스템 / :root 토큰)
├── config.js       ★ 연도별 기준값 — 매년 여기만 수정
├── app.js          계산 로직 (config.js 값을 읽어 판정)
├── robots.txt      크롤러 설정
├── sitemap.xml     사이트맵
└── README.md       이 문서
```

**핵심 원칙: 데이터(config.js) / 로직(app.js) / 표현(html·css) 분리.**
연도 기준이 바뀌어도 로직·디자인은 건드릴 필요가 없습니다.

---

## 🔧 매년 업데이트 방법 (가장 중요)

### 1순위: `config.js` 수정 (대부분 여기서 끝)

```js
const CRITERIA = {
  year: 2026,                 // → 새 연도
  lastUpdated: "2026년 4월",   // → 갱신 시점
  income: {
    generalLimit:  2000,      // 일반 소득 한도 (만원)
    reducedLimit:  1000,      // 재산 5.4억 초과 구간 소득 한도
    businessLimit:  500,      // 사업소득 한도
  },
  property: {
    tier1: 54000,             // 5.4억 (만원)
    tier2: 90000,             // 9억 (만원)
  },
  insuranceRate: 7.19,        // 해당 연도 보험료율 (%)
};
```

- 모든 금액 단위는 **만원**. (예: 9억 → `90000`)
- 화면의 연도/기준/금액 텍스트는 `data-*` 속성을 통해 **자동 반영**됩니다.

### 2순위: `index.html`의 YEAR-SENSITIVE 영역 (SEO용, 검색 노출에 중요)

검색엔진은 정적 텍스트를 읽으므로 아래 3곳의 연도는 **수동으로** 함께 바꿔야 합니다.
파일 내 `★ YEAR-SENSITIVE` 주석으로 표시해 두었습니다.

1. `<title>` 태그
2. `<meta name="description">` / `og:*` 설명
3. `<script type="application/ld+json">` (FAQ·WebApplication 구조화 데이터)

> 팁: `index.html`에서 이전 연도 숫자(예: `2026`)를 찾아 새 연도로 일괄 치환하면 됩니다.

### 3순위: 기준 자체가 개편된 경우만

소득/재산 "구간 수"나 "판정 규칙"이 바뀌면 `app.js`의 `calculate()` 수정 필요.
단순 금액 변경은 `config.js`만으로 충분합니다.

---

## 🤖 다른 AI / 개발자를 위한 작업 규칙

같은 디자인을 유지하며 페이지를 추가·수정할 때:

1. **색·간격·폰트는 절대 하드코딩하지 말 것.** `styles.css`의 `:root` CSS 변수(`--accent`, `--radius` 등)만 사용.
2. **새 페이지**는 `privacy.html`을 템플릿으로 복제 — 동일한 `.site-nav`, `.site-footer`, `.container`, `.card.prose` 구조 사용.
3. **연도·금액 등 가변 텍스트**는 직접 쓰지 말고 `data-year`, `data-income-general` 등 기존 data 속성 패턴을 따를 것. (app.js `initYearLabels()`가 채움)
4. **계산 기준값**은 반드시 `config.js`에서 읽기. app.js 안에 숫자 상수를 새로 박지 말 것.
5. 컴포넌트 클래스 재사용: 카드 `.card`, 본문 `.prose`, 강조박스 `.callout`, 버튼 `.btn`, 토글 `.toggle`, 결과 `.result`.

---

## 🚀 배포 전 체크리스트

`config.js` / 각 HTML에서 아래 placeholder를 실제 값으로 교체:

- [ ] `SITE.url`, `<link rel="canonical">`, `og:url`, sitemap.xml, robots.txt → 실제 도메인
- [ ] `CONTACT.email` (privacy.html 문의 + 애드센스 연락처)
- [ ] `SITE.publisher` → 운영자/사이트명
- [ ] 애드센스 승인 후: `index.html` 상단 `<script ... adsbygoogle>` 주석 해제 + `ca-pub-XXXX` 입력
- [ ] 애드센스 승인 후: 각 `.ad-slot` 내부 placeholder를 `<ins class="adsbygoogle">` 태그로 교체

### 배포 방법 (정적 호스팅)
Cloudflare Pages / Netlify / GitHub Pages 등에 `site/` 폴더 전체를 업로드하면 끝.

---

## ⚠️ 광고 슬롯 위치

| 위치 | 클래스 | 권장 규격 |
|------|--------|-----------|
| 상단 헤더 위 | `.ad-slot-top` | 728×90 (PC) / 320×100 (모바일) |
| 소득·재산 입력 사이 | `.ad-slot-mid` | 300×250 |
| 결과 출력 하단 | `.ad-slot-bottom` | 728×90 (결과 확인 후 노출) |

---

## 📌 면책

계산 결과는 참고용입니다. 최종 자격 판정은 국민건강보험공단(1577-1000) 기준을 따릅니다.
