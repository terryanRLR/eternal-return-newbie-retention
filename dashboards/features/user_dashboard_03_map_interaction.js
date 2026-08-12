// ============================================================
// 유저용 대시보드 — 지역 지도 상호작용 (승률 히트 도트 + 이동 경로 화살표)
// 원본 파일: eternal_return_dashboard_user.html
// 루미아 섬 지도 위에 지역별 승률을 색상 도트로 표시하고, 지역 클릭 시 주요 이동 경로를 화살표로 그려주는 기능. 실선/점선으로 이동 빈도를 표현.
// 아래 함수들은 원본 HTML에서 그대로 추출한 것입니다 (수정 없음, 브레이스 매칭으로 잘라냄).
// ============================================================

// ---- buildMapDots() ----
function buildMapDots() {
  const overlay = document.getElementById('mapOverlay');
  overlay.innerHTML = '';
  const viewed = getPatchData().places.map(p=>({...p, v:getPlaceView(p)}));
  const totalSum = viewed.reduce((s,p)=>s+p.v.total, 0);
  const avgWr = viewed.reduce((s,p)=>s+p.v.winRate*p.v.total, 0) / Math.max(1,totalSum);
  const wrs = viewed.map(p=>p.v.winRate);
  const maxWr = Math.max(...wrs), minWr = Math.min(...wrs);
  const isBeg = App.filter==='beginner';
  const deathRates = getExtraDeathRates(App.patch, isBeg);
  const rect = getMapImageRect();
  viewed.forEach(p=>{
    const pos = MAP_POSITIONS[p.placeOfStart]; if(!pos) return;
    const name = pname(p.placeOfStart);
    const isAbove = p.v.winRate >= avgWr;
    const strength = isAbove
      ? (maxWr>avgWr ? (p.v.winRate-avgWr)/(maxWr-avgWr) : 0)
      : (minWr<avgWr ? (avgWr-p.v.winRate)/(avgWr-minWr) : 0);
    const hue = isAbove ? 155 : 0;
    const sat = 30 + strength*60;
    const light = 70 - strength*45;
    const bg = `hsl(${hue},${sat}%,${light}%)`;
    const txt = light<50 ? '#fff' : '#0a0c10';
    const dot = document.createElement('div');
    dot.className = 'map-dot'; dot.id = 'dot-'+p.placeOfStart;
    dot.setAttribute('data-pos-x', pos[0]);
    dot.setAttribute('data-pos-y', pos[1]);
    if(rect) {
      const px = rect.offX + (pos[0]/100) * rect.rendW;
      const py = rect.offY + (pos[1]/100) * rect.rendH;
      dot.style.left = px + 'px';
      dot.style.top  = py + 'px';
    } else {
      dot.style.left = pos[0]+'%';
      dot.style.top  = pos[1]+'%';
    }
    dot.innerHTML = `<div class="map-dot-inner" style="background:${bg};border-color:rgba(255,255,255,0.55);color:${txt}">${name}</div>`;
    const dr = deathRates[String(p.placeOfStart)]||0;
    const dangerLbl = getDangerLabel(dr, deathRates);
    const dangerCls = getDangerClass(dr, deathRates);
    const dangerColor = dangerCls==='danger-high'?'var(--danger)':dangerCls==='danger-mid'?'var(--gold)':'var(--safe)';
    const tipContent = `<span style="color:${bg};font-size:13px;font-weight:900">${name}</span><br>`
      + `${t('mapWr')}: <b style="color:var(--accent)">${(p.v.winRate*100).toFixed(1)}%</b>`
      + ` &nbsp; ${t('mapTop3')}: <b style="color:var(--accent3)">${(p.v.top3Rate*100).toFixed(1)}%</b>`
      + `<br>${getDangerTipLabel()}: <b style="color:${dangerColor}">${dangerLbl} (${(dr*100).toFixed(1)}%)</b>`;
    dot.addEventListener('mouseenter', (e) => {
      const tip = document.getElementById('mapFloatTooltip');
      if(!tip) return;
      tip.innerHTML = tipContent;
      tip.style.display = 'block';
      positionMapTooltip(tip, e);
    });
    /* V25.1: rAF 스로틀 → 타임스탬프 스로틀 (rAF 미발화 시 플래그 영구 잠김 방지) */
    let _dotLast = 0;
    dot.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if(now - _dotLast < 33) return;
      _dotLast = now;
      const tip=document.getElementById('mapFloatTooltip');
      if(tip) positionMapTooltip(tip, e);
    });
    dot.addEventListener('mouseleave', () => {
      const tip = document.getElementById('mapFloatTooltip');
      if(tip) tip.style.display = 'none';
    });
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      highlightMapDot(p.placeOfStart);
      onMapDotClick(p.placeOfStart);
    });
    overlay.appendChild(dot);
  });
}

