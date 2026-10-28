/* MAD CATS DEN RADIO - V6 FINAL
   - GEAR + hover fixed ROUND
   - modal X closes inner cards
   - 42 CATS live counter
   - fonts self-hosted
   - palette var(--cream)
   - ?v=6
*/

// 1. Utilities
const MCD_safeStorage = (() => {
  try { const t='__t'; localStorage.setItem(t,t); localStorage.removeItem(t); return localStorage; }
  catch { return { getItem:()=>null, setItem:()=>{}, removeItem:()=>{} }; }
})();
const MCD_Athens = {
  time: () => new Date().toLocaleString('en-GB', { timeZone: 'Europe/Athens', hour12:false }),
  now: () => new Date()
};

// 2. 42 CATS LIVE COUNTER - V6
(function(){
  const els = [document.getElementById('cats-live-counter'), document.getElementById('mini-cats'), document.getElementById('footer-cats')];
  let cats = 42;
  let visitors = parseInt(MCD_safeStorage.getItem('mcd_visitors_today') || '0',10) + 1;
  MCD_safeStorage.setItem('mcd_visitors_today', String(visitors));
  const vc = document.getElementById('visitor-count');
  if(vc) vc.textContent = String(visitors);

  function renderCats(){
    const el = document.getElementById('cats-live-counter');
    if(el) el.textContent = `${cats} CATS LIVE`;
    const mini = document.getElementById('mini-cats');
    if(mini) mini.textContent = `${cats} CATS`;
    const footer = document.getElementById('footer-cats');
    if(footer) footer.childNodes[0] && (footer.childNodes[0].textContent = `${cats} CATS LISTENING LIVE • `);
    // keep visitor count
    const v = document.getElementById('visitor-count');
    if(v && footer) footer.appendChild(v);
  }
  renderCats();

  // live fluctuation: 42 +/- small
  setInterval(()=>{
    const delta = Math.random() > 0.5 ? 1 : -1;
    if(Math.random() > 0.7){
      cats = Math.max(38, Math.min(46, cats + delta));
      if(cats !== 42 && Math.random() > 0.6) cats = 42; // snap back to 42
      renderCats();
      // flash
      const el = document.getElementById('cats-live-counter');
      if(el){ el.style.transform='scale(1.08)'; setTimeout(()=>el.style.transform='',180); }
    }
  }, 4000);

  // expose for debug
  window.MCD_CATS = { get:()=>cats, set:(n)=>{ cats=n; renderCats(); } };
})();

// 3. Navigation & Modals - V6 FIX: X closes inner cards
(function(){
  const modals = document.querySelectorAll('.modal');
  function openModal(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden','false');
    // reset inner cards
    m.querySelectorAll('.inner-card').forEach(c=>c.classList.remove('is-closing'));
    document.body.style.overflow='hidden';
  }
  function closeModal(modal){
    if(!modal) return;
    // V6 FIX: X closes inner cards with animation
    const innerCards = modal.querySelectorAll('.inner-card');
    if(innerCards.length){
      innerCards.forEach((card,i)=>{
        setTimeout(()=>card.classList.add('is-closing'), i*60);
      });
      setTimeout(()=>{
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden','true');
        document.body.style.overflow='';
        innerCards.forEach(c=>c.classList.remove('is-closing'));
      }, innerCards.length*60 + 220);
    } else {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
    }
  }

  // close triggers
  document.addEventListener('click', (e)=>{
    const trigger = e.target.closest('[data-close-modal]');
    if(trigger){
      const modal = trigger.closest('.modal');
      closeModal(modal);
    }
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      document.querySelectorAll('.modal.is-open').forEach(closeModal);
    }
  });

  // GEAR cards open modal
  document.querySelectorAll('.gear-card').forEach(card=>{
    const open = ()=>{
      const gear = card.dataset.gear || 'tascam';
      const content = document.getElementById('gearModalContent');
      if(content){
        const title = content.querySelector('h3');
        if(title) title.textContent = gear.toUpperCase() + ' — GEAR DETAIL';
        const specs = content.querySelector('[data-inner="specs"] p');
        if(specs) specs.textContent = `Specs for ${gear}: basement-tested, cat-approved, low ceiling optimized.`;
      }
      openModal('gearModal');
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(); }
    });
  });

  // manifesto
  const btnManifesto = document.getElementById('btn-manifesto');
  if(btnManifesto) btnManifesto.addEventListener('click', ()=>openModal('manifestoModal'));
})();

