// ============================================================
// 사내 종합 대시보드 — 제작 구간 분포 차트 (일반 vs 뉴비)
// 원본 파일: eternal_return_dashboard_internal.html
// 슬라이드 09 '이탈 원인 ① 제작'의 원본 구현. 동일 로직을 두 구간(5~10분/10~15분)에 재사용.
// ============================================================

// ---- craftChart(cv, d) : 제작 구간별 막대차트 헬퍼 함수 ----
function craftChart(cv,d){new Chart(cv,{type:'bar',data:{labels:d.cats,datasets:[
 {label:'일반 유저',data:d.gen,backgroundColor:'#9aa0ab',borderRadius:3,barPercentage:.8,categoryPercentage:.7},
 {label:'뉴비 유저',data:d.nb,backgroundColor:C.plan,borderRadius:3,barPercentage:.8,categoryPercentage:.7}]},
 options:{layout:{padding:{top:18}},plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:11}}}},scales:{y:{...gx,max:85,ticks:{callback:v=>v+'%'}},x:ny}},plugins:[vbarLabel]});}

// ---- 호출부 1: 5~10분 구간 제작 횟수 비교 (cCraft510) ----
craftChart(cCraft510,D.craft510);

// ---- 호출부 2: 10~15분 구간 제작 횟수 비교 (cCraft1015) ----
craftChart(cCraft1015,D.craft1015);