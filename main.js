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
  
  const openModal = (roomType = null, isSpa = false, packageName = null) => {
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
    
    // Add spa note if spa button clicked
    if (isSpa) {
      const noteField = modalForm?.querySelector('#booking-note');
      if (noteField) {
        noteField.value = 'Jeg er interesseret i spa-tilvalg.';
      }
    }
    
    // Add experience note if experience button clicked
    if (packageName) {
      const noteField = modalForm?.querySelector('#booking-note');
      if (noteField) {
        noteField.value = `Jeg er interesseret i "${packageName}".`;
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
      const packageName = button.getAttribute('data-package');
      openModal(roomType, isSpa, packageName);
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
    
    // Validate form
    const formData = new FormData(modalForm);
    const date = formData.get('date');
    const nights = formData.get('nights');
    const guests = formData.get('guests');
    
    const submitButton = modalForm.querySelector('.btn-submit');
    
    if (!date || !nights || !guests) {
      // Show error
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Udfyld alle påkrævede felter';
      submitButton.style.background = '#d32f2f';
      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.style.background = '';
      }, 3000);
      return;
    }
    
    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sender...';
    submitButton.disabled = true;
    
    // Get form data
    const data = {
      date: date,
      nights: nights,
      guests: guests,
      room: formData.get('room'),
      note: formData.get('note')
    };
    
    // Log to console (in production, this would send to backend)
    console.log('Booking request:', data);
    
    // Simulate API call
    setTimeout(() => {
      // Show toast notification
      showToast('Tak for din forespørgsel! Vi vender tilbage snarest.');
      
      // Reset button
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      
      // Close modal after delay
      setTimeout(() => {
        closeModal();
      }, 1500);
    }, 1000);
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
  // Active Navigation
  // ========================================
  
  const updateActiveNav = () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Set active state based on current page
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      
      // Check if link matches current page
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
      
      // For index.html, also check scroll position for anchor links
      if (currentPage === 'index.html' || currentPage === '') {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          const sectionId = section.getAttribute('id');
          
          if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          }
        });
      }
    });
  };

  // Throttle scroll events for performance (only on index.html)
  let ticking = false;
  const handleScroll = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html' || currentPage === '') {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveNav();
          ticking = false;
        });
        ticking = true;
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  updateActiveNav(); // Initial check

  // ========================================
  // Fade in animations on scroll
  // ========================================
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe sections for fade-in
  document.querySelectorAll('.section').forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = `opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
    observer.observe(section);
  });

  // Parallax effect for hero images (subtle, only on homepage)
  const heroImages = document.querySelectorAll('.hero-image-main img, .hero-image-small img');
  if (heroImages.length > 0 && window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    let ticking = false;
    const parallaxSpeed = 0.15; // Subtle parallax
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          
          heroImages.forEach((img) => {
            const container = img.closest('.hero-image-main, .hero-image-small');
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isInView && !container.matches(':hover')) {
              const offset = (rect.top - window.innerHeight / 2) * parallaxSpeed;
              img.style.setProperty('--parallax-offset', `${offset}px`);
            } else {
              img.style.setProperty('--parallax-offset', '0px');
            }
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
  }

  // ========================================
  // Language Dropdown
  // ========================================
  
  const languageSwitcher = document.querySelector('.language-switcher');
  const langDropdownBtn = document.querySelector('.lang-dropdown-btn');
  
  if (languageSwitcher && langDropdownBtn) {
    // Get current language from active link
    const activeLangLink = languageSwitcher.querySelector('.lang-link.active');
    if (activeLangLink) {
      const currentLang = activeLangLink.textContent.trim();
      langDropdownBtn.textContent = currentLang;
    }
    
    // Toggle dropdown
    langDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = languageSwitcher.classList.contains('open');
      languageSwitcher.classList.toggle('open');
      langDropdownBtn.setAttribute('aria-expanded', !isOpen);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!languageSwitcher.contains(e.target)) {
        languageSwitcher.classList.remove('open');
        langDropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Close dropdown when selecting a language
    const langLinks = languageSwitcher.querySelectorAll('.lang-link');
    langLinks.forEach(link => {
      link.addEventListener('click', () => {
        languageSwitcher.classList.remove('open');
        langDropdownBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ========================================
  // Newsletter Form
  // ========================================
  
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');
      
      // Here you would typically send to your backend/email service
      console.log('Newsletter signup:', email);
      
      // Show success message
      const input = newsletterForm.querySelector('.newsletter-input');
      const originalPlaceholder = input.placeholder;
      input.value = '';
      input.placeholder = 'Tak! Vi sender dig en bekræftelse.';
      input.style.borderColor = 'var(--olive)';
      
      setTimeout(() => {
        input.placeholder = originalPlaceholder;
        input.style.borderColor = '';
      }, 4000);
    });
  }

  // ========================================
  // Performance: Lazy load images
  // ========================================
  
  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  } else {
    // Fallback for browsers without native lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
  }

  // ========================================
  // Accessibility: Skip to main content link
  // ========================================
  
  // Create skip link if it doesn't exist
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.href = '#hero';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Spring til hovedindhold';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // ========================================
  // Intimate Stays Packages (Seasonal)
  // ========================================
  
  const packagesGrid = document.getElementById('packages-grid');
  if (packagesGrid) {
    const getCurrentSeason = () => {
      const month = new Date().getMonth() + 1; // 1-12
      if (month >= 3 && month <= 5) return 'spring';
      if (month >= 6 && month <= 8) return 'summer';
      if (month >= 9 && month <= 11) return 'fall';
      return 'winter';
    };

    // Get recommended season based on planning timeline
    // This shows the season people should be planning for NOW, not just current season
    const getRecommendedSeason = () => {
      const month = new Date().getMonth() + 1; // 1-12
      const currentDate = new Date();
      
      // Planning timelines:
      // Spring (Mar-May): Plan 2-3 months ahead → Show from January
      // Summer (Jun-Aug): Plan 3-6 months ahead → Show from December/January
      // Fall (Sep-Nov): Plan 1-2 months ahead → Show from July/August
      // Winter (Dec-Feb): Plan 2-4 weeks ahead → Show from November
      
      // If we're in Jan-Feb, people should be planning for Spring (starts in 1-2 months)
      if (month === 1 || month === 2) return 'spring';
      
      // If we're in Mar-May, show Spring (current) but also start showing Summer
      if (month >= 3 && month <= 5) {
        // Early spring (Mar-Apr): Show spring, but also highlight summer planning
        // Late spring (May): Start transitioning to summer
        return month === 5 ? 'summer' : 'spring';
      }
      
      // If we're in Jun-Aug, show Summer (current) but also start showing Fall
      if (month >= 6 && month <= 8) {
        // Early summer (Jun-Jul): Show summer
        // Late summer (Aug): Start showing fall (plan 1-2 months ahead)
        return month === 8 ? 'fall' : 'summer';
      }
      
      // If we're in Sep-Nov, show Fall (current) but also start showing Winter
      if (month >= 9 && month <= 11) {
        // Early fall (Sep-Oct): Show fall
        // Late fall (Nov): Start showing winter (plan 2-4 weeks ahead)
        return month === 11 ? 'winter' : 'fall';
      }
      
      // If we're in Dec, show Winter (current) but also start showing Spring for next year
      // People planning 2-3 months ahead for spring should see it in December
      return 'winter';
    };

    // Detect language from URL or page
    const getLanguage = () => {
      const path = window.location.pathname;
      if (path.includes('/en/')) return 'en';
      if (path.includes('/de/')) return 'de';
      return 'da';
    };

    const lang = getLanguage();

    const packages = {
      da: {
        spring: {
          name: 'Forårsoplevelse',
          season: 'Forår (marts-maj)',
          description: 'Når naturen vågner og lyset kommer tilbage. En oplevelse for par der søger ro og fornyelse efter vinteren. Vågn op til blomstring, gåture langs kysten og lange aftener med øl fra bryggeriet.',
          includes: [
            '2-3 nætter i valgfrit værelse',
            'Morgenmad med lokale råvarer',
            'Gårdsauna & koldtvand',
            'Ølsmagning fra ØLIV Brew',
            'Guide til forårsgåture langs kysten'
          ],
          badge: 'Forår',
          planning: 'Planlæg 2-3 måneder i forvejen',
          includesLabel: 'Oplevelsen inkluderer:',
          toggleAll: 'Se alle sæsonoplevelser',
          toggleCurrent: 'Vis kun anbefalede oplevelser'
        },
        summer: {
          name: 'Sommeroplevelse',
          season: 'Sommer (juni-august)',
          description: 'Bornholms højsæson med lang dagslys og varmt vejr. En rolig oplevelse for par der vil undgå sommerens travlhed. Morgenmad på terrassen, dage ved havet og aftener med øl.',
          includes: [
            '2-4 nætter i valgfrit værelse',
            'Morgenmad på terrassen',
            'Gårdsauna & koldtvand',
            'Privat ølsmagning',
            'Guide til skjulte steder langs kysten',
            'Mulighed for SUP/kajak (tilkøb)'
          ],
          badge: 'Sommer',
          planning: 'Planlæg 3-6 måneder i forvejen',
          includesLabel: 'Oplevelsen inkluderer:',
          toggleAll: 'Se alle sæsonoplevelser',
          toggleCurrent: 'Vis kun anbefalede oplevelser'
        },
        fall: {
          name: 'Efterårsoplevelse',
          season: 'Efterår (september-november)',
          description: 'Naturen skifter farver, og temperaturen falder. En oplevelse med rolige dage ved saunaen, lange aftener med mørke øl og gåture gennem det farverige landskab.',
          includes: [
            '2-3 nætter i valgfrit værelse',
            'Morgenmad med lokale råvarer',
            'Gårdsauna & koldtvand',
            'Ølsmagning med mørke øl',
            'Guide til efterårsgåture',
            'Snacks til øllene'
          ],
          badge: 'Efterår',
          planning: 'Planlæg 1-2 måneder i forvejen',
          includesLabel: 'Oplevelsen inkluderer:',
          toggleAll: 'Se alle sæsonoplevelser',
          toggleCurrent: 'Vis kun anbefalede oplevelser'
        },
        winter: {
          name: 'Vinteroplevelse',
          season: 'Vinter (december-februar)',
          description: 'Stille dage med fokus på ro og nærvær. En oplevelse hvor saunaen er varm, øllene er mørke, og naturen er i ro. Perfekt til at slappe af og oplade i rolige omgivelser.',
          includes: [
            '2-4 nætter i valgfrit værelse',
            'Morgenmad med lokale råvarer',
            'Gårdsauna & koldtvand (dagligt)',
            'Privat ølsmagning med mørke øl',
            'Snacks og varme drikke',
            'Rolige omgivelser uden turister'
          ],
          badge: 'Vinter',
          planning: 'Planlæg 2-4 uger i forvejen',
          includesLabel: 'Oplevelsen inkluderer:',
          toggleAll: 'Se alle sæsonoplevelser',
          toggleCurrent: 'Vis kun anbefalede oplevelser'
        }
      },
      en: {
        spring: {
          name: 'Spring Experience',
          season: 'Spring (March-May)',
          description: 'When nature awakens and light returns. An experience for couples seeking peace and renewal after winter. Wake up to blooming nature, coastal walks and evenings with beer from the brewery.',
          includes: [
            '2-3 nights in chosen room',
            'Breakfast with local ingredients',
            'Farm sauna & cold water',
            'Beer tasting from ØLIV Brew',
            'Guide to spring walks along the coast'
          ],
          badge: 'Spring',
          planning: 'Plan 2-3 months ahead',
          button: 'Inquire about experience',
          includesLabel: 'The experience includes:',
          toggleAll: 'See all seasonal experiences',
          toggleCurrent: 'Show only recommended experiences',
          recommendedLabel: 'Recommended now'
        },
        summer: {
          name: 'Summer Experience',
          season: 'Summer (June-August)',
          description: 'Bornholm\'s high season with long daylight and warm weather. A peaceful experience for couples who want to avoid summer\'s hustle. Breakfast on the terrace, days by the sea and evenings with beer.',
          includes: [
            '2-4 nights in chosen room',
            'Breakfast on the terrace',
            'Farm sauna & cold water',
            'Private beer tasting',
            'Guide to hidden spots along the coast',
            'Option for SUP/kayak (add-on)'
          ],
          badge: 'Summer',
          planning: 'Plan 3-6 months ahead',
          button: 'Inquire about experience',
          includesLabel: 'The experience includes:',
          toggleAll: 'See all seasonal experiences',
          toggleCurrent: 'Show only recommended experiences',
          recommendedLabel: 'Recommended now'
        },
        fall: {
          name: 'Fall Experience',
          season: 'Fall (September-November)',
          description: 'Nature changes colors, and temperatures drop. An experience with quiet days at the sauna, long evenings with dark beers and walks through the colorful landscape.',
          includes: [
            '2-3 nights in chosen room',
            'Breakfast with local ingredients',
            'Farm sauna & cold water',
            'Beer tasting with dark beers',
            'Guide to fall walks',
            'Snacks for the beers'
          ],
          badge: 'Fall',
          planning: 'Plan 1-2 months ahead',
          button: 'Inquire about experience',
          includesLabel: 'The experience includes:',
          toggleAll: 'See all seasonal experiences',
          toggleCurrent: 'Show only recommended experiences',
          recommendedLabel: 'Recommended now'
        },
        winter: {
          name: 'Winter Experience',
          season: 'Winter (December-February)',
          description: 'Quiet days focused on peace and presence. An experience where the sauna is warm, the beers are dark, and nature is at rest. Perfect for relaxing and recharging in peaceful surroundings.',
          includes: [
            '2-4 nights in chosen room',
            'Breakfast with local ingredients',
            'Farm sauna & cold water (daily)',
            'Private beer tasting with dark beers',
            'Snacks and warm drinks',
            'Peaceful surroundings without tourists'
          ],
          badge: 'Winter',
          planning: 'Plan 2-4 weeks ahead',
          button: 'Inquire about experience',
          includesLabel: 'The experience includes:',
          toggleAll: 'See all seasonal experiences',
          toggleCurrent: 'Show only recommended experiences',
          recommendedLabel: 'Recommended now'
        }
      },
      de: {
        spring: {
          name: 'Frühlingserlebnis',
          season: 'Frühling (März-Mai)',
          description: 'Wenn die Natur erwacht und das Licht zurückkehrt. Ein Erlebnis für Paare, die nach dem Winter Ruhe und Erneuerung suchen. Erwachen Sie zur Blüte, Küstenspaziergänge und Abende mit Bier aus der Brauerei.',
          includes: [
            '2-3 Nächte im gewählten Zimmer',
            'Frühstück mit lokalen Zutaten',
            'Hofsauna & kaltes Wasser',
            'Bierverkostung von ØLIV Brew',
            'Führung zu Frühlingsspaziergängen entlang der Küste'
          ],
          badge: 'Frühling',
          planning: '2-3 Monate im Voraus planen',
          button: 'Erlebnis anfragen',
          includesLabel: 'Das Erlebnis beinhaltet:',
          toggleAll: 'Alle Saisonerlebnisse anzeigen',
          toggleCurrent: 'Nur empfohlene Erlebnisse anzeigen',
          recommendedLabel: 'Jetzt empfohlen'
        },
        summer: {
          name: 'Sommererlebnis',
          season: 'Sommer (Juni-August)',
          description: 'Bornholms Hochsaison mit langem Tageslicht und warmem Wetter. Ein ruhiges Erlebnis für Paare, die dem Sommertrubel entgehen wollen. Frühstück auf der Terrasse, Tage am Meer und Abende mit Bier.',
          includes: [
            '2-4 Nächte im gewählten Zimmer',
            'Frühstück auf der Terrasse',
            'Hofsauna & kaltes Wasser',
            'Private Bierverkostung',
            'Führung zu versteckten Orten entlang der Küste',
            'Option für SUP/Kajak (Zusatz)'
          ],
          badge: 'Sommer',
          planning: '3-6 Monate im Voraus planen',
          button: 'Erlebnis anfragen',
          includesLabel: 'Das Erlebnis beinhaltet:',
          toggleAll: 'Alle Saisonerlebnisse anzeigen',
          toggleCurrent: 'Nur empfohlene Erlebnisse anzeigen',
          recommendedLabel: 'Jetzt empfohlen'
        },
        fall: {
          name: 'Herbsterlebnis',
          season: 'Herbst (September-November)',
          description: 'Die Natur wechselt die Farben und die Temperaturen sinken. Ein Erlebnis mit ruhigen Tagen in der Sauna, langen Abenden mit dunklen Bieren und Spaziergängen durch die farbenfrohe Landschaft.',
          includes: [
            '2-3 Nächte im gewählten Zimmer',
            'Frühstück mit lokalen Zutaten',
            'Hofsauna & kaltes Wasser',
            'Bierverkostung mit dunklen Bieren',
            'Führung zu Herbstspaziergängen',
            'Snacks zu den Bieren'
          ],
          badge: 'Herbst',
          planning: '1-2 Monate im Voraus planen',
          button: 'Erlebnis anfragen',
          includesLabel: 'Das Erlebnis beinhaltet:',
          toggleAll: 'Alle Saisonerlebnisse anzeigen',
          toggleCurrent: 'Nur empfohlene Erlebnisse anzeigen',
          recommendedLabel: 'Jetzt empfohlen'
        },
        winter: {
          name: 'Wintererlebnis',
          season: 'Winter (Dezember-Februar)',
          description: 'Ruhige Tage mit Fokus auf Ruhe und Präsenz. Ein Erlebnis, bei dem die Sauna warm ist, die Biere dunkel sind und die Natur ruht. Perfekt zum Entspannen und Aufladen in ruhiger Umgebung.',
          includes: [
            '2-4 Nächte im gewählten Zimmer',
            'Frühstück mit lokalen Zutaten',
            'Hofsauna & kaltes Wasser (täglich)',
            'Private Bierverkostung mit dunklen Bieren',
            'Snacks und warme Getränke',
            'Ruhige Umgebung ohne Touristen'
          ],
          badge: 'Winter',
          planning: '2-4 Wochen im Voraus planen',
          button: 'Erlebnis anfragen',
          includesLabel: 'Das Erlebnis beinhaltet:',
          toggleAll: 'Alle Saisonerlebnisse anzeigen',
          toggleCurrent: 'Nur empfohlene Erlebnisse anzeigen',
          recommendedLabel: 'Jetzt empfohlen'
        }
      }
    };

    const currentSeason = getCurrentSeason();
    const recommendedSeason = getRecommendedSeason();
    
    // Show recommended season (what people should plan for now) as primary
    // But also show current season if different
    const primaryPackage = packages[lang][recommendedSeason];
    const currentPackage = packages[lang][currentSeason];
    const allPackages = packages[lang];

    if (primaryPackage) {
      // If recommended season differs from current season, show both
      const showBothSeasons = recommendedSeason !== currentSeason && currentPackage;
      
      const renderPackage = (pkg, isHighlighted = false) => `
        <div class="package-card ${isHighlighted ? 'package-card-highlighted' : ''}">
          <span class="package-badge">${pkg.badge}</span>
          <h3>${pkg.name}</h3>
          <p class="package-season">${pkg.season}</p>
          <p class="package-description">${pkg.description}</p>
          <div class="package-includes">
            <h4>${pkg.includesLabel}</h4>
            <ul>
              ${pkg.includes.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          <p class="package-note">${pkg.planning}</p>
          <a href="${lang === 'en' ? 'accommodation.html' : lang === 'de' ? 'unterkunft.html' : 'overnatning.html'}" class="btn-secondary">${lang === 'en' ? 'Read more' : lang === 'de' ? 'Mehr erfahren' : 'Læs mere'}</a>
        </div>
      `;
      
      // Show recommended season first, then current if different
      if (showBothSeasons) {
        packagesGrid.innerHTML = renderPackage(primaryPackage, true) + renderPackage(currentPackage, false);
      } else {
        packagesGrid.innerHTML = renderPackage(primaryPackage, true);
      }

      // Show all packages
      const showAllPackages = () => {
        const allPackagesHTML = Object.values(allPackages).map((pkg, index) => {
          const isHighlighted = pkg.badge === primaryPackage.badge;
          return renderPackage(pkg, isHighlighted);
        }).join('');
        packagesGrid.innerHTML = allPackagesHTML;
      };

      // Add toggle button to show all packages
      const toggleButton = document.createElement('button');
      toggleButton.className = 'btn-secondary';
      toggleButton.textContent = primaryPackage.toggleAll;
      toggleButton.style.cssText = 'margin: var(--spacing-lg) auto 0; display: block;';
      toggleButton.addEventListener('click', () => {
        const currentCount = packagesGrid.children.length;
        if (currentCount <= 2) { // 1 or 2 packages shown
          showAllPackages();
          toggleButton.textContent = primaryPackage.toggleCurrent;
        } else {
          // Reset to recommended/current view
          if (showBothSeasons) {
            packagesGrid.innerHTML = renderPackage(primaryPackage, true) + renderPackage(currentPackage, false);
          } else {
            packagesGrid.innerHTML = renderPackage(primaryPackage, true);
          }
          toggleButton.textContent = primaryPackage.toggleAll;
        }
      });
      
      packagesGrid.parentElement.appendChild(toggleButton);
    }
  }

  // ========================================
  // Initialize
  // ========================================
  
  console.log('ØLIV website initialized');

})();
