// ============================================================
// 유저용 대시보드 — 성향별 캐릭터 추천 엔진
// 원본 파일: eternal_return_dashboard_user.html
// 전투/방어/회복/지원/시야/사냥/성장/금전/제작/이동 10개 성향(TEND_ICONS) 중 사용자가 고른 성향에 맞춰 캐릭터 TOP5를 스코어링해 추천. 점수식: 성향지표*0.40 + 정규화승률*0.35 + 정규화Top3율*0.25.
// 아래 함수들은 원본 HTML에서 그대로 추출한 것입니다 (수정 없음, 브레이스 매칭으로 잘라냄).
// ============================================================

// ---- renderRecTab() ----
function renderRecTab() {
  const chars = getCharData();
  const isBeg = App.filter==='beginner';
  let toggleHtml = `<div class="tend-toggle-wrap">
    <button class="tend-btn${_selectedTendency==='all'?' active':''}" data-tendency="all">${t('filterAll')}</button>`;
  TEND_KEYS.forEach(k=>{
    toggleHtml += `<button class="tend-btn${_selectedTendency===k?' active':''}" data-tendency="${k}">${TEND_ICONS[k]} ${getTendLabel(k)}</button>`;
  });
  toggleHtml += `</div>`;
  const charSubEl = document.getElementById('recCharSub');
  if(charSubEl) {
    charSubEl.innerHTML = t('recCharSub') + toggleHtml; /* V25-fix: 하드코딩 한국어 → 다국어 키 */
  }
  renderTendencyChars();
  const isBegPlace = App.filter === 'beginner';
  const topPlaces = [...getPatchData().places]
    .map(p => ({...p, v: getPlaceView(p)}))
    .filter(p => p.v.wr_diff > 0)
    .sort((a,b) => b.v.winRate - a.v.winRate)
    .slice(0, 5);
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  const goHint = t('goHintMap');
  const deathRates = getExtraDeathRates(App.patch, isBeg);
  document.getElementById('recPlaceList').innerHTML = topPlaces.map((p,i) => {
    const dr = deathRates[String(p.placeOfStart)]||0;
    const dangerCls = getDangerClass(dr, deathRates);
    const dangerLbl = getDangerLabel(dr, deathRates);
    const routes = getRouteRecommendations(p.placeOfStart);
    let routeHtml = '';
    if(routes.good.length || routes.bad.length) {
      const routeMedals = ['🥇','🥈','🥉'];
      let parts = [];
      if(routes.good.length) {
        const goodNames = routes.good.slice(0,3).map((r,ri)=>`${routeMedals[ri]||''}${pname(r.place)}`).join('\u2009');
        parts.push(`<span class="rec-route-good" style="font-size:10px;font-weight:700;white-space:nowrap">✅ 추천 경로:${goodNames}</span>`);
      }
      if(routes.bad.length) {
        const badNames = routes.bad.slice(0,3).map((r,ri)=>`${routeMedals[ri]||''}${pname(r.place)}`).join('\u2009');
        parts.push(`<span class="rec-route-bad" style="font-size:10px;font-weight:700;white-space:nowrap">⚠️ 회피 지역:${badNames}</span>`);
      }
      routeHtml = `<div class="rec-route-wrap" style="display:flex;flex-direction:row;flex-wrap:wrap;gap:6px 14px;padding:4px 8px;align-items:center">${parts.join('')}</div>`;
    }
    return `<div class="rec-place-item" data-place-id="${p.placeOfStart}">
      <span class="rec-place-medal">${medals[i]}</span>
      <span class="rec-place-name">${pname(p.placeOfStart)}<span class="danger-badge ${dangerCls}" style="font-size:9px">☠ ${dangerLbl}</span></span>
      <div class="rec-place-stats">
        <div class="rec-place-stat">
          <span class="rec-place-stat-label">${t('recPlaceWr')}</span>
          <span class="rec-place-stat-val wr">${(p.v.winRate*100).toFixed(1)}%</span>
        </div>
        <div class="rec-place-stat">
          <span class="rec-place-stat-label">${t('recPlaceTop3')}</span>
          <span class="rec-place-stat-val top3">${(p.v.top3Rate*100).toFixed(1)}%</span>
        </div>
        <div class="rec-place-stat">
          <span class="rec-place-stat-label">${t('recPlaceDiff')}</span>
          <span class="rec-place-stat-val diff">+${(p.v.wr_diff*100).toFixed(2)}%p</span>
        </div>
      </div>
      <span class="rec-place-goto">${goHint}</span>
      ${routeHtml}
    </div>`;
  }).join('');
  const abilitySorted=[...getPatchData().ability].sort((a,b)=>b.win_corr-a.win_corr);
  document.getElementById('recAbilityList').innerHTML=abilitySorted.map((a,i)=>{
    const pct=(Math.abs(a.win_corr)/0.736*100).toFixed(0);
    return `<div class="stat-bar-mini" data-action="goToAbility" title="${t('abilityTabHint')}">
      <div class="stat-bar-mini-label">${ABILITY_ICONS[a.stat]||'📊'} ${getAbilityLabel(a.stat)}</div>
      <div class="stat-bar-mini-track">
        <div class="stat-bar-mini-fill" style="width:${pct}%;background:${getPieColor(a.stat, i)}"></div>
      </div>
      <div class="stat-bar-mini-val">${(a.win_corr*100).toFixed(0)}%</div>
    </div>`;
  }).join('');
}

