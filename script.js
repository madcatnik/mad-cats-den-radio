/* PLAYER V41 - mobile smaller button, desktop ▶ bigger, sync play keeps gesture */
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
  if (nowSpinningEl) nowSpinningEl.textContent = `✦ ${STATION_SLOGAN} ✦ ${STATION_SLOGAN} ✦`;
  function fireHTML(icon, label){
    return '<span class="mcd-play-symbol" aria-hidden="true">' + icon + '</span><span class="mcd-fire-label"> ' + label + '</span>';
  }
  function ensureMixcloudAPI(cb){ if (window.Mixcloud && window.Mixcloud.PlayerWidget) { cb(); return; } if (apiLoading) { setTimeout(()=>ensureMixcloudAPI(cb), 300); return; } apiLoading = true; const s = document.createElement('script'); s.src = 'https://widget.mixcloud.com/media/js/widgetApi.js'; s.async = true; s.onload = () => { apiLoading = false; cb(); }; s.onerror = () => { apiLoading = false; cb(); }; document.head.appendChild(s); }
  function getWidget(){ if (widget) return widget; if (window.Mixcloud && iframe) { try { widget = Mixcloud.PlayerWidget(iframe); } catch(e){ widget = null; } } return widget; }
  ensureMixcloudAPI(()=>{ getWidget(); });
  function setPlayingUI(on){
    isPlaying = on;
    if (fireBtn) { fireBtn.classList.toggle('is-playing', on); fireBtn.innerHTML = on ? fireHTML('💀', 'KEEP IT WILD') : fireHTML('▶', 'FIRE IT UP'); }
    if (beautyPlayer) beautyPlayer.classList.toggle('is-playing', on);
    if (heroSection) heroSection.classList.toggle('is-playing', on);
    document.body.classList.toggle('is-playing', on);
  }
  if (fireBtn && beautyPlayer) {
    fireBtn.addEventListener('click', () => {
      if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
      if (isPlaying) { setPlayingUI(false); const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} } return; }
      // Show LOADING, keep ▶ span
      fireBtn.innerHTML = fireHTML('▶', 'LOADING TAPE...');
      // FIX: Try play SYNCHRONOUSLY in the click handler first - this keeps the Chrome user-gesture.
      // The old code only played inside an async callback, so desktop Chrome blocked autoplay and the popup opened silent.
      const syncWidget = getWidget();
      let syncPlayed = false;
      if (syncWidget) {
        try { const p = syncWidget.play(); if (p && p.catch) p.catch(()=>{}); syncPlayed = true; } catch(e){}
      }
      ensureMixcloudAPI(()=>{
        const w = getWidget();
        if (!w) { fireBtn.innerHTML = fireHTML('▶', 'FIRE IT UP'); return; }
        // If sync play already fired, just confirm UI via ready. If not, play now as backup.
        if (!syncPlayed) {
          try { const p = w.play(); if (p && p.catch) p.catch(()=>{}); } catch(e){}
        }
        try { w.ready.then(()=>{ if (!syncPlayed) { w.play().then(()=>{ setPlayingUI(true); }).catch(()=>{ setPlayingUI(true); }); } else { setPlayingUI(true); } }).catch(()=>{ setPlayingUI(true); }); } catch(e){ setPlayingUI(true); }
        setTimeout(()=>{ if (fireBtn.textContent && fireBtn.textContent.indexOf('LOADING TAPE') !== -1) setPlayingUI(true); }, 1200);
      });
    });
  }
  if (beautyClose && beautyPlayer) { beautyClose.addEventListener('click', () => { beautyPlayer.classList.remove('show'); setPlayingUI(false); const w = getWidget(); if (w) { try{ w.pause(); }catch(e){} } }); }
});
