/* =========================================
   MAD CATS DEN - PLAYER & INTERACTION SCRIPT V11
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. AJAX FORM SUBMISSION
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

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: searchParams.toString()
      })
      .then((response) => {
        if (response.ok) {
          submitBtn.textContent = '✦ DELIVERED ✦';
          contactForm.reset();
        } else {
          submitBtn.textContent = 'ERROR - TRY AGAIN';
        }
        setTimeout(() => { submitBtn.textContent = originalText; }, 4000);
      })
      .catch((error) => {
        submitBtn.textContent = 'ERROR - TRY AGAIN';
        setTimeout(() => { submitBtn.textContent = originalText; }, 4000);
      });
    });
  }

  // 2. MIXCLOUD PLAYER (API, Ignition & Tape Memory)
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const beautyClose = document.getElementById('mcd-beauty-close');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  
  let isPlaying = false;
  let widget = null;
  let hasResumed = false;

  if (iframe && window.Mixcloud) {
    widget = Mixcloud.PlayerWidget(iframe);
    
    // Track play state in background so we don't break the user interaction thread
    widget.ready.then(() => {
      setInterval(() => {
        if (isPlaying && widget) {
          widget.getPosition().then((pos) => {
            if (pos > 0) localStorage.setItem('mcd_tape_position', pos);
          });
        }
      }, 5000);
    });
  }

  if (fireBtn && beautyPlayer && widget) {
    // Crucial fix: removed 'async' here so widget.play() executes directly from the click event
    fireBtn.addEventListener('click', () => {
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

        // Play synchronously on click to bypass strict autoplay blocking
        widget.play().then(() => {
          if (!hasResumed) {
            const savedPos = localStorage.getItem('mcd_tape_position');
            if (savedPos && parseFloat(savedPos) > 3) {
              setTimeout(() => {
                widget.seek(parseFloat(savedPos));
              }, 600);
            }
            hasResumed = true;
          }
        }).catch(e => console.log('Browser blocked direct API play', e));
        
      } else {
        isPlaying = false;
        fireBtn.classList.remove('is-playing');
        fireBtn.textContent = '▶ FIRE IT UP';
        beautyPlayer.classList.remove('is-playing');
        if (heroSection) heroSection.classList.remove('is-playing');
        document.body.classList.remove('is-playing');

        widget.pause();
      }
    });
  }

  if (beautyClose && beautyPlayer && widget) {
    beautyClose.addEventListener('click', () => {
      beautyPlayer.classList.remove('show');
      isPlaying = false;
      if (fireBtn) {
        fireBtn.classList.remove('is-playing');
        fireBtn.textContent = '▶ FIRE IT UP';
      }
      if (heroSection) heroSection.classList.remove('is-playing');
      document.body.classList.remove('is-playing');
      
      widget.pause();
    });
  }

  // 3. DRAGGABLE TAPE DECK LOGIC (Desktop only)
  const dragHandle = beautyPlayer ? beautyPlayer.querySelector('.head') : null;
  let isDragging = false;
  let startX, startY, initialX, initialY;
  const isMobile = () => window.innerWidth <= 768;

  if (dragHandle && beautyPlayer) {
    dragHandle.addEventListener('pointerdown', (e) => {
      if (isMobile()) return;
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
      try { dragHandle.releasePointerCapture(e.pointerId); } catch (err) {}
    });
  }
});
