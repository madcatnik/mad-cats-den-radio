/* PLAYER V15 - SHORTER + SINGLE LINE + OPTION 2 TRACKLIST */
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
      window.__MCD_MIX_DATA = data;
      if(data.sections && data.sections.length > 1){
        const tracks = data.sections.map(s => { const a=(s.artist||'').trim(); const t=(s.songName||s.title||'').trim(); if(a&&t) return `${a} - ${t}`; return t||a; }).filter(Boolean).filter(x=>x.length>1).slice(0,30);
        if(tracks.length>0){ nowSpinningEl.textContent = `✦ CRATE: ${tracks.join(' ✦ ').toUpperCase()} ✦ ${STATION_SLOGAN} ✦`; return; }
      }
    }catch(e){ nowSpinningEl.textContent = `✦ ${STATION_SLOGAN} ✦ ${STATION_SLOGAN} ✦`; }
  }
  if(nowSpinningEl) nowSpinningEl.textContent = `✦ LOADING TAPE... ${STATION_SLOGAN} ✦`;
  loadMixcloudMeta();
  if (iframe && window.Mixcloud) { widget = Mixcloud.PlayerWidget(iframe); setInterval(()=>{ if(isPlaying && widget){ widget.getPosition().then(p=>{ if(p>0) localStorage.setItem('mcd_tape_position', p); }).catch(()=>{}); } },5000); }
  if (fireBtn && beautyPlayer) {
    fireBtn.addEventListener('click', () => {
      if (!beautyPlayer.classList.contains('show')) beautyPlayer.classList.add('show');
      if (!widget && window.Mixcloud && iframe) widget = Mixcloud.PlayerWidget(iframe);
      if (!widget) return;
      if (!isPlaying) {
        try{ widget.play(); }catch(e){}
        widget.ready.then(()=>{ widget.play().then(()=>{ isPlaying=true; fireBtn.classList.add('is-playing'); fireBtn.textContent='💀 KEEP IT WILD'; beautyPlayer.classList.add('is-playing'); if(heroSection) heroSection.classList.add('is-playing'); document.body.classList.add('is-playing'); if(!hasResumed){ const s=localStorage.getItem('mcd_tape_position'); if(s && parseFloat(s)>3) setTimeout(()=>{ widget.seek(parseFloat(s)); },600); hasResumed=true; } }).catch(()=>{ isPlaying=false; }); });
      } else {
        isPlaying=false; fireBtn.classList.remove('is-playing'); fireBtn.textContent='▶ FIRE IT UP'; beautyPlayer.classList.remove('is-playing'); if(heroSection) heroSection.classList.remove('is-playing'); document.body.classList.remove('is-playing'); widget.pause();
      }
    });
  }
  if (beautyClose && beautyPlayer) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show'); isPlaying=false;
      if(fireBtn){ fireBtn.classList.remove('is-playing'); fireBtn.textContent='▶ FIRE IT UP'; }
      if(heroSection) heroSection.classList.remove('is-playing');
      document.body.classList.remove('is-playing');
      if(widget) widget.pause();
    });
  }
  const dragHandle = beautyPlayer ? beautyPlayer.querySelector('.head') : null;
  let isDragging=false, startX, startY, initialX, initialY;
  const isMobile = () => window.innerWidth <= 768;
  if (dragHandle && beautyPlayer) {
    dragHandle.addEventListener('pointerdown', (e) => {
      if (isMobile() || e.target.closest('#mcd-beauty-close')) return;
      isDragging=true; beautyPlayer.classList.add('is-dragging');
      startX=e.clientX; startY=e.clientY;
      const rect=beautyPlayer.getBoundingClientRect();
      beautyPlayer.style.bottom='auto'; beautyPlayer.style.right='auto';
      beautyPlayer.style.top=rect.top+'px'; beautyPlayer.style.left=rect.left+'px';
      initialX=rect.left; initialY=rect.top;
      dragHandle.setPointerCapture(e.pointerId);
    });
    dragHandle.addEventListener('pointermove', (e) => {
      if(!isDragging) return;
      beautyPlayer.style.top=(initialY+(e.clientY-startY))+'px';
      beautyPlayer.style.left=(initialX+(e.clientX-startX))+'px';
    });
    dragHandle.addEventListener('pointerup', (e) => {
      if(!isDragging) return;
      isDragging=false; beautyPlayer.classList.remove('is-dragging');
      try{ dragHandle.releasePointerCapture(e.pointerId); }catch(err){}
    });
  }
});
