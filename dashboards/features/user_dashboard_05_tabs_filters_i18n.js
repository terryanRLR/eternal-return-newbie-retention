// ============================================================
// 유저용 대시보드 — 탭 전환 / 필터(전체·초보자, 패치) / 다국어(KOR·ENG·JPN)
// 원본 파일: eternal_return_dashboard_user.html
// 5개 탭(실험체/지역/능력/파티/추천) 전환, 전체·초보자 필터와 패치(22.1/23.0/전체) 필터, 화면 언어 전환(t() 헬퍼로 라벨 매핑).
// 아래 함수들은 원본 HTML에서 그대로 추출한 것입니다 (수정 없음, 브레이스 매칭으로 잘라냄).
// ============================================================

// ---- switchTab() ----
function switchTab(tab, btn) {
  /* UI 업데이트(active 클래스)는 즉시, 실제 렌더는 비동기 */
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.getElementById('tab-'+tab).classList.add('active');
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  setTimeout(function() {
    const wasDirty=tabDirty[tab];
    if(tab==='ability'){
      delete pieAngles['pieWinCanvas']; delete pieAngles['pieTop3Canvas'];
      tabDirty.ability=false; renderAbilityTab();
    } else if(tab==='party'){
      tabDirty.party=false; renderPartyTab();
    } else if(tab==='place'){
      tabDirty.place=false; renderPlaceTab(); setTimeout(repositionMapDots,50);
    } else if(tab==='rec'){
      tabDirty.rec=false; renderRecTab();
    } else if(tab==='char'){
      if(wasDirty){ tabDirty.char=false; renderCharTab(); }
      if(App.selChar){ const ch=getCharData().find(x=>x.id===App.selChar); if(ch) drawRadar(ch); }
    }
  }, 0);
}

// ---- getActiveTab() ----
function getActiveTab() {
  const panel = document.querySelector('.tab-panel.active');
  if(!panel) return 'char';
  return panel.id.replace('tab-', '');
}

// ---- renderTabIfNeeded() ----
function renderTabIfNeeded(tab) {
  if(!tabDirty[tab]) return;
  tabDirty[tab] = false;
  if(tab==='char')         renderCharTab();
  else if(tab==='place')   renderPlaceTab();
  else if(tab==='ability') renderAbilityTab();
  else if(tab==='party')   renderPartyTab();
  else if(tab==='rec')     renderRecTab();
}

// ---- setFilter() ----
function setFilter(mode, btn) {
  if(App.filter===mode) return; /* P1-fix: 동일 값 가드 */
  App.filter=mode;
  document.querySelectorAll('#filterBtnAll,#filterBtnBeg').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  updateFilterInfo();
  setTimeout(function() {
    Object.keys(tabDirty).forEach(k=>tabDirty[k]=true);
    const active=getActiveTab();
    renderTabIfNeeded(active);
    if(App.selChar&&active==='char'){ const ch=getCharData().find(x=>x.id===App.selChar); if(ch) drawRadar(ch); }
  }, 0);
}

// ---- setPatch() ----
function setPatch(patch, btn) {
  if(App.patch===patch) return; /* P1-fix: 동일 값 가드 */
  App.patch=patch;
  document.querySelectorAll('#patchBtnAll,#patchBtn221,#patchBtn230').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  updateFilterInfo();
  setTimeout(function() {
    Object.keys(tabDirty).forEach(k=>tabDirty[k]=true);
    const active=getActiveTab();
    renderTabIfNeeded(active);
    if(App.selChar&&active==='char'){ const ch=getCharData().find(x=>x.id===App.selChar); if(ch) drawRadar(ch); }
  }, 0);
}

// ---- updateFilterInfo() ----
function updateFilterInfo() {
  const patchLabel = App.patch==='all' ? '' : ` · 패치 ${App.patch}`;
  document.getElementById('filterInfo').textContent = t(App.filter==='beginner'?'filterInfoBeg':'filterInfoAll') + patchLabel;
}

// ---- getPatchData() ----
function getPatchData() {
  if(_patchDataCacheKey === App.patch && _patchDataCache) return _patchDataCache;
  _patchDataCacheKey = App.patch;
  _patchDataCache = (App.patch === 'all') ? RAW_DATA : (PATCH_DATA[App.patch] || RAW_DATA);
  return _patchDataCache;
}

