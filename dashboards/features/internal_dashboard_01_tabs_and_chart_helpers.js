// ============================================================
// 사내 종합 대시보드 — 탭 전환 & Chart.js 공용 헬퍼
// 원본 파일: eternal_return_dashboard_internal.html
// 임원진(exec)/기획자(plan)/밸런스팀(bal) 3-tab 전환 로직과, 막대 위 값 라벨을 그리는 Chart.js 커스텀 플러그인(valLabel) 등 모든 차트가 공유하는 헬퍼.
// 아래 코드는 원본 HTML(축소/한 줄 스타일)에서 그대로 추출한 것입니다 (수정 없음, 괄호 매칭으로 잘라냄).
//
// ⚠️ 이 파일은 **팀 원본 코드의 보존용 발췌**입니다. 현재 대시보드의 탭 전환 코드는
//    접근성 보강(role/aria-selected/로빙 tabindex/방향키)으로 다시 작성되어 아래와
//    다릅니다 — 지금 동작하는 코드는 HTML 본문을 보세요.
//    (docs/05_dashboard_architecture.md §A-1 참고)
// ============================================================

// ---- 탭 전환 (원본) ----
// 클릭 리스너만 있고 키보드 조작·aria 속성이 없었다.
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===t));
 document.querySelectorAll('.page').forEach(x=>x.classList.toggle('on',x.id===t.dataset.p));
 document.getElementById('ftteam').textContent=t.dataset.team+' · 사내 종합 대시보드';
}));

// ---- gx (const) ----
const gx={grid:{color:C.line},border:{display:false}};

// ---- ny (const) ----
const ny={grid:{display:false},border:{display:false}};

// ---- valLabel (const) ----
const valLabel=(fmt,col)=>({id:'vl'+Math.random(),afterDatasetsDraw(ch){const{ctx}=ch;const m=ch.getDatasetMeta(0);ctx.save();ctx.font='600 11px Pretendard';ctx.fillStyle=col||C.mut;ctx.textBaseline='middle';m.data.forEach((bar,i)=>{const v=ch.data.datasets[0].data[i];ctx.fillText(fmt(v),bar.x+6,bar.y);});ctx.restore();}});