// ---- repositionMapDots() ----
function repositionMapDots() {
  const rect = getMapImageRect();
  if(!rect) return;
  document.querySelectorAll('.map-dot[data-pos-x]').forEach(dot=>{
    const px = rect.offX + (parseFloat(dot.dataset.posX)/100) * rect.rendW;
    const py = rect.offY + (parseFloat(dot.dataset.posY)/100) * rect.rendH;
    dot.style.left = px + 'px';
    dot.style.top  = py + 'px';
  });
}

// ---- getMapImageRect() ----
function getMapImageRect() {
  const img = document.getElementById('mapImg');
  const wrap = img ? img.parentElement : null;
  if(!img || !wrap) return null;
  const wrapW = wrap.clientWidth;
  const wrapH = wrap.clientHeight;
  const natW = img.naturalWidth  || img.width  || wrapW;
  const natH = img.naturalHeight || img.height || wrapH;
  if(!natW || !natH) return null;
  const scale = Math.min(wrapW / natW, wrapH / natH);
  const rendW = natW * scale;
  const rendH = natH * scale;
  const offX  = (wrapW - rendW) / 2;  // 좌우 여백
  const offY  = (wrapH - rendH) / 2;  // 상하 여백
  return { offX, offY, rendW, rendH, wrapW, wrapH };
}

// ---- onMapDotClick() ----
function onMapDotClick(placeId) {
  if(_activeArrowStart === placeId) { clearArrows(); return; }
  _activeArrowStart = placeId;
  drawFlowArrows(placeId);
}

// ---- highlightMapDot() ----
function highlightMapDot(placeId) {
  document.querySelectorAll('.map-dot').forEach(d=>d.classList.remove('highlighted'));
  const dot=document.getElementById('dot-'+placeId);
  if(dot) dot.classList.add('highlighted');
}

// ---- addArrows() ----
function addArrows(list, cat, color) {
    list.forEach((f,rank)=>{
      const key=f[0]+'_'+f[1];
      if(!arrowMap.has(key)) arrowMap.set(key,{flow:f, cats:[]});
      arrowMap.get(key).cats.push({cat,rank,color});
    });
  }

