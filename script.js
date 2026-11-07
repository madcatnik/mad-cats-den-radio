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
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  const nowSpinningEl = document.getElementById('mcd-now-spinning-text');
  let isPlaying = false, widget = null, apiLoading = false;
  if (nowSpinningEl) nowSpinningEl.textContent = `\u2726 ${STATION_SLOGAN} \u2726 ${STATION_SLOGAN} \u2726`;
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
  // Create widget immediately - HTML already loads widgetApi.js before this script, so window.Mixcloud is there
  ensureMixcloudAPI(()=>{ getWidget(); });
  function setPlayingUI(on){
    isPlaying = on;
    if (fireBtn) { fireBtn.classList.toggle('is-playing', on); fireBtn.innerHTML = on ? fireHTML('\uD83D\uDC80', 'KEEP IT WILD') : fireHTML('\u25B6', 'FIRE IT UP'); }
    if (beautyPlayer) beautyPlayer.classList.toggle('is-playing', on);
    if (heroSection) heroSection.classList.toggle('is-playing', on);
    document.body.classList.toggle('is-playing', on);
  }
  if (fireBtn && beautyPlayer) {
    fireBtn.addEventListener('click', () => {
      if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
      if (isPlaying) { setPlayingUI(false); const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} } return; }
      fireBtn.innerHTML = fireHTML('\u25B6', 'LOADING TAPE...');
      // 1. Try sync play FIRST - keeps the Chrome/Safari user gesture
      const syncWidget = getWidget();
      if (syncWidget) { try { const p = syncWidget.play(); if (p && p.catch) p.catch(()=>{}); } catch(e){} }
      // 2. FIX V44: ALWAYS play again after ready. Mixcloud ignores play() before ready,
      // so the old V41 "if sync played, don't play again" left the popup open but silent.
      ensureMixcloudAPI(()=>{
        const w = getWidget();
        if (!w) { fireBtn.innerHTML = fireHTML('\u25B6', 'FIRE IT UP'); return; }
        try {
          w.ready.then(()=>{
            // Always re-play after ready - this is the one that actually starts audio
            try {
              const p2 = w.play();
              if (p2 && p2.then) p2.then(()=>{ setPlayingUI(true); }).catch(()=>{ setPlayingUI(true); });
              else setPlayingUI(true);
            } catch(e){ setPlayingUI(true); }
          }).catch(()=>{ setPlayingUI(true); });
        } catch(e){ setPlayingUI(true); }
        setTimeout(()=>{ if (fireBtn.textContent && fireBtn.textContent.indexOf('LOADING TAPE') !== -1) setPlayingUI(true); }, 1500);
      });
    });
  }
  if (beautyClose && beautyPlayer) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show');
      // Reset any drag position so next open docks back to bottom-right on desktop
      beautyPlayer.style.top = ''; beautyPlayer.style.left = ''; beautyPlayer.style.bottom = ''; beautyPlayer.style.right = '';
      setPlayingUI(false);
      const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} }
    });
  }
  // 3. DRAGGABLE TAPE DECK - RESTORED from V11, desktop only. Mobile stays docked bottom.
  const dragHandle = beautyPlayer ? beautyPlayer.querySelector('.head') : null;
  let isDragging = false, startX, startY, initialX, initialY;
  const isMobile = () => window.innerWidth <= 768;
  if (dragHandle && beautyPlayer) {
    dragHandle.addEventListener('pointerdown', (e) => {
      if (isMobile()) return;
      if (e.target.closest('#mcd-beauty-close')) return;
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