// ---- applyLang() ----
function applyLang() {
  /* DOM 텍스트 업데이트는 즉시, 무거운 탭 렌더는 setTimeout으로 메인스레드 양보 */
  document.body.classList.add('no-transitions');
  const L = currentLang;
  document.title = (L==='en' ? 'Eternal Return Beginner Dashboard' : L==='jp' ? 'エターナルリターン 初心者ガイド' : '이터널 리턴 초보자 추천 대시보드') + ' ' + APP_VERSION;
  document.querySelector('.title-main').textContent = t('titleMain');
  document.querySelector('.title-sub').textContent = t('titleSub');
  const bm = document.getElementById('badgeMatches');
  const bc = document.getElementById('badgeChars');
  if(bm) bm.textContent = t('badgeMatches');
  if(bc) bc.textContent = t('badgeChars');
  const fBtnAll = document.getElementById('filterBtnAll');
  const fBtnBeg = document.getElementById('filterBtnBeg');
  if(fBtnAll) fBtnAll.innerHTML = `<span class="filter-icon" aria-hidden="true">🌐</span> ${t('filterAll')}`;
  if(fBtnBeg) fBtnBeg.innerHTML = `<span class="filter-icon" aria-hidden="true">🌱</span> ${t('filterBeg')}`;
  updateFilterInfo();
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabKeys = ['tabChar','tabPlace','tabAbility','tabParty','tabRec'];
  tabBtns.forEach((b,i) => { if(tabKeys[i]) b.textContent = t(tabKeys[i]); });
  const secH2s = document.querySelectorAll('.sec-header h2');
  const secKeys = ['secChar','secPlace','secAbility','secParty','secRec'];
  secH2s.forEach((h,i) => { if(secKeys[i]) h.textContent = t(secKeys[i]); });
  const showBtns = document.querySelectorAll('.showcase-toggle-btn');
  if(showBtns[0]) showBtns[0].textContent = t('showWr');
  if(showBtns[1]) showBtns[1].textContent = t('showTop3');
  const empP = document.querySelector('.detail-empty p');
  if(empP) empP.innerHTML = t('detailEmpty1')+'<br>'+t('detailEmpty2');
  const radT = document.querySelector('.radar-title');
  if(radT) radT.textContent = t('detailRadar');
  [['radarLegChar','radarLegendChar'],['radarLegAvg','radarLegendAvg']].forEach(([id,k])=>{const e=document.getElementById(id);if(e)e.textContent=t(k);});
  const abWin  = document.getElementById('abilityWinTitle');
  const abTop3 = document.getElementById('abilityTop3Title');
  if(abWin)  abWin.textContent  = t('abilityWinTitle');
  if(abTop3) abTop3.textContent = t('abilityTop3Title');
  const pwt2 = document.getElementById('partyWinTitle');
  const ptt2 = document.getElementById('partyTop3Title');
  if(pwt2) pwt2.textContent = t('partyWinTitle');
  if(ptt2) ptt2.textContent = t('partyTop3Title');
  const mBtn = document.getElementById('modeToggleBtn');
  if(mBtn) mBtn.textContent = _themeLabel(currentTheme);
  const pnt = document.getElementById('partyNoteTitle');
  if(pnt) pnt.textContent = t('partyNoteTitle');
  const recIds = {
    recCharTitle:  el => { el.innerHTML = `<span class="icon">⚔️</span> ${t('recCharTitle').replace(/^⚔️ /,'')}`; },
    recCharSub:    el => { el.textContent = t('recCharSub'); },
    recPlaceTitle: el => { el.innerHTML = `<span class="icon">🗺️</span> ${t('recPlaceTitle').replace(/^🗺️ /,'')}`; },
    recPlaceSub:   el => { el.textContent = t('recPlaceSub'); },
    recAbilityTitle: el => { el.innerHTML = `<span class="icon">📊</span> ${t('recAbilityTitle').replace(/^📊 /,'')}`; },
    recAbilitySub: el => { el.textContent = t('recAbilitySub'); },
    recPartyTitle: el => { el.innerHTML = `<span class="icon">👥</span> ${t('recPartyTitle').replace(/^👥 /,'')}`; },
    recGuideTitle: el => { el.innerHTML = `<span class="icon">🌟</span> ${t('recGuideTitle').replace(/^🌟 /,'')}`; },
    recGuide1Title:el => { el.textContent = t('recGuide1Title'); },
    recGuide1Body: el => { el.innerHTML = t('recGuide1Body'); },
    recGuide2Title:el => { el.textContent = t('recGuide2Title'); },
    recGuide2Body: el => { el.innerHTML = t('recGuide2Body'); },
    recGuide3Title:el => { el.textContent = t('recGuide3Title'); },
    recGuide3Body: el => { el.innerHTML = t('recGuide3Body'); },
    ytGuideBtnLabel: el => { el.textContent = t('ytGuideBtn'); },
    lumiaBtnLabel:   el => { el.textContent = t('lumiaBtn'); },
    recTip1Title:  el => { el.textContent = t('recTip1Title'); },
    recTip1Body:   el => { el.textContent = t('recTip1Body'); },
    recTip2Title:  el => { el.textContent = t('recTip2Title'); },
    recTip2Body:   el => { el.textContent = t('recTip2Body'); },
    recTip3Title:  el => { el.textContent = t('recTip3Title'); },
    recTip3Body:   el => { el.textContent = t('recTip3Body'); },
  };
  Object.entries(recIds).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if(el) fn(el);
  });
  updateVoiceToggleUI();
  /* V25.1-fix: Canva iframe에서 rAF 미발화 → no-transitions 잔류 + 렌더 미실행으로
     언어 전환 시 활성 탭이 갱신되지 않던 문제. nextTick으로 실행 보장 */
  nextTick(function() {
    document.body.classList.remove('no-transitions');
    setTimeout(function() {
      Object.keys(tabDirty).forEach(k=>tabDirty[k]=true);
      const activeLangTab = getActiveTab();
      /* V25-fix: dirty를 false로 만든 뒤 renderTabIfNeeded를 호출해 조기 리턴되던 버그.
         언어 전환 시 활성 탭이 갱신되지 않았음 — dirty=true 상태로 호출해 즉시 렌더 */
      renderTabIfNeeded(activeLangTab);
      if(activeLangTab === 'char' && App.selChar) {
        const chars = getCharData();
        const ch = chars.find(x=>x.id===App.selChar);
        if(ch) showCharDetail(App.selChar);
      }
    }, 0);
  });
}

