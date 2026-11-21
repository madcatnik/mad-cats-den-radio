/* PLAYER V50-ALL-TOGETHER — CORRECT v47 base (Ape Tape Mix 1 + Pinterest) — desktop drag only */
/* PLAYER V44 - FIX: audio must play on FIRE IT UP (desktop + mobile) + restore desktop drag */
document.addEventListener('DOMContentLoaded', () => {
  const STATION_SLOGAN = "LOW CEILING HIGH VOLUME — NO SPONSORS — NO ALGORITHM — JUST BASEMENT SIGNAL — ATHENS GR — EST 2026";
  const contactForm = document.querySelector('form[name="backroom-howls"]');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('.mcd-submit-btn');
      const originalText = submitBtn ? submitBtn.textContent : 'SLIDE IT UNDER THE DOOR';
      if (submitBtn) submitBtn.textContent = 'SLIDING...';
      const formData = new FormData(contactForm);
      formData.append('form-name', contactForm.getAttribute('name'));
      const searchParams = new URLSearchParams(formData);
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: searchParams.toString() })
      .then((r) => { if (submitBtn) submitBtn.textContent = r.ok ? '✦ DELIVERED ✦' : 'ERROR - TRY AGAIN'; if(r.ok) contactForm.reset(); setTimeout(()=>{ if(submitBtn) submitBtn.textContent = originalText; },4000); })
      .catch(()=>{ if (submitBtn) submitBtn.textContent = 'ERROR - TRY AGAIN'; setTimeout(()=>{ if(submitBtn) submitBtn.textContent = originalText; },4000); });
    });
  }
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const beautyClose = document.getElementById('mcd-beauty-close');
  const beautyPlay = document.getElementById('mcd-beauty-play');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  // V119 — RANDOM ONCE PER VISIT, no list on site. Pool of tapes, pick one on load, keep it till reload. FIRE IT UP plays that pick.
  const MCD_TAPES = [
    {id:'ape-tape-1', feed:'/madcatnik/mad-cats-den-the-ape-tape-series-mix-1-1950s-rockabilly-rock-n-roll/', label:'APE TAPE 01 — 1950S ROCKABILLY ROCK N ROLL'},
    {id:'ape-tape-2', feed:'/madcatnik/mad-cats-den-the-ape-tape-series-mix-2-raw-rockabilly-teddy-boy-rock-n-roll-wild-surf/', label:'APE TAPE 02 — RAW ROCKABILLY, TEDDY BOY ROCK N ROLL, WILD SURF'}
  ];
  let MCD_TAPE_IDX = Math.floor(Math.random() * MCD_TAPES.length);
  let MCD_TAPE = MCD_TAPES[MCD_TAPE_IDX];
  let MCD_TAPE_KEY = 'mcd_tape_position_' + MCD_TAPE.id;
  if (iframe) {
    const pickSrc = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=' + encodeURIComponent(MCD_TAPE.feed);
    if (iframe.getAttribute('src') !== pickSrc) iframe.setAttribute('src', pickSrc);
  }
  const nowSpinningEl = document.getElementById('mcd-now-spinning-text');
  let isPlaying = false, widget = null, apiLoading = false, hasResumed = false;
  // V144b — Cream marquee: LOADING -> HELP while waiting -> NOW SPINNING immediately when playing. Speed 22s (original).