// ---- computeTiers() ----
function computeTiers(){
  const key = _tierKey();
  if(_tierCache[key]) return _tierCache[key];
  const isBeg = App.filter === 'beginner';
  const src = (App.patch==='all' ? RAW_DATA : (PATCH_DATA[App.patch]||RAW_DATA)).chars;
  const getTotal = c => isBeg ? c.beg_total : c.total;
  const getWr    = c => isBeg ? c.beg_winRate : c.winRate;
  const getT3    = c => isBeg ? c.beg_top3Rate : c.top3Rate;
  const eligible = src.filter(c => getTotal(c) >= 50);
  const map = {};
  if(!eligible.length){ _tierCache[key]=map; return map; }
  const wrs = eligible.map(getWr), t3s = eligible.map(getT3);
  const maxWr=Math.max(...wrs), minWr=Math.min(...wrs);
  const maxT3=Math.max(...t3s), minT3=Math.min(...t3s);
  const nw=v=>maxWr===minWr?1:(v-minWr)/(maxWr-minWr);
  const nt=v=>maxT3===minT3?1:(v-minT3)/(maxT3-minT3);
  const scored = eligible
    .map(c=>({id:c.id, score:nw(getWr(c))*0.55 + nt(getT3(c))*0.45}))
    .sort((a,b)=>b.score-a.score);
  const N = scored.length;
  scored.forEach((s,i)=>{
    const p = (i+1)/N;
    let tier = 5;
    if(p<=TIER_CUTOFFS[0]) tier=1;
    else if(p<=TIER_CUTOFFS[1]) tier=2;
    else if(p<=TIER_CUTOFFS[2]) tier=3;
    else if(p<=TIER_CUTOFFS[3]) tier=4;
    map[s.id] = tier;
  });
  _tierCache[key] = map;
  return map;
}

// ---- getCharTier() ----
function getCharTier(id){ return computeTiers()[id] || 0; }

// ---- tierBadgeHtml() ----
function tierBadgeHtml(id, size){
  const tier = getCharTier(id);
  if(!tier) return '';
  const sz = size==='lg' ? ' tier-lg' : size==='sm' ? ' tier-sm' : '';
  const crown = tier===1 ? '<span class="tier-crown" aria-hidden="true">♛</span>' : '';
  return `<span class="tier-badge t${tier}${sz}" title="추천 티어 T${tier}">${crown}<span class="tier-letter">T</span><span class="tier-num">${tier}</span></span>`;
}

// ---- getTendLabel() ----
function getTendLabel(k){ return (TEND_LABELS[currentLang]||TEND_LABELS.ko)[k]||k; }

