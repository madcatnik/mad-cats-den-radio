document.addEventListener('DOMContentLoaded', () => {
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const closePlayerBtn = document.getElementById('mcd-beauty-close');
  const iframe = document.getElementById('mcd-mixcloud');
  const headerPlayer = document.getElementById('mcd-header-player');
  const heroSection = document.getElementById('mcd-hero');

  let isPlaying = false;
  
  // 1. Connect to Mixcloud
  const widget = Mixcloud.PlayerWidget(iframe);

  // 2. Main UI Update Function
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

  // 3. Wait for Mixcloud to officially wake up and say "Ready"
  widget.ready.then(() => {
    
    // Listen for manual play/pause clicks inside the widget itself
    widget.events.play.on(() => {
      isPlaying = true;
      updateUI(true);
    });
    
    widget.events.pause.on(() => {
      isPlaying = false;
      updateUI(false);
    });
    
    widget.events.ended.on(() => {
      isPlaying = false;
      updateUI(false);
    });

  });

  // 4. Handle clicks on our custom FIRE IT UP button
  fireBtn.addEventListener('click', () => {
    if (isPlaying) {
      widget.pause();
      isPlaying = false;
      updateUI(false);
    } else {
      // Show the player instantly
      beautyPlayer.classList.add('show');
      isPlaying = true;
      updateUI(true);
      
      // Give the hidden iframe a split-second to wake up and render 
      // before sending the command, otherwise it misses it.
      setTimeout(() => {
        widget.play().catch(err => console.log("Mixcloud still waking up:", err));
      }, 150); 
    }
  });

  // 5. Handle clicks on the X close button
  closePlayerBtn.addEventListener('click', () => {
    widget.pause();
    isPlaying = false;
    updateUI(false);
    beautyPlayer.classList.remove('show');
  });
});