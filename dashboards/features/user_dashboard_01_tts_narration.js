// ============================================================
// 유저용 대시보드 — TTS 내레이션 시스템
// 원본 파일: eternal_return_dashboard_user.html
// 설정에서 언어별(KOR/ENG/JPN) 음성을 고르고, 각 탭의 설명을 Web Speech API(speechSynthesis)로 읽어주는 기능.
// 아래 함수들은 원본 HTML에서 그대로 추출한 것입니다 (수정 없음, 브레이스 매칭으로 잘라냄).
// ============================================================

// ---- _loadVoices() ----
function _loadVoices(cb){
  if(!('speechSynthesis' in window)){ cb([]); return; }
  const tryGet=()=>{ const vs=speechSynthesis.getVoices(); if(vs&&vs.length){ _voicesCache=vs; cb(vs); return true; } return false; };
  if(tryGet()) return;
  let fired=false;
  speechSynthesis.onvoiceschanged=()=>{ if(fired) return; fired=true; _voicesCache=speechSynthesis.getVoices()||[]; cb(_voicesCache); };
  let tries=0;
  const poll=setInterval(()=>{ if(fired||tries++>8){ clearInterval(poll); return; } if(tryGet()){ fired=true; clearInterval(poll); } },250);
}

// ---- _bestVoiceFor() ----
function _bestVoiceFor(langKey){
  const bcp = TTS_LANG_BCP[langKey];
  const prios = TTS_VOICE_PRIORITY[langKey] || [];
  for(const rx of prios){
    const v = _voicesCache.find(v => rx.test(v.name) && _langMatch(v, bcp));
    if(v) return v;
  }
  const withLang = _voicesCache.find(v => (v.lang||'') && _langMatch(v, bcp));
  if(withLang) return withLang;
  return _voicesCache.find(v => _langMatch(v, bcp)) || null;
}

// ---- _getShortVoiceName() ----
function _getShortVoiceName(name){
  const m1 = name.match(/^Microsoft\s+([^\-]+?)\s+Online\s*\(Natural\)/i);
  if(m1) return m1[1].trim() + ' <span style="font-size:10px;color:var(--text-muted)">(MS Natural)</span>';
  const m2 = name.match(/^Microsoft\s+(\S+)\s+\-/i);
  if(m2) return m2[1] + ' <span style="font-size:10px;color:var(--text-muted)">(MS)</span>';
  const m3 = name.match(/^(Google|Apple)\s+(.+)/i);
  if(m3) return m3[2] + ` <span style="font-size:10px;color:var(--text-muted)">(${m3[1]})</span>`;
  return name;
}

