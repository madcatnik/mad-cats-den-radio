/* =======================================================

   MAD CATS DEN — main.js

   Consolidated, cacheable, deferred — Zero visual changes

   Original IIFEs preserved to avoid global pollution

   ======================================================= */

/* ==========================================

   1. UTILITIES & STORAGE

   ========================================== */

// Safe localStorage wrapper for private mode / Safari ITP

// === STEP 4: PERFORMANCE - SAFE STORAGE (private mode guard) ===
window.MCD_safeStorage = (function(){
  function get(k, fallback){
    try{
      var v = localStorage.getItem(k);
      return v===null ? fallback : v;
    }catch(e){ return fallback; }
  }
  function set(k, v){
    try{ localStorage.setItem(k, v); return true; }catch(e){ return false; }
  }
  function parse(k, fallback){
    try{
      var raw = localStorage.getItem(k);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(e){ return fallback; }
  }
  return {get:get, set:set, parse:parse};
})();

// Appearance-neutral accessibility helpers shared by both existing dialogs.
window.MCD_motionBehavior = function(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
};
window.MCD_modalBackground = (function(){
  let saved = null;
  const hasNativeInert = 'inert' in HTMLElement.prototype;
  return function(block){
    if(block && !saved){
      saved = Array.from(document.querySelectorAll('#main-content,#main-nav,#footer,#mobile-menu,#mini-player,.skip-link')).map(function(el){
        const state = {el:el, inert:el.inert, fallback: el.getAttribute('data-inert-fallback'), pointer: el.style.pointerEvents};
        if(hasNativeInert){
          el.inert = true;
        } else {
          el.setAttribute('data-inert-fallback','');
          el.style.pointerEvents='none';
          el.setAttribute('aria-hidden','true');
        }
        return state;
      });
    } else if(!block && saved){
      saved.forEach(function(state){
        if(hasNativeInert){
          state.el.inert = state.inert;
        } else {
          state.el.removeAttribute('data-inert-fallback');
          state.el.style.pointerEvents = state.pointer || '';
          state.el.removeAttribute('aria-hidden');
        }
      });
      saved = null;
    }
  };
})();
window.MCD_dialogFocusables = function(root){
  return Array.from(root.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')).filter(function(el){
    return !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden],[inert]') && el.getClientRects().length > 0;
  });
};

// ATHENS CLOCK — single source of truth (V79) — replaces 3 duplicated getAthensTime()
window.MCD_Athens = {
  time: function(){ try{ return new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/Athens',hour:'2-digit',minute:'2-digit',hour12:false}); }catch(e){ return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); } },
  hour: function(){ try{ return parseInt(new Date().toLocaleString('en-GB',{timeZone:'Europe/Athens',hour:'2-digit',hour12:false})); }catch(e){ return new Date().getHours(); } }
};

/* ==========================================

   2. NAVIGATION & UI

   ========================================== */

// Mobile menu, focus trap, aria-current, cats-badge tooltip guard

// NAV
(function(){
  const menu=document.getElementById('mobile-menu');
  const mBtn=document.getElementById('menu-btn');
  const main=document.getElementById('main-content');
  if(!menu||!mBtn) return;
  function getFocusable(){ return Array.from(menu.querySelectorAll('a,button')).filter(el=>!el.disabled); }
  function openMenu(){
    menu.inert=false;
    menu.classList.add('open');
    mBtn.classList.add('open');
    mBtn.setAttribute('aria-expanded','true');
    mBtn.setAttribute('aria-label','Close menu');
    document.body.classList.add('menu-open');
    if(main){
      if('inert' in HTMLElement.prototype){
        main.setAttribute('inert','');
      } else {
        main.setAttribute('data-inert-fallback','');
        main.style.pointerEvents='none';
      }
      main.setAttribute('aria-hidden','true');
    }
    const first=getFocusable()[0];
    if(first) first.focus({preventScroll:true});
  }
  function closeMenu(){
    menu.inert=true;
    menu.classList.remove('open');
    mBtn.classList.remove('open');
    mBtn.setAttribute('aria-expanded','false');
    mBtn.setAttribute('aria-label','Open menu');
    document.body.classList.remove('menu-open');
    if(main){
      main.removeAttribute('inert');
      main.removeAttribute('data-inert-fallback');
      main.removeAttribute('aria-hidden');
      main.style.pointerEvents='';
    }
    mBtn.focus({preventScroll:true});
  }
  // focus trap for mobile menu
  function trapFocus(e){
    if(!menu.classList.contains('open')) return;
    if(e.key!=='Tab') return;
    const focusable=getFocusable();
    if(!focusable.length) return;
    const first=focusable[0], last=focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
  mBtn.addEventListener('click',e=>{e.preventDefault(); menu.classList.contains('open')?closeMenu():openMenu();});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&menu.classList.contains('open')) closeMenu();
    trapFocus(e);
  });
  document.addEventListener('click',e=>{
    if(!menu.classList.contains('open')) return;
    if(menu.contains(e.target)||mBtn.contains(e.target)) return;
    closeMenu();
  });
  const mq=window.matchMedia('(min-width: 768px)');
  const handleResize=()=>{if(mq.matches&&menu.classList.contains('open')) closeMenu();};
  if(mq.addEventListener) mq.addEventListener('change',handleResize); else mq.addListener(handleResize);
  window.updateCats=function(total,here){
    const badge=document.getElementById('cats-badge');
    if(!badge) return;
    const num=badge.querySelector('.num');
    if(num) num.textContent=here;
    const tip=total+' cats prowled the den - '+here+' browsing now';
    badge.setAttribute('data-tooltip',tip);
    badge.setAttribute('aria-label',tip);
    badge.removeAttribute('title');
  }
  // V51: ensure no native title tooltip ever - keep cream only
  try{ document.getElementById('cats-badge')?.removeAttribute('title'); }catch(e){};
  // aria-current - V101: fix double highlight (ROUND+CRATE both #schedule)
  try{
    const desktopLinks=[...document.querySelectorAll('.nav-link[href^="#"]')];
    const mobileLinks=[...document.querySelectorAll('.mobile-link[href^="#"]')];
    const allLinks=[...desktopLinks, ...mobileLinks];
    const seen=new Set();
    const sections=[];
    allLinks.forEach(l=>{ const el=document.querySelector(l.getAttribute('href')); if(el && !seen.has(el.id)){ seen.add(el.id); sections.push(el); } });
    const setCurrent=(id)=>{
      allLinks.forEach(a=>a.removeAttribute('aria-current'));
      // only first desktop + first mobile per id to avoid ROUND+CRATE both lit
      const firstDesk = desktopLinks.find(a=>a.getAttribute('href')==='#'+id);
      const firstMob = mobileLinks.find(a=>a.getAttribute('href')==='#'+id);
      if(firstDesk) firstDesk.setAttribute('aria-current','page');
      if(firstMob) firstMob.setAttribute('aria-current','page');
    };
    // clear hardcoded aria-current from HTML
    allLinks.forEach(a=>a.removeAttribute('aria-current'));
    allLinks.forEach(a=>a.addEventListener('click',()=>setCurrent(a.getAttribute('href').slice(1))));
    if('IntersectionObserver' in window && sections.length){
      const io=new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{ if(entry.isIntersecting) setCurrent(entry.target.id); });
      },{rootMargin:'-40% 0px -55% 0px', threshold:0});
      sections.forEach(s=>io.observe(s));
    }
  }catch(e){}
})();

// View Full Schedule pill — mobile only, expands .mcd-program, desktop auto-expanded

