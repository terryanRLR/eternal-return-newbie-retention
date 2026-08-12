// ============================================================
// 유저용 대시보드 — 캔버스 기반 레이더/파이 차트 (Chart.js 미사용)
// 원본 파일: eternal_return_dashboard_user.html
// 이 대시보드는 Chart.js를 쓰지 않고 <canvas> 2D context에 직접 그리는 자체 차트 엔진을 사용합니다. 캐릭터 능력치 레이더 차트와 능력별 승리 기여도 파이 차트가 대표적입니다.
// 아래 함수들은 원본 HTML에서 그대로 추출한 것입니다 (수정 없음, 브레이스 매칭으로 잘라냄).
// ============================================================

// ---- drawRadar() ----
function drawRadar(charData) {
  const canvas = document.getElementById('radarCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  if(!ctx) return;
  const W=canvas.width, H=canvas.height;
  const cx=W/2, cy=H/2, r=Math.min(W,H)*0.37;
  const RADAR_LABELS=getRadarLabels();
  const n=RADAR_KEYS.length;
  const angles = Array.from({length:n},(_,i)=>(i*2*Math.PI/n)-Math.PI/2);
  const targetVals = RADAR_KEYS.map(k=>(charData[k]||0)/100);
  const patchAvg = PATCH_AVG_RADAR[App.patch] || PATCH_AVG_RADAR.all;
  const avgV = patchAvg.map(v=>v/100);
  const geo={cx,cy,r,angles};
  const isNewChar=charData.id!==radarLastCharId;
  const startVals=(isNewChar||!radarPrevVals||radarPrevVals.length!==n)?new Array(n).fill(0):radarPrevVals.slice();
  radarLastCharId=charData.id;
  if(radarRAF) cancelAnimationFrame(radarRAF);
  if(REDUCED_MOTION){
    renderRadarFrame(ctx,geo,targetVals,avgV,RADAR_LABELS,targetVals);
    radarPrevVals=targetVals.slice();
  } else {
    const t0=performance.now();
    const stepFn=now=>{
      const raw=Math.min((now-t0)/RADAR_DURATION,1),e=easeInOutCubic(raw);
      const curVals=targetVals.map((tv,i)=>startVals[i]+(tv-startVals[i])*e);
      renderRadarFrame(ctx,geo,curVals,avgV,RADAR_LABELS,targetVals);
      if(raw<1){radarRAF=requestAnimationFrame(stepFn);}
      else{radarRAF=null;radarPrevVals=targetVals.slice();}
    };
    radarRAF=requestAnimationFrame(stepFn);
  }
  [['radarLegChar','radarLegendChar'],['radarLegAvg','radarLegendAvg']].forEach(([id,k])=>{const e=document.getElementById(id);if(e)e.textContent=t(k);});
}

// ---- renderRadarFrame() ----
function renderRadarFrame(ctx, geo, curVals, avgV, labels, targetVals) {
  const { cx, cy, r, angles } = geo;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const light = document.body.classList.contains('light-mode');
  ctx.clearRect(0, 0, W, H);
  for(let ring=1; ring<=5; ring++){
    const rr = r*ring/5;
    ctx.beginPath();
    angles.forEach((a,i)=>{ const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.closePath();
    ctx.strokeStyle = ring===5 ? 'rgba(232,200,74,0.3)' : (light?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.06)');
    ctx.lineWidth = ring===5?1.5:1; ctx.stroke();
    if(ring===5){ ctx.fillStyle='rgba(255,255,255,0.02)'; ctx.fill(); }
  }
  angles.forEach(a=>{ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); ctx.strokeStyle=light?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke(); });
  ctx.beginPath();
  angles.forEach((a,i)=>{ const x=cx+Math.cos(a)*r*avgV[i], y=cy+Math.sin(a)*r*avgV[i]; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.closePath(); ctx.fillStyle='rgba(100,120,200,0.15)'; ctx.fill(); ctx.strokeStyle='rgba(100,120,200,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.beginPath();
  angles.forEach((a,i)=>{ const x=cx+Math.cos(a)*r*curVals[i], y=cy+Math.sin(a)*r*curVals[i]; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.closePath(); ctx.fillStyle='rgba(232,200,74,0.18)'; ctx.fill(); ctx.strokeStyle='rgba(232,200,74,0.9)'; ctx.lineWidth=2; ctx.stroke();
  angles.forEach((a,i)=>{ const x=cx+Math.cos(a)*r*curVals[i], y=cy+Math.sin(a)*r*curVals[i]; ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2); ctx.fillStyle='#e8c84a'; ctx.fill(); });
  ctx.font='9px Noto Sans KR'; ctx.textAlign='center'; ctx.textBaseline='middle';
  angles.forEach((a,i)=>{ const lx=cx+Math.cos(a)*(r+20), ly=cy+Math.sin(a)*(r+20); ctx.fillStyle=targetVals[i]>avgV[i]?'#e8c84a':'#7a8099'; ctx.fillText(labels[i],lx,ly); });
}

// ---- getRadarLabels() ----
function getRadarLabels(){ return (LANG[currentLang]||LANG.ko).radarLabels || LANG.ko.radarLabels; }

// ---- drawPieChart() ----
function drawPieChart(canvasId, data, legendId, rawCorrs, statKeys) {
  if(!pieDisabled[canvasId]) pieDisabled[canvasId] = new Set();
  const disabled = pieDisabled[canvasId];
  const colors = data.map((d, i) => getPieColor(statKeys ? statKeys[i] : '', i));
  const activeVals = data.map((d, i) => disabled.has(i) ? 0 : d.val);
  const total = activeVals.reduce((s, v) => s + v, 0);
  const targetAngles=[];
  let cur=-Math.PI/2;
  activeVals.forEach(v=>{ const span=total>0?(v/total)*Math.PI*2:0; targetAngles.push({start:cur,end:cur+span}); cur+=span; });
  const prevAngles=pieAngles[canvasId]||data.map(()=>({start:-Math.PI/2,end:-Math.PI/2}));
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  if(pieAnimRAF[canvasId]) cancelAnimationFrame(pieAnimRAF[canvasId]);
  const bgDark=getComputedStyle(document.body).getPropertyValue('--bg-dark').trim()||'#0a0c10';
  let lastSlices=[];
  if(REDUCED_MOTION){
    lastSlices=renderPieFrame(canvas,ctx,targetAngles,data,colors,rawCorrs,total,bgDark);
    pieAngles[canvasId]=targetAngles; pieAnimRAF[canvasId]=null;
  } else {
    const DURATION=560, t0=performance.now();
    const step=now=>{
      const raw=Math.min((now-t0)/DURATION,1), ease=easeInOutCubic(raw);
      const curAngles=targetAngles.map((tgt,i)=>{ const p=prevAngles[i]||{start:-Math.PI/2,end:-Math.PI/2}; return{start:p.start+(tgt.start-p.start)*ease,end:p.end+(tgt.end-p.end)*ease}; });
      lastSlices=renderPieFrame(canvas,ctx,curAngles,data,colors,rawCorrs,total,bgDark);
      if(raw<1){pieAnimRAF[canvasId]=requestAnimationFrame(step);}
      else{pieAngles[canvasId]=targetAngles;pieAnimRAF[canvasId]=null;}
    };
    pieAnimRAF[canvasId]=requestAnimationFrame(step);
  }
  attachPieTooltip(canvasId, () => lastSlices, colors, total);
  const maxCorr = Math.max(...data.map(d => d.val));
  const leg = document.getElementById(legendId);
  leg.innerHTML = data.map((d, i) => {
    const barW = (d.val/maxCorr*100).toFixed(0);
    const isOff = disabled.has(i);
    return '<div class="legend-item'+(isOff?' disabled':'')+'" data-canvas="'+canvasId+'" data-idx="'+i+'">'
      +'<span class="legend-icon">'+(d.icon||'\u25ce')+'</span>'
      +'<div class="legend-dot" style="background:'+colors[i]+'"></div>'
      +'<span style="color:var(--text);flex:1;font-size:14px;font-weight:700">'+d.label+'</span>'
      +'<div class="legend-bar-wrap"><div class="legend-bar-fill" style="width:'+barW+'%;background:'+colors[i]+'"></div></div>'
      +'<span style="color:'+colors[i]+';font-weight:700;font-size:14px;width:48px;text-align:right">'+(d.val*100).toFixed(1)+'%</span>'
      +'</div>';
  }).join('');
  leg.querySelectorAll('.legend-item').forEach(el => {
    el.onclick = () => {
      const idx = parseInt(el.dataset.idx);
      const cid = el.dataset.canvas;
      if(!pieDisabled[cid]) pieDisabled[cid] = new Set();
      if(pieDisabled[cid].has(idx)) {
        pieDisabled[cid].delete(idx);
      } else {
        if(data.length - pieDisabled[cid].size <= 1) return;
        pieDisabled[cid].add(idx);
      }
      renderAbilityTab();
    };
  });
}

// ---- renderPieFrame() ----
function renderPieFrame(canvas,ctx,angles,data,colors,rawCorrs,total,bgDark){
  const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2-8,r=Math.min(W,H)*0.37;
  if(!bgDark) bgDark='#0a0c10';
  ctx.clearRect(0,0,W,H);
  const slices=[];
  angles.forEach((ang,i)=>{
    const span=ang.end-ang.start;
    if(span<0.001) return;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,ang.start,ang.end);ctx.closePath();
    ctx.fillStyle=colors[i];ctx.fill();ctx.strokeStyle=bgDark;ctx.lineWidth=2;ctx.stroke();
    slices.push({start:ang.start,end:ang.end,i,d:data[i],corr:rawCorrs?rawCorrs[i]:data[i].val});
    if(span>0.28){
      const mid=ang.start+span/2;
      ctx.font='bold 13px Noto Sans KR';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
      ctx.fillText((span/(Math.PI*2)*100).toFixed(0)+'%',cx+Math.cos(mid)*r*0.65,cy+Math.sin(mid)*r*0.65);
    }
  });
  ctx.beginPath();ctx.arc(cx,cy,r*0.38,0,Math.PI*2);ctx.fillStyle=bgDark;ctx.fill();
  if(total===0){ctx.font='14px Noto Sans KR';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(200,200,200,0.4)';ctx.fillText('—',cx,cy);}
  return slices;
}

// ---- attachPieTooltip() ----
function attachPieTooltip(canvasId, getSlices, colors, total) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2-8, r = Math.min(W,H)*0.37;
  const tipId = canvasId === 'pieWinCanvas' ? 'pieTooltipWin' : 'pieTooltipTop3';
  const tip = document.getElementById(tipId);
  if(!tip) return;
  /* V25.1: rect 캐시 + 타임스탬프 스로틀 (rAF 미발화 시 핸들러 영구 잠김 방지) */
  let _cachedRect = null, _rectTick = 0, _pieLast = 0;
  function _refreshRect(){ _cachedRect = canvas.getBoundingClientRect(); _rectTick = performance.now(); }
  canvas.onmousemove = (e) => {
    const _now = performance.now();
    if(_now - _pieLast < 33) return;
    _pieLast = _now;
    const ex = e.clientX, ey = e.clientY;
    {
      if(!_cachedRect || performance.now()-_rectTick > 500) _refreshRect();
      const rect = _cachedRect;
      const mx = (ex-rect.left)*(W/rect.width);
      const my = (ey-rect.top)*(H/rect.height);
      const dx = mx-cx, dy = my-cy;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if(dist > r || dist < r*0.38) { tip.style.display='none'; return; }
      let ang = Math.atan2(dy, dx);
      const slices = getSlices();
      const hit = slices.find(s => {
        let a = ang;
        while(a < s.start) a += Math.PI*2;
        while(a > s.start + Math.PI*2) a -= Math.PI*2;
        return a >= s.start && a <= s.end;
      });
      if(!hit) { tip.style.display='none'; return; }
      const span = hit.end - hit.start;
      const pct = (span/(Math.PI*2)*100).toFixed(1);
      const corrVal = ((hit.corr||0)*100).toFixed(1);
      tip.innerHTML = '<span style="color:'+colors[hit.i]+'">'+(hit.d.icon||'\u25ce')+' '+hit.d.label+'</span><br>'
        +'<span style="color:var(--text-muted);font-weight:400">'+t('legContrib')+'</span> <b>'+pct+'%</b><br>'
        +'<span style="color:var(--text-muted);font-weight:400">'+t('legCorr')+'</span> <b style="color:var(--accent3)">'+corrVal+'%</b>';
      tip.style.display = 'block';
      tip.style.left = (ex - rect.left + 14)+'px';
      tip.style.top  = (ey - rect.top  + 14)+'px';
    }
  };
  canvas.onmouseleave = () => { tip.style.display='none'; };
}

// ---- getPieColor() ----
function getPieColor(stat, fallbackIdx) {
  const idx = PIE_STAT_ORDER.indexOf(stat);
  return PIE_COLORS_ARR[(idx >= 0 ? idx : fallbackIdx) % PIE_COLORS_ARR.length];
}

// ---- _getPieState() ----
function _getPieState(id){
  if(!pieState[id]) pieState[id] = { disabled: new Set(), angles: null, raf: null };
  return pieState[id];
}

// ---- _cycP() ----
function _cycP(){var i=_PO.indexOf(App.patch),n=_PO[(i+1)%_PO.length],b=document.getElementById(n==='all'?'patchBtnAll':n==='22.1'?'patchBtn221':'patchBtn230');if(b)setPatch(n,b);}

// ---- easeInOutCubic() ----
function easeInOutCubic(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}