// ---- renderTtsOptions() ----
function renderTtsOptions(){
  if(!('speechSynthesis' in window)) return;
  const langKeys = {Ko:'ko', En:'en', Jp:'jp'};
  Object.entries(langKeys).forEach(([L, langKey]) => {
    const host = document.getElementById('ttsOpts'+L);
    if(!host) return;
    const bcp = TTS_LANG_BCP[langKey];
    const voices = _voicesCache.filter(v => _langMatch(v, bcp));
    const autoChecked = (!_ttsPrefs[langKey] || _ttsPrefs[langKey] === 'auto') ? 'checked' : '';
    const bestVoice = _bestVoiceFor(langKey);
    const bestName = bestVoice ? bestVoice.name : '—';
    let html = `<label class="tts-opt recommended">
      <input type="radio" name="ttsVoice${L}" value="auto" ${autoChecked} onchange="saveTtsPrefs()">
      <span class="tts-name">자동 선택 <span style="color:var(--text-muted);font-size:10px">(${bestName})</span></span>
      <span class="tts-badge recommended">권장</span>
    </label>`;
    if(voices.length === 0){
      html += _buildInstallGuide(langKey);
    } else {
      const locals=voices.filter(v=>v.localService), remotes=voices.filter(v=>!v.localService);
      [...locals,...remotes].forEach(v=>{
        const sel=_ttsPrefs[langKey]===v.name?'checked':'';
        const badgeClass=v.localService?'local':'remote', badgeLabel=v.localService?'로컬':'원격';
        const isRec=(TTS_MS_RECOMMENDED[langKey]||[]).some(r=>r.name===v.name);
        const rowClass=isRec?'tts-opt recommended':'tts-opt';
        const shortName=_getShortVoiceName(v.name), escapedName=v.name.replace(/"/g,'&quot;');
        html += `<label class="${rowClass}">
          <input type="radio" name="ttsVoice${L}" value="${escapedName}" ${sel} onchange="saveTtsPrefs()">
          <span class="tts-name" title="${v.name}">${shortName}</span>
          <span class="tts-badge ${badgeClass}">${badgeLabel}</span>
        </label>`;
      });
      const installedNames = new Set(voices.map(v => v.name));
      const missing = (TTS_MS_RECOMMENDED[langKey]||[]).filter(r => !installedNames.has(r.name));
      if(missing.length > 0){
        html += `<div style="font-size:10px;color:var(--text-muted);padding:4px 8px 2px;margin-top:4px;border-top:1px dashed var(--border)">📥 Windows 추천 (미설치)</div>`;
        missing.forEach(r => {
          html += `<label class="tts-opt" style="opacity:0.5;cursor:default">
            <input type="radio" name="ttsVoice${L}" disabled>
            <span class="tts-name" title="${r.name}">${r.short} <span style="font-size:10px;color:var(--text-muted)">· ${r.desc}</span></span>
            <span class="tts-badge missing">미설치</span>
          </label>`;
        });
      }
    }
    html += `<label class="tts-opt" style="border-top:1px dashed var(--border);margin-top:4px;padding-top:8px">
      <input type="radio" name="ttsVoice${L}" value="none" ${_ttsPrefs[langKey]==='none'?'checked':''} onchange="saveTtsPrefs()">
      <span class="tts-name" style="color:var(--text-muted)">사용 안 함</span>
    </label>`;
    host.innerHTML = html;
  });
  const r=document.getElementById('ttsRate');
  if(r){r.value=_ttsPrefs.rate;const rl=document.getElementById('ttsRateLbl');if(rl)rl.textContent=_ttsPrefs.rate+'x';}
  const v=document.getElementById('ttsVol');
  if(v){v.value=_ttsPrefs.vol;const vl=document.getElementById('ttsVolLbl');if(vl)vl.textContent=Math.round(_ttsPrefs.vol*100)+'%';}
  const ls=document.getElementById('ttsLangSel');if(ls)ls.value=_ttsPrefs.lang;
}

// ---- saveTtsPrefs() ----
function saveTtsPrefs(){
  const r = document.getElementById('ttsRate'); if(r) _ttsPrefs.rate = parseFloat(r.value);
  const v = document.getElementById('ttsVol');  if(v) _ttsPrefs.vol  = parseFloat(v.value);
  const ls = document.getElementById('ttsLangSel'); if(ls) _ttsPrefs.lang = ls.value;
  ['Ko','En','Jp'].forEach(L=>{
    const el=document.querySelector(`input[name="ttsVoice${L}"]:checked`);
    if(el) _ttsPrefs[L.toLowerCase()]=el.value;
  });
  try { localStorage.setItem('ttsPrefs', JSON.stringify(_ttsPrefs)); } catch(_) {}
}

// ---- speakText() ----
function speakText(text, btn){
  if(!('speechSynthesis' in window)){
    alert('이 브라우저는 Web Speech API(음성 합성)를 지원하지 않습니다.\nChrome, Edge, Safari, Firefox 최신 버전을 이용해 주세요.');
    return;
  }
  const lang = _resolveSpeakLang();
  if(!lang){
    const s = document.getElementById('narrationStatus'); if(s) s.textContent='음성 끔 (None)';
    return;
  }
  stopSpeak();
  if(!_voicesCache.length){_voicesCache=speechSynthesis.getVoices()||[];renderTtsOptions();}
  const voice = findVoiceFor(lang, _ttsPrefs[lang]);
  if(!voice){
    const osHints = {
      ko:'• Windows: 설정 → 시간 및 언어 → 언어 및 지역 → 한국어 팩 추가\n• macOS: 시스템 설정 → 손쉬운 사용 → 말하기 → 시스템 음성 → 한국어\n• iOS: 설정 → 손쉬운 사용 → 말한 내용 → 음성 → 한국어\n• Android: 설정 → 일반 관리 → 언어 → TTS → 한국어 다운로드',
      en:'• Most systems include English voices by default.\n• Try refreshing the page or switching browsers.',
      jp:'• Windows: 설정 → 언어 → 일본어 팩 추가\n• macOS: 시스템 설정 → 손쉬운 사용 → 말하기 → 일본어 음성(Kyoko)',
    };
    alert(`선택한 언어(${lang.toUpperCase()})의 음성이 이 기기/브라우저에서 감지되지 않았습니다.\n\n${osHints[lang]||''}`);
    return;
  }
  const chunks=(text||'').replace(/\s+/g,' ').trim().match(/[\s\S]{1,180}(?=\s|$)|[\s\S]+$/g)||[];
  if(!chunks.length) return;
  if(btn){_speakingBtn=btn;btn.classList.add('speaking');}
  const status=document.getElementById('narrationStatus');
  if(status) status.textContent=`재생 중: ${voice.name}`;
  _startKeepAlive();
  const voiceName=voice.name, voiceBcp=voice.lang||TTS_LANG_BCP[lang];
  let i=0;
  const speakNext=()=>{
    if(i>=chunks.length){ _stopKeepAlive(); if(_speakingBtn){_speakingBtn.classList.remove('speaking');_speakingBtn=null;} if(status) status.textContent='재생 완료'; return; }
    const u=new SpeechSynthesisUtterance(chunks[i++]);
    const fv=speechSynthesis.getVoices().find(v=>v.name===voiceName)||voice;
    u.voice=fv; u.lang=fv.lang||voiceBcp;
    u.rate=(_ttsPrefs.rate!=null&&!isNaN(_ttsPrefs.rate))?parseFloat(_ttsPrefs.rate):1;
    u.volume=(_ttsPrefs.vol!=null&&!isNaN(_ttsPrefs.vol))?parseFloat(_ttsPrefs.vol):1;
    u.onend=speakNext;
    u.onerror=e=>{ if(e.error==='interrupted') return; _stopKeepAlive(); if(_speakingBtn){_speakingBtn.classList.remove('speaking');_speakingBtn=null;} if(status) status.textContent=`오류: ${e.error||'알 수 없음'}`; };
    speechSynthesis.speak(u);
  };
  speakNext();
}

// ---- speakTab() ----
function speakTab(tab, btn){
  if(_speakingBtn === btn){ stopSpeak(); return; }
  const text = _gatherTabText(tab);
  if(!text) return;
  const intros = {
    char:   {ko:'실험체 성과 분석.',en:'Character performance analysis.',jp:'実験体パフォーマンス分析。'},
    place:  {ko:'지역별 승률 분석.',en:'Win rate by area.',jp:'エリア別勝率分析。'},
    ability:{ko:'주요 능력치별 승리 기여도.',en:'Win contribution by stat.',jp:'主要能力値別の勝利貢献度。'},
    party:  {ko:'파티 구성별 승률.',en:'Win rate by party composition.',jp:'パーティ構成別勝率。'},
    rec:    {ko:'초보자 맞춤 추천 요약.',en:'Beginner recommendation summary.',jp:'初心者向けおすすめまとめ。'},
  };
  const lang = _resolveSpeakLang() || 'ko';
  const intro = (intros[tab]||{})[lang] || '';
  speakText((intro + ' ' + text).trim(), btn);
}

// ---- speakElement() ----
function speakElement(elemId, btn){
  if(_speakingBtn === btn){ stopSpeak(); return; }
  const txt = _extractText(document.getElementById(elemId), 1400); /* V25: 전역 t() 섀도잉 제거 */
  if(!txt) return;
  speakText(txt, btn);
}

// ---- stopSpeak() ----
function stopSpeak(){
  if('speechSynthesis' in window) speechSynthesis.cancel();
  if(_speakingBtn){ _speakingBtn.classList.remove('speaking'); _speakingBtn=null; }
  const s=document.getElementById('narrationStatus'); if(s) s.textContent='중지됨';
}

// ---- _resolveSpeakLang() ----
function _resolveSpeakLang(){
  if(_ttsPrefs.lang==='none') return null;
  if(_ttsPrefs.lang==='auto') return(['ko','en','jp'].includes(currentLang)?currentLang:'ko');
  return _ttsPrefs.lang;
}

// ---- _langMatch() ----
function _langMatch(voice, bcp){
  const l = (voice.lang||'').toLowerCase();
  if(!l){
    const n = (voice.name||'').toLowerCase();
    if(bcp.startsWith('ko')) return n.includes('korean') || n.includes('한국') || n.includes('hyunsu') || n.includes('서현') || n.includes('현수') || n.includes('봉진') || n.includes('지민') || n.includes('유진') || n.includes('순복') || n.includes('국민');
    if(bcp.startsWith('ja')) return n.includes('japan') || n.includes('japanese') || n.includes('nanami') || n.includes('keita') || n.includes('haruka');
    if(bcp.startsWith('en')) return n.includes('english') || n.includes('zira') || n.includes('ava') || n.includes('andrew') || n.includes('david') || n.includes('mark');
    return false;
  }
  return l.startsWith(bcp.toLowerCase().slice(0,2));
}

// ---- cycleVoiceLang() ----
function cycleVoiceLang() {
  const idx = VOICE_CYCLE.indexOf(voiceLang);
  voiceLang = VOICE_CYCLE[(idx + 1) % VOICE_CYCLE.length];
  if(voiceLang === 'mute' && currentAudio) {
    currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null;
  }
  updateVoiceToggleUI();
}

// ---- toggleNarrationPanel() ----
function toggleNarrationPanel() {
  const panel=document.getElementById('narrationDropdown');
  const btn=document.getElementById('settingsBtn');
  const open=panel.style.display!=='none';
  panel.style.display=open?'none':'block';
  btn.classList.toggle('active',!open);
}

// ---- _gatherTabText() ----
function _gatherTabText(tab){
  return _extractText(document.getElementById('tab-'+tab), 1200);
}

// ---- _extractText() ----
function _extractText(el, maxLen) {
  if(!el) return '';
  const clone = el.cloneNode(true);
  clone.querySelectorAll('canvas,.tts-btn,script,style').forEach(n=>n.remove());
  let text = (clone.innerText || clone.textContent || '').replace(/\s+/g,' ').trim();
  if(maxLen && text.length > maxLen) text = text.slice(0, maxLen) + '…';
  return text;
}