// --- V137 VIEW FULL SCHEDULE - clean, mobile only, expands schedule ---
(function(){
  const pill = document.getElementById('mcd-toggle-schedule-pill');
  const prog = document.querySelector('.mcd-program');
  if(!pill || !prog) return;
  
  function setExpanded(expanded){
    prog.classList.toggle('is-expanded', expanded);
    pill.textContent = expanded ? 'HIDE SCHEDULE ↑' : 'VIEW FULL SCHEDULE ↓';
    pill.classList.toggle('is-expanded', expanded);
    pill.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }
  
  function toggle(){
    const next = !prog.classList.contains('is-expanded');
    setExpanded(next);
    if(next){
      document.getElementById('program-cards')?.scrollIntoView({behavior:window.MCD_motionBehavior(), block:'start'});
    }
  }
  
  pill.addEventListener('click', toggle);
  
  const mql = window.matchMedia('(min-width: 641px)');
  function handleDesktop(){
    setExpanded(mql.matches ? true : false);
  }
  if(mql.addEventListener) mql.addEventListener('change', handleDesktop);
  else mql.addListener(handleDesktop);
  handleDesktop();
})();

// Native player buttons already support Enter and Space without global interception.

/* ==========================================

   3. AUDIO PLAYER & MIXCLOUD

   ========================================== */

// Hero player, Mixcloud profile/live links, marquee pill, reel spokes

// HERO + MIXCLOUD
function makeSpokes(id){
  const c=document.getElementById(id); if(!c) return; c.innerHTML='';
  for(let i=0;i<3;i++){ const s=document.createElement('div'); s.className='p390-reel-spoke'; s.style.transform='translate(-50%,0) rotate('+ (i*120) +'deg)'; c.appendChild(s); }
}
makeSpokes('spokes1'); makeSpokes('spokes2');
const MIXCLOUD_PROFILE = 'https://www.mixcloud.com/madcatnik/';
const MIXCLOUD_LIVE = 'https://www.mixcloud.com/live/madcatnik/';
const btn=document.getElementById('btn'),lbl=document.getElementById('lbl'),shell=document.getElementById('shell'),player=document.getElementById('player'),dot=document.getElementById('dot'),triEl=btn?btn.querySelector('.tri'):null,reel1=document.getElementById('reel1'),reel2=document.getElementById('reel2'),tape=document.getElementById('p390-tape'),marquee=document.getElementById('marquee'),pTrack=document.getElementById('p-track'),pStatus=document.getElementById('p-status');
let isLiveMode = false;
function openMixcloud(){ window.open(isLiveMode ? MIXCLOUD_LIVE : MIXCLOUD_PROFILE, '_blank', 'noopener'); }

// Shared MX pill updater - single source of truth, text preserved exactly
window.__mcdUpdateMxPill = function(isLive){
  try{
    const mxPill = document.querySelector('#mx-pill');
    if(!mxPill) return;
    const prof = mxPill.getAttribute('data-href') || 'https://www.mixcloud.com/madcatnik/';
    const liveUrl = mxPill.getAttribute('data-href-live') || 'https://www.mixcloud.com/live/madcatnik/';
    const target = isLive ? liveUrl : prof;
    mxPill.href = target;
    mxPill.textContent = isLive ? 'M-X ✦ LIVE NOW • TUNE IN' : 'M-X ✦ TAPE RUNNING 24/7';
    mxPill.title = isLive ? 'Mixcloud LIVE — Click to tune in' : 'Mixcloud — Tape Running 24/7';
  }catch(e){}
};

window.setLiveMode = function(live){
  isLiveMode = !!live;
  if(pTrack){ pTrack.href = isLiveMode ? MIXCLOUD_LIVE : MIXCLOUD_PROFILE; pTrack.setAttribute('aria-label', (isLiveMode ? 'Mixcloud live' : 'Mixcloud archive') + ' (opens in new tab)'); }
  window.__mcdUpdateMxPill(isLiveMode);

  if(isLiveMode){
    shell.classList.add('live'); player.classList.add('live');
    shell.classList.remove('playing'); player.classList.remove('playing');
    dot.className='p-dot live';
    pStatus.textContent='LIVE NOW';
    marquee.textContent='● LIVE NOW: madcatnik on Mixcloud • CLICK TO TUNE IN •';
    marquee.classList.add('playing');
    pTrack.classList.add('live');
    pTrack.title='Tune in live on Mixcloud (opens in new tab)';
    lbl.textContent='TUNE IN LIVE';
    btn.className='btn live';
    btn.setAttribute('aria-label','Tune in live on Mixcloud (opens in new tab)');
    reel1.classList.add('playing'); reel2.classList.add('playing'); tape.classList.add('playing');
  } else {
    shell.classList.remove('live'); player.classList.remove('live');
    dot.className='p-dot idle';
    pStatus.textContent='STEREO • 33⅓ RPM';
    // idle = static ON AIR NOW: TITLE
    if(window.__whatsNowFull){
      marquee.textContent = window.__whatsNowFull;
      marquee.classList.remove('playing');
    } else if(window.__whatsNowShort){
      marquee.textContent = window.__whatsNowShort;
      marquee.classList.remove('playing');
    } else {
      marquee.textContent='ARCHIVE: mixcloud.com/madcatnik • Night Owl Radio •';
      marquee.classList.remove('playing');
    }
    pTrack.classList.remove('live');
    pTrack.title='Open Mixcloud archive (opens in new tab)';
    lbl.textContent='FIRE IT UP';
    btn.className='btn idle';
    btn.setAttribute('aria-label','Open Mixcloud archive (opens in new tab)');
    shell.classList.remove('playing'); player.classList.remove('playing');
    reel1.classList.remove('playing'); reel2.classList.remove('playing'); tape.classList.remove('playing');
  }
  btn.setAttribute('aria-pressed', isLiveMode ? 'true' : 'false');
};
setLiveMode(false);
if(btn){
  btn.onclick=()=>{
    if(isLiveMode){
      openMixcloud();
      return;
    }
    const isPlaying = shell.classList.contains('playing');
    if(isPlaying){
      lbl.textContent='FIRE IT UP';
      if(triEl) triEl.textContent='';
      if(triEl) triEl.textContent='';
      btn.classList.remove('playing'); btn.classList.add('idle');
      shell.classList.remove('playing'); player.classList.remove('playing');
      dot.className='p-dot idle';
      // idle = static ON AIR NOW: TITLE
      if(window.__whatsNowFull){
        marquee.textContent = window.__whatsNowFull;
        marquee.classList.remove('playing');
      } else if(window.__whatsNowShort){
        marquee.textContent = window.__whatsNowShort;
        marquee.classList.remove('playing');
      } else {
        marquee.classList.remove('playing');
        marquee.textContent='ARCHIVE: mixcloud.com/madcatnik • Night Owl Radio •';
      }
      reel1.classList.remove('playing'); reel2.classList.remove('playing'); tape.classList.remove('playing');
      btn.setAttribute('aria-pressed','false');
      pStatus.textContent='STEREO • 33⅓ RPM';
    } else {
      lbl.textContent='FIRING UP...';
      btn.classList.add('playing'); btn.classList.remove('idle');
      if(triEl) triEl.textContent='💀';
      shell.classList.add('playing'); player.classList.add('playing');
      dot.className='p-dot on';
      // playing = ON AIR NOW: TITLE • DESC, scrolling 18s instant
      if(window.__whatsNowShort){
        marquee.textContent = window.__whatsNowShort;
      } else if(window.__whatsNowFull){
        marquee.textContent = window.__whatsNowFull;
      } else {
        marquee.textContent='ON AIR NOW: Night Owl Radio • Analog Warmth';
      }
      marquee.classList.add('playing');
      reel1.classList.add('playing'); reel2.classList.add('playing'); tape.classList.add('playing');
      btn.setAttribute('aria-pressed','true');
      pStatus.textContent='WARMING UP';
      openMixcloud();
      setTimeout(()=>{
        if(shell.classList.contains('playing') && !isLiveMode){
          lbl.textContent='KEEP IT WILD';
          pStatus.textContent='ON AIR';
        }
      }, 900);
    }
  };
}

