/* PLAYER V48 - SHUFFLE TAPES + AUTO-NEXT + NEXT TAPE button + per-tape memory */
document.addEventListener('DOMContentLoaded', () => {
  const STATION_SLOGAN = "LOW CEILING HIGH VOLUME — NO SPONSORS — NO ALGORITHM — JUST BASEMENT SIGNAL — ATHENS GR — EST 2026";
  // V48 TAPES - Add a new tape = add one line here. When Mix 2 arrives, add it here and, if you want only Ape Tapes, remove oinoxoos.
  const TAPES = [
    { id: 'ape-tape-1', slug: 'mad-cats-den-the-ape-tape-series-mix-1-1950s-rockabilly-rock-n-roll', label: 'APE TAPE MIX 1 — 1950s ROCKABILLY' },
    { id: 'oinoxoos', slug: '29-05-25-oinoxoos-rnr-thursday-dedicated-kostas-geros', label: 'OINOXOOS RNR THURSDAY — 29.05.25' }
  ];
  function getTapeById(id){ for (let i=0;i<TAPES.length;i++){ if (TAPES[i].id===id) return TAPES[i]; } return TAPES[0]; }
  function pickRandomTape(exceptId){
    const pool = TAPES.filter(t=>t.id!==exceptId);
    const list = pool.length ? pool : TAPES;
    return list[Math.floor(Math.random()*list.length)];
  }
  let currentTapeId = null;
  try { currentTapeId = localStorage.getItem('mcd_current_tape'); } catch(e){}
  if (!currentTapeId || !TAPES.some(t=>t.id===currentTapeId)) {
    currentTapeId = pickRandomTape(null).id;
    try { localStorage.setItem('mcd_current_tape', currentTapeId); } catch(e){}
  }
  function buildFeedUrl(tape){
    return 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=%2Fmadcatnik%2F' + tape.slug + '%2F';
  }
  function tapePosKey(){ return 'mcd_tape_position_' + currentTapeId; }
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
  const nextTapeBtn = document.getElementById('mcd-next-tape');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  const nowSpinningEl = document.getElementById('mcd-now-spinning-text');
  let isPlaying = false, widget = null, apiLoading = false, hasResumed = false, endedAttachedFor = null;
  function updateTicker(){
    const tape = getTapeById(currentTapeId);
    if (nowSpinningEl) nowSpinningEl.textContent = `\u2726 NOW SPINNING: ${tape.label} \u2726 ${STATION_SLOGAN} \u2726`;
  }
  // Set iframe to current tape BEFORE creating widget, so shuffle pick is the one that plays
  if (iframe) {
    const want = buildFeedUrl(getTapeById(currentTapeId));
    if (iframe.getAttribute('src') !== want) iframe.setAttribute('src', want);
  }
  updateTicker();
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
  ensureMixcloudAPI(()=>{ getWidget(); attachEnded(); });
  function saveTapePosition(){
    const w = getWidget();
    if (!w || !isPlaying) return;
    try {
      const p = w.getPosition();
      if (p && p.then) p.then((pos)=>{ if (pos && pos > 0) { try { localStorage.setItem(tapePosKey(), String(pos)); } catch(e){} } }).catch(()=>{});
    } catch(e){}
  }
  setInterval(saveTapePosition, 5000);
  window.addEventListener('beforeunload', saveTapePosition);
  function attachEnded(){
    const w = getWidget();
    if (!w) return;
    if (endedAttachedFor === currentTapeId + '_' + (widget ? '1' : '0')) return;
    try {
      w.ready.then(()=>{
        try {
          if (w.events && w.events.ended && w.events.ended.on) {
            w.events.ended.on(()=>{ nextTape(true); });
            endedAttachedFor = currentTapeId + '_1';
          }
        } catch(e){}
      }).catch(()=>{});
    } catch(e){}
  }
  function setPlayingUI(on){
    isPlaying = on;
    if (fireBtn) { fireBtn.classList.toggle('is-playing', on); fireBtn.innerHTML = on ? fireHTML('\uD83D\uDC80', 'KEEP IT WILD') : fireHTML('\u25B6', 'FIRE IT UP'); }
    if (beautyPlayer) beautyPlayer.classList.toggle('is-playing', on);
    if (heroSection) heroSection.classList.toggle('is-playing', on);
    document.body.classList.toggle('is-playing', on);
  }
  function playCurrentTape(){
    if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
    if (fireBtn) fireBtn.innerHTML = fireHTML('\u25B6', 'LOADING TAPE...');
    const syncWidget = getWidget();
    if (syncWidget) { try { const p = syncWidget.play(); if (p && p.catch) p.catch(()=>{}); } catch(e){} }
    ensureMixcloudAPI(()=>{
      const w = getWidget();
      if (!w) { if (fireBtn) fireBtn.innerHTML = fireHTML('\u25B6', 'FIRE IT UP'); return; }
      attachEnded();
      try {
        w.ready.then(()=>{
          try {
            const p2 = w.play();
            if (p2 && p2.then) p2.then(()=>{
              setPlayingUI(true);
              if (!hasResumed) {
                hasResumed = true;
                try {
                  const saved = localStorage.getItem(tapePosKey());
                  if (saved && parseFloat(saved) > 3) { setTimeout(()=>{ try { w.seek(parseFloat(saved)); } catch(e){} }, 600); }
                } catch(e){}
              }
            }).catch(()=>{ setPlayingUI(true); });
            else {
              setPlayingUI(true);
              if (!hasResumed) {
                hasResumed = true;
                try {
                  const saved = localStorage.getItem(tapePosKey());
                  if (saved && parseFloat(saved) > 3) { setTimeout(()=>{ try { w.seek(parseFloat(saved)); } catch(e){} }, 600); }
                } catch(e){}
              }
            }
          } catch(e){ setPlayingUI(true); }
        }).catch(()=>{ setPlayingUI(true); });
      } catch(e){ setPlayingUI(true); }
      setTimeout(()=>{ if (fireBtn && fireBtn.textContent && fireBtn.textContent.indexOf('LOADING TAPE') !== -1) setPlayingUI(true); }, 1500);
    });
  }
  if (fireBtn && beautyPlayer) {
    fireBtn.addEventListener('click', () => {
      if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
      if (isPlaying) { saveTapePosition(); setPlayingUI(false); const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} } return; }
      playCurrentTape();
    });
  }
  function nextTape(isAuto){
    saveTapePosition();
    const next = pickRandomTape(currentTapeId);
    currentTapeId = next.id;
    try { localStorage.setItem('mcd_current_tape', currentTapeId); } catch(e){}
    hasResumed = false; endedAttachedFor = null; widget = null;
    updateTicker();
    if (iframe) iframe.setAttribute('src', buildFeedUrl(next));
    setPlayingUI(false);
    // Give iframe a moment to load the new tape, then play it. If auto-play is blocked, user hits FIRE IT UP.
    setTimeout(()=>{ ensureMixcloudAPI(()=>{ getWidget(); attachEnded(); if (isAuto || nextTapeBtn) playCurrentTape(); }); }, 800);
  }
  if (nextTapeBtn && beautyPlayer) {
    nextTapeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
      nextTape(false);
    });
  }
  if (beautyClose && beautyPlayer) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show');
      saveTapePosition();
      beautyPlayer.style.top = ''; beautyPlayer.style.left = ''; beautyPlayer.style.bottom = ''; beautyPlayer.style.right = '';
      setPlayingUI(false);
      const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} }
    });
  }
  const dragHandle = beautyPlayer ? beautyPlayer.querySelector('.head') : null;
  let isDragging = false, startX, startY, initialX, initialY;
  const isMobile = () => window.innerWidth <= 768;
  if (dragHandle && beautyPlayer) {
    dragHandle.addEventListener('pointerdown', (e) => {
      if (isMobile()) return;
      if (e.target.closest('#mcd-beauty-close') || e.target.closest('#mcd-next-tape')) return;
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
