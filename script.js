/* =========================================
   MAD CATS DEN - PLAYER & INTERACTION SCRIPT
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const beautyClose = document.getElementById('mcd-beauty-close');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  
  let widget = null;
  let isPlaying = false;

  // Initialize Mixcloud Widget API
  function initWidget() {
    if (!widget && window.Mixcloud && iframe) {
      try {
        widget = Mixcloud.PlayerWidget(iframe);
      } catch (e) {
        console.log('Widget init note:', e);
      }
    }
  }

  // Try initial bind
  initWidget();

  // Toggle or Fire Up Player with Instant Play Trigger
  if (fireBtn && beautyPlayer) {
    fireBtn.addEventListener('click', () => {
      // 1. Show player immediately
      const isHidden = !beautyPlayer.classList.contains('show');
      if (isHidden) {
        beautyPlayer.classList.add('show');
      }

      // Ensure widget is initialized now that the element is visible
      initWidget();

      // UI State update
      if (!isPlaying) {
        isPlaying = true;
        fireBtn.classList.add('is-playing');
        fireBtn.textContent = '⏸ PLAYING';
        beautyPlayer.classList.add('is-playing');
        if (heroSection) heroSection.classList.add('is-playing');
        document.body.classList.add('is-playing');

        // Send play command to widget (with a small safety timeout for iframe rendering)
        setTimeout(() => {
          if (widget) {
            try {
              widget.play();
            } catch (err) {
              console.log('Widget play trigger note:', err);
            }
          }
        }, 150);

      } else {
        isPlaying = false;
        fireBtn.classList.remove('is-playing');
        fireBtn.textContent = '▶ FIRE IT UP';
        beautyPlayer.classList.remove('is-playing');
        if (heroSection) heroSection.classList.remove('is-playing');
        document.body.classList.remove('is-playing');

        if (widget) {
          try {
            widget.pause();
          } catch (err) {}
        }
      }
    });
  }

  // Close Beauty Player
  if (beautyClose && beautyPlayer) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show');
      if (widget) {
        try { widget.pause(); } catch (e) {}
      }
      isPlaying = false;
      if (fireBtn) {
        fireBtn.classList.remove('is-playing');
        fireBtn.textContent = '▶ FIRE IT UP';
      }
      if (heroSection) heroSection.classList.remove('is-playing');
      document.body.classList.remove('is-playing');
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