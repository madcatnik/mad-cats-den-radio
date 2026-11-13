/* =========================================
   MAD CATS DEN - PLAYER & INTERACTION SCRIPT V11 - AUTOPLAY FIX + NOW SPINNING
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  
  // 0. NOW SPINNING - edit this one line when you upload new mix
  const NOW_SPINNING = "29-05-25 OINOXOOS RNR THURSDAY DEDICATED KOSTAS GEROS — 60 MIN REAL GONE ROCK & ROLL";

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

  // 2. MIXCLOUD PLAYER (API, Ignition & Tape Memory) - FIXED AUTOPLAY
  const fireBtn = document.getElementById('mcd-h-fire');
  const beautyPlayer = document.getElementById('mcd-beauty-player');
  const beautyClose = document.getElementById('mcd-beauty-close');
  const heroSection = document.getElementById('mcd-hero');
  const iframe = document.getElementById('mcd-mixcloud');
  const nowSpinningEl = document.getElementById('mcd-now-spinning-text');
  
  let isPlaying = false;
  let widget = null;
  let hasResumed = false;

  // Set ticker text immediately
  if (nowSpinningEl) {
    nowSpinningEl.textContent = `✦ NOW SPINNING: ${NOW_SPINNING} ✦ ${NOW_SPINNING} ✦`;
  }

  if (iframe && window.Mixcloud) {
    widget = Mixcloud.PlayerWidget(iframe);
    
    setInterval(() => {
      if (isPlaying && widget) {
        widget.getPosition().then((pos) => {
          if (pos > 0) localStorage.setItem('mcd_tape_position', pos);
        }).catch(()=>{});
      }
    }, 5000);
  }

  if (fireBtn && beautyPlayer && widget) {
    fireBtn.addEventListener('click', () => {
      if (!beautyPlayer.classList.contains('show')) {
        beautyPlayer.classList.add('show');
      }

      if (!isPlaying) {
        // FIX: Immediate play to keep user gesture - before ready
        try { widget.play(); } catch(e){}

        widget.ready.then(() => {
          widget.play().then(() => {
            isPlaying = true;
            fireBtn.classList.add('is-playing');
            fireBtn.textContent = '💀 KEEP IT WILD'; 
            beautyPlayer.classList.add('is-playing');
            if (heroSection) heroSection.classList.add('is-playing');
            document.body.classList.add('is-playing');

            if (!hasResumed) {
              const savedPos = localStorage.getItem('mcd_tape_position');
              if (savedPos && parseFloat(savedPos) > 3) {
                setTimeout(() => {
                  widget.seek(parseFloat(savedPos));
                }, 600);
              }
              hasResumed = true;
            }
          }).catch(e => {
            console.log('Autoplay blocked, will need second tap', e);
            isPlaying = false;
          });
        });

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
  const isMobile = () => window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;

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
