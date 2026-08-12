// ============================================================
// 사내 종합 대시보드 — PART3 밸런스팀 탭: 승률×픽률 사분면 + SHAP 카드
// 원본 파일: eternal_return_dashboard_internal.html
// 승률×픽률 사분면 산점도(cQuad, quadrant 배경 밴드 포함), 사분면 그룹별 캐릭터 칩 목록(grpWrap), 너프/버프 후보 카드(nerfRow/buffRow), SHAP 해석 카드(shapWrap).
// 아래 코드는 원본 HTML(축소/한 줄 스타일)에서 그대로 추출한 것입니다 (수정 없음, 괄호 매칭으로 잘라냄).
// ============================================================

// ---- chq (func) ----
function chq(c){const en=c.en||'';return `<div class="chq"><div class="av3"><img src="${PORT(en)}" alt="" onerror="this.parentNode.innerHTML='<span>'+'${c.char[0]}'+'</span>'"></div><div class="nm2">${c.char}</div><div class="st2">승 ${c.win}%<br>픽 ${c.pick}%</div></div>`;}
