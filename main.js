/**
 * ØLIV Website - Main JavaScript
 * Handles navigation, booking modal, form submission, and interactions
 */

(function() {
  'use strict';

  // ========================================
  // State Management
  // ========================================
  
  const state = {
    modalOpen: false,
    ratesVisible: false
  };

  // ========================================
  // DOM Elements
  // ========================================
  
  const modal = document.getElementById('booking-modal');
  const modalForm = document.getElementById('booking-form');
  const openBookingButtons = document.querySelectorAll('.js-open-booking');
  const closeBookingButton = document.querySelector('.js-close-booking');
  const toggleRatesButton = document.querySelector('.js-toggle-rates');
  const ratesPanel = document.getElementById('rates-panel');
  const toast = document.getElementById('toast');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  // ========================================
  // Smooth Scroll
  // ========================================
  
  const handleSmoothScroll = (e) => {
    const href = e.target.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const offset = 80; // Account for sticky navbar
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Add smooth scroll to all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', handleSmoothScroll);
  });

  // ========================================
  // Modal Functions
  // ========================================
  
  const openModal = (roomType = null, isSpa = false) => {
    state.modalOpen = true;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Pre-fill room if specified
    if (roomType) {
      const roomSelect = document.getElementById('booking-room');
      if (roomSelect) {
        roomSelect.value = roomType;
      }
    }
    
    // Focus first input
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  };

  const closeModal = () => {
    state.modalOpen = false;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Reset form
    if (modalForm) {
      modalForm.reset();
    }
    
    // Hide rates panel
    if (ratesPanel) {
      ratesPanel.setAttribute('hidden', '');
      state.ratesVisible = false;
    }
  };

  // ========================================
  // Event Listeners - Modal
  // ========================================
  
  // Open modal
  openBookingButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const roomType = button.getAttribute('data-room');
      const isSpa = button.getAttribute('data-spa') === 'true';
      openModal(roomType, isSpa);
    });
  });

  // Close modal
  if (closeBookingButton) {
    closeBookingButton.addEventListener('click', closeModal);
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.modalOpen) {
      closeModal();
    }
  });

  // ========================================
  // Toggle Rates Panel
  // ========================================
  
  const toggleRates = () => {
    if (!ratesPanel || !toggleRatesButton) return;
    
    state.ratesVisible = !state.ratesVisible;
    
    if (state.ratesVisible) {
      ratesPanel.removeAttribute('hidden');
      toggleRatesButton.textContent = 'Skjul priser';
    } else {
      ratesPanel.setAttribute('hidden', '');
      toggleRatesButton.textContent = 'Se priser & min. nætter';
    }
  };

  if (toggleRatesButton) {
    toggleRatesButton.addEventListener('click', toggleRates);
  }

  // ========================================
  // Form Submission
  // ========================================
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!modalForm) return;
    
    // Get form data
    const formData = new FormData(modalForm);
    const data = {
      date: formData.get('date'),
      nights: formData.get('nights'),
      guests: formData.get('guests'),
      room: formData.get('room'),
      note: formData.get('note')
    };
    
    // Log to console (in production, this would send to backend)
    console.log('Booking request:', data);
    
    // Show toast notification
    showToast('Tak for din forespørgsel! Vi vender tilbage snarest.');
    
    // Close modal after delay
    setTimeout(() => {
      closeModal();
    }, 1500);
  };

  if (modalForm) {
    modalForm.addEventListener('submit', handleFormSubmit);
  }

  // ========================================
  // Toast Notification
  // ========================================
  
  const showToast = (message) => {
    if (!toast) return;
    
    const toastMessage = toast.querySelector('.toast-message');
    if (toastMessage) {
      toastMessage.textContent = message;
    }
    
    toast.removeAttribute('hidden');
    toast.setAttribute('aria-hidden', 'false');
    
    // Hide after 4 seconds
    setTimeout(() => {
      toast.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        toast.setAttribute('hidden', '');
      }, 300);
    }, 4000);
  };

  // ========================================
  // Mobile Menu
  // ========================================
  
  const toggleMobileMenu = () => {
    if (!mobileMenuToggle || !navLinks) return;
    
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
    
    // Toggle nav visibility (simple toggle - could be enhanced with animation)
    if (isExpanded) {
      navLinks.style.display = 'none';
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '100%';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'rgba(245, 240, 233, 0.98)';
      navLinks.style.padding = '1rem';
      navLinks.style.borderTop = '1px solid rgba(0, 0, 0, 0.05)';
    }
  };

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }

  // ========================================
  // Lazy Loading Images (if not native)
  // ========================================
  
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      img.src = img.src; // Trigger load
    });
  } else {
    // Fallback: Intersection Observer
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // ========================================
  // Keyboard Navigation Enhancement
  // ========================================
  
  // Ensure all interactive elements are keyboard accessible
  document.querySelectorAll('button, a, input, select, textarea').forEach(element => {
    if (!element.hasAttribute('tabindex') && element.getAttribute('disabled') !== 'true') {
      element.setAttribute('tabindex', '0');
    }
  });

  // ========================================
  // Initialize
  // ========================================
  
  console.log('ØLIV website initialized');

})();
