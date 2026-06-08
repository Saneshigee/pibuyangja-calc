/* ============================================================================
 *  계산 로직 (app.js)
 * ============================================================================
 *  ▣ 이 파일은 "로직"만 담당합니다. 연도 기준값은 config.js에서 읽습니다.
 *    기준 변경 시 app.js는 수정하지 마세요. → config.js만 수정.
 *
 *  ▣ 흐름:
 *    1. initYearLabels()   : config.js 값으로 화면 텍스트(연도/기준) 자동 채움
 *    2. onRelationChange() : 관계 선택에 따라 형제·자매 추가 항목 토글
 *    3. updateSummary()    : 소득 입력 실시간 합계
 *    4. updatePropertyTier(): 재산 구간 실시간 표시
 *    5. calculate()        : 최종 판정 → 결과 렌더링
 * ==========================================================================*/

(function () {
  "use strict";

  const C = window.CRITERIA;
  const CT = window.CONTACT;

  /* 유틸 */
  const val = (id) => parseFloat(document.getElementById(id).value) || 0;
  const won = (n) => n.toLocaleString("ko-KR") + "만원";
  const eok = (manwon) => (manwon / 10000).toLocaleString("ko-KR") + "억"; // 표기용

  /* ── 1) config 값으로 화면 라벨 자동 채움 ── */
  function initYearLabels() {
    document.querySelectorAll("[data-year]").forEach(el => { el.textContent = C.year; });
    document.querySelectorAll("[data-income-general]").forEach(el => { el.textContent = won(C.income.generalLimit); });
    document.querySelectorAll("[data-income-reduced]").forEach(el => { el.textContent = won(C.income.reducedLimit); });
    document.querySelectorAll("[data-income-business]").forEach(el => { el.textContent = won(C.income.businessLimit); });
    document.querySelectorAll("[data-prop-tier1]").forEach(el => { el.textContent = eok(C.property.tier1); });
    document.querySelectorAll("[data-prop-tier2]").forEach(el => { el.textContent = eok(C.property.tier2); });
    document.querySelectorAll("[data-rate]").forEach(el => { el.textContent = C.insuranceRate + "%"; });
    document.querySelectorAll("[data-updated]").forEach(el => { el.textContent = C.lastUpdated; });
    document.querySelectorAll("[data-nhis-phone]").forEach(el => { el.textContent = CT.nhisPhone; });
  }

  /* ── 2) 관계 선택 ── */
  function onRelationChange() {
    const rel = document.querySelector('input[name="relation"]:checked')?.value;
    const extra = document.getElementById("sibling-extra");
    if (extra) extra.classList.toggle("show", rel === "형제자매");
  }

  /* ── 3) 소득 합계 ── */
  function updateSummary() {
    const keys = ["work", "biz", "fin", "pension", "other"];
    let total = 0;
    keys.forEach(k => {
      const v = val("inc-" + k);
      const cell = document.getElementById("s-" + k);
      if (cell) cell.textContent = won(v);
      total += v;
    });
    const totalCell = document.getElementById("s-total");
    if (totalCell) totalCell.textContent = won(total);
  }

  /* ── 4) 재산 구간 표시 ── */
  function updatePropertyTier() {
    const prop = val("property");
    const tier = document.getElementById("prop-tier");
    const noteEl = document.getElementById("prop-note");
    const noteText = document.getElementById("prop-note-text");
    if (!tier) return;

    if (prop <= 0) {
      tier.textContent = "-"; tier.style.color = "var(--text)";
      noteEl.style.display = "none"; return;
    }
    if (prop > C.property.tier2) {
      tier.textContent = eok(C.property.tier2) + " 초과";
      tier.style.color = "var(--danger)";
      noteText.textContent = "재산 요건으로 피부양자 등록 불가";
      noteEl.style.display = "flex";
    } else if (prop > C.property.tier1) {
      tier.textContent = eok(C.property.tier1) + " 초과 ~ " + eok(C.property.tier2) + " 이하";
      tier.style.color = "var(--warning)";
      noteText.textContent = "이 구간은 연 소득 " + won(C.income.reducedLimit) + " 이하여야 합니다";
      noteEl.style.display = "flex";
    } else {
      tier.textContent = eok(C.property.tier1) + " 이하";
      tier.style.color = "var(--success)";
      noteEl.style.display = "none";
    }
  }

  /* ── 5) 최종 판정 ── */
  function calculate() {
    const relation = document.querySelector('input[name="relation"]:checked')?.value;
    if (!relation) { alert("부양 관계를 먼저 선택해주세요."); return; }

    const inc = {
      work:    val("inc-work"),
      biz:     val("inc-biz"),
      fin:     val("inc-fin"),
      pension: val("inc-pension"),
      other:   val("inc-other"),
    };
    const totalIncome = inc.work + inc.biz + inc.fin + inc.pension + inc.other;
    const bizReg = document.getElementById("biz-reg").checked;
    const property = val("property");

    let canRegister = true;
    const checks = [];

    /* 관계 요건 */
    if (relation === "형제자매") {
      const ageOk = document.getElementById("sib-age").checked;
      const disabledOk = document.getElementById("sib-disabled").checked;
      if (!ageOk && !disabledOk) {
        canRegister = false;
        checks.push({ type: "ng", title: "관계 요건 미충족",
          desc: `형제·자매는 만 ${C.sibling.minAgeUnder}세 미만, 만 ${C.sibling.minAgeOver}세 이상, 또는 등록 장애인·국가유공자여야 합니다.` });
      } else {
        checks.push({ type: "ok", title: "관계 요건 충족", desc: "형제·자매 (추가 요건 해당)" });
      }
    } else {
      checks.push({ type: "ok", title: "관계 요건 충족", desc: relation });
    }

    /* 사업자등록 주의 */
    if (bizReg) {
      checks.push({ type: "warn", title: "사업자등록 주의",
        desc: `사업자등록이 있는 경우 사업소득이 없어도 공단 심사 기준이 다를 수 있습니다. 국민건강보험공단(${CT.nhisPhone})에 개별 확인하세요.` });
    }

    /* 사업소득 한도 */
    if (inc.biz > C.income.businessLimit) {
      canRegister = false;
      checks.push({ type: "ng", title: "사업소득 요건 미충족",
        desc: `사업소득 ${won(inc.biz)} → 기준: 연 ${won(C.income.businessLimit)} 이하` });
    } else if (inc.biz > 0) {
      checks.push({ type: "ok", title: "사업소득 요건 충족",
        desc: `사업소득 ${won(inc.biz)} (기준: 연 ${won(C.income.businessLimit)} 이하)` });
    }

    /* 재산 요건 + 소득 한도 결정 */
    let incomeLimit = C.income.generalLimit;
    if (property > C.property.tier2) {
      canRegister = false;
      checks.push({ type: "ng", title: "재산 요건 미충족",
        desc: `재산세 과세표준 ${won(property)} → ${eok(C.property.tier2)} 초과 시 등록 불가` });
    } else if (property > C.property.tier1) {
      incomeLimit = C.income.reducedLimit;
      checks.push({ type: "warn", title: "재산 구간: 소득 기준 강화",
        desc: `재산세 과세표준 ${won(property)} (${eok(C.property.tier1)} 초과 ~ ${eok(C.property.tier2)} 이하) → 소득 기준 ${won(C.income.reducedLimit)} 이하 적용` });
    } else {
      checks.push({ type: "ok", title: "재산 요건 충족",
        desc: property > 0 ? `재산세 과세표준 ${won(property)} (${eok(C.property.tier1)} 이하)` : `재산 없음 또는 ${eok(C.property.tier1)} 이하` });
    }

    /* 총 소득 요건 */
    if (totalIncome > incomeLimit) {
      canRegister = false;
      checks.push({ type: "ng", title: "소득 요건 미충족",
        desc: `연 소득 합계 ${won(totalIncome)} → 기준: ${won(incomeLimit)} 이하` });
    } else {
      checks.push({ type: "ok", title: "소득 요건 충족",
        desc: `연 소득 합계 ${won(totalIncome)} (기준: ${won(incomeLimit)} 이하)` });
    }

    renderResult(canRegister, checks);
  }

  /* 결과 렌더링 */
  function renderResult(canRegister, checks) {
    const hasWarn = checks.some(c => c.type === "warn");
    let cls, icon, title, subtitle;

    if (!canRegister) {
      cls = "fail"; icon = "✕"; title = "피부양자 등록 불가"; subtitle = "아래 항목을 확인해 주세요";
    } else if (hasWarn) {
      cls = "warning"; icon = "!"; title = "조건부 확인 필요"; subtitle = "일부 항목은 공단 확인이 필요합니다";
    } else {
      cls = "pass"; icon = "✓"; title = "피부양자 등록 가능"; subtitle = `모든 요건을 충족합니다 (${C.year}년 기준)`;
    }

    const items = checks.map(c => `
      <div class="check-item">
        <div class="ci-icon ${c.type}">${c.type === "ok" ? "✓" : c.type === "ng" ? "✕" : "!"}</div>
        <div class="ci-text"><strong>${c.title}</strong><span>${c.desc}</span></div>
      </div>`).join("");

    const el = document.getElementById("result");
    el.className = `result ${cls}`;
    el.innerHTML = `
      <div class="result-header">
        <div class="result-icon">${icon}</div>
        <div><div class="result-title">${title}</div><div class="result-sub">${subtitle}</div></div>
      </div>
      <div class="check-list">${items}</div>
      <div class="notice">
        ※ 본 결과는 참고용이며, 실제 판정은 국민건강보험공단 심사를 따릅니다.<br>
        ※ 금융소득은 이자·배당 합산 연 ${won(C.income.reducedLimit)} 초과 시 전액 합산됩니다 (이 계산기는 입력값 그대로 사용).<br>
        ※ 자동차는 피부양자 재산 요건에 포함되지 않습니다.<br>
        ※ 피부양자 등록: 직장 인사팀 또는 <a href="${CT.nhisUrl}" target="_blank" rel="noopener">국민건강보험공단 지사</a> 신청
      </div>`;

    const ad = document.getElementById("ad-after-result");
    if (ad) ad.style.display = "flex";
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* FAQ 아코디언 */
  function initFaq() {
    document.querySelectorAll(".faq-q").forEach(btn => {
      btn.addEventListener("click", () => btn.parentElement.classList.toggle("open"));
    });
  }

  /* 초기화 + 이벤트 바인딩 */
  document.addEventListener("DOMContentLoaded", () => {
    initYearLabels();
    initFaq();

    document.querySelectorAll('input[name="relation"]').forEach(r =>
      r.addEventListener("change", onRelationChange));
    ["inc-work", "inc-biz", "inc-fin", "inc-pension", "inc-other"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", updateSummary);
    });
    const propEl = document.getElementById("property");
    if (propEl) propEl.addEventListener("input", updatePropertyTier);
    const btn = document.getElementById("calc-btn");
    if (btn) btn.addEventListener("click", calculate);
  });
})();
