/* =========================================
   MAD CATS DEN - PLAYER & INTERACTION SCRIPT
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const beautyClose = document.getElementById('mcd-beauty-close');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  
  let isPlaying = false;
  const baseFeedUrl = "https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=%2Fmadcatnik%2F29-05-25-oinoxoos-rnr-thursday-dedicated-kostas-geros%2F";

  if (fireBtn && beautyPlayer && iframe) {
    fireBtn.addEventListener('click', () => {
      // Make sure popup is visible
      if (!beautyPlayer.classList.contains('show')) {
        beautyPlayer.classList.add('show');
      }

      if (!isPlaying) {
        isPlaying = true;
        fireBtn.classList.add('is-playing');
        fireBtn.textContent = '💀 KEEP IT WILD'; 
        beautyPlayer.classList.add('is-playing');
        if (heroSection) heroSection.classList.add('is-playing');
        document.body.classList.add('is-playing');

        // Force autoplay via iframe URL swap
        if (!iframe.src.includes('autoplay=1')) {
          iframe.src = baseFeedUrl + "&autoplay=1";
        }
      } else {
        isPlaying = false;
        fireBtn.classList.remove('is-playing');
        fireBtn.textContent = '▶ FIRE IT UP';
        beautyPlayer.classList.remove('is-playing');
        if (heroSection) heroSection.classList.remove('is-playing');
        document.body.classList.remove('is-playing');

        // Stop playback by resetting iframe
        iframe.src = baseFeedUrl;
      }
    });
  }

  // Close Beauty Player
  if (beautyClose && beautyPlayer) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show');
      isPlaying = false;
      if (fireBtn) {
        fireBtn.classList.remove('is-playing');
        fireBtn.textContent = '▶ FIRE IT UP';
      }
      if (heroSection) heroSection.classList.remove('is-playing');
      document.body.classList.remove('is-playing');
      if (iframe) {
        iframe.src = baseFeedUrl; 
      }
    });
  }

  // --- DRAGGABLE PLAYER LOGIC ---
  const dragHandle = beautyPlayer ? beautyPlayer.querySelector('.head') : null;
  let isDragging = false;
  let startX, startY, initialX, initialY;

  if (dragHandle && beautyPlayer) {
    dragHandle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#mcd-beauty-close')) return;
      isDragging = true;
      beautyPlayer.classList.add('is-dragging');
      startX = e.clientX;
      startY = e.clientY;
      const rect = beautyPlayer.getBoundingClientRect();
      beautyPlayer.style.bottom = 'auto';
      beautyPlayer.style.right = 'auto';
      beautyPlayer.style.top = rect.top + 'px';
      beautyPlayer.style.left = rect.left + 'px';
      initialX = rect.left;
      initialY = rect.top;
      dragHandle.setPointerCapture(e.pointerId);
    });

    dragHandle.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      beautyPlayer.style.top = (initialY + dy) + 'px';
      beautyPlayer.style.left = (initialX + dx) + 'px';
    });

    dragHandle.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      beautyPlayer.classList.remove('is-dragging');
      try {
        dragHandle.releasePointerCapture(e.pointerId);
      } catch (err) {}
    });
  }
});