const CREAM_LOADING = "\u2726 LOADING TAPE... LOW CEILING HIGH VOLUME \u2014 JUST BASEMENT SIGNAL \u2726";
const CREAM_HELP = "\u2726 PRESS PLAY \u2022 NO SOUND? PRESS AGAIN \u2726";
let mcdCreamHelpTimer = null;
function mcdCreamNowSpinning(){ return `\u2726 NOW SPINNING: ${MCD_TAPE.label} \u2726 ${STATION_SLOGAN} \u2726`; }
if (nowSpinningEl) nowSpinningEl.textContent = CREAM_LOADING;
  function fireHTML(icon, label){
    return '<span class="mcd-play-symbol" aria-hidden="true">' + icon + '</span><span class="mcd-fire-label"> ' + label + '</span>';
  }
  function ensureMixcloudAPI(cb){
    if (window.Mixcloud && window.Mixcloud.PlayerWidget) { cb(); return; }
    if (apiLoading) { setTimeout(()=>ensureMixcloudAPI(cb), 300); return; }
    apiLoading = true;
    const s = document.createElement('script');
    s.src = 'https://widget.mixcloud.com/media/js/widgetApi.js';
    s.async = true;
    s.onload = () => { apiLoading = false; cb(); };
    s.onerror = () => { apiLoading = false; cb(); };
    document.head.appendChild(s);
  }
  function getWidget(){
    if (widget) return widget;
    if (window.Mixcloud && iframe) { try { widget = Mixcloud.PlayerWidget(iframe); } catch(e){ widget = null; } }
    return widget;
  }
  // V120 — AUTOPLAY NEXT TAPE, loop. One tape ends -> other takes over, no click. No list, same player.
  // Ended -> clear finished tape position (so it doesn't resume at the end next time), advance to next tape, swap iframe, re-bind events, play.
  function mcdBindWidgetEvents(w){
    if (!w) return;
    try { if (w.events && w.events.play && w.events.play.on) w.events.play.on(()=>{ setPlayingUI(true); }); } catch(e){}
    try { if (w.events && w.events.pause && w.events.pause.on) w.events.pause.on(()=>{ setPlayingUI(false); }); } catch(e){}
    try { if (w.events && w.events.ended && w.events.ended.on) w.events.ended.on(()=>{ mcdOnTapeEnded(); }); } catch(e){}
  }
  let mcdEnding = false, mcdLastPos = 0;
  function mcdOnTapeEnded(){
    if (mcdEnding) return; mcdEnding = true; mcdManualPause = false;
    // If player was ejected / hidden, don't auto-advance
    if (beautyPlayer && !beautyPlayer.classList.contains('show')) { setPlayingUI(false); return; }
    try { localStorage.removeItem(MCD_TAPE_KEY); } catch(e){}
    const nextIdx = (MCD_TAPE_IDX + 1) % MCD_TAPES.length;
    mcdLoadTapeAndPlay(nextIdx);
  }
  function mcdLoadTapeAndPlay(nextIdx){
    MCD_TAPE_IDX = nextIdx;
    MCD_TAPE = MCD_TAPES[MCD_TAPE_IDX];
    MCD_TAPE_KEY = 'mcd_tape_position_' + MCD_TAPE.id;
    try { localStorage.removeItem(MCD_TAPE_KEY); localStorage.setItem('mcd_last_tape_id', MCD_TAPE.id); } catch(e){}
    hasResumed = true;
    setTimeout(()=>{ mcdEnding = false; mcdLastPos = 0; }, 2000);
    if (nowSpinningEl) nowSpinningEl.textContent = mcdCreamNowSpinning();
    if (typeof setSeekUI === 'function') { try { setSeekUI(0); } catch(e){} }
    try { if (typeof seekDuration !== 'undefined') seekDuration = 0; } catch(e){}
    // V172 — Tape-end also uses iframe reload with autoplay, not widget.load(). Same reason as red button.
    try { if (iframe) { const _src = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&autoplay=1&feed=' + encodeURIComponent(MCD_TAPE.feed); iframe.setAttribute('src', _src); } } catch(e){}
    widget = null;
    setPlayingUI(true);
    ensureMixcloudAPI(()=>{ const _w = getWidget(); if (_w) { try { _w.ready.then(()=>{ mcdBindWidgetEvents(_w); }).catch(()=>{}); } catch(e){} } });
  }
  // Create widget immediately - HTML already loads widgetApi.js before this script, so window.Mixcloud is there
  ensureMixcloudAPI(()=>{ getWidget(); });
  // V68 SYNC VIA EVENTS — not polling. When you tap Mixcloud's own ▶/⏸ inside iframe, Mixcloud fires play/pause events. We listen and sync our buttons + cat glow.
  // Polling position>0 caused jam: after pause, position is still >0, so polling kept flipping back to playing.
  ensureMixcloudAPI(()=>{
    const w = getWidget();
    if (!w) return;
    try {
      w.ready.then(()=>{
        mcdBindWidgetEvents(w);
      }).catch(()=>{});
    } catch(e){}
  });
  // V46 TAPE MEMORY - save position every 5s while playing, so leaving + coming back resumes where you left
  function saveTapePosition(){
    const w = getWidget();
    if (!w || !isPlaying) return;
    try {
      const p = w.getPosition();
      if (p && p.then) p.then((pos)=>{ if (pos && pos > 0) { try { localStorage.setItem(MCD_TAPE_KEY, String(pos)); } catch(e){} } }).catch(()=>{});
    } catch(e){}
  }
  setInterval(saveTapePosition, 5000);
  // Save on leave too, so last seconds aren't lost
  window.addEventListener('beforeunload', saveTapePosition);
  let mcdManualPause = false, mcdLastPlayingAt = 0;
  function setPlayingUI(on){
    isPlaying = on;
    if (on) { mcdLastPlayingAt = Date.now(); mcdManualPause = false; }
    // V144b — HELP only while waiting. Playing -> NOW SPINNING immediately. Paused (open) -> HELP. Closed -> LOADING.
    if (nowSpinningEl) {
      if (on) {
        if (mcdCreamHelpTimer) clearTimeout(mcdCreamHelpTimer);
        nowSpinningEl.textContent = mcdCreamNowSpinning();
      } else {
        if (mcdCreamHelpTimer) clearTimeout(mcdCreamHelpTimer);
        if (beautyPlayer && beautyPlayer.classList.contains('show')) {
          nowSpinningEl.textContent = CREAM_HELP;
        } else {
          nowSpinningEl.textContent = CREAM_LOADING;
        }
      }
    }
    
  if (fireBtn) { fireBtn.classList.toggle('is-playing', on); fireBtn.innerHTML = on ? fireHTML('\uD83D\uDC80', 'KEEP IT WILD') : fireHTML('\u25B6\uFE0E', 'FIRE IT UP'); }
    if (beautyPlay) beautyPlay.textContent = on ? '⏸︎ PAUSE' : '▶︎ PLAY';
    if (beautyPlayer) { beautyPlayer.classList.toggle('is-playing', on); if (on) beautyPlayer.classList.add('is-hairline'); }
    if (heroSection) heroSection.classList.toggle('is-playing', on);
    document.body.classList.toggle('is-playing', on);
  }

// SEEK ONLY — custom seek bar, outside Mixcloud iframe
  const seekTrack = document.getElementById('mcd-seek-track');
  const seekFill = document.getElementById('mcd-seek-fill');
  const seekThumb = document.getElementById('mcd-seek-thumb');
  const seekCur = document.getElementById('mcd-seek-cur');
  const seekDur = document.getElementById('mcd-seek-dur');
  let seekDuration = 0;
  let isSeeking = false;
  function fmtTime(s){
    if(!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' + sec : sec);
  }
  function setSeekUI(pos){
    if(!seekDuration) return;
    const pct = Math.max(0, Math.min(100, (pos / seekDuration) * 100));
    if(seekFill) seekFill.style.width = pct + '%';
    // V148 — clamp thumb inside track only, no page-level overflow change
    const thumbPct = Math.max(1.5, Math.min(98.5, pct));
    if(seekThumb) seekThumb.style.left = thumbPct + '%';
    if(seekCur) seekCur.textContent = fmtTime(pos);
  }
  function seekFromEvent(e){
    const wSeek = getWidget() || widget;
    if(!wSeek || !seekDuration || !seekTrack) return;
    const rect = seekTrack.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, x));
    const target = clamped * seekDuration;
    setSeekUI(target);
    try { wSeek.seek(target); } catch(err){}
  }
  if(seekTrack){
    // V103 FIX: attach seek even if widget is null at load — widget loads async, so guard on widget broke seek on mobile (page scrolled instead)
    const wSeekInit = getWidget();
    if(wSeekInit){ wSeekInit.ready.then(() => {
      wSeekInit.getDuration().then((d) => { seekDuration = d || 0; if(seekDur) seekDur.textContent = fmtTime(seekDuration); }).catch(()=>{});
    }).catch(()=>{}); }
    setInterval(() => {
      if(!isSeeking){
        const wPoll = getWidget();
        if(wPoll){
        wPoll.getPosition().then((p) => { setSeekUI(p || 0); if (p > 0 && beautyPlayer) beautyPlayer.classList.add('is-hairline');
          // V122 FIX for symptom A: ended never fires, and Mixcloud fires pause first, so isPlaying is already false at end. DO NOT check isPlaying here. Kick on position alone, unless user manually paused.
          if (seekDuration > 0 && !mcdEnding && !mcdManualPause) {
            if (p >= seekDuration - 2) { mcdOnTapeEnded(); }
            else if (mcdLastPos > seekDuration - 5 && p < 2) { mcdOnTapeEnded(); }
          }
          mcdLastPos = p || 0;
        }).catch(()=>{});
        if(!seekDuration){
          wPoll.getDuration().then((d) => { seekDuration = d || 0; if(seekDur) seekDur.textContent = fmtTime(seekDuration); }).catch(()=>{});
        }
        }
      }
    }, 500);
    seekTrack.addEventListener('pointerdown', (e) => { e.preventDefault(); isSeeking = true; try { seekTrack.setPointerCapture(e.pointerId); } catch(err){} seekFromEvent(e); });
    seekTrack.addEventListener('pointermove', (e) => { if(!isSeeking) return; e.preventDefault(); seekFromEvent(e); });
    const endSeek = (e) => { if(!isSeeking) return; isSeeking = false; try { seekTrack.releasePointerCapture(e.pointerId); } catch(err){} };
    seekTrack.addEventListener('pointerup', endSeek);
    seekTrack.addEventListener('pointercancel', endSeek);
  }
  function handleFireClick(){
    if (fireBtn && beautyPlayer) {
      if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
      // V172 RED-FIX — Visitors press RED, not Mixcloud sliver. Red must not depend on widget.play() (blocked / not ready on live = does nothing).
      // Play = reload iframe with autoplay=1 in this click (user gesture). Pause = reload iframe without autoplay (stops audio). No widget API for play/pause.
      if (isPlaying) {
        mcdManualPause = true;
        setPlayingUI(false);
        try { if (iframe) { const _src = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=' + encodeURIComponent(MCD_TAPE.feed); iframe.setAttribute('src', _src); } } catch(e){}
        widget = null; hasResumed = true; mcdLastPos = 0;
        return;
      }
      fireBtn.innerHTML = fireHTML('\u25B6\uFE0E', 'LOADING TAPE...');
      if (nowSpinningEl) nowSpinningEl.textContent = CREAM_HELP;
      try { if (iframe) { const _src = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&autoplay=1&feed=' + encodeURIComponent(MCD_TAPE.feed); iframe.setAttribute('src', _src); } } catch(e){}
      widget = null; hasResumed = true; mcdLastPos = 0;
      // UI to playing — audio starts when new iframe loads with autoplay. Re-bind events to new widget for pause/play sync + seek display.
      setPlayingUI(true);
      ensureMixcloudAPI(()=>{ const _w = getWidget(); if (_w) { try { _w.ready.then(()=>{ mcdBindWidgetEvents(_w); }).catch(()=>{}); } catch(e){} } });
    }
  }
  if (fireBtn && beautyPlayer) { fireBtn.addEventListener('click', handleFireClick); }
  if (beautyClose && beautyPlayer) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show');
      saveTapePosition();
      // Reset any drag position so next open docks back to bottom-right on desktop
      beautyPlayer.style.top = ''; beautyPlayer.style.left = ''; beautyPlayer.style.bottom = ''; beautyPlayer.style.right = '';
      setPlayingUI(false);
      try { if (iframe) { const _src = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=' + encodeURIComponent(MCD_TAPE.feed); iframe.setAttribute('src', _src); } } catch(e){} widget = null;
    });
  }

  if (beautyPlay && fireBtn) {
    // V103 SYNC FIX: call handleFireClick directly, not fireBtn.click() — synthetic click is blocked by browsers, so desktop play did nothing
    beautyPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      handleFireClick();
    });
  }
  // 3. DRAGGABLE TAPE DECK - RESTORED from V11, desktop only. Mobile stays docked bottom.
  const dragHandle = beautyPlayer ? beautyPlayer.querySelector('.head') : null;
  let isDragging = false, startX, startY, initialX, initialY;
  const isMobile = () => window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
  if (dragHandle && beautyPlayer) {
    dragHandle.addEventListener('pointerdown', (e) => {
      if (isMobile()) return;
      if (e.target.closest('#mcd-beauty-close') || e.target.closest('#mcd-beauty-play') || e.target.closest('#mcd-seek-wrap')) return;
      isDragging = true;
      beautyPlayer.classList.add('is-dragging');
      startX = e.clientX; startY = e.clientY;
      const rect = beautyPlayer.getBoundingClientRect();
      beautyPlayer.style.bottom = 'auto';
      beautyPlayer.style.right = 'auto';
      beautyPlayer.style.top = rect.top + 'px';
      beautyPlayer.style.left = rect.left + 'px';
      initialX = rect.left; initialY = rect.top;
      try { dragHandle.setPointerCapture(e.pointerId); } catch(err){}
    });
    dragHandle.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      beautyPlayer.style.top = (initialY + dy) + 'px';
      beautyPlayer.style.left = (initialX + dx) + 'px';
    });
    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      beautyPlayer.classList.remove('is-dragging');
      try { dragHandle.releasePointerCapture(e.pointerId); } catch(err){}
    };
    dragHandle.addEventListener('pointerup', endDrag);
    dragHandle.addEventListener('pointercancel', endDrag);
  }
});
