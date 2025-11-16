// React Booking Integration Script
// This script loads the React booking modal when needed

(function() {
  'use strict';
  
  let reactLoaded = false;
  let reactRoot = null;
  
  // Create container for React booking
  function createReactContainer() {
    if (document.getElementById('react-booking-root')) return;
    
    const container = document.createElement('div');
    container.id = 'react-booking-root';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.display = 'none';
    document.body.appendChild(container);
    
    return container;
  }
  
  // Load React booking assets
  function loadReactBooking() {
    if (reactLoaded) {
      showReactBooking();
      return;
    }
    
    // Load CSS
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/client/dist/assets/index-D-r-dCpa.css';
    document.head.appendChild(css);
    
    // Load JS
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/client/dist/assets/index-DLsenxxv.js';
    script.onload = () => {
      reactLoaded = true;
      showReactBooking();
    };
    document.body.appendChild(script);
  }
  
  // Show React booking
  function showReactBooking() {
    const container = document.getElementById('react-booking-root');
    if (container) {
      container.style.display = 'block';
      // Simulate click on "Book nu" button inside React app
      setTimeout(() => {
        const bookButton = container.querySelector('.btn-primary');
        if (bookButton) {
          bookButton.click();
        }
      }, 100);
    }
  }
  
  // Initialize
  createReactContainer();
  
  // Replace all booking buttons
  document.addEventListener('DOMContentLoaded', () => {
    const bookingButtons = document.querySelectorAll('.js-open-booking');
    bookingButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadReactBooking();
      });
    });
  });
  
  // Export for manual use
  window.openReactBooking = loadReactBooking;
})();