// ---- setTendency() ----
function setTendency(key, btn) {
  _selectedTendency = key;
  document.querySelectorAll('.tend-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  setTimeout(function() { renderTendencyChars(); }, 0);
}

// ---- renderTendencyChars() ----
function renderTendencyChars() {
  const isBeg = App.filter==='beginner';
  const tend = getExtraTendency(App.patch, isBeg);
  const chars = getCharData();
  let scored;
  if(_selectedTendency==='all'){
    const eligible=[...chars].filter(c=>getCharView(c).total>=50);
    const getWr=c=>getCharView(c).winRate;
    const getT3=c=>getCharView(c).top3Rate;
    const {maxWr,minWr} = eligible.reduce((a,c)=>{ const v=getWr(c); return {maxWr:Math.max(a.maxWr,v),minWr:Math.min(a.minWr,v)}; }, {maxWr:-Infinity,minWr:Infinity});
    const {maxT3,minT3} = eligible.reduce((a,c)=>{ const v=getT3(c); return {maxT3:Math.max(a.maxT3,v),minT3:Math.min(a.minT3,v)}; }, {maxT3:-Infinity,minT3:Infinity});
    const nw=v=>(maxWr===minWr)?1:(v-minWr)/(maxWr-minWr);
    const nt=v=>(maxT3===minT3)?1:(v-minT3)/(maxT3-minT3);
    scored = eligible.map(c=>{
      const wr=getWr(c), t3=getT3(c);
      return {...c, score: nw(wr)*0.55+nt(t3)*0.45, dispWr:wr, dispT3:t3};
    }).sort((a,b)=>b.score-a.score).slice(0,5);
  } else {
    const tendIdx=TEND_KEYS.indexOf(_selectedTendency);
    if(tendIdx<0) return;
    const entries=Object.entries(tend).filter(([cid,t])=>t[10]>=30);
    if(!entries.length) return;
    const tendVals = entries.map(([,t])=>t[tendIdx]);
    const maxTend=Math.max(...tendVals), minTend=Math.min(...tendVals);
    const normT=v=>(maxTend===minTend)?1:(v-minTend)/(maxTend-minTend);
    const wrVals = entries.map(([,t])=>t[11]);
    const t3Vals = entries.map(([,t])=>t[12]);
    const maxWr=Math.max(...wrVals),minWr=Math.min(...wrVals);
    const maxT3=Math.max(...t3Vals),minT3=Math.min(...t3Vals);
    const nw=v=>(maxWr===minWr)?1:(v-minWr)/(maxWr-minWr);
    const nt=v=>(maxT3===minT3)?1:(v-minT3)/(maxT3-minT3);
    scored=entries.map(([cid,t])=>{
      const charData=chars.find(c=>c.id===parseInt(cid));
      if(!charData) return null;
      const score=normT(t[tendIdx])*0.40+nw(t[11])*0.35+nt(t[12])*0.25;
      return{...charData,score,dispWr:t[11],dispT3:t[12],tendVal:t[tendIdx]};
    }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,5);
  }
  if(!scored||!scored.length) return;
  const rankClass = ['rank-1','rank-2','rank-3','rank-4',''];
  const rankLabel = ['1','2','3','4','5'];
  const goHint = t('goHintChar');
  const tendTag = _selectedTendency!=='all' ? `<span class="tend-tag">${TEND_ICONS[_selectedTendency]||''} ${getTendLabel(_selectedTendency)}</span>` : '';
  document.getElementById('recCharList').innerHTML = scored.map((c,i)=>{
    const halfImg = getHalfAvatar(c.id);
    return `<div class="rec-char ${rankClass[i]}" data-rank="${i}" data-char-id="${c.id}" tabindex="0" role="button">
      <div class="rec-char-img-wrap">
        ${halfImg}
        <div class="rec-char-rank-badge">${rankLabel[i]}</div>
        ${tierBadgeHtml(c.id, 'lg')}
      </div>
      <div class="rec-char-info">
        <div class="rec-char-name">${cname(c.id)}${tendTag}</div>
        <div class="rec-char-stats">
          <div class="rec-char-stat-row">
            <span class="rec-char-stat-label">${t('statWr')}</span>
            <span class="rec-char-stat-val wr">${(c.dispWr*100).toFixed(1)}%</span>
          </div>
          <div class="rec-char-stat-row">
            <span class="rec-char-stat-label">${t('statTop3')}</span>
            <span class="rec-char-stat-val top3">${(c.dispT3*100).toFixed(1)}%</span>
          </div>
        </div>
        <span class="rec-char-goto">${goHint}</span>
      </div>
    </div>`;
  }).join('');
  const cards = document.querySelectorAll('#recCharList .rec-char');
  [4,3,2,1,0].forEach((ci,step)=>{ const c=cards[ci]; if(c) setTimeout(()=>c.classList.add('card-revealed'),60+step*90); });
}

// ---- getRouteRecommendations() ----
function getRouteRecommendations(startId) {
  const isBeg = App.filter==='beginner';
  const flows = getExtraFlows(App.patch, isBeg);
  const startFlows = flows.filter(f=>f[0]===startId && f[2]>=5);
  if(!startFlows.length) return {good:[],bad:[]};
  const byWr=[...startFlows].sort((a,b)=>(b[3]/b[2])-(a[3]/a[2]));
  const good=byWr.slice(0,3).map(f=>({place:f[1],wr:(f[3]/f[2]),t3r:(f[4]/f[2]),count:f[2]}));
  const totalD=startFlows.reduce((s,f)=>s+f[2],0);
  const byDanger = [...startFlows].sort((a,b)=>{
    const aScore = (a[2]/totalD)*0.5 + (1-a[3]/a[2])*0.5;
    const bScore = (b[2]/totalD)*0.5 + (1-b[3]/b[2])*0.5;
    return bScore-aScore;
  });
  const bad = byDanger.slice(0,3).map(f=>({place:f[1],wr:(f[3]/f[2]),dr:(f[2]/totalD),count:f[2]}));
  return {good,bad};
}