// ---- drawFlowArrows() ----
function drawFlowArrows(startId) {
  const layer = document.getElementById('mapArrowLayer');
  if(!layer) return;
  layer.innerHTML='';
  const rect = getMapImageRect();
  if(!rect) return;
  const flows = getFlowsForStart(startId);
  if(!flows.length) return;
  const totalDeaths = flows.reduce((s,f)=>s+f[2],0);
  const byTotal = [...flows].sort((a,b)=>b[2]-a[2]).slice(0,5);
  const byWr = [...flows].filter(f=>f[2]>=5).sort((a,b)=>(b[3]/b[2])-(a[3]/a[2])).slice(0,5);
  const byT3 = [...flows].filter(f=>f[2]>=5).sort((a,b)=>(b[4]/b[2])-(a[4]/a[2])).slice(0,5);
  const arrowMap = new Map(); // key: startId_deathId -> {categories, flow}
  function addArrows(list, cat, color) {
    list.forEach((f,rank)=>{
      const key=f[0]+'_'+f[1];
      if(!arrowMap.has(key)) arrowMap.set(key,{flow:f, cats:[]});
      arrowMap.get(key).cats.push({cat,rank,color});
    });
  }
  const isLight = document.body.classList.contains('light-mode') || document.body.classList.contains('sakura-mode');
  const countColor = isLight ? '#888888' : '#cccccc';
  const wrColor = '#40c870';
  const t3Color = '#4090e0';
  addArrows(byTotal,'count',countColor);
  addArrows(byWr,'wr',wrColor);
  addArrows(byT3,'t3',t3Color);
  const wrapW = rect.wrapW, wrapH = rect.wrapH;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS,'svg');
  svg.setAttribute('viewBox',`0 0 ${wrapW} ${wrapH}`);
  svg.style.pointerEvents='none';
  const defs = document.createElementNS(svgNS,'defs');
  [countColor,wrColor,t3Color].forEach(color=>{
    const markerId = 'ah-'+color.replace('#','');
    const marker = document.createElementNS(svgNS,'marker');
    marker.setAttribute('id',markerId);
    marker.setAttribute('viewBox','0 0 12 8');
    marker.setAttribute('refX','10');
    marker.setAttribute('refY','4');
    marker.setAttribute('markerWidth','10');
    marker.setAttribute('markerHeight','7');
    marker.setAttribute('orient','auto');
    const path = document.createElementNS(svgNS,'path');
    path.setAttribute('d','M0,0 Q6,4 0,8 L12,4 Z');
    path.setAttribute('fill',color);
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);
  const dashArrays = ['none','12,5','6,4','4,3,2,3','2,3'];
  const pairOffsets = new Map();
  arrowMap.forEach((data, key)=>{
    const f = data.flow;
    const deathId = f[1];
    const startPos = MAP_POSITIONS[startId];
    const endPos = MAP_POSITIONS[deathId];
    if(!startPos||!endPos) return;
    const sx = rect.offX + (startPos[0]/100)*rect.rendW;
    const sy = rect.offY + (startPos[1]/100)*rect.rendH;
    const ex = rect.offX + (endPos[0]/100)*rect.rendW;
    const ey = rect.offY + (endPos[1]/100)*rect.rendH;
    const pairKey = Math.min(startId,deathId)+'_'+Math.max(startId,deathId);
    if(!pairOffsets.has(pairKey)) pairOffsets.set(pairKey,0);
    const baseOffset = pairOffsets.get(pairKey);
    data.cats.forEach((cat,ci)=>{
      const offset = baseOffset + ci * 6 - (data.cats.length-1)*3;
      const dx = ex-sx, dy = ey-sy;
      const len = Math.sqrt(dx*dx+dy*dy)||1;
      const nx = -dy/len, ny = dx/len; // perpendicular
      const osx = sx + nx*offset, osy = sy + ny*offset;
      const oex = ex + nx*offset, oey = ey + ny*offset;
      const mx = (osx+oex)/2 + nx*18;
      const my = (osy+oey)/2 + ny*18;
      const pathD = `M${osx.toFixed(1)},${osy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${oex.toFixed(1)},${oey.toFixed(1)}`;
      const path = document.createElementNS(svgNS,'path');
      path.setAttribute('d',pathD);
      path.setAttribute('fill','none');
      path.setAttribute('stroke',cat.color);
      path.setAttribute('stroke-width', cat.rank===0?'3':'2');
      path.setAttribute('stroke-opacity','0.8');
      if(dashArrays[cat.rank]!=='none') path.setAttribute('stroke-dasharray',dashArrays[cat.rank]);
      path.setAttribute('marker-end',`url(#ah-${cat.color.replace('#','')})`);
      path.style.pointerEvents='stroke';
      path.style.cursor='pointer';
      const wr = f[2]>0?(f[3]/f[2]*100).toFixed(1):'0';
      const t3r = f[2]>0?(f[4]/f[2]*100).toFixed(1):'0';
      const dr = totalDeaths>0?(f[2]/totalDeaths*100).toFixed(1):'0';
      const CAT_LBL={ko:{count:'이동량',wr:'승률',t3:'상위3위률'},en:{count:'Traffic',wr:'Win rate',t3:'Top3 rate'},jp:{count:'移動量',wr:'勝率',t3:'TOP3率'}};
      const catLabel = (CAT_LBL[currentLang]||CAT_LBL.ko)[cat.cat];
      const tipHtml = `<span style="font-weight:900">${pname(startId)} → ${pname(deathId)}</span><br>`
        +`<span style="color:var(--text-muted)">${catLabel} ${cat.rank+1}위</span><br>`
        +`사망비율: <b>${dr}%</b> (${f[2]}회)<br>`
        +`승률: <b style="color:var(--accent)">${wr}%</b>  `
        +`상위3위: <b style="color:var(--accent3)">${t3r}%</b>`;
      path.addEventListener('mouseenter',(e)=>{
        const tip = document.getElementById('arrowTooltip');
        if(tip){ tip.innerHTML=tipHtml; tip.style.display='block'; tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY+12)+'px'; }
      });
      /* V25.1: rAF 스로틀 → 타임스탬프 스로틀 */
      let _arrowLast = 0;
      path.addEventListener('mousemove',(e)=>{
        const now = performance.now();
        if(now - _arrowLast < 33) return;
        _arrowLast = now;
        const tip=document.getElementById('arrowTooltip');
        if(tip){ tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY+12)+'px'; }
      });
      path.addEventListener('mouseleave',()=>{
        const tip = document.getElementById('arrowTooltip');
        if(tip) tip.style.display='none';
      });
      svg.appendChild(path);
    });
    pairOffsets.set(pairKey, baseOffset + data.cats.length * 6 + 4);
  });
  layer.appendChild(svg);
  const legend = document.getElementById('arrowLegend');
  if(legend) legend.style.display='flex';
  const hint = document.getElementById('mapClickHint');
  if(hint) hint.style.opacity='0';
}

