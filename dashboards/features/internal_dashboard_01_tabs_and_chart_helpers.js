// ============================================================
// 사내 종합 대시보드 — 탭 전환 & Chart.js 공용 헬퍼
// 원본 파일: eternal_return_dashboard_internal.html
// 임원진(exec)/기획자(plan)/밸런스팀(bal) 3-tab 전환 로직과, 막대 위 값 라벨을 그리는 Chart.js 커스텀 플러그인(valLabel) 등 모든 차트가 공유하는 헬퍼.
// 아래 코드는 원본 HTML(축소/한 줄 스타일)에서 그대로 추출한 것입니다 (수정 없음, 괄호 매칭으로 잘라냄).
// ============================================================

// ---- gx (const) ----
const gx={grid:{color:C.line},border:{display:false}};

// ---- ny (const) ----
const ny={grid:{display:false},border:{display:false}};

// ---- valLabel (const) ----
const valLabel=(fmt,col)=>({id:'vl'+Math.random(),afterDatasetsDraw(ch){const{ctx}=ch;const m=ch.getDatasetMeta(0);ctx.save();ctx.font='600 11px Pretendard';ctx.fillStyle=col||C.mut;ctx.textBaseline='middle';m.data.forEach((bar,i)=>{const v=ch.data.datasets[0].data[i];ctx.fillText(fmt(v),bar.x+6,bar.y);});ctx.restore();}});
