/* ============================================================================
   CURRENT GIG CONFIG — Edit these fields to swap the left Gig Card in 10s.
   Leave badge or stampSrc as "" to hide them automatically.
   ============================================================================ */
const CURRENT_GIG = {
  heading: 'NEXT ALL-NIGHTER ✦ LIVE',
  datePill: 'FRI 18.12.26 • 22:30',
  badge: 'FREE ENTRY',
  posterSrc: './gig-poster.webp',
  posterAlt: 'The 3 Haunted Chords - Fri 18.12.26',
  posterUrl: 'https://www.facebook.com/madcatsdenradio',
  locationText: 'FRIDAY 18.12.26 📍 OINOXOOS BAR • AG. SOFIAS 7, NEA FILADELFIA • SHOW 22:30',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Oinoxoos+Bar+Agias+Sofias+7+Nea+Filadelfia',
  bandTitle: 'THE THREE HAUNTED CHORDS',
  bioParagraphs: [
    "3HC are a Greece-based rockabilly band delivering raw, energetic rock 'n' roll with a blend of blues, country and vintage influences.",
    "Formed in 2024, the band brings together experienced musicians from the local scene, creating a powerful live sound and an authentic rockabilly feel.",
    "Their recent live studio recordings capture the band exactly as they sound on stage — tight, dynamic and full of energy."
  ],
  stampSrc: './3hc-stamp-cream.png',
  stampAlt: 'THE THREE HAUNTED CHORDS — 3HC logo'
};