// Single source of truth is window.__mcdUpdateMxPill (defined in hero). Keep alias for legacy calls.
window.updateMxPillForLive = function(isLive){
  if(window.__mcdUpdateMxPill) return window.__mcdUpdateMxPill(isLive);
};

// Mini player — sticks when hero scrolls out, syncs status

// MINI PLAYER — V95 + V113 footer together
(function(){
  const hero = document.getElementById('hero');
  const mini = document.getElementById('mini-player');
  const miniBtn = document.getElementById('mini-btn');
  const miniStatus = document.getElementById('mini-status');
  const miniTrack = document.getElementById('mini-track');
  const mainBtn = document.getElementById('btn');
  const pStatus = document.getElementById('p-status');
  const marquee = document.getElementById('marquee');
  const footer = document.getElementById('footer');
  if(!mini || !hero) return;
  function sync(){
    // Keep DEN RULES fixed - don't overwrite miniStatus
    // if(pStatus) miniStatus.textContent = pStatus.textContent;
    if(marquee) miniTrack.textContent = marquee.textContent;
    const isPlaying = mainBtn && mainBtn.classList.contains('playing');
    if(isPlaying){ miniBtn.textContent='❚❚'; miniBtn.classList.add('playing'); mini.classList.add('is-playing'); } else { miniBtn.textContent='▶'; miniBtn.classList.remove('playing'); mini.classList.remove('is-playing'); }
  }
  function onScroll(){
    const show = window.scrollY > (hero.offsetHeight * 0.9);
    mini.classList.toggle('show', show);
    mini.hidden = !show;
    if(show) sync();
    // Keep fixed at bottom - no more funny lifting
    mini.style.bottom = '0px';
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  miniBtn.addEventListener('click', ()=>{ if(mainBtn) mainBtn.click(); setTimeout(sync, 100); });
  setInterval(()=>{ if(!mini.hidden) sync(); }, 2000);
  onScroll();
})();

/* ==========================================

   4. SHOUT WALL & CASSETTE MODALS

   ========================================== */

// Program: Athens clock + is-now (unified for contact + live)

// PROGRAM - Athens clock + is-now (unified — also drives contact + live clocks)
(function(){
  function getAthensTime(){ return window.MCD_Athens.time(); }
  function getSlot(){
    try{
      const h = window.MCD_Athens.hour();
      if(h>=0&&h<3) return '00:00';
      if(h>=3&&h<6) return '03:00';
      if(h>=6&&h<9) return '06:00';
      if(h>=9&&h<12) return '09:00';
      if(h>=12&&h<15) return '12:00';
      if(h>=15&&h<18) return '15:00';
      if(h>=18&&h<21) return '18:00';
      return '21:00';
    }catch(e){ return '21:00'; }
  }
  function update(){
    const slot=getSlot();
    const athensTime=getAthensTime();
    var clkEl=document.getElementById('athens-clock-v5'); if(clkEl) clkEl.textContent=athensTime;
    // Unified: contact + live wall share same Athens time
    var contactEl=document.getElementById('contact-clock'); if(contactEl) contactEl.textContent=athensTime;
    var liveEl=document.getElementById('live-time'); if(liveEl){ liveEl.textContent=athensTime; try{ liveEl.title='Athens EEST \u2022 ' + new Date().toLocaleDateString('en-CA') + ' ' + athensTime; }catch(e){} }
    var currentCard = null;
    document.querySelectorAll('.mcd-card').forEach(c=>{
      const isNow = c.dataset.time===slot;
      c.classList.toggle('is-now', isNow);
      c.setAttribute('aria-label', c.dataset.time+' '+c.dataset.title+' — liner notes'+(isNow ? ' — ON AIR' : ''));
      if(isNow) c.setAttribute('aria-current','true');
      else c.removeAttribute('aria-current');
      if(isNow){
        currentCard = c;
        const g = c.dataset.circleBg || '#9BDBC1';
        c.style.setProperty('--glow', g);
      } else {
        c.style.removeProperty('--glow');
      }
    });
    // set whats playing now texts
    if(currentCard){
      var t = currentCard.dataset.title || '';
      var d = currentCard.dataset.desc || '';
      var tm = currentCard.dataset.time || slot;
      window.__whatsNowFull = 'ON AIR NOW: ' + t;
      window.__whatsNowShort = 'ON AIR NOW: ' + t + ' • ' + d;
      var marqueeEl = document.getElementById('marquee');
      var shellEl = document.getElementById('shell');
      if(marqueeEl){
        var isShellPlaying = shellEl && shellEl.classList.contains('playing');
        var isLive = shellEl && shellEl.classList.contains('live');
        if(!isLive){
          if(isShellPlaying){
            // playing = ON AIR NOW: TITLE • DESC, scrolling 18s instant
            marqueeEl.textContent = window.__whatsNowShort;
            marqueeEl.classList.add('playing');
          } else {
            // idle = static ON AIR NOW: TITLE
            marqueeEl.textContent = window.__whatsNowFull;
            marqueeEl.classList.remove('playing');
          }
        }
      }
    }
  }
  update(); setInterval(update,10000); // unified 10s — drives program + contact + live wall
})();

// Program: Cassette modal (focus trap, history)

// PROGRAM - MODAL
(function(){
  const modal=document.getElementById('cassette-modal');
  const overlay=document.getElementById('cassette-overlay');
  const card=document.getElementById('cassette-modal-card');
  const closeBtn=document.getElementById('cassette-close');
  const mTime=document.getElementById('modal-time');
  const mTitle=document.getElementById('modal-title');
  const mDesc=document.getElementById('modal-desc');
  const mHost=document.getElementById('modal-host');
  const mTower=document.getElementById('modal-tower');
  const mOnAir=document.getElementById('modal-onair');
  if(!modal||!card) return;
  let lastFocus=null;
  let closing=false;
  function trapTab(e){
    if(e.key!=='Tab'||!modal.classList.contains('is-open')) return;
    const f=window.MCD_dialogFocusables(card);
    if(!f.length){ e.preventDefault(); return; }
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey&&(document.activeElement===first||!card.contains(document.activeElement))){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey&&(document.activeElement===last||!card.contains(document.activeElement))){ e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', trapTab);
  function openModal(el){
    if(!el||!el.dataset) return;
    if(modal.classList.contains('is-open')) return;
    closing=false;
    lastFocus=el;
    const time=el.dataset.time||'';
    const title=el.dataset.title||'';
    const desc=el.dataset.desc||'';
    const dj=el.dataset.dj||'Politis N';
    const circleBg = el.dataset.circleBg || '#F0F0DA';
    card.style.backgroundColor=el.dataset.bg||'#1A1C18';
    // keep original den colors - dark bg, cream text always
    card.style.color = '#F0F0DA';
    if(mTower){ mTower.style.backgroundColor = circleBg; }
    if(mTime){
      mTime.textContent = 'ROLLS AT ' + time;
      var bgLower = (circleBg||'').toLowerCase();
      var isCircleLight = bgLower.indexOf('f0f0da')!==-1 || bgLower.indexOf('9bdbc1')!==-1 || bgLower.indexOf('f7f3e8')!==-1 || bgLower.indexOf('8ce0d6')!==-1 || bgLower.indexOf('e9dcc0')!==-1 || bgLower.indexOf('e9dcc')!==-1;
      // dark is only CC2D30 red - everything else light
      var isDark = bgLower.indexOf('cc2d30')!==-1 || bgLower.indexOf('cc2d')!==-1;
      if(isDark) isCircleLight = false;
      mTime.style.backgroundColor = circleBg;
      mTime.style.color = isCircleLight ? '#050505' : '#F0F0DA';
      mTime.style.borderColor = '#050505';
    }
    if(mTitle) mTitle.textContent = title;
    if(mDesc) mDesc.textContent = desc;
    if(mHost) mHost.textContent = dj;
    const isNow = el.classList.contains('is-now');
    if(mOnAir){ if(isNow){ mOnAir.classList.remove('hidden'); } else { mOnAir.classList.add('hidden'); } }
    modal.classList.remove('modal-hidden');
    modal.classList.add('is-open');
    if(overlay) overlay.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';
    const skullImg=document.getElementById('modal-tower-img');
    const skullTower=document.getElementById('modal-tower');
    const reelA=document.getElementById('reel-a');
    const reelB=document.getElementById('reel-b');
    if(skullImg){
      skullImg.classList.remove('skull-hello'); void skullImg.offsetWidth; skullImg.classList.add('skull-hello');
      if(skullTower){ skullTower.classList.remove('tower-pop'); void skullTower.offsetWidth; skullTower.classList.add('tower-pop'); }
      setTimeout(function(){ skullImg.classList.remove('skull-hello'); if(skullTower){ skullTower.classList.remove('tower-pop'); } }, 2200);
    }
    if(reelA&&reelB){
      reelA.classList.remove('mcd-rotate'); reelB.classList.remove('mcd-rotate-reverse'); void reelA.offsetWidth;
      reelA.classList.add('mcd-rotate'); reelB.classList.add('mcd-rotate-reverse');
      setTimeout(function(){ reelA.classList.remove('mcd-rotate'); reelB.classList.remove('mcd-rotate-reverse'); }, 3000);
    }
    setTimeout(function(){ card.classList.add('is-visible'); },10);
    if(closeBtn) closeBtn.focus({preventScroll:true});
    window.MCD_modalBackground(true);
  }
  function closeModal(){
    if(!modal.classList.contains('is-open')||closing) return;
    closing=true;
    card.classList.remove('is-visible');
    if(overlay) overlay.classList.remove('open');
    setTimeout(function(){
      modal.classList.add('modal-hidden');
      modal.classList.remove('is-open');
      if(overlay) overlay.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
      document.documentElement.style.overflow='';
      window.MCD_modalBackground(false);
      if(lastFocus&&document.contains(lastFocus)) lastFocus.focus({preventScroll:true});
      closing=false;
      lastFocus=null;
    },200);
  }
  document.getElementById('program-cards')?.addEventListener('click', function(e){
    const c=e.target.closest('.mcd-card');
    if(c) openModal(c);
  });
  document.getElementById('program-cards')?.addEventListener('keydown', function(e){
    if(e.key==='Enter'||e.key===' '){
      const c=e.target.closest('.mcd-card');
      if(c){ e.preventDefault(); openModal(c); }
    }
  });
  if(overlay) overlay.addEventListener('click', closeModal);
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'&&modal.classList.contains('is-open')) closeModal();
  });
  window.MCD_openModal = openModal;
  window.MCD_closeModal = closeModal;
})();

