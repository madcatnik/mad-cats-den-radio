
(function(){
  const headerBtn=document.getElementById('mcd-h-fire');
  const beautyPlayer=document.getElementById('mcd-beauty-player');
  const closeBtn=document.getElementById('mcd-beauty-close');
  const mixcloud=document.getElementById('mcd-mixcloud');
  const hero=document.getElementById('mcd-hero');
  const header=document.getElementById('mcd-header-player');
  const toast=document.getElementById('mcd-toast');
  let isPlaying=false;
  let playRetry=null;
  let toastTimer=null;

  function sendCmd(method){
    try{
      if(mixcloud && mixcloud.contentWindow){
        mixcloud.contentWindow.postMessage(JSON.stringify({method:method}), '*');
      }
    }catch(e){ /* ignore */ }
  }
  function showToast(msg){
    if(!toast) return;
    toast.textContent=msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);
  }
  function setPlaying(state, opts){
    const o=opts||{};
    const fromWidget=!!o.fromWidget;
    const toastMsg=o.toastMsg||null;
    clearTimeout(playRetry);
    if(isPlaying===state && !fromWidget) return; // avoid double toggle
    isPlaying=state;
    if(state){
      headerBtn.classList.add('is-playing');
      headerBtn.textContent='💀 KEEP IT WILD';
      header.classList.add('is-playing');
      if(hero) hero.classList.add('is-playing');
      beautyPlayer.classList.add('show');
      if(!fromWidget){
        // MUST stay in user-gesture tick to avoid autoplay block
        sendCmd('play');
        // retry once if iframe not ready yet
        playRetry=setTimeout(()=>sendCmd('play'), 350);
      }
    }else{
      headerBtn.classList.remove('is-playing');
      headerBtn.textContent='▶ FIRE IT UP';
      header.classList.remove('is-playing');
      if(hero) hero.classList.remove('is-playing');
      beautyPlayer.classList.remove('show');
      if(!fromWidget){
        sendCmd('pause');
      }
      if(toastMsg) showToast(toastMsg);
    }
  }

  headerBtn.addEventListener('click', function(e){
    e.preventDefault();
    setPlaying(!isPlaying);
  });
  closeBtn.addEventListener('click', function(){
    setPlaying(false, {toastMsg:'SIGNAL PAUSED • KEEP IT WILD'});
  });

  // SYNC: if user hits play/pause INSIDE Mixcloud widget, update header+hero
  window.addEventListener('message', function(ev){
    try{
      if(!ev.data || typeof ev.data!=='string') return;
      // Mixcloud posts from https://player-widget.mixcloud.com
      if(ev.origin && ev.origin.indexOf('mixcloud.com')===-1) return;
      const data=JSON.parse(ev.data);
      if(!data || !data.method) return;
      if(data.method==='play'){
        setPlaying(true, {fromWidget:true});
      }else if(data.method==='pause' || data.method==='ended' || data.method==='stop'){
        setPlaying(false, {fromWidget:true, toastMsg: data.method==='ended' ? 'SHOW ENDED • KEEP IT WILD' : null});
      }
    }catch(err){}
  });

  // ESC to close
  document.addEventListener('keydown', function(ev){
    if(ev.key==='Escape' && isPlaying){
      setPlaying(false, {toastMsg:'SIGNAL PAUSED'});
    }
  });

  // Expose for debug
  window.mcdPlayer={setPlaying, get isPlaying(){return isPlaying}};
})();



(function(){
  const player=document.getElementById('mcd-beauty-player');
  if(!player) return;
  const head=player.querySelector('.head');
  if(!head) return;
  let isDragging=false;
  let startX=0,startY=0,origLeft=0,origTop=0;

  head.addEventListener('pointerdown', function(e){
    if(e.target.closest('#mcd-beauty-close')) return;
    // only left click / primary touch
    if(e.button!==undefined && e.button!==0) return;
    isDragging=true;
    const rect=player.getBoundingClientRect();
    // Convert from bottom/right to left/top on first drag so we can move freely
    if(!player.style.left){
      player.style.left=rect.left+'px';
      player.style.top=rect.top+'px';
      player.style.right='auto';
      player.style.bottom='auto';
    }
    startX=e.clientX;
    startY=e.clientY;
    origLeft=parseFloat(player.style.left)||rect.left;
    origTop=parseFloat(player.style.top)||rect.top;
    player.classList.add('is-dragging');
    try{ head.setPointerCapture(e.pointerId); }catch{}
    e.preventDefault();
  });

  window.addEventListener('pointermove', function(e){
    if(!isDragging) return;
    const dx=e.clientX-startX;
    const dy=e.clientY-startY;
    let newLeft=origLeft+dx;
    let newTop=origTop+dy;
    const r=player.getBoundingClientRect();
    const maxLeft=window.innerWidth - r.width - 8;
    const maxTop=window.innerHeight - r.height - 8;
    newLeft=Math.max(8, Math.min(newLeft, maxLeft));
    newTop=Math.max(8, Math.min(newTop, maxTop));
    player.style.left=newLeft+'px';
    player.style.top=newTop+'px';
  });

  function stopDrag(e){
    if(!isDragging) return;
    isDragging=false;
    player.classList.remove('is-dragging');
    try{ head.releasePointerCapture(e.pointerId); }catch{}
  }
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);

  // Keep inside viewport on resize
  window.addEventListener('resize', function(){
    if(!player.classList.contains('show')) return;
    const r=player.getBoundingClientRect();
    let left=parseFloat(player.style.left)||r.left;
    let top=parseFloat(player.style.top)||r.top;
    const maxLeft=window.innerWidth - r.width - 8;
    const maxTop=window.innerHeight - r.height - 8;
    left=Math.max(8, Math.min(left, maxLeft));
    top=Math.max(8, Math.min(top, maxTop));
    player.style.left=left+'px';
    player.style.top=top+'px';
  });

  // Double-click header to snap back to default corner
  head.addEventListener('dblclick', function(){
    player.style.left='';
    player.style.top='';
    player.style.right='16px';
    player.style.bottom='16px';
  });
})();