// ---- toggleLang() ----
function toggleLang() {
  currentLang=currentLang==='ko'?'en':currentLang==='en'?'jp':'ko';
  const ids={ko:'langKr',en:'langEn',jp:'langJp'};
  Object.values(ids).forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('active'); });
  const active=document.getElementById(ids[currentLang]);
  if(active) active.classList.add('active');
  document.documentElement.lang=currentLang==='jp'?'ja':currentLang;
  applyLang();
}

// ---- t() ----
function t(key) { return (LANG[currentLang] || LANG.ko)[key] || LANG.ko[key] || key; }

// ---- applyTheme() ----
function applyTheme(theme) {
  const meta=THEME_META[theme]||THEME_META.dark;
  currentTheme=theme;
  /* Canva 호환: no-transitions로 transition 폭풍 차단 후,
     무거운 canvas 작업(drawRadar, renderAbilityTab)은 setTimeout(0)으로 메인스레드 양보 */
  document.body.classList.add('no-transitions');
  document.body.classList.remove(...ALL_THEME_CLS);
  if(meta.cls) document.body.classList.add(meta.cls);
  const btn=document.getElementById('modeToggleBtn');
  if(btn) btn.textContent=_themeLabel(theme);
  document.querySelectorAll('.theme-chip').forEach(c=>c.classList.toggle('active',c.dataset.theme===theme));
  try{ localStorage.setItem('erTheme',theme); }catch(_){}
  /* V25.1-fix: rAF 미발화 환경에서도 테마 적용 후 캔버스 재드로우 보장 */
  nextTick(function() {
    document.body.classList.remove('no-transitions');
    setTimeout(function() {
      if(App.selChar){ const ch=getCharData().find(x=>x.id===App.selChar); if(ch) drawRadar(ch); }
      const ab=document.getElementById('tab-ability');
      if(ab&&ab.classList.contains('active')) renderAbilityTab();
    }, 0);
  });
}

// ---- pickTheme() ----
function pickTheme(theme){ applyTheme(theme); document.getElementById('themePicker').style.display='none'; }

// ---- toggleThemePicker() ----
function toggleThemePicker() {
  const picker=document.getElementById('themePicker');
  const btn=document.getElementById('modeToggleBtn');
  if(!picker||!btn) return;
  if(picker.style.display!=='none'){ picker.style.display='none'; return; }
  const rect=btn.getBoundingClientRect();
  picker.style.display='block';
  const left=Math.max(8,rect.right-picker.offsetWidth);
  picker.style.top=(rect.bottom+6)+'px';
  picker.style.left=left+'px';
  document.querySelectorAll('.theme-chip').forEach(c=>c.classList.toggle('active',c.dataset.theme===currentTheme));
  _pickerJustOpened = true;  /* 동기 플래그: 같은 클릭 버블에서 닫히는 것 방지 */
  setTimeout(()=>{ _pickerJustOpened = false; }, 0);
}