// ---- clearArrows() ----
function clearArrows() {
  const layer = document.getElementById('mapArrowLayer');
  if(layer) layer.innerHTML='';
  const legend = document.getElementById('arrowLegend');
  if(legend) legend.style.display='none';
  const hint = document.getElementById('mapClickHint');
  if(hint) hint.style.opacity='1';
  _activeArrowStart = null;
}

// ---- getFlowsForStart() ----
function getFlowsForStart(startId) {
  const isBeg = App.filter==='beginner';
  const flows = getExtraFlows(App.patch, isBeg);
  return flows.filter(f=>f[0]===startId); // [start,death,total,wins,top3]
}

// ---- positionMapTooltip() ----
function positionMapTooltip(tip, e) {
  const TW = tip.offsetWidth  || 180;
  const TH = tip.offsetHeight || 52;
  const MARGIN = 14;
  let x = e.clientX + MARGIN;
  let y = e.clientY + MARGIN;
  if(x + TW + MARGIN > window.innerWidth)  x = e.clientX - TW - MARGIN;
  if(y + TH + MARGIN > window.innerHeight) y = e.clientY - TH - MARGIN;
  if(x < MARGIN) x = MARGIN;
  if(y < MARGIN) y = MARGIN;
  tip.style.left = x + 'px';
  tip.style.top  = y + 'px';
}

// ---- getDangerClass() ----
function getDangerClass(rate,rates){
  const v=Object.values(rates).sort((a,b)=>a-b);
  const p66=v[Math.floor(v.length*0.66)]||0.06, p33=v[Math.floor(v.length*0.33)]||0.04;
  return rate>=p66?'danger-high':rate>=p33?'danger-mid':'danger-low';
}

// ---- getDangerLabel() ----
function getDangerLabel(rate,rates){
  const c=getDangerClass(rate,rates), L=DANGER_LBL[currentLang]||DANGER_LBL.ko;
  return c==='danger-high'?L.h:c==='danger-mid'?L.m:L.l;
}

// ---- getDangerTipLabel() ----
function getDangerTipLabel(){ return DANGER_TIP[currentLang]||DANGER_TIP.ko; }
