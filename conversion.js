/**
 * Conversion optimization scripts
 * - Social proof notifications
 * - Sticky booking bar
 * - Urgency timers
 * - Scroll animations
 */

(function() {
  'use strict';

  // ==================================
  // SOCIAL PROOF NOTIFICATIONS
  // ==================================
  
  const socialProofMessages = [
    { name: 'Maria & Thomas', action: 'bookede ophold i maj', time: 'I dag', avatar: 1 },
    { name: 'Lars fra Aarhus', action: 'forespurgte ledighed', time: 'I går', avatar: 5 },
    { name: 'Emma fra Stockholm', action: 'bookede weekend-ophold', time: 'Denne uge', avatar: 9 }
  ];

  let socialProofIndex = 0;
  let socialProofTimeout;

  function showSocialProof() {
    // Don't show if user has scrolled less than 30%
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    if (scrollPercentage < 30) return;

    const message = socialProofMessages[socialProofIndex];
    
    const proofBar = document.createElement('div');
    proofBar.className = 'social-proof-bar';
    proofBar.innerHTML = `
      <img src="https://i.pravatar.cc/150?img=${message.avatar}" alt="${message.name}" class="avatar" />
      <div class="social-proof-text">
        <strong>${message.name}</strong> ${message.action} <span style="color: var(--muted);">${message.time}</span>
      </div>
      <button class="social-proof-close" aria-label="Luk notifikation">×</button>
    `;

    document.body.appendChild(proofBar);

    // Close button
    const closeBtn = proofBar.querySelector('.social-proof-close');
    closeBtn.addEventListener('click', () => {
      proofBar.style.animation = 'slideDownFade 0.3s ease-out';
      setTimeout(() => proofBar.remove(), 300);
    });

    // Auto remove after 6 seconds
    setTimeout(() => {
      if (proofBar.parentNode) {
        proofBar.style.animation = 'slideDownFade 0.3s ease-out';
        setTimeout(() => proofBar.remove(), 300);
      }
    }, 6000);

    // Next message
    socialProofIndex = (socialProofIndex + 1) % socialProofMessages.length;

    // Schedule next notification (random between 45-90 seconds)
    const nextDelay = 45000 + Math.random() * 45000;
    socialProofTimeout = setTimeout(showSocialProof, nextDelay);
  }

  // Start social proof after 30 seconds (less aggressive)
  setTimeout(() => {
    showSocialProof();
  }, 30000);

  // ==================================
  // STICKY BOOKING BAR (Mobile/Scroll)
  // ==================================

  function initStickyBookingBar() {
    const stickyBar = document.createElement('div');
    stickyBar.className = 'sticky-booking-bar';
    stickyBar.innerHTML = `
      <div class="sticky-booking-content">
        <div class="sticky-booking-info">
          <div class="sticky-booking-price">Fra 950 DKK/nat</div>
          <div class="sticky-booking-note">Farm hospitality ved kysten</div>
        </div>
        <button class="btn-primary js-open-booking" type="button">
          Forespørg ophold
        </button>
      </div>
    `;

    document.body.appendChild(stickyBar);

    // Show/hide based on scroll
    let lastScroll = 0;
    let ticking = false;

    function updateStickyBar() {
      const scrollY = window.scrollY;
      const scrollPercentage = (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      // Show after scrolling 40%, hide when at top or bottom
      if (scrollPercentage > 40 && scrollPercentage < 95) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateStickyBar);
        ticking = true;
      }
    });

    // Ensure booking modal opens when clicked
    const stickyBookingBtn = stickyBar.querySelector('.js-open-booking');
    if (stickyBookingBtn) {
      stickyBookingBtn.addEventListener('click', () => {
        const modalBackdrop = document.getElementById('booking-modal');
        if (modalBackdrop) {
          modalBackdrop.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickyBookingBar);
  } else {
    initStickyBookingBar();
  }

  // ==================================
  // SCROLL ANIMATIONS
  // ==================================

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements on page load
  function observeElements() {
    const elementsToAnimate = document.querySelectorAll('.room-card, .testimonial-card, .seasonal-card, .preview-layout');
    elementsToAnimate.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeElements);
  } else {
    observeElements();
  }

  // ==================================
  // URGENCY COUNTDOWN (Optional)
  // ==================================

  function initUrgencyCountdown() {
    const urgencyElements = document.querySelectorAll('[data-countdown]');
    
    urgencyElements.forEach(element => {
      const targetMinutes = parseInt(element.dataset.countdown) || 30;
      const endTime = Date.now() + (targetMinutes * 60 * 1000);

      function updateCountdown() {
        const remaining = endTime - Date.now();
        
        if (remaining <= 0) {
          element.textContent = 'Tilbud udløbet';
          return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} tilbage`;
        
        requestAnimationFrame(updateCountdown);
      }

      updateCountdown();
    });
  }

  // ==================================
  // ENHANCED ROOM CARDS
  // ==================================

  function enhanceRoomCards() {
    const roomCards = document.querySelectorAll('.room-card');
    
    roomCards.forEach(card => {
      // Add hover effect tracking
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });

      // Add click tracking for analytics (if needed)
      card.addEventListener('click', (e) => {
        // Track room card clicks
        const roomName = card.querySelector('.room-title')?.textContent || 'Unknown';
        console.log('Room card clicked:', roomName);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceRoomCards);
  } else {
    enhanceRoomCards();
  }

  // ==================================
  // CLEANUP
  // ==================================

  window.addEventListener('beforeunload', () => {
    if (socialProofTimeout) {
      clearTimeout(socialProofTimeout);
    }
  });

  // Add slideDownFade animation for social proof close
  if (!document.querySelector('#social-proof-animations')) {
    const style = document.createElement('style');
    style.id = 'social-proof-animations';
    style.textContent = `
      @keyframes slideDownFade {
        from {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        to {
          opacity: 0;
          transform: translate(-50%, 20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

})();