// 4. Shout wall
(function(){
  const wall = document.getElementById('shout-wall');
  const form = document.getElementById('shout-form');
  const input = document.getElementById('shout-input');
  if(!wall || !form || !input) return;
  const saved = JSON.parse(MCD_safeStorage.getItem('mcd_shouts') || '[]');
  saved.forEach(({author, text, time})=>{
    const div = document.createElement('div');
    div.className='shout-note';
    div.innerHTML=`<span class="shout-author">${author}</span>: ${text} <span style="opacity:0.5;font-size:10px">• ${time}</span>`;
    wall.appendChild(div);
  });
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const txt = input.value.trim();
    if(!txt) return;
    const note = { author: 'anon', text: txt, time: MCD_Athens.time() };
    const div = document.createElement('div');
    div.className='shout-note';
    div.innerHTML=`<span class="shout-author">${note.author}</span>: ${note.text} <span style="opacity:0.5;font-size:10px">• ${note.time}</span>`;
    wall.prepend(div);
    const arr = JSON.parse(MCD_safeStorage.getItem('mcd_shouts') || '[]');
    arr.unshift(note); MCD_safeStorage.setItem('mcd_shouts', JSON.stringify(arr.slice(0,50)));
    input.value='';
  });
})();

// 5. Wurlitzer voting - fixed B2 P0 double handler, fake tally removed
(function(){
  const grid = document.getElementById('vote-grid');
  if(!grid) return;
  let tally = JSON.parse(MCD_safeStorage.getItem('mcd_vote_tally') || '{"1":0,"2":0,"3":0}');
  // ensure 0/0/0 when offline - no fake 3/5/2
  function render(){
    Object.keys(tally).forEach(k=>{
      const el = document.getElementById('count-'+k);
      if(el) el.textContent = String(tally[k]);
    });
  }
  render();
  let locked = false;
  grid.addEventListener('click', (e)=>{
    const card = e.target.closest('.vote-card');
    if(!card || locked) return;
    const id = card.dataset.vote;
    tally[id] = (tally[id]||0)+1;
    MCD_safeStorage.setItem('mcd_vote_tally', JSON.stringify(tally));
    render();
    locked = true;
    card.style.borderColor='var(--cream)';
    setTimeout(()=>{ locked=false; card.style.borderColor=''; }, 800);
  });
  // keyboard: only one handler (B2 fix)
  grid.addEventListener('keydown', (e)=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    const card = e.target.closest('.vote-card');
    if(!card) return;
    e.preventDefault();
    card.click();
  });
})();

// 6. Player / mini player - fixed Space hijack (B5)
(function(){
  const playBtn = document.getElementById('mini-play');
  const heroBtn = document.getElementById('btn-play-hero');
  let playing = false;
  function toggle(){
    playing = !playing;
    if(playBtn) playBtn.textContent = playing ? '❚❚' : '▶';
    if(heroBtn) heroBtn.textContent = playing ? '❚❚ PAUSE' : '▶ LISTEN LIVE';
  }
  if(playBtn) playBtn.addEventListener('click', toggle);
  if(heroBtn) heroBtn.addEventListener('click', toggle);
  // B5 fix: Space only when focus is on player buttons
  document.addEventListener('keydown', (e)=>{
    if(e.code!=='Space') return;
    const active = document.activeElement;
    if(active && (active.id==='mini-play' || active.id==='btn-play-hero' || active.closest('.mini-player'))){
      e.preventDefault();
      toggle();
    }
  });
})();

console.log('MAD CATS DEN V6 loaded — GEAR ROUND fix, modal X inner cards, 42 CATS live, var(--cream), ?v=6');
