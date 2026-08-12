// ============================================================
// 사내 종합 대시보드 — PART3 밸런스팀: 승률×픽률 사분면 산점도 (cQuad)
// 원본 파일: eternal_return_dashboard_internal.html
// Isolation Forest로 분류된 flag(너프 후보(OP)/숙련자형/신중 검토/버프 후보/정상)별로 색상을 다르게 그리는 산점도. quadrant band 배경 플러그인 포함.
// 아래는 원본에서 각 Chart.js 인스턴스 생성 구문(new Chart(...))을 괄호 매칭으로 그대로 잘라낸 것입니다.
// ============================================================

// ---- 승률×픽률 사분면 산점도 (cQuad) ----
new Chart(cQuad,{type:'scatter',data:{datasets:[{data:D.cbal.map(c=>({x:c.pick,y:c.win,nm:c.char,fl:c.flag})),pointRadius:D.cbal.map(c=>c.flag==='정상'?3.2:6),pointHoverRadius:9,backgroundColor:D.cbal.map(c=>FC[c.flag]),borderColor:'#fff',borderWidth:D.cbal.map(c=>c.flag==='정상'?0:1.2)}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const d=c.raw;return `${d.nm} · 승률 ${d.y}% · 픽률 ${d.x}% · ${d.fl}`;}}}},scales:{x:{...gx,title:{display:true,text:'픽률 (%) →'}},y:{...gx,title:{display:true,text:'승률 (%) →'}}}},plugins:[band,ptLabel]});
