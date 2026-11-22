/* V215 MOBILE STRETCH — clean rebuild, no hairline, no fake seek, Mixcloud bar is the only seek */
document.addEventListener('DOMContentLoaded', () => {
  // Contact form — kept from V201, untouched
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

  // ---- Fresh Player C + Fix B + V207: PlayerWidget fix, seek-after-play, own timer, auto-next ----
  const player = document.getElementById('mcd-player');
  const playBtn = document.getElementById('mcd-play');
  const nextBtn = document.getElementById('mcd-next');
  const ejectBtn = document.getElementById('mcd-eject');
  const fireBtn = document.getElementById('mcd-h-fire');
  const marqueeText = document.getElementById('mcd-marquee-text');
  const statusPill = document.getElementById('mcd-player-status');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  if (!player || !iframe) return;

  const TAPES = [
    {id:'ape-tape-1', feed:'/' + 'mad' + 'cat' + 'nik' + '/' + 'mad-cats-den-' + 'the-ape-tape-series-' + 'mix-1-' + '1950s-rockabilly-' + 'rock-n-roll' + '/', label:'APE TAPE 01 — 1950S ROCKABILLY ROCK N ROLL'},
    {id:'ape-tape-2', feed:'/' + 'mad' + 'cat' + 'nik' + '/' + 'mad-cats-den-' + 'the-ape-tape-series-' + 'mix-2-' + 'raw-rockabilly-' + 'teddy-boy-' + 'rock-n-roll-' + 'wild-surf' + '/', label:'APE TAPE 02 — RAW ROCKABILLY, TEDDY BOY ROCK N ROLL, WILD SURF'}
  ];
  const HELP_TEXT = 'PRESS PLAY • NO SPONSORS • NO ALGORITHM • MADCATNIK DIGGIN IN CRATE ...';
  const RESUME_WINDOW = 30 * 60 * 1000;

  function tapeSrc(t, autoplay){
    let u = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=' + encodeURIComponent(t.feed);
    if (autoplay) u += '&autoplay=1';
    return u;
  }

  let currentIdx = Math.floor(Math.random() * TAPES.length);
  let resumePos = 0;
  try {
    const savedId = localStorage.getItem('mcd_fresh_tape_id');
    const savedPos = parseFloat(localStorage.getItem('mcd_fresh_tape_pos') || '0');
    const savedAt = parseInt(localStorage.getItem('mcd_fresh_paused_at') || '0', 10);
    if (savedId && savedAt && (Date.now() - savedAt) < RESUME_WINDOW && savedPos > 0) {
      const si = TAPES.findIndex(t => t.id === savedId);
      if (si !== -1) { currentIdx = si; resumePos = savedPos; }
    }
  } catch(e){}

  let currentTape = TAPES[currentIdx];
  let isPlaying = false;
  let widget = null;
  let widgetReady = false;
  let isBinding = false;
  let pendingSeek = resumePos;
  let lastKnownPos = resumePos;
  let tapeDuration = 0;
  let isAutoNexting = false;

  // Own timer — backup if Mixcloud getPosition fails. PLAY start + elapsed = position.
  let playStartTime = 0;
  let playStartPos = 0;
  let posTimer = null;
  function startPosTimer(){
    stopPosTimer();
    playStartTime = Date.now();
    playStartPos = lastKnownPos;
    posTimer = setInterval(()=>{
      if (!isPlaying) return;
      const est = playStartPos + (Date.now() - playStartTime) / 1000;
      if (est > lastKnownPos) lastKnownPos = est;
      if (tapeDuration > 0 && lastKnownPos >= tapeDuration - 2) { autoNext(); }
    }, 1000);
  }
  function stopPosTimer(){ if (posTimer) { clearInterval(posTimer); posTimer = null; } }
  // Refresh lastKnownPos from own timer before saving
  function syncPosFromTimer(){
    if (isPlaying && playStartTime) {
      const est = playStartPos + (Date.now() - playStartTime) / 1000;
      if (est > lastKnownPos) lastKnownPos = est;
    }
  }

  if (iframe && !iframe.src.includes(encodeURIComponent(currentTape.feed))) {
    iframe.setAttribute('src', tapeSrc(currentTape, false));
  }

  function setMarquee(){
    if (!marqueeText) return;
    if (player) player.classList.toggle('is-playing', isPlaying);
    if (isPlaying) {
      const txt = 'NOW SPINNING: ' + currentTape.label + ' • LOW CEILING HIGH VOLUME • JUST BASEMENT SIGNAL';
      marqueeText.textContent = txt + '  •  ' + txt;
    } else {
      marqueeText.textContent = HELP_TEXT;
    }
    if (statusPill) statusPill.textContent = isPlaying ? 'TAPE ROLLING' : 'TAPE READY';
    if (playBtn) playBtn.textContent = isPlaying ? '❚❚ PAUSE' : '▶ PLAY';
    if (fireBtn) fireBtn.classList.toggle('is-playing', isPlaying);
    if (heroSection) heroSection.classList.toggle('is-playing', isPlaying);
  }

  function savePosition(pos, pausedAt){
    try {
      if (pos && pos > 0) { localStorage.setItem('mcd_fresh_tape_pos', String(Math.floor(pos))); lastKnownPos = pos; }
      localStorage.setItem('mcd_fresh_tape_id', currentTape.id);
      if (pausedAt) localStorage.setItem('mcd_fresh_paused_at', String(pausedAt));
    } catch(e){}
  }

  function makeWidget(){
    if (!window.Mixcloud) return null;
    const Ctor = window.Mixcloud.PlayerWidget || window.Mixcloud.Widget;
    if (!Ctor) return null;
    try { return Ctor(iframe); } catch(e){ return null; }
  }

  function trySeek(pos){
    if (!pos || pos <= 0) return;
    if (!widget || !widgetReady) { pendingSeek = pos; return; }
    try {
      const r = widget.seek(pos);
      if (r && r.then) r.then((ok)=>{ if (ok) { pendingSeek = 0; } else { pendingSeek = pos; } }).catch(()=>{ pendingSeek = pos; });
      else pendingSeek = 0;
    } catch(e){ pendingSeek = pos; }
  }

  function bindWidget(){
    if (isBinding) return;
    if (!window.Mixcloud || !iframe) { setTimeout(bindWidget, 500); return; }
    // Widget API needs visible iframe — if player closed, retry when opened
    if (!player.classList.contains('show')) { setTimeout(bindWidget, 800); return; }
    isBinding = true;
    try {
      const w = makeWidget();
      if (!w) { isBinding = false; setTimeout(bindWidget, 800); return; }
      widget = w;
      widget.ready.then(() => {
        widgetReady = true; isBinding = false;
        if (!widget._mcdV207Bound) {
          widget._mcdV207Bound = true;
          try {
            widget.events.play.on(() => {
              isPlaying = true; setMarquee(); startPosTimer();
              // V207 fix: seek AFTER play fires, not on ready. Mixcloud ignores seek before first play.
              if (pendingSeek && pendingSeek > 0) {
                const s = pendingSeek;
                setTimeout(()=>{ trySeek(s); }, 600);
              }
            });
          } catch(e){}
          try {
            widget.events.pause.on(() => {
              isPlaying = false; setMarquee(); stopPosTimer(); syncPosFromTimer();
              if (lastKnownPos > 0) savePosition(lastKnownPos, Date.now());
            });
          } catch(e){}
          try {
            widget.events.ended.on(() => {
              // Tape finished -> auto start next via load(), no reload, so browser does not block it
              autoNext();
            });
          } catch(e){}
          try {
            widget.events.progress.on((position, duration) => {
              if (typeof position === 'number' && position > 0) lastKnownPos = position;
              if (typeof duration === 'number' && duration > 0) tapeDuration = duration;
              // Fallback auto-next: if progress says we are at the end, flip
              if (typeof position === 'number' && typeof duration === 'number' && duration > 0 && position >= duration - 2) {
                autoNext();
              }
            });
          } catch(e){}
          try {
            widget.events.error.on(() => {});
          } catch(e){}
        }
        try { widget.getDuration().then((d)=>{ if (d && d>0) tapeDuration = d; }).catch(()=>{}); } catch(e){}
        // If we are already playing (autoplay reload) and have a pending seek, seek now via play handler will also fire, but try once here too
        if (isPlaying && pendingSeek && pendingSeek > 0) {
          const s = pendingSeek;
          setTimeout(()=>{ trySeek(s); }, 800);
        }
      }).catch(()=>{ isBinding = false; setTimeout(bindWidget, 800); });
    } catch(e){ isBinding = false; setTimeout(bindWidget, 800); }
  }

  iframe.addEventListener('load', () => { widget = null; widgetReady = false; isBinding = false; bindWidget(); });
  bindWidget();

  function openPlayer(){ player.classList.add('show'); try{ document.body.classList.add('mcd-player-open'); }catch(e){} bindWidget(); }

  function playCurrent(){
    openPlayer();
    if (isPlaying) return;
    isAutoNexting = false;
    isPlaying = true; setMarquee(); startPosTimer();
    widget = null; widgetReady = false; isBinding = false;
    // pendingSeek stays = lastKnownPos, will be applied after play fires in new iframe
    pendingSeek = lastKnownPos;
    if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, true));
  }

  function pauseCurrent(){
    if (!isPlaying) return;
    syncPosFromTimer(); stopPosTimer();
    const posToSave = lastKnownPos;
    isPlaying = false; setMarquee();
    savePosition(posToSave, Date.now());
    widget = null; widgetReady = false; isBinding = false;
    pendingSeek = posToSave;
    if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, false));
  }

  // V208 auto-next: use Widget load(feed, true) so it keeps playing without a click.
  // Iframe reload with autoplay=1 gets blocked when there is no click, load() does not.
  function pickNextIdx(){
    let n = currentIdx;
    if (TAPES.length > 1) { do { n = Math.floor(Math.random() * TAPES.length); } while (n === currentIdx); }
    return n;
  }
  function autoNext(){
    if (isAutoNexting) return;
    isAutoNexting = true;
    const nIdx = pickNextIdx();
    const nTape = TAPES[nIdx];
    // If widget is ready, try load() first — no reload, keeps playing
    if (widget && widgetReady && widget.load) {
      currentIdx = nIdx; currentTape = nTape;
      stopPosTimer();
      lastKnownPos = 0; pendingSeek = 0; tapeDuration = 0;
      try { localStorage.setItem('mcd_fresh_tape_pos', '0'); } catch(e){}
      try { localStorage.setItem('mcd_fresh_tape_id', currentTape.id); localStorage.setItem('mcd_fresh_paused_at', '0'); } catch(e){}
      isPlaying = true; setMarquee(); startPosTimer();
      try {
        const r = widget.load(nTape.feed, true);
        if (r && r.then) r.then(()=>{ isAutoNexting = false; try { widget.getDuration().then((d)=>{ if (d>0) tapeDuration = d; }).catch(()=>{}); } catch(e){} }).catch(()=>{ isAutoNexting = false; playNext(true); });
        else { isAutoNexting = false; }
      } catch(e){ isAutoNexting = false; playNext(true); }
      // Safety: if load did not start playing in 3s, fall back to reload
      setTimeout(()=>{ if (isAutoNexting) { isAutoNexting = false; playNext(true); } }, 3000);
      return;
    }
    // No widget — fall back to reload with autoplay
    isAutoNexting = false;
    playNext(true);
  }

  function playNext(autoplay){
    let nextIdx = currentIdx;
    if (TAPES.length > 1) {
      do { nextIdx = Math.floor(Math.random() * TAPES.length); } while (nextIdx === currentIdx);
    }
    isAutoNexting = false;
    currentIdx = nextIdx; currentTape = TAPES[currentIdx];
    stopPosTimer();
    lastKnownPos = 0; pendingSeek = 0; tapeDuration = 0;
    try { localStorage.setItem('mcd_fresh_tape_pos', '0'); } catch(e){}
    try { localStorage.setItem('mcd_fresh_tape_id', currentTape.id); localStorage.setItem('mcd_fresh_paused_at', '0'); } catch(e){}
    isPlaying = !!autoplay; setMarquee();
    if (autoplay) startPosTimer();
    widget = null; widgetReady = false; isBinding = false;
    if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, autoplay));
    openPlayer();
  }

  if (playBtn) playBtn.addEventListener('click', () => {
    if (!player.classList.contains('show')) openPlayer();
    if (isPlaying) pauseCurrent();
    else playCurrent();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => { playNext(true); });
  if (ejectBtn) ejectBtn.addEventListener('click', () => {
    syncPosFromTimer(); stopPosTimer();
    if (lastKnownPos > 0) savePosition(lastKnownPos, Date.now());
    isPlaying = false; setMarquee();
    widget = null; widgetReady = false; isBinding = false;
    pendingSeek = lastKnownPos;
    if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, false));
    player.classList.remove('show');
    try{ document.body.classList.remove('mcd-player-open'); }catch(e){}
  });
  if (fireBtn) fireBtn.addEventListener('click', () => { openPlayer(); });

  window.addEventListener('beforeunload', () => { syncPosFromTimer(); if (lastKnownPos > 0) savePosition(lastKnownPos, Date.now()); });

  setMarquee();
});
