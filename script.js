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
  // V162 — Initial tape ALWAYS Mix 1, matches HTML src. No random / no last-tape on load, so widget is ready on live and label == audio. Rotation is on tape-end (1->2->1, never same twice). Resume position still works: if you were on Mix 1, you resume Mix 1 where you left.
  let MCD_TAPE_IDX = 0;
  let MCD_TAPE = MCD_TAPES[MCD_TAPE_IDX];
  let MCD_TAPE_KEY = 'mcd_tape_position_' + MCD_TAPE.id;
  if (iframe) {
    const pickSrc = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=' + encodeURIComponent(MCD_TAPE.feed);
    if (iframe.getAttribute('src') !== pickSrc) iframe.setAttribute('src', pickSrc);
  }
  const nowSpinningEl = document.getElementById('mcd-now-spinning-text');
  let isPlaying = false, widget = null, apiLoading = false, hasResumed = false;
  const CREAM_LOADING = `\u2726 LOADING TAPE... LOW CEILING HIGH VOLUME \u2014 JUST BASEMENT SIGNAL \u2726`;
  const CREAM_HELP = `\u2726 PRESS PLAY \u2022 NO SOUND? PRESS AGAIN \u2726`;
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
    // V124 — auto-advance must ALWAYS start at 0:00. Clear next tape's saved spot, otherwise it jumps to where you left it last time.
    try { localStorage.removeItem(MCD_TAPE_KEY); localStorage.setItem('mcd_last_tape_id', MCD_TAPE.id); } catch(e){}
    hasResumed = true; // autoplay starts at 0, don't resume old position for this tape
    setTimeout(()=>{ mcdEnding = false; mcdLastPos = 0; }, 2000);
    if (nowSpinningEl) nowSpinningEl.textContent = mcdCreamNowSpinning();
    if (typeof setSeekUI === 'function') { try { setSeekUI(0); } catch(e){} }
    // V123 — use widget.load(feed, true) instead of rebuilding iframe. Rebuilding iframe kills the play gesture, so new tape lands at 0:00 stuck on PAUSE. load() keeps same widget/iframe, same session, so it keeps playing.
    try { if (typeof seekDuration !== 'undefined') seekDuration = 0; } catch(e){}
    const w = getWidget();
    if (w) {
      try {
        w.ready.then(()=>{
          try {
            const lp = w.load(MCD_TAPE.feed, true);
            if (lp && lp.then) {
              lp.then(()=>{ setPlayingUI(true); setTimeout(()=>{ try { w.seek(0); } catch(e){} if (typeof setSeekUI === 'function') { try { setSeekUI(0); } catch(e){} } }, 800); }).catch(()=>{
                // load() resolved but play blocked — keep UI on next tape, one tap resumes it
                setPlayingUI(false);
                if (fireBtn) fireBtn.innerHTML = fireHTML('\u25B6\uFE0E', 'TAP TO CONTINUE');
                if (beautyPlay) beautyPlay.textContent = '▶︎ PLAY';
              });
            } else { setPlayingUI(true); setTimeout(()=>{ try { w.seek(0); } catch(e){} }, 800); }
          } catch(e){
            // Fallback: old iframe swap if load() not available
            if (iframe) {
              const nextSrc = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=' + encodeURIComponent(MCD_TAPE.feed);
              widget = null; iframe.setAttribute('src', nextSrc);
              ensureMixcloudAPI(()=>{ const w2 = getWidget(); if (w2) { try { w2.ready.then(()=>{ mcdBindWidgetEvents(w2); try { w2.play(); } catch(e){} }).catch(()=>{}); } catch(e){} } });
            }
          }
        }).catch(()=>{});
      } catch(e){}
    } else if (iframe) {
      const nextSrc = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=' + encodeURIComponent(MCD_TAPE.feed);
      widget = null; iframe.setAttribute('src', nextSrc);
    }
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
      if (p && p.then) p.then((pos)=>{ if (pos && pos > 0) { try { localStorage.setItem(MCD_TAPE_KEY, String(pos)); localStorage.setItem('mcd_last_tape_id', MCD_TAPE.id); } catch(e){} } }).catch(()=>{});
    } catch(e){}
  }
  setInterval(saveTapePosition, 5000);
  // Save on leave too, so last seconds aren't lost
  window.addEventListener('beforeunload', saveTapePosition);
  let mcdManualPause = false, mcdLastPlayingAt = 0;
  function setPlayingUI(on){
    isPlaying = on;
    if (on) { mcdLastPlayingAt = Date.now(); mcdManualPause = false; }
    if (nowSpinningEl) { if (on) nowSpinningEl.textContent = mcdCreamNowSpinning(); else if (beautyPlayer && beautyPlayer.classList.contains('show')) nowSpinningEl.textContent = CREAM_HELP; else nowSpinningEl.textContent = CREAM_LOADING; }
    
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
    if(seekThumb) seekThumb.style.left = pct + '%';
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
      if (isPlaying) { mcdManualPause = true; saveTapePosition(); setPlayingUI(false); const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} } return; }
      fireBtn.innerHTML = fireHTML('\u25B6\uFE0E', 'LOADING TAPE...');
      if (nowSpinningEl) nowSpinningEl.textContent = CREAM_HELP;
      // V59 — DIRECT GESTURE ONLY. On live (not localhost) browsers block play() that is not directly from the tap.
      // Old code did play() inside ready.then (async) + forced PAUSE after 1500ms even if play failed — so UI said PAUSE, seek stayed 0:00, no audio.
      // Now: try sync play (direct gesture). If widget not ready yet, don't force PAUSE — show TAP PLAY and wait for second direct tap, which will succeed because widget is ready by then.
      const w0 = getWidget();
      let played = false;
      if (w0) {
        try {
          const p0 = w0.play();
          if (p0 && p0.then) {
            p0.then(() => {
              played = true;
              setPlayingUI(true);
              if (!hasResumed) {
                hasResumed = true;
                try {
                  const saved = localStorage.getItem(MCD_TAPE_KEY);
                  if (saved && parseFloat(saved) > 3) { setTimeout(()=>{ try { w0.seek(parseFloat(saved)); } catch(e){} }, 600); }
                } catch(e){}
              }
            }).catch(() => {
              // Autoplay blocked or not ready — don't fake PAUSE. Wait for second direct tap. HELP shows now.
              setPlayingUI(false);
            });
          } else {
            // No promise (older API) — assume it worked, but verify via position in 800ms
            setTimeout(() => {
              try {
                w0.getPosition().then((pos) => {
                  if (pos > 0) { /* don't fake playing — wait for Mixcloud play event */ } else { setPlayingUI(false); }
                }).catch(() => { setPlayingUI(false); });
              } catch(e){ setPlayingUI(false); }
            }, 800);
          }
        } catch(e){
          setPlayingUI(false);
        }
      } else {
        setPlayingUI(false);
      }
      // If widget becomes ready later, do NOT auto-play (blocked on live). Just update button so next tap works.
      ensureMixcloudAPI(()=>{
        const w = getWidget();
        if (!w) return;
        try {
          w.ready.then(() => {
            // Widget ready — if user already tapped and we're still on LOADING, prompt second tap
            if (fireBtn.textContent && fireBtn.textContent.indexOf('LOADING TAPE') !== -1) {
              fireBtn.innerHTML = fireHTML('\u25B6\uFE0E', 'FIRE IT UP'); fireBtn.classList.remove('is-playing');
            }
          }).catch(()=>{});
        } catch(e){}
      });
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
      const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} }
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
