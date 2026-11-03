document.addEventListener('DOMContentLoaded', () => {
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const closePlayerBtn = document.getElementById('mcd-beauty-close');
  const iframe = document.getElementById('mcd-mixcloud');
  const headerPlayer = document.getElementById('mcd-header-player');
  const heroSection = document.getElementById('mcd-hero');

  let isPlaying = false;
  let isWidgetReady = false;
  let pendingPlay = false;

  const widget = Mixcloud.PlayerWidget(iframe);

  function updateUI(playing) {
    if (playing) {
      fireBtn.innerHTML = '💀 KEEP IT WILD';
      fireBtn.classList.add('is-playing');
      headerPlayer.classList.add('is-playing');
      heroSection.classList.add('is-playing');
      beautyPlayer.classList.add('show');
    } else {
      fireBtn.innerHTML = '▶ FIRE IT UP';
      fireBtn.classList.remove('is-playing');
      headerPlayer.classList.remove('is-playing');
      heroSection.classList.remove('is-playing');
    }
  }

  widget.ready.then(() => {
    isWidgetReady = true;
    if (pendingPlay) {
      pendingPlay = false;
      widget.play().catch(e => console.log("Queued play error:", e));
    }
    widget.events.play.on(() => { isPlaying = true; updateUI(true); });
    widget.events.pause.on(() => { isPlaying = false; updateUI(false); });
    widget.events.ended.on(() => { isPlaying = false; updateUI(false); beautyPlayer.classList.remove('show'); });
  });

  // FIRE - no setTimeout, keep user gesture
  fireBtn.addEventListener('click', () => {
    if (isPlaying) {
      pendingPlay = false;
      widget.pause();
      isPlaying = false;
      updateUI(false);
    } else {
      beautyPlayer.classList.add('show');
      isPlaying = true;
      updateUI(true);
      if (isWidgetReady) {
        widget.play().catch(err => console.log("Play blocked:", err));
      } else {
        pendingPlay = true;
        try { widget.play().catch(()=>{}); } catch(e){}
      }
    }
  });

  closePlayerBtn.addEventListener('click', () => {
    pendingPlay = false;
    widget.pause();
    isPlaying = false;
    updateUI(false);
    beautyPlayer.classList.remove('show');
  });
});
