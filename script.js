/* PLAYER V36 */
document.addEventListener('DOMContentLoaded', () => {
  const STATION_SLOGAN = "LOW CEILING HIGH VOLUME — NO SPONSORS — NO ALGORITHM — JUST BASEMENT SIGNAL — ATHENS GR — EST 2026";
  const contactForm = document.querySelector('form[name="backroom-howls"]');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('.mcd-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'SLIDING...';
      const formData = new FormData(contactForm);
      formData.append('form-name', contactForm.getAttribute('name'));
      const searchParams = new URLSearchParams(formData);
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: searchParams.toString() })
      .then((r) => { submitBtn.textContent = r.ok ? '✦ DELIVERED ✦' : 'ERROR - TRY AGAIN'; if(r.ok) contactForm.reset(); setTimeout(()=>{ submitBtn.textContent = originalText; },4000); })
      .catch(()=>{ submitBtn.textContent = 'ERROR - TRY AGAIN'; setTimeout(()=>{ submitBtn.textContent = originalText; },4000); });
    });
  }
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const beautyClose = document.getElementById('mcd-beauty-close');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  const nowSpinningEl = document.getElementById('mcd-now-spinning-text');
  let isPlaying = false, widget = null, hasResumed = false;
  function getWidget(){ if(widget) return widget; if(window.Mixcloud && iframe){ widget = Mixcloud.PlayerWidget(iframe); } return widget; }
  function extractMixcloudFeed(el){ try{ const u=new URL(el.src); const f=u.searchParams.get('feed'); if(f) return decodeURIComponent(f); }catch(e){} return null; }
  async function loadMixcloudMeta(){
    if(!iframe || !nowSpinningEl) return;
    nowSpinningEl.textContent = `✦ ${STATION_SLOGAN} ✦ ${STATION_SLOGAN} ✦`;
    const feedPath = extractMixcloudFeed(iframe);
    if(!feedPath) return;
    try{
      const res = await fetch(`https://api.mixcloud.com${feedPath}`);
      if(!res.ok) throw new Error('fail');
      const data = await res.json();
      if(data.sections && data.sections.length > 1){
        const tracks = data.sections.map(s => { const a=(s.artist||'').trim(); const t=(s.songName||s.title||'').trim(); if(a&&t) return `${a} - ${t}`; return t||a; }).filter(Boolean).slice(0,30);
        if(tracks.length>0){ nowSpinningEl.textContent = `✦ CRATE: ${tracks.join(' ✦ ').toUpperCase()} ✦ ${STATION_SLOGAN} ✦`; return; }
      }
    }catch(e){ nowSpinningEl.textContent = `✦ ${STATION_SLOGAN} ✦ ${STATION_SLOGAN} ✦`; }
  }
  if(nowSpinningEl) nowSpinningEl.textContent = `✦ LOADING TAPE... ${STATION_SLOGAN} ✦`;
  loadMixcloudMeta();
  getWidget();
  if (fireBtn && beautyPlayer) {
    fireBtn.addEventListener('click', () => {
      if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
      const w = getWidget();
      if (!w) return;
      if (!isPlaying) {
        try{ w.play(); }catch(e){}
        w.ready.then(()=>{ w.play().then(()=>{ isPlaying=true; fireBtn.classList.add('is-playing'); fireBtn.textContent='💀 KEEP IT WILD'; beautyPlayer.classList.add('is-playing'); if(heroSection) heroSection.classList.add('is-playing'); document.body.classList.add('is-playing'); if(!hasResumed){ const s=localStorage.getItem('mcd_tape_position'); if(s && parseFloat(s)>3) setTimeout(()=>{ w.seek(parseFloat(s)); },600); hasResumed=true; } }).catch(()=>{ isPlaying=false; }); });
      } else {
        isPlaying=false; fireBtn.classList.remove('is-playing'); fireBtn.textContent='▶ FIRE IT UP'; beautyPlayer.classList.remove('is-playing'); if(heroSection) heroSection.classList.remove('is-playing'); document.body.classList.remove('is-playing'); w.pause();
      }
    });
  }
  if (beautyClose && beautyPlayer) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show'); isPlaying=false;
      if(fireBtn){ fireBtn.classList.remove('is-playing'); fireBtn.textContent='▶ FIRE IT UP'; }
      if(heroSection) heroSection.classList.remove('is-playing');
      document.body.classList.remove('is-playing');
      const w = getWidget(); if(w) w.pause();
    });
  }
});