/* V227 PLAY LOAD — clean rebuild, no hairline, no fake seek, Mixcloud bar is the only seek */
document.addEventListener('DOMContentLoaded', () => {
  // Render CURRENT_GIG config into the Gig Card
  (function applyGigConfig(g) {
    if (!g) return;
    const setText = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.textContent = val; };
    setText('mcd-gig-heading', g.heading);
    setText('mcd-gig-date', g.datePill);
    setText('mcd-gig-title', g.bandTitle);

    const badgeEl = document.getElementById('mcd-gig-badge');
    if (badgeEl) {
      if (g.badge) { badgeEl.textContent = g.badge; badgeEl.style.display = ''; }
      else { badgeEl.style.display = 'none'; }
    }

    const posterLink = document.getElementById('mcd-gig-poster-link');
    if (posterLink && g.posterUrl) posterLink.href = g.posterUrl;

    const posterImg = document.getElementById('mcd-gig-poster-img');
    if (posterImg) {
      if (g.posterSrc) posterImg.src = g.posterSrc;
      if (g.posterAlt) posterImg.alt = g.posterAlt;
    }

    const locEl = document.getElementById('mcd-gig-loc');
    if (locEl) {
      if (g.locationText) locEl.textContent = g.locationText;
      if (g.mapsUrl) locEl.href = g.mapsUrl;
    }

    const bioEl = document.getElementById('mcd-gig-bio');
    if (bioEl && Array.isArray(g.bioParagraphs)) {
      bioEl.innerHTML = '';
      g.bioParagraphs.forEach((p, idx) => {
        if (idx > 0) { bioEl.appendChild(document.createElement('br')); bioEl.appendChild(document.createElement('br')); }
        bioEl.appendChild(document.createTextNode(p));
      });
    }

    const stampWrap = document.getElementById('mcd-gig-stamp-wrap');
    const stampImg = document.getElementById('mcd-gig-stamp-img');
    if (stampWrap && stampImg) {
      if (g.stampSrc) {
        stampImg.src = g.stampSrc;
        stampImg.alt = g.stampAlt || '';
        stampWrap.style.display = '';
      } else {
        stampWrap.style.display = 'none';
      }
    }
  })(CURRENT_GIG);

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

  // ---- Fresh Player C + Fix B + V207 + V217 first-click widget.play: PlayerWidget fix, seek-after-play, own timer, auto-next ----
  const player = document.getElementById('mcd-player');
  const nextBtn = document.getElementById('mcd-next');
  const ejectBtn = document.getElementById('mcd-eject');
  const fireBtn = document.getElementById('mcd-h-fire');
  const fireLabel = fireBtn ? fireBtn.querySelector('.mcd-fire-label') : null;
  const fireSymbol = fireBtn ? fireBtn.querySelector('.mcd-play-symbol') : null;
  let pendingPlay = false;
  let playEventFired = false;
  let hasUnlockedAudio = false;
  const marqueeText = document.getElementById('mcd-marquee-text');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  if (!player || !iframe) return;

  const TAPES = [
    {id:'ape-tape-1', feed:'/' + 'mad' + 'cat' + 'nik' + '/' + 'mad-cats-den-' + 'the-ape-tape-series-' + 'mix-1-' + '1950s-rockabilly-' + 'rock-n-roll' + '/', label:'APE TAPE 01 — 1950S ROCKABILLY ROCK N ROLL'},
    {id:'ape-tape-2', feed:'/' + 'mad' + 'cat' + 'nik' + '/' + 'mad-cats-den-' + 'the-ape-tape-series-' + 'mix-2-' + 'raw-rockabilly-' + 'teddy-boy-' + 'rock-n-roll-' + 'wild-surf' + '/', label:'APE TAPE 02 — RAW ROCKABILLY, TEDDY BOY ROCK N ROLL, WILD SURF'}
  ];
  const HELP_TEXT = 'NO SPONSORS • NO ALGORITHM • MADCATNIK DIGGIN IN CRATE ...';
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
  let loadedTapeId = currentTape.id;
  let playFallbackTimer = null;
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
  loadedTapeId = currentTape.id;

  function setMarquee(){
    if (!marqueeText) return;
    const isOpen = player && player.classList.contains('show');
    if (player) player.classList.toggle('is-playing', isPlaying);
    if (isPlaying) {
      const txt = 'NOW SPINNING: ' + currentTape.label + ' • LOW CEILING HIGH VOLUME • JUST BASEMENT SIGNAL';
      marqueeText.textContent = txt + '  •  ' + txt;
    } else {
      marqueeText.textContent = HELP_TEXT;
    }
    if (fireBtn) fireBtn.classList.toggle('is-playing', isOpen || isPlaying);
    if (fireSymbol) {
      fireSymbol.textContent = (isOpen || isPlaying) ? '' : '▶︎';
      fireSymbol.style.display = (isOpen || isPlaying) ? 'none' : '';
    }
    if (fireLabel) fireLabel.textContent = (isOpen || isPlaying) ? 'KEEP IT WILD 💀' : ' FIRE IT UP';
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
    if (isBinding || (widget && widgetReady)) return;
    if (!window.Mixcloud || !iframe) { setTimeout(bindWidget, 500); return; }
    // V225: Player is rendered but hidden (visibility hidden, off-screen), not display:none, so bind on page load, widget is ready before first click.
    isBinding = true;
    try {
      const w = makeWidget();
      if (!w) { isBinding = false; setTimeout(bindWidget, 800); return; }
      widget = w;
      widget.ready.then(() => {
        widgetReady = true; isBinding = false;
        if (pendingPlay) { pendingPlay = false; loadedTapeId = currentTape.id; try { const rp = widget.load(currentTape.feed, true); if (rp && rp.then) rp.then(()=>{}).catch(()=>{}); } catch(e){} }
        if (!widget._mcdV207Bound) {
          widget._mcdV207Bound = true;
          try {
            widget.events.play.on(() => {
              playEventFired = true; hasUnlockedAudio = true; if (playFallbackTimer) { clearTimeout(playFallbackTimer); playFallbackTimer = null; } isPlaying = true; setMarquee(); startPosTimer();
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
              if (typeof position === 'number' && position > 0) {
                if (!isPlaying && position !== lastKnownPos) {
                  playEventFired = true; hasUnlockedAudio = true; isPlaying = true; setMarquee(); startPosTimer();
                }
                lastKnownPos = position;
              }
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

  // V231: Sync UI (marquee, VU, HIT PLAY hide) with Mixcloud's actual play/pause state every 1s while open,
  // in case Mixcloud's iframe drops postMessage play/pause events.
  setInterval(() => {
    if (!player.classList.contains('show') || !widget || !widgetReady || !widget.getIsPaused) return;
    try {
      const p = widget.getIsPaused();
      if (p && p.then) {
        p.then((paused) => {
          if (paused === false && !isPlaying) {
            playEventFired = true;
            hasUnlockedAudio = true;
            if (playFallbackTimer) { clearTimeout(playFallbackTimer); playFallbackTimer = null; }
            isPlaying = true;
            setMarquee();
            startPosTimer();
          } else if (paused === true && isPlaying) {
            isPlaying = false;
            setMarquee();
            stopPosTimer();
            syncPosFromTimer();
            if (lastKnownPos > 0) savePosition(lastKnownPos, Date.now());
          }
        }).catch(() => {});
      }
    } catch(e) {}
  }, 1000);

  function openPlayer(){ player.classList.add('show'); try{ document.body.classList.add('mcd-player-open'); }catch(e){} setMarquee(); bindWidget(); }

  function playCurrent(){
    openPlayer();
    if (isPlaying) return;
    isAutoNexting = false;
    // V228: PLAY uses load() synchronously in the click, tracks loadedTapeId, and reverts UI if browser blocks autoplay.
    if (widget && widgetReady) {
      try {
        playEventFired = false;
        if (playFallbackTimer) { clearTimeout(playFallbackTimer); playFallbackTimer = null; }
        const attemptPos = lastKnownPos;
        // If on wrong tape, seek from 0, else seek to where we paused.
        const isWrongTape = loadedTapeId !== currentTape.id;
        const r2 = widget.load(currentTape.feed, true);
        loadedTapeId = currentTape.id;
        isPlaying = true; setMarquee(); startPosTimer();
        pendingSeek = isWrongTape ? 0 : attemptPos;
        if (!isWrongTape) lastKnownPos = attemptPos;
        if (isWrongTape) lastKnownPos = 0;
        if (r2 && r2.then) r2.then(()=>{}).catch(()=>{});
        playFallbackTimer = setTimeout(()=>{
          playFallbackTimer = null;
          if (!playEventFired && isPlaying) {
            isPlaying = false;
            stopPosTimer();
            setMarquee();
          }
        }, 2500);
        return;
      } catch(e) { /* fall through to wait + fallback */ }
    }
    // V217: Widget null or not ready yet — DON'T reload immediately, that gets blocked on desktop and kills the widget.
    // Wait for ready, then play via pendingPlay in bindWidget ready handler.
    pendingPlay = true;
    isPlaying = true; setMarquee(); startPosTimer();
    pendingSeek = lastKnownPos;
    bindWidget();
    // Fallback: if widget never becomes ready in 4s, reload with autoplay as last resort.
    setTimeout(()=>{
      if (pendingPlay && isPlaying && (!widget || !widgetReady)) {
        pendingPlay = false;
        widget = null; widgetReady = false; isBinding = false;
        if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, true));
      }
    }, 4000);
  }

  function pauseCurrent(){
    if (!isPlaying) return;
    pendingPlay = false;
    if (playFallbackTimer) { clearTimeout(playFallbackTimer); playFallbackTimer = null; }
    syncPosFromTimer(); stopPosTimer();
    const posToSave = lastKnownPos;
    // V216: Try widget.pause() first — no reload, keeps widget alive for next PLAY.
    if (widget && widgetReady) {
      try {
        const r = widget.pause();
        isPlaying = false; setMarquee();
        savePosition(posToSave, Date.now());
        pendingSeek = posToSave;
        if (r && r.then) r.then(()=>{}).catch(()=>{});
        return;
      } catch(e) { /* fall through to reload fallback */ }
    }
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
        loadedTapeId = nTape.id;
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
    const nTape = TAPES[nextIdx];
    // V223: If widget ready, use load() — openPlayer BEFORE load, not after, so bindWidget doesn't make a second widget and kill the load.
    if (widget && widgetReady && widget.load && autoplay) {
      openPlayer();
      currentIdx = nextIdx; currentTape = nTape;
      stopPosTimer();
      lastKnownPos = 0; pendingSeek = 0; tapeDuration = 0;
      try { localStorage.setItem('mcd_fresh_tape_pos', '0'); } catch(e){}
      try { localStorage.setItem('mcd_fresh_tape_id', currentTape.id); localStorage.setItem('mcd_fresh_paused_at', '0'); } catch(e){}
      isPlaying = true; setMarquee(); startPosTimer();
      loadedTapeId = nTape.id;
      try { const r = widget.load(nTape.feed, true); if (r && r.then) r.then(()=>{}).catch(()=>{ /* load failed, fall back to reload */ widget = null; widgetReady = false; isBinding = false; if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, true)); }); } catch(e){ widget = null; widgetReady = false; isBinding = false; if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, true)); }
      return;
    }
    currentIdx = nextIdx; currentTape = nTape;
    stopPosTimer();
    lastKnownPos = 0; pendingSeek = 0; tapeDuration = 0;
    try { localStorage.setItem('mcd_fresh_tape_pos', '0'); } catch(e){}
    try { localStorage.setItem('mcd_fresh_tape_id', currentTape.id); localStorage.setItem('mcd_fresh_paused_at', '0'); } catch(e){}
    isPlaying = !!autoplay; setMarquee();
    if (autoplay) startPosTimer();
    widget = null; widgetReady = false; isBinding = false;
    loadedTapeId = currentTape.id;
    if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, autoplay));
    openPlayer();
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { playNext(true); });
  if (ejectBtn) ejectBtn.addEventListener('click', () => {
    pendingPlay = false;
    if (playFallbackTimer) { clearTimeout(playFallbackTimer); playFallbackTimer = null; }
    syncPosFromTimer(); stopPosTimer();
    if (lastKnownPos > 0) savePosition(lastKnownPos, Date.now());
    isPlaying = false; setMarquee();
    pendingSeek = lastKnownPos;
    if (widget && widgetReady) {
      try { const r = widget.pause(); if (r && r.then) r.then(()=>{}).catch(()=>{}); } catch(e){}
    } else {
      widget = null; widgetReady = false; isBinding = false;
      if (iframe) iframe.setAttribute('src', tapeSrc(currentTape, false));
    }
    player.classList.remove('show');
    try{ document.body.classList.remove('mcd-player-open'); }catch(e){}
    setMarquee();
  });
  // V229: FIRE IT UP opens the deck so the visitor taps Mixcloud's highlighted play button; once unlocked, it toggles pause/play.
  if (fireBtn) fireBtn.addEventListener('click', () => { if (!player.classList.contains('show')) { openPlayer(); return; } if (isPlaying) pauseCurrent(); else if (hasUnlockedAudio) playCurrent(); });

  window.addEventListener('beforeunload', () => { syncPosFromTimer(); if (lastKnownPos > 0) savePosition(lastKnownPos, Date.now()); });

  setMarquee();
});
