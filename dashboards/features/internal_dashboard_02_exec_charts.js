// ============================================================
// 사내 종합 대시보드 — PART1 임원진 탭 차트
// 원본 파일: eternal_return_dashboard_internal.html
// 유저별 플레이 횟수 분포, 레벨 구간별 재방문율, 사전 팀원 구성 비율/시간, 선택 유저 수 기준 캐릭터 TOP10.
// 아래는 원본에서 각 Chart.js 인스턴스 생성 구문(new Chart(...))을 괄호 매칭으로 그대로 잘라낸 것입니다.
// ============================================================

// ---- 유저별 플레이 횟수 분포 (cPlay) ----
new Chart(cPlay,{type:'bar',data:{labels:D.playcount.map(p=>p[0]),datasets:[{data:D.playcount.map(p=>p[1]),backgroundColor:C.blue,borderRadius:3,barPercentage:.62}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const r=D.playcount[c.dataIndex];return r[1]+'% · '+nf(r[2])+'명';}}}},scales:{y:{...gx,ticks:{callback:v=>v+'%'}},x:ny}}});

// ---- 레벨 구간별 재방문율 (cRet) ----
new Chart(cRet,{type:'line',data:{labels:D.retention.map(r=>r[0]),datasets:[{data:D.retention.map(r=>r[1]),borderColor:C.blue,backgroundColor:'rgba(63,108,176,.08)',fill:true,tension:.25,pointRadius:2.5,pointBackgroundColor:C.blue,borderWidth:2}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y+'%'}}},scales:{y:{...gx,ticks:{callback:v=>v+'%'}},x:{...ny,title:{display:true,text:'레벨 구간'}}}}});

// ---- 사전 팀원 구성 비율 (cPre) ----
new Chart(cPre,{type:'bar',data:{labels:D.premade.map(p=>p[0]),datasets:[{data:D.premade.map(p=>p[1]),backgroundColor:[C.orange,C.blue,C.teal],borderRadius:3,barPercentage:.6}]},options:{indexAxis:'y',layout:{padding:{right:30}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.x+'%'}}},scales:{x:{...gx,suggestedMax:72,ticks:{callback:v=>v+'%'}},y:ny}},plugins:[valLabel(v=>v+'%')]});

// ---- 구성별 평균 플레이시간 (cPreTime) ----
new Chart(cPreTime,{type:'bar',data:{labels:D.premade_time.map(p=>p[0]),datasets:[{data:D.premade_time.map(p=>p[1]),backgroundColor:[C.orange,C.blue,C.teal],borderRadius:3,barPercentage:.5}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y+'분'}}},scales:{y:{...gx,suggestedMin:13.5,ticks:{callback:v=>v+'분'}},x:ny}}});

// ---- 선택 유저 수 기준 캐릭터 TOP10 (cTop) ----
new Chart(cTop,{type:'bar',data:{labels:D.top10.map(t=>t[0]),datasets:[{data:D.top10.map(t=>t[1]),backgroundColor:C.blue,borderRadius:3,barPercentage:.74}]},options:{indexAxis:'y',layout:{padding:{right:52}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>nf(c.parsed.x)+'명'}}},scales:{x:{...gx,suggestedMax:Math.max(...D.top10.map(t=>t[1]))*1.13,ticks:{callback:v=>(v/1000)+'K'}},y:ny}},plugins:[valLabel(v=>nf(v))]});
