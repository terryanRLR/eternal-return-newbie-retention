// ============================================================
// 사내 종합 대시보드 — PART2 기획자 탭 차트
// 원본 파일: eternal_return_dashboard_internal.html
// 뉴비 플레이타임 구간 분포, 출발 구역별 뉴비 생존 성과, 출발×사망 구역 히트맵, 동반 플레이 생존 비교, 보조 장치 사용 생존 비교.
// 아래는 원본에서 각 Chart.js 인스턴스 생성 구문(new Chart(...))을 괄호 매칭으로 그대로 잘라낸 것입니다.
// ============================================================

// ---- 뉴비 플레이타임 구간 (cNewt) ----
new Chart(cNewt,{type:'bar',data:{labels:D.newtime2.map(t=>t[0]),datasets:[{data:D.newtime2.map(t=>t[1]),backgroundColor:D.newtime2.map((t,i)=>i===1?C.plan:C.blue),borderRadius:3,barPercentage:.62}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>nf(c.parsed.y)+'명'}}},scales:{y:gx,x:ny}}});

// ---- 출발 구역별 뉴비 생존 성과 (cStart) ----
new Chart(cStart,{type:'bar',data:{labels:D.start_area.map(a=>a.area),datasets:[{data:D.start_area.map(a=>a.surv),backgroundColor:C.blue,borderRadius:3,barPercentage:.74}]},options:{indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const a=D.start_area[c.dataIndex];return '평균 생존 '+a.surv+'분 · 승률 '+a.win+'%';}}}},scales:{x:{...gx,suggestedMin:13.5,ticks:{callback:v=>v+'분'}},y:ny}}});

// ---- 출발×사망 구역 히트맵 (cDeath) ----
new Chart(cDeath,{type:'bar',data:{labels:D.death_area.map(d=>d.area),datasets:[{data:D.death_area.map(d=>d.deaths),backgroundColor:C.orange,borderRadius:3,barPercentage:.72}]},options:{indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const r=D.death_area[c.dataIndex];return nf(r.deaths)+'건 · '+r.share+'% · '+r.top_cause;}}}},scales:{x:gx,y:ny}}});

// ---- 동반 플레이 생존 비교 (cParty) ----
new Chart(cParty,{type:'bar',data:{labels:D.party_surv.map(p=>p[0]),datasets:[{data:D.party_surv.map(p=>p[1]),backgroundColor:[C.orange,C.blue,C.teal],borderRadius:3,barPercentage:.55}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y+'분'}}},scales:{y:{...gx,suggestedMin:13.5,ticks:{callback:v=>v+'분'}},x:ny}}});

// ---- 보조 장치 사용 생존 비교 (cUtil) ----
new Chart(cUtil,{type:'bar',data:{labels:D.util3.map(u=>u.name),datasets:[
 {label:'미사용',data:D.util3.map(u=>u.non),backgroundColor:'#9aa0ab',borderRadius:3,barPercentage:.8,categoryPercentage:.66},
 {label:'사용',data:D.util3.map(u=>u.used),backgroundColor:C.blue,borderRadius:3,barPercentage:.8,categoryPercentage:.66}]},
 options:{plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:11}}},tooltip:{callbacks:{label:c=>c.dataset.label+' Top3율 '+c.parsed.y+'%'}}},scales:{y:{...gx,ticks:{callback:v=>v+'%'},title:{display:true,text:'Top3율'}},x:ny}}});
