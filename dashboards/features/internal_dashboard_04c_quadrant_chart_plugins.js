// ============================================================
// 사내 종합 대시보드 — Chart.js 커스텀 플러그인 (사분면 배경 밴드 · 포인트 라벨)
// 원본 파일: eternal_return_dashboard_internal.html
// cQuad(승률x픽률 산점도)에 주입되는 plugins:[band, ptLabel]의 실제 정의.
// ============================================================

// ---- band (const, Chart.js custom plugin: quadrant background) ----
const band={id:'band',beforeDatasetsDraw(ch){const{ctx,chartArea:a,scales:{y,x}}=ch;const yU=y.getPixelForValue(TH.winUp),yL=y.getPixelForValue(TH.winLo);ctx.save();ctx.fillStyle='rgba(74,157,107,.07)';ctx.fillRect(a.left,yU,a.right-a.left,yL-yU);
 ctx.setLineDash([5,4]);ctx.lineWidth=1.2;ctx.strokeStyle='rgba(214,96,79,.55)';ctx.beginPath();ctx.moveTo(a.left,yU);ctx.lineTo(a.right,yU);ctx.stroke();ctx.strokeStyle='rgba(63,108,176,.55)';ctx.beginPath();ctx.moveTo(a.left,yL);ctx.lineTo(a.right,yL);ctx.stroke();
 const px=x.getPixelForValue(TH.pickMean);ctx.strokeStyle='#c8cdd6';ctx.beginPath();ctx.moveTo(px,a.top);ctx.lineTo(px,a.bottom);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='rgba(214,96,79,.85)';ctx.font='10px Pretendard';ctx.textAlign='right';ctx.fillText('+1σ '+TH.winUp.toFixed(1),a.right-4,yU-4);ctx.fillStyle='rgba(63,108,176,.85)';ctx.fillText('-1σ '+TH.winLo.toFixed(1),a.right-4,yL+12);ctx.restore();}};

// ---- ptLabel (const, Chart.js custom plugin: point label near dot) ----
const ptLabel={id:'pl',afterDatasetsDraw(ch){const{ctx}=ch;const m=ch.getDatasetMeta(0);ctx.save();ctx.font='800 11px Pretendard';ch.data.datasets[0].data.forEach((d,i)=>{if(labelSet.includes(d.nm)){const p=m.data[i];ctx.fillStyle=FC[d.fl]||'#333';ctx.fillText(d.nm,p.x+8,p.y+3);}});ctx.restore();}};