// Shout wall, toasts, sanitization, pinned shout — includes vote modal wiring

(function(){
  const $ = (s)=>document.querySelector(s);
  const shoutWall = $('#shout-wall');
  const nikoInput = $('#niko-input');
  const ruthInput = $('#ruth-input');
  const dropBtn = $('#dropBtn');
  const liveTimeEl = $('#live-time');
  const toastEl = $('#toast');
  const voteCard = $('#voteCard');
  const voteModal = $('#voteModal');
  // closeModal removed — was dead (no #closeModal element), using #modalCloseX instead
  const openBooth = $('#openBooth');
  const pinnedText = $('#pinned-shout-text');
  const pinnedAuthor = $('#pinned-shout-author');
  const pinnedNote = $('#pinned-note');

  // Stop rotating placeholders for people who request reduced motion.
  const placeholderMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  // ROCK / ROLL slow rotation - 5s
  const catPlaceholders = ["ROCK", "ROLL"];
  let catIdx = 0;
  nikoInput.placeholder = catPlaceholders[0];
  function rotateCatPlaceholder(){
    if(!placeholderMotion.matches && document.activeElement !== nikoInput && !nikoInput.value){
      catIdx = (catIdx + 1) % catPlaceholders.length;
      nikoInput.placeholder = catPlaceholders[catIdx];
    }
  }
  setInterval(rotateCatPlaceholder, 5000);
  nikoInput.addEventListener('focus', ()=>{ if(!nikoInput.value) nikoInput.placeholder = catPlaceholders[catIdx]; });
  nikoInput.addEventListener('blur', ()=>{ if(!nikoInput.value) setTimeout(rotateCatPlaceholder, 600); });

    const defaultNotes = [
    {name:"NIKO", isHost:true, time:"21:12", msg:"Cleaned the stylus, new needle hits fat. drop a bopper, i spin it top of hour.", vinyl:"teal"},
    {name:"THALIA", time:"21:05", msg:"Gene Vincent - Be-Bop-A-Lula just cracked my speaker. still shakes the walls.", vinyl:"teal"},
    {name:"LEO", time:"20:58", msg:"Found a Ruth Brown 78 at Monastiraki for 3€. skips at start but that howl is worth it.", vinyl:"red"},
    {name:"MARA", time:"20:51", msg:"Request: Wanda Jackson - Fujiyama Mama if you have it? need that scream.", vinyl:"cream"},
    {name:"KOSTAS", time:"20:44", msg:"Bopper: Esquerita - Rockin' The Joint. piano like a chainsaw.", vinyl:"teal"},
    {name:"DEN", time:"20:38", msg:"Side B rule: artist + song. no spotify links. we spin what we got in the den.", vinyl:"red", denBadge:false},
    {name:"NIKO", isHost:true, time:"20:31", msg:"Vote: A1 MAMA'S MEAN vs B2 HOUND DOG vs C3 JIM DANDY. ends fri 18:00.", vinyl:"teal"},
    {name:"JIM", time:"20:27", msg:"Just cut a new 45 in Exarcheia — 'Cat Fight Boogie'. can i mail it to the den?", vinyl:"cream"},
    {name:"ELENI", time:"20:19", msg:"Screamin' Jay Hawkins on full blast, neighbors banging but who cares.", vinyl:"red"},
    {name:"DEN", time:"20:12", msg:"HOWL: niko@madcatsdenradio.com — guest boppers, crate digs, gig flyers welcome.", vinyl:"red", denBadge:false},
    {name:"ALEX", time:"20:05", msg:"Bopper: Johnny Burnette - Tear It Up. that trio still unbeatable.", vinyl:"teal"},
    {name:"NIKO", isHost:true, time:"19:58", msg:"Tape running 24/7 on Mixcloud — M-X ✦ TAPE RUNNING. archive's fat.", vinyl:"teal"},
    {name:"SOFIA", time:"19:51", msg:"Little Richard - Long Tall Sally → Etta James - Tough Lover. what a run.", vinyl:"cream"},
    {name:"VASS", time:"19:44", msg:"Dig report: 12 45s at a Kypseli basement, 2 Big Mama Thornton, 1 tore label but plays.", vinyl:"red"},
    {name:"NIKO", isHost:true, time:"19:37", msg:"If you got a gig, cut a 45, scene report — mail the den. if it crackles, we care.", vinyl:"teal"},
    {name:"GUEST CAT", time:"19:29", msg:"First time here — this wall is wild. dropping: Billy Lee Riley - Red Hot.", vinyl:"cream"},
    {name:"DEN", time:"19:22", msg:"One vote per cat. no bots, just wax. shake rattle & vote til fri.", vinyl:"red", denBadge:false},
    {name:"YANNIS", time:"19:15", msg:"Bopper: Hasil Adkins - No More Hot Dogs. out there but it bops.", vinyl:"teal"},
    {name:"NIKO", isHost:true, time:"19:08", msg:"Needle check: 2.5g, anti-skate dialed. new boppers sounding fat rn.", vinyl:"teal"},
    {name:"LENA", time:"19:01", msg:"Request: LaVern Baker - Jim Dandy if you spin C3 monday?", vinyl:"cream"},
    {name:"DEN", time:"18:54", msg:"Side B live — 07:08 EEST • crate light on • den announcement top.", vinyl:"red", denBadge:false},
    {name:"MIKE", time:"18:47", msg:"Bopper: Dale Hawkins - Suzie-Q. swamp drip still hits.", vinyl:"teal"},
    {name:"NIKO", isHost:true, time:"18:39", msg:"Got a stack of Sun 45s from a road trip — Jerry Lee, Carl, Johnny. gonna leak em.", vinyl:"teal"},
    {name:"ANNA", time:"18:32", msg:"Big Maybelle - Gabbin' Blues made me drop my coffee. voice like gravel & honey.", vinyl:"red"},
    {name:"STAVROS", time:"18:25", msg:"Bopper: Charlie Feathers - Tongue-Tied Jill. that hiccup is evil.", vinyl:"cream"},
    {name:"DEN", time:"18:18", msg:"Tonight: Ruth Brown deep cuts + basement requests. light on til 02:00.", vinyl:"red", denBadge:false},
    {name:"NIKO", isHost:true, time:"18:11", msg:"Bopper from Thalia in — spinning at top of hour. that Ruth Brown is heat.", vinyl:"teal"},
    {name:"KIKI", time:"18:04", msg:"The Cramps - Human Fly → Link Wray - Rumble. den knows.", vinyl:"red"},
    {name:"PETROS", time:"17:57", msg:"Bopper: Ronnie Dawson - Rockin' Bones. cowboy bop still rips.", vinyl:"teal"},
    {name:"DEN", time:"17:50", msg:"Wurlitzer 3 selector live — choose monday 21:00. A1 B2 C3.", vinyl:"red", denBadge:false},
    {name:"NIKO", isHost:true, time:"17:43", msg:"If you got wax, bring it. crate light is on. dropping 45s til late.", vinyl:"teal"},
    {name:"ZOE", time:"17:36", msg:"Bopper: Janis Martin - Drugstore Rock 'n Roll. teenage sass.", vinyl:"cream"},
    {name:"DEN", time:"17:29", msg:"Find us: IG @madcatnik • FB • YT basement cuts • MX tape 24/7", vinyl:"red", denBadge:false},
    {name:"DIMITRIS", time:"17:22", msg:"Bopper: Roy Orbison - Ooby Dooby. Sun era Roy is wild.", vinyl:"teal"},
    {name:"NIKO", isHost:true, time:"17:15", msg:"Vote closes fri, shake rattle til then. one vote per cat.", vinyl:"teal"},
    {name:"MARIA", time:"17:08", msg:"Howlin' Wolf - Smokestack Lightnin' on repeat. that howl.", vinyl:"red"},
    {name:"TOM", time:"17:01", msg:"Bopper: Eddie Cochran - Twenty Flight Rock. stairwell riff.", vinyl:"cream"},
    {name:"DEN", time:"16:54", msg:"Guest boppers welcome — artist + song. go cat go!", vinyl:"red", denBadge:false},
    {name:"NIKO", isHost:true, time:"16:47", msg:"Just sorted 45s by feel, not alphabet. rockers front, weepers back.", vinyl:"teal"},
    {name:"CHRIS", time:"16:40", msg:"Bopper: Little Esther - Cherry. 1952 but still a bopper.", vinyl:"teal"},
    {name:"EIRINI", time:"16:33", msg:"Big Joe Turner - Shake Rattle & Roll original hits different after covers.", vinyl:"red"},
    {name:"DEN", time:"16:26", msg:"Live wires coming 2027 — madcatnik digging in crate…", vinyl:"red", denBadge:true},
    {name:"NIKO", isHost:true, time:"16:19", msg:"Mail: niko@madcatsdenradio.com. if it crackles, we care.", vinyl:"teal"},
    {name:"PANOS", time:"16:12", msg:"Bopper: Warren Smith - Ubangi Stomp. jungle drums + slapback.", vinyl:"teal"},
    {name:"ALICE", time:"16:05", msg:"Bo Diddley beat all night. shave and a haircut still bops.", vinyl:"cream"},
    {name:"DEN", time:"15:58", msg:"Monday 21:00 on air — theme picked by cats, not algorithm.", vinyl:"red", denBadge:false},
    {name:"NIKO", isHost:true, time:"15:51", msg:"New boppers from last night still spinning. keep em coming.", vinyl:"teal"},
    {name:"GIANNIS", time:"15:44", msg:"Bopper: Carl Perkins - Honey Don't. that intro lick.", vinyl:"teal"},
    {name:"NIKO", isHost:true, time:"15:37", msg:"50 shouts max on wall, then old wax files back. keeps it tight.", vinyl:"teal"}
  ];

  function bu(d=new Date()){ return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  function uid(){ return Date.now()+'-'+Math.random().toString(36).slice(2,8)+'-'+Math.random().toString(36).slice(2,5); }

  // V96 — Toast queue (safe, local only): max 2 queued, 2.6s each, no overwrite
  let hideTO=null, clearTO=null;
  let toastQueue=[];
  let isToasting=false;
  function showToastNow(msg){
    isToasting=true;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    toastEl.onclick = ()=>{
      if(hideTO) clearTimeout(hideTO);
      if(clearTO) clearTimeout(clearTO);
      toastEl.classList.remove('show');
      clearTO = setTimeout(()=>{ toastEl.textContent=''; toastEl.onclick=null; isToasting=false; nextToast(); }, 220);
    };
    hideTO = setTimeout(()=>{
      toastEl.classList.remove('show');
      clearTO = setTimeout(()=>{ toastEl.textContent=''; toastEl.onclick=null; isToasting=false; nextToast(); }, 220);
    }, 2600);
  }
  function nextToast(){
    if(toastQueue.length>0){ const next = toastQueue.shift(); showToastNow(next); }
  }
  function toast(msg){
    if(!isToasting){ showToastNow(msg); }
    else if(toastQueue.length<2){ toastQueue.push(msg); }
    else { toastQueue[1]=msg; }
  }
  // V82 — expose toast globally (was trapped in closure, FIX script + social copy couldn't call it)
  window.toast = toast;
  window.MCD_toast = toast;

  function createNoteElement(n){
    const div = document.createElement('div');
    div.className = 'wall-note enter';
    div.dataset.id = n.id;
    const leftVinyl = document.createElement('div');
    leftVinyl.className = 'vinyl-icon';
    leftVinyl.style.setProperty('--v-dot', n.vinyl==='red' ? '#CC2D30' : n.vinyl==='teal' ? '#9BDBC1' : '#F0F0DA');
    const content = document.createElement('div');
    content.className = 'note-content';
    const top = document.createElement('div');
    top.className = 'note-top';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'name-wrap';
    const nameEl = document.createElement('span');
    nameEl.className = 'note-name';
    nameEl.textContent = n.name;
    nameWrap.appendChild(nameEl);
    if(n.isHost){ const hb=document.createElement('span'); hb.className='host-badge'; hb.textContent='HOST'; nameWrap.appendChild(hb); }
    const timeEl = document.createElement('span');
    timeEl.className='note-time'; timeEl.textContent=n.time;
    top.appendChild(nameWrap); top.appendChild(timeEl);
    const msgEl = document.createElement('div');
    msgEl.className='note-msg'; msgEl.textContent=n.msg;
    content.appendChild(top); content.appendChild(msgEl);
    div.appendChild(leftVinyl); div.appendChild(content);
    if(n.denBadge){
      const db=document.createElement('div'); db.className='den-badge'; db.textContent='✦ DEN ANNOUNCEMENT'; div.appendChild(db);
    }
    setTimeout(()=>div.classList.remove('enter'),400);
    return div;
  }

  function renderNotes(notes){
    shoutWall.innerHTML='';
    notes.forEach(n=>{ shoutWall.appendChild(createNoteElement(n)); });
  }

  function loadNotes(){
    try{
      const raw = MCD_safeStorage.get('mcd-wall-notes-vanilla', null);
      if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr) && arr.length && arr[0].msg) return arr; }
    }catch(e){}
    return defaultNotes.map(n=>({...n, id:uid()}));
  }
  function saveNotes(notes){
    try{ MCD_safeStorage.set('mcd-wall-notes-vanilla', JSON.stringify(notes.slice(0,50))); }catch(e){}
  }

  let notes = loadNotes();
  renderNotes(notes);

  function loadPinned(){
    try{
      const t=MCD_safeStorage.get('mcd-pinned-text', null);
      const a=MCD_safeStorage.get('mcd-pinned-author', null);
      if(t) pinnedText.textContent=t;
      if(a) pinnedAuthor.textContent=a;
    }catch(e){}
  }
  loadPinned();
  window.MCD_PINNED = {enabled:true, text:pinnedText.textContent, author:pinnedAuthor.textContent};
  window.updatePinnedShout = function(txt, author){
    if(txt){ pinnedText.textContent=txt; window.MCD_PINNED.text=txt; try{MCD_safeStorage.set('mcd-pinned-text',txt);}catch(e){} }
    if(author){ pinnedAuthor.textContent=author; window.MCD_PINNED.author=author; try{MCD_safeStorage.set('mcd-pinned-author',author);}catch(e){} }
  };

  // Unified clock handles live-time — tick now just uses shared Athens helper (no own interval)
  function tick(){
    if(window.MCD_Athens){ const t = window.MCD_Athens.time(); liveTimeEl.textContent = t; try{ liveTimeEl.title = 'Athens EEST \u2022 ' + new Date().toLocaleDateString('en-CA') + ' ' + t; }catch(e){} }
    else liveTimeEl.textContent = bu();
  }
  tick(); // single interval lives in PROGRAM clock (V79) — no duplicate setInterval here

  let lastDropAt = 0;
  const DROP_COOLDOWN = 3000;
  function doDrop(){
    const now = Date.now();
    if(now - lastDropAt < DROP_COOLDOWN){
      const wait = Math.ceil((DROP_COOLDOWN - (now - lastDropAt))/1000);
      toast(`EASY CAT — WAIT ${wait}s`);
      return;
    }
    const nameRaw = sanitizeName(nikoInput.value || 'GUEST CAT');
    const trackRaw = sanitizeTrack(ruthInput.value);
    if(trackRaw.length===0){
      // keep fallback but bulletproof: allow empty -> defaults, but show hint
      // if you want to require track, uncomment next 2 lines
      // toast('GIMME A TRACK — RUTH? MAMA?'); return;
    }
    const track = trackRaw || 'Gene Vincent - Crazy Beat';
    const id = uid(); const time = bu();
    const msg = track;
    const note = {id, name:nameRaw, isHost:false, time, msg, vinyl:'teal'};
    notes.unshift(note);
    // Guardrail: keep only 50 in memory + storage
    if(notes.length>50) notes.length = 50;
    const el = createNoteElement(note);
    shoutWall.prepend(el);
    // Guardrail: trim DOM to 50 max
    while(shoutWall.children.length>50){
      shoutWall.removeChild(shoutWall.lastChild);
    }
    shoutWall.scrollTo({top:0, behavior:window.MCD_motionBehavior()});
    ruthInput.value=''; saveNotes(notes); toast('BOPPER DROPPED TO SIDE B');
    lastDropAt = now;
    dropBtn.disabled = true;
    dropBtn.style.opacity = '0.7';
    dropBtn.style.pointerEvents = 'none';
    setTimeout(()=>{ dropBtn.disabled=false; dropBtn.style.opacity='1'; dropBtn.style.pointerEvents='auto'; }, DROP_COOLDOWN);
  }
  dropBtn.addEventListener('click', doDrop);

  // Guardrail: input sanitization + live counters
  function sanitizeName(s){
    return s.toUpperCase().replace(/[^A-Z0-9 _-]/g,'').trim().slice(0,12) || 'GUEST CAT';
  }
  function sanitizeTrack(s){
    return s.replace(/[<>]/g,'').trim().slice(0,80);
  }
  function updateCounters(){ /* counters removed - 0/12 0/80 hidden per request */ }
  nikoInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); ruthInput.focus(); } });

  

    // --- VOTE LOGIC - CLOUDFLARE KV WIRED - PERCENTAGE FIXED ---
  const VOTE_API_URL = '/api/votes';
  const VOTE_COUNTS_KEY = 'mcd-vote-counts';
  const VOTE_LAST_KEY = 'mcd-last-vote';
  const THEME_TITLES = {'1':'THEME A1 — MAMA\'S MEAN','2':'THEME B2 — HOUND DOG HOWL','3':'THEME C3 — JIM DANDY JUMP'};
  const THEME_SHORT = {'1':'A1','2':'B2','3':'C3'};

  function getLocalCounts(){
    try{
      const raw = MCD_safeStorage.get(VOTE_COUNTS_KEY, null);
      if(raw){ const o=JSON.parse(raw); if(o && o['1']!=null) return o; }
    }catch(e){}
    return {'1':3,'2':5,'3':2};
  }
  function saveLocalCounts(c){ try{ MCD_safeStorage.set(VOTE_COUNTS_KEY, JSON.stringify(c)); }catch(e){} }
  function getLastVote(){ try{ return MCD_safeStorage.get(VOTE_LAST_KEY, null); }catch(e){ return null; } }

  async function fetchRealCounts(){
    try{
      const res = await fetch(VOTE_API_URL, {method:'GET', cache:'no-store'});
      if(!res.ok) throw new Error('bad status '+res.status);
      const data = await res.json();
      const counts = data.counts || data;
      if(counts && counts['1']!=null){
        saveLocalCounts(counts);
        return counts;
      }
      return getLocalCounts();
    }catch(e){
      console.warn('vote api fetch failed, using local', e);
      return getLocalCounts();
    }
  }

  async function postRealVote(newVote){
    const last = getLastVote();
    const payload = {vote: newVote, previous: last || null, ts: Date.now()};
    try{
      const res = await fetch(VOTE_API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error('post failed '+res.status);
      const data = await res.json();
      const counts = data.counts || data;
      if(counts && counts['1']!=null) saveLocalCounts(counts);
      try{ MCD_safeStorage.set(VOTE_LAST_KEY, newVote); }catch(e){}
      return counts;
    }catch(e){
      console.warn('vote api post failed, fallback local', e);
      const counts = getLocalCounts();
      if(last && last!==newVote){
        counts[last] = Math.max(0, (counts[last]||0)-1);
        counts[newVote] = (counts[newVote]||0)+1;
      } else if(!last){
        counts[newVote] = (counts[newVote]||0)+1;
      }
      saveLocalCounts(counts);
      try{ MCD_safeStorage.set(VOTE_LAST_KEY, newVote); }catch(e){}
      return counts;
    }
  }

  let selectedVote = getLastVote();
  let currentCounts = getLocalCounts();
  let previousFocus = null;
  let voteOpenVersion = 0;
  let isChangingVote = false;

  

  function getFocusableElements(){
    const modalBox = voteModal.querySelector('.modal-box');
    if(!modalBox) return [];
    return window.MCD_dialogFocusables(modalBox);
  }

  function renderVoteResults(counts){
    counts = counts || currentCounts;
    currentCounts = counts;
    const total = (counts['1']||0)+(counts['2']||0)+(counts['3']||0);
    const last = getLastVote();
    const wText = document.getElementById('wurlitzerText');
    const oText = document.getElementById('oneVoteText');
    const vDesc = document.getElementById('voteDesc');
    const changeLink = document.getElementById('changeVoteLink');

    let pct = {'1':0,'2':0,'3':0};
    if(total>0){
      const raw = {};
      const floored = {};
      let sumFloored = 0;
      ['1','2','3'].forEach(k=>{
        const r = ((counts[k]||0)/total)*100;
        raw[k]=r;
        floored[k]=Math.floor(r);
        sumFloored+=floored[k];
      });
      let remainder = 100 - sumFloored;
      const sorted = ['1','2','3'].slice().sort((a,b)=>(raw[b]-floored[b])-(raw[a]-floored[a]));
      for(let i=0;i<remainder && i<sorted.length;i++){
        floored[sorted[i]]++;
      }
      pct = floored;
    }

    let max = -1;
    ['1','2','3'].forEach(k=>{
      const c = (counts[k]||0);
      if(c>max) max=c;
    });
    const leaders = max>0 ? ['1','2','3'].filter(k=>(counts[k]||0)===max) : [];
    const isTie = leaders.length>1;
    const leader = leaders[0] || '1';

    if(wText){
      if(total===0){
        wText.textContent = 'WURLITZER 3 SELECTOR';
      } else if(isTie){
        wText.textContent = `TIE: ${leaders.map(l=>THEME_SHORT[l]).join(' + ')} • ${max}`;
      } else {
        wText.textContent = `${THEME_SHORT[leader]} LEADS • ${max} VOTES`;
      }
      wText.title = wText.textContent;
    }
    if(oText){
      if(last){
        oText.textContent = `YOU VOTED ${THEME_SHORT[last]} ✓ • ${total} CATS`;
      } else {
        oText.textContent = total>0 ? `${total} CATS VOTED` : 'One vote per cat.';
      }
      oText.title = oText.textContent;
    }
    // V97 — Vote remembers: show VOTED state on outer card (localStorage, safe)
    try{
      const vc = document.getElementById('voteCard');
      if(vc){
        if(last){
          vc.classList.add('has-voted');
          vc.setAttribute('aria-label', `Voted ${THEME_SHORT[last]} — click to change vote`);
          const topLeft = vc.querySelector('.vote-top-left');
          if(topLeft) topLeft.innerHTML = '<span class="dot-teal"></span> YOU VOTED '+THEME_SHORT[last]+' ✓ • ON AIR MONDAY 21:00';
        } else {
          vc.classList.remove('has-voted');
          vc.setAttribute('aria-label', 'Open vote booth');
          const topLeft = vc.querySelector('.vote-top-left');
          if(topLeft) topLeft.innerHTML = '<span class="dot-teal"></span> CHOOSE THE RUMBLE • ON AIR MONDAY 21:00';
        }
      }
    }catch(e){}

    document.querySelectorAll('.mini-vinyl[data-v]').forEach(mv=>{
      const isLeader = leaders.includes(mv.dataset.v);
      mv.classList.toggle('leader', isLeader && total>0 && !isTie);
      mv.classList.toggle('tie', isLeader && isTie);
    });

    const showResults = !!last;
    document.querySelectorAll('.vote-option').forEach(opt=>{
      const v = opt.dataset.vote;
      const fill = opt.querySelector('.vote-progress-fill');
      const check = opt.querySelector('.vote-check');
      opt.style.background = '';
      opt.style.borderColor = '';
      const isSelected = v===selectedVote;
      opt.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      if(!opt.matches(':focus')){
        opt.tabIndex = isSelected ? 0 : -1;
      }
      const result = document.getElementById('vote-result-'+v);
      if(result) result.textContent = showResults ? pct[v]+' percent of votes' : '';
      if(showResults){
        opt.classList.add('has-results');
        opt.classList.remove('is-selected');
        if(fill) fill.style.width = pct[v]+'%';
        if(check){
          check.textContent = pct[v]+'%';
          check.classList.add('has-pct');
        }
        opt.classList.toggle('is-voted', isSelected);
        opt.classList.toggle('tie-leader', leaders.includes(v) && total>0);
      } else {
        opt.classList.remove('has-results','is-voted','tie-leader');
        opt.classList.toggle('is-selected', isSelected);
        if(fill) fill.style.width = '0%';
        if(check){
          check.textContent = isSelected ? '●' : '○';
          check.classList.remove('has-pct');
        }
      }
    });

    if(vDesc){
      if(last){
        if(isTie){
          vDesc.textContent = `Tie! ${leaders.map(l=>THEME_TITLES[l]).join(' + ')} both at ${max} votes. Your vote: ${THEME_TITLES[last]}. Change until Fri 18:00.`;
        } else {
          vDesc.textContent = `You voted ${THEME_TITLES[last]}. Live tally: ${total} cats — leader ${THEME_SHORT[leader]}. You can change until Fri 18:00.`;
        }
      } else {
        vDesc.textContent = `You pick Monday's theme. Most votes takes the title for Monday 21:00. One vote per cat, ends Fri 18:00 EEST — no bots, just wax.`;
      }
    }
    if(openBooth){
      if(last && !isChangingVote){
        openBooth.textContent = `THANKS • ${THEME_SHORT[last] || last}`;
        openBooth.classList.add('thanks-pill');
        openBooth.classList.remove('primary','is-loading');
        openBooth.disabled = true;
        openBooth.setAttribute('aria-label', `Thanks, you voted ${THEME_TITLES[last] || last}`);
        if(changeLink){
          changeLink.hidden = false;
          changeLink.style.display = 'inline-block';
        }
      } else {
        openBooth.textContent = 'VOTE';
        openBooth.classList.remove('thanks-pill');
        openBooth.classList.add('primary');
        openBooth.disabled = false;
        openBooth.removeAttribute('aria-label');
        if(changeLink && !isChangingVote){
          changeLink.hidden = true;
          changeLink.style.display = 'none';
        }
      }
    }
  }

  async function openVote(){
    if(voteModal.classList.contains('open')) return;
    const version = ++voteOpenVersion;
    previousFocus = document.activeElement;
    voteModal.classList.add('open');
    voteModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    renderVoteResults(currentCounts);
    const options = Array.from(voteModal.querySelectorAll('.vote-option'));
    const sel = options.find(opt=>opt.getAttribute('aria-checked')==='true') || options[0];
    options.forEach(opt=>opt.tabIndex = opt===sel ? 0 : -1);
    if(sel) sel.focus({preventScroll:true});
    window.MCD_modalBackground(true);
    let counts;
    try{ counts = await fetchRealCounts(); }catch(e){ counts = getLocalCounts(); }
    if(version !== voteOpenVersion || !voteModal.classList.contains('open')) return;
    renderVoteResults(counts);
  }
  function closeVote(){
    if(!voteModal.classList.contains('open')) return;
    ++voteOpenVersion;
    voteModal.classList.remove('open');
    voteModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    isChangingVote = false;
    window.MCD_modalBackground(false);
    if(previousFocus && document.contains(previousFocus)) previousFocus.focus({preventScroll:true});
    else if(voteCard) voteCard.focus({preventScroll:true});
    previousFocus = null;
  }

  const voteOptionsContainer = document.getElementById('voteOptions') || document.querySelector('.vote-options');
  function handleVoteSelection(opt){
    if(!opt) return;
    selectedVote = opt.dataset.vote;
    renderVoteResults(currentCounts);
    if(voteOptionsContainer){
      voteOptionsContainer.querySelectorAll('.vote-option').forEach(o=>o.tabIndex = -1);
      opt.tabIndex = 0;
      opt.focus();
    }
  }
  if(voteOptionsContainer){
    voteOptionsContainer.addEventListener('click', (e)=>{
      const opt = e.target.closest('.vote-option');
      if(!opt) return;
      handleVoteSelection(opt);
    });
    voteOptionsContainer.addEventListener('keydown', (e)=>{
      const options = Array.from(voteOptionsContainer.querySelectorAll('.vote-option'));
      const currentIdx = options.findIndex(o=>o===document.activeElement);
      let nextIdx = -1;
      if(e.key==='ArrowDown' || e.key==='ArrowRight'){
        e.preventDefault();
        nextIdx = (currentIdx+1+options.length) % options.length;
      } else if(e.key==='ArrowUp' || e.key==='ArrowLeft'){
        e.preventDefault();
        nextIdx = (currentIdx-1+options.length) % options.length;
      } else if(e.key==='Home'){
        e.preventDefault();
        nextIdx = 0;
      } else if(e.key==='End'){
        e.preventDefault();
        nextIdx = options.length-1;
      } else if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        if(document.activeElement && document.activeElement.classList.contains('vote-option')){
          handleVoteSelection(document.activeElement);
        }
        return;
      }
      if(nextIdx>=0){
        handleVoteSelection(options[nextIdx]);
      }
    });
  }

  voteCard.addEventListener('click', openVote);

  // closeModal guard removed — dead
  const modalCloseX = document.getElementById('modalCloseX');
  if(modalCloseX){ modalCloseX.addEventListener('click', closeVote); }
  const changeVoteLink = document.getElementById('changeVoteLink');
  if(changeVoteLink){
    changeVoteLink.addEventListener('click', ()=>{
      isChangingVote = true;
      selectedVote = getLastVote();
      renderVoteResults(currentCounts);
      // switch to VOTE state
      if(openBooth){
        openBooth.textContent = 'VOTE';
        openBooth.classList.remove('thanks-pill');
        openBooth.classList.add('primary');
        openBooth.disabled = false;
      }
      changeVoteLink.hidden = true;
      changeVoteLink.style.display = 'none';
      const firstOpt = voteOptionsContainer ? voteOptionsContainer.querySelector('.vote-option') : null;
      if(firstOpt) firstOpt.focus();
    });
  }

  function handleModalKeydown(e){
    if(!voteModal.classList.contains('open')) return;
    if(e.key==='Escape'){
      e.preventDefault();
      closeVote();
      return;
    }
    if(e.key==='Tab'){
      const focusable = getFocusableElements();
      if(focusable.length===0) return;
      const first = focusable[0];
      const last = focusable[focusable.length-1];
      if(e.shiftKey){
        if(document.activeElement===first || !voteModal.contains(document.activeElement)){
          e.preventDefault();
          last.focus();
        }
      } else {
        if(document.activeElement===last || !voteModal.contains(document.activeElement)){
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
  document.addEventListener('keydown', handleModalKeydown);

  function setBoothLoading(isLoading){
    if(!openBooth) return;
    if(openBooth.classList.contains('thanks-pill')) return;
    openBooth.disabled = isLoading;
    openBooth.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    if(isLoading){
      openBooth.dataset.prevText = openBooth.textContent;
      openBooth.textContent = '...';
      openBooth.classList.add('is-loading');
    } else {
      openBooth.classList.remove('is-loading');
      if(openBooth.dataset.prevText && openBooth.textContent==='...'){
        openBooth.textContent = openBooth.dataset.prevText;
      }
      delete openBooth.dataset.prevText;
    }
  }

  openBooth.addEventListener('click', async ()=>{
    if(openBooth.classList.contains('thanks-pill')) return;
    if(!selectedVote){
      toast('PICK A THEME — A1, B2 OR C3');
      const firstOpt = voteOptionsContainer ? voteOptionsContainer.querySelector('.vote-option') : null;
      if(firstOpt) firstOpt.focus();
      return;
    }
    setBoothLoading(true);
    try{
      const newCounts = await postRealVote(selectedVote);
      openBooth.classList.remove('is-loading','primary');
      openBooth.classList.add('thanks-pill');
      openBooth.textContent = `THANKS • ${THEME_SHORT[selectedVote] || selectedVote}`;
      openBooth.disabled = true;
      isChangingVote = false;
      toast('VOTE LOCKED: ' + (THEME_TITLES[selectedVote] || selectedVote) + ' — MONDAY 21:00');
      renderVoteResults(newCounts);
      setTimeout(()=>{ closeVote(); }, 1100);
    }catch(e){
      toast('VOTE FAILED — TRY AGAIN');
      console.warn('vote failed', e);
    }finally{
      setBoothLoading(false);
      if(voteModal.classList.contains('open') && !openBooth.classList.contains('thanks-pill')){
        renderVoteResults(currentCounts);
      }
    }
  });

  voteModal.addEventListener('click', (e)=>{ if(e.target===voteModal) closeVote(); });

  if(pinnedNote){ pinnedNote.addEventListener('click', ()=> toast('DEN ANNOUNCEMENT — LIVE WIRES COMING 2027')); }

  fetchRealCounts().then(c=>{ currentCounts=c; renderVoteResults(c); }).catch(()=>renderVoteResults(getLocalCounts()));
})();

/* ==========================================

   5. WURLITZER VOTING SYSTEM (inside same IIFE above, section for readability)

   ========================================== */

// Note: Voting logic lives inside the Shout Wall IIFE above to share $ and DOM refs.

// API: /api/votes — Cloudflare KV, localStorage fallback, percent bars

// Theme titles A1 B2 C3 preserved

/* ==========================================

   6. VISITOR COUNTER — live now + all time

   ========================================== */

// === VISITORS COUNTER - live now + all time - FINAL BUILD ===
(function(){
  const BADGE_ID = 'cats-badge';
  const API_URL = '/api/visitors';
  const CLIENT_KEY = 'mcd-client-id';
  const VISITED_KEY = 'mcd-visited-ever';
  function getClientId(){
    try{
      let id = MCD_safeStorage.get(CLIENT_KEY, null);
      if(!id){
        id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'mcd-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        try{ MCD_safeStorage.set(CLIENT_KEY, id); }catch(e){}
      }
      return id;
    }catch(e){ return 'mcd-' + Math.random().toString(36).slice(2); }
  }
  function isNewVisitor(){
    try{
      const v = MCD_safeStorage.get(VISITED_KEY, null);
      if(v) return false;
      return true;
    }catch(e){ return false; }
  }
  function markVisited(){
    try{
      MCD_safeStorage.set(VISITED_KEY, '1');
    }catch(e){}
  }
  function updateBadge(total, now){
    const badge = document.getElementById(BADGE_ID);
    if(!badge) return;
    const numEl = badge.querySelector('.num');
    if(numEl){
      const prev = numEl.textContent;
      if(prev !== String(now)){
        numEl.textContent = String(now);
        numEl.classList.remove('pop');
        void numEl.offsetWidth;
        numEl.classList.add('pop');
        setTimeout(()=>numEl.classList.remove('pop'), 450);
      } else {
        numEl.textContent = String(now);
      }
    }
    const tooltip = total + ' cats prowled the den - ' + now + ' browsing now';
    badge.setAttribute('data-tooltip', tooltip);
    badge.setAttribute('aria-label', tooltip);
    badge.title = tooltip;
  }
  async function postVisit(isNew){
    const clientId = getClientId();
    try{
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({clientId, isNewVisitor: isNew}),
        cache: 'no-store'
      });
      if(!res.ok) throw new Error('bad status');
      const data = await res.json();
      if(data && data.total != null && data.now != null){
        updateBadge(data.total, data.now);
        if(isNew) markVisited();
        return data;
      }
    }catch(e){ console.warn('visitors api failed', e); }
    return null;
  }
  async function heartbeat(){
    const clientId = getClientId();
    try{
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({clientId, isNewVisitor: false}),
        cache: 'no-store'
      });
      if(!res.ok) return;
      const data = await res.json();
      if(data && data.total != null) updateBadge(data.total, data.now);
    }catch(e){}
  }
  const newVisit = isNewVisitor();
  postVisit(newVisit);
  setInterval(heartbeat, 30000);
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible') heartbeat();
  });
})();

