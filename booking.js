// Booking Engine Frontend - Enhanced Version
(function() {
  'use strict';

  // Use environment variable if set, otherwise use current origin
  const API_BASE = (window.API_BASE_URL || window.location.origin) + '/api';
  
  // ========================================
  // Utility Functions
  // ========================================
  
  const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const messageEl = toast.querySelector('.toast-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
    
    toast.className = `toast toast-${type}`;
    toast.hidden = false;
    toast.setAttribute('aria-live', 'polite');
    
    setTimeout(() => {
      toast.hidden = true;
    }, 5000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateNights = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ========================================
  // Enhanced Calendar Component
  // ========================================
  
  class BookingCalendar {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      this.options = {
        minDate: options.minDate || new Date(),
        maxDate: options.maxDate || this.addMonths(new Date(), 12),
        selectMode: options.selectMode || 'range',
        onSelect: options.onSelect || null,
        ...options
      };
      this.selectedDates = { start: null, end: null };
      this.availability = {};
      this.hoverDate = null;
      this.init();
    }

    addMonths(date, months) {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    }

    async init() {
      if (!this.container) {
        console.error('Calendar container not found');
        return;
      }
      this.showLoading();
      try {
        await this.loadAvailability();
        this.hideLoading();
        this.render();
      } catch (error) {
        console.error('Calendar init error:', error);
        this.hideLoading();
        if (this.container) {
          this.container.innerHTML = '<div class="calendar-loading">Kunne ikke indlæse kalender. Opdater siden.</div>';
        }
      }
    }

    showLoading() {
      if (this.container) {
        this.container.innerHTML = '<div class="calendar-loading">Indlæser tilgængelighed...</div>';
      }
    }

    hideLoading() {
      // Loading will be replaced by render()
    }

    async loadAvailability() {
      const start = this.formatDate(this.options.minDate);
      const end = this.formatDate(this.options.maxDate);
      
      try {
        const response = await fetch(`${API_BASE}/availability?start_date=${start}&end_date=${end}`);
        if (!response.ok) throw new Error('Failed to load availability');
        const data = await response.json();
        
        // Organize by date
        data.forEach(item => {
          if (!this.availability[item.date]) {
            this.availability[item.date] = [];
          }
          this.availability[item.date].push(item);
        });
      } catch (error) {
        console.error('Error loading availability:', error);
        showToast('Kunne ikke indlæse tilgængelighed. Prøv igen senere.', 'error');
      }
    }

    formatDate(date) {
      return date.toISOString().split('T')[0];
    }

    render() {
      if (!this.container) {
        console.error('Calendar container not found for render');
        return;
      }

      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      this.container.innerHTML = `
        <div class="booking-calendar">
          <div class="calendar-header">
            <button class="calendar-nav prev-month" type="button" aria-label="Forrige måned">‹</button>
            <h3 class="calendar-month-year"></h3>
            <button class="calendar-nav next-month" type="button" aria-label="Næste måned">›</button>
          </div>
          <div class="calendar-selection-info" id="calendar-selection-info"></div>
          <div class="calendar-grid"></div>
          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-color available"></span> Ledig</span>
            <span class="legend-item"><span class="legend-color booked"></span> Optaget</span>
            <span class="legend-item"><span class="legend-color selected"></span> Valgt</span>
            <span class="legend-item"><span class="legend-color in-range"></span> I perioden</span>
          </div>
        </div>
      `;
      
      this.currentMonth = currentMonth;
      this.renderMonth(currentMonth);
      this.updateSelectionInfo();
      
      // Event listeners for navigation
      const prevBtn = this.container.querySelector('.prev-month');
      const nextBtn = this.container.querySelector('.next-month');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
          this.renderMonth(this.currentMonth);
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
          this.renderMonth(this.currentMonth);
        });
      }
    }

    updateSelectionInfo() {
      const infoEl = this.container.querySelector('#calendar-selection-info');
      if (!infoEl) return;

      if (this.selectedDates.start && this.selectedDates.end) {
        const nights = calculateNights(
          this.formatDate(this.selectedDates.start),
          this.formatDate(this.selectedDates.end)
        );
        infoEl.innerHTML = `
          <div class="selection-info">
            <span class="selection-date">Ankomst: ${formatDate(this.formatDate(this.selectedDates.start))}</span>
            <span class="selection-date">Afrejse: ${formatDate(this.formatDate(this.selectedDates.end))}</span>
            <span class="selection-nights">${nights} ${nights === 1 ? 'nat' : 'nætter'}</span>
          </div>
        `;
        infoEl.style.display = 'block';
      } else if (this.selectedDates.start) {
        infoEl.innerHTML = `
          <div class="selection-info">
            <span class="selection-date">Vælg afrejsedato</span>
          </div>
        `;
        infoEl.style.display = 'block';
      } else {
        infoEl.style.display = 'none';
      }
    }

    renderMonth(month) {
      if (!this.container) return;
      
      const monthYearEl = this.container.querySelector('.calendar-month-year');
      if (monthYearEl) {
        monthYearEl.textContent = month.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
      }
      
      const grid = this.container.querySelector('.calendar-grid');
      if (!grid) return;
      
      grid.innerHTML = '';
      
      // Day names
      const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
      dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-name';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
      });
      
      // First day of month
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Start from Sunday of the week containing first day
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      // End on Saturday of the week containing last day
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      
      // Render days
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayElement = this.createDayElement(current, month);
        grid.appendChild(dayElement);
        current.setDate(current.getDate() + 1);
      }
    }

    createDayElement(date, currentMonth) {
      const day = document.createElement('div');
      const dateStr = this.formatDate(date);
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = date < today;
      const isSelected = this.isDateSelected(date);
      const isInRange = this.isDateInRange(date);
      
      day.className = 'calendar-day';
      if (!isCurrentMonth) day.classList.add('other-month');
      if (isPast) day.classList.add('past');
      if (isSelected) day.classList.add('selected');
      if (isInRange) day.classList.add('in-range');
      
      // Check availability
      const avail = this.availability[dateStr];
      if (avail && avail.length > 0) {
        const hasAvailable = avail.some(a => a.available === 1);
        if (!hasAvailable) {
          day.classList.add('booked');
        } else {
          day.classList.add('available');
        }
      }
      
      day.textContent = date.getDate();
      day.dataset.date = dateStr;
      day.dataset.timestamp = date.getTime();
      
      // Make clickable if not past and in current month
      if (!isPast && isCurrentMonth && !day.classList.contains('booked')) {
        day.style.cursor = 'pointer';
        day.style.pointerEvents = 'auto';
        day.setAttribute('role', 'button');
        day.setAttribute('tabindex', '0');
        day.setAttribute('aria-label', `Vælg ${date.toLocaleDateString('da-DK')}`);
        
        // Store date reference on element for debugging
        day._date = date;
        day._dateStr = dateStr;
        
        // Click handler - use capture phase to ensure it fires
        const clickHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('✅ Date clicked:', dateStr, date, 'Element:', day);
          this.selectDate(new Date(date)); // Create new date object
        };
        
        // Add multiple event types to ensure it works
        day.addEventListener('click', clickHandler, true); // Use capture
        day.addEventListener('mousedown', (e) => {
          e.preventDefault();
          clickHandler(e);
        }, true);
        
        // Keyboard support
        day.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            clickHandler(e);
          }
        });
        
        // Hover effect for range selection
        day.addEventListener('mouseenter', () => {
          if (this.selectedDates.start && !this.selectedDates.end) {
            this.hoverDate = date;
            this.renderMonth(this.currentMonth);
          }
        });
        
        // Visual feedback on mouse down
        day.addEventListener('mousedown', () => {
          day.style.transform = 'scale(0.9)';
        });
        day.addEventListener('mouseup', () => {
          day.style.transform = '';
        });
        day.addEventListener('mouseleave', () => {
          day.style.transform = '';
        });
      } else {
        day.style.cursor = 'default';
        day.style.pointerEvents = 'none';
        day.setAttribute('aria-disabled', 'true');
      }
      
      return day;
    }

    isDateSelected(date) {
      if (!this.selectedDates.start) return false;
      const dateStr = this.formatDate(date);
      const startStr = this.formatDate(this.selectedDates.start);
      if (this.selectedDates.end) {
        const endStr = this.formatDate(this.selectedDates.end);
        return dateStr === startStr || dateStr === endStr;
      }
      return dateStr === startStr;
    }

    isDateInRange(date) {
      if (!this.selectedDates.start || !this.selectedDates.end) {
        if (this.selectedDates.start && this.hoverDate && date > this.selectedDates.start && date <= this.hoverDate) {
          return true;
        }
        return false;
      }
      const dateStr = this.formatDate(date);
      const startStr = this.formatDate(this.selectedDates.start);
      const endStr = this.formatDate(this.selectedDates.end);
      return dateStr > startStr && dateStr < endStr;
    }

    selectDate(date) {
      console.log('selectDate called with:', date);
      
      // Prevent selecting past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        console.log('Date is in the past, ignoring');
        return;
      }

      if (this.options.selectMode === 'single') {
        this.selectedDates.start = date;
        this.selectedDates.end = null;
      } else {
        // Range selection mode
        if (!this.selectedDates.start || this.selectedDates.end) {
          // Start new selection
          console.log('Starting new selection:', date);
          this.selectedDates.start = new Date(date);
          this.selectedDates.end = null;
          this.hoverDate = null;
        } else {
          // Complete selection - we already have a start date
          console.log('Completing selection. Start:', this.selectedDates.start, 'End:', date);
          
          if (date < this.selectedDates.start) {
            // If clicked date is before start, swap them
            this.selectedDates.end = new Date(this.selectedDates.start);
            this.selectedDates.start = new Date(date);
          } else if (date.getTime() === this.selectedDates.start.getTime()) {
            // If clicking same date, reset
            this.selectedDates.start = new Date(date);
            this.selectedDates.end = null;
          } else {
            // Normal case: set end date
            this.selectedDates.end = new Date(date);
          }
          this.hoverDate = null;
        }
      }
      
      console.log('Selected dates:', {
        start: this.selectedDates.start,
        end: this.selectedDates.end
      });
      
      this.renderMonth(this.currentMonth);
      this.updateSelectionInfo();
      
      // Only trigger onSelect when we have both start and end
      if (this.options.onSelect && this.selectedDates.start && this.selectedDates.end) {
        console.log('Calling onSelect callback');
        this.options.onSelect({
          start: this.selectedDates.start,
          end: this.selectedDates.end
        });
      }
    }

    getSelectedDates() {
      return {
        start: this.selectedDates.start ? this.formatDate(this.selectedDates.start) : null,
        end: this.selectedDates.end ? this.formatDate(this.selectedDates.end) : null
      };
    }
  }

  // ========================================
  // Enhanced Booking Form Handler
  // ========================================
  
  class BookingEngine {
    constructor() {
      this.calendar = null;
      this.selectedRoom = null;
      this.bookingData = {};
      this.rooms = [];
      this.availableRooms = [];
      this.isLoading = false;
      this.currentStep = 1;
      this.init();
    }

    async init() {
      // Load rooms from API
      await this.loadRooms();
      
      // Initialize calendar when modal opens
      const bookingModal = document.getElementById('booking-modal');
      if (bookingModal) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
              const isOpen = bookingModal.getAttribute('aria-hidden') === 'false';
              if (isOpen && !this.calendar) {
                this.initCalendar();
                this.setupStepNavigation();
                this.setupGuestsSelector();
              }
              if (!isOpen) {
                this.resetForm();
              }
            }
          });
        });
        observer.observe(bookingModal, { attributes: true });
      }

      // Add form field listeners
      this.setupFormListeners();
    }

    setupStepNavigation() {
      // Next step buttons
      document.querySelectorAll('.btn-next-step').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const nextStep = parseInt(btn.dataset.next);
          if (this.validateStep(this.currentStep)) {
            this.goToStep(nextStep);
          }
        });
      });

      // Previous step buttons
      document.querySelectorAll('.btn-prev-step').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const prevStep = parseInt(btn.dataset.prev);
          this.goToStep(prevStep);
        });
      });
    }

    setupGuestsSelector() {
      const guestButtons = document.querySelectorAll('.guest-btn');
      const guestSelect = document.getElementById('booking-guests');
      
      guestButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          guestButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const guests = parseInt(btn.dataset.guests);
          if (guestSelect) {
            guestSelect.value = guests;
            // Trigger change event
            guestSelect.dispatchEvent(new Event('change'));
          }
        });
      });
    }

    validateStep(step) {
      if (step === 1) {
        const dateInput = document.getElementById('booking-date');
        const nightsSelect = document.getElementById('booking-nights');
        if (!dateInput || !dateInput.value || !nightsSelect || !nightsSelect.value) {
          showToast('Vælg venligst datoer og antal nætter', 'error');
          return false;
        }
        return true;
      } else if (step === 2) {
        const roomSelect = document.getElementById('booking-room');
        if (!roomSelect || !roomSelect.value) {
          showToast('Vælg venligst et værelse', 'error');
          return false;
        }
        return true;
      } else if (step === 3) {
        const nameInput = document.getElementById('booking-name');
        const emailInput = document.getElementById('booking-email');
        if (!nameInput || !nameInput.value || !emailInput || !emailInput.value) {
          showToast('Navn og email er påkrævet', 'error');
          return false;
        }
        if (emailInput && !emailInput.validity.valid) {
          showToast('Indtast venligst en gyldig email', 'error');
          return false;
        }
        return true;
      }
      return true;
    }

    goToStep(step) {
      // Hide all steps
      document.querySelectorAll('.form-step').forEach(s => {
        s.classList.remove('active');
      });

      // Show target step
      const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
      if (targetStep) {
        targetStep.classList.add('active');
        this.currentStep = step;
        this.updateProgress(step);

        // If going to step 2, load rooms
        if (step === 2) {
          this.loadRoomsForSelection();
        }

        // If going to step 3, show summary
        if (step === 3) {
          this.showBookingSummary();
        }

        // Scroll to top of modal
        const modal = document.querySelector('.modal');
        if (modal) {
          modal.scrollTop = 0;
        }
      }
    }

    updateProgress(activeStep) {
      document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < activeStep) {
          step.classList.add('completed');
        } else if (stepNum === activeStep) {
          step.classList.add('active');
        }
      });
    }

    setupFormListeners() {
      const dateInput = document.getElementById('booking-date');
      const nightsSelect = document.getElementById('booking-nights');
      const guestsSelect = document.getElementById('booking-guests');
      const roomSelect = document.getElementById('booking-room');

      // Update nights when date changes (from date input)
      if (dateInput) {
        dateInput.addEventListener('change', async () => {
          if (dateInput.value && nightsSelect && nightsSelect.value) {
            // Update calendar if it exists
            if (this.calendar) {
              const startDate = new Date(dateInput.value);
              const nights = parseInt(nightsSelect.value);
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + nights);
              
              this.calendar.selectedDates.start = startDate;
              this.calendar.selectedDates.end = endDate;
              this.calendar.renderMonth(this.calendar.currentMonth);
              this.calendar.updateSelectionInfo();
            }
            // Check availability
            await this.checkAvailability();
          }
        });
      }

      // Update dates when nights changes
      if (nightsSelect) {
        nightsSelect.addEventListener('change', async () => {
          if (dateInput && dateInput.value && nightsSelect.value) {
            // Update calendar if it exists
            if (this.calendar) {
              const startDate = new Date(dateInput.value);
              const nights = parseInt(nightsSelect.value);
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + nights);
              
              this.calendar.selectedDates.start = startDate;
              this.calendar.selectedDates.end = endDate;
              this.calendar.renderMonth(this.calendar.currentMonth);
              this.calendar.updateSelectionInfo();
            }
            // Check availability
            await this.checkAvailability();
          }
        });
      }

      // Check availability when guests change
      if (guestsSelect) {
        guestsSelect.addEventListener('change', async () => {
          if (dateInput && dateInput.value && nightsSelect && nightsSelect.value) {
            await this.checkAvailability();
          }
        });
      }

      // Show room details when selected
      if (roomSelect) {
        roomSelect.addEventListener('change', () => {
          this.updateRoomDetails();
        });
      }
    }

    async loadRooms() {
      try {
        const response = await fetch(`${API_BASE}/rooms`);
        if (!response.ok) throw new Error('Failed to load rooms');
        this.rooms = await response.json();
        this.updateRoomSelect();
      } catch (error) {
        console.error('Error loading rooms:', error);
        showToast('Kunne ikke indlæse værelser. Prøv igen senere.', 'error');
      }
    }

    updateRoomSelect() {
      const roomSelect = document.getElementById('booking-room');
      if (roomSelect && this.rooms.length > 0) {
        roomSelect.innerHTML = '<option value="">Vælg værelse...</option>';
        this.rooms.forEach(room => {
          const option = document.createElement('option');
          option.value = room.id;
          option.textContent = `${room.name} (op til ${room.max_guests} gæster)`;
          option.dataset.maxGuests = room.max_guests;
          option.dataset.basePrice = room.base_price;
          roomSelect.appendChild(option);
        });
      }
    }

    initCalendar() {
      // Check if calendar already exists
      if (this.calendar) {
        return;
      }

      // Find or create calendar container
      let calendarContainer = document.getElementById('booking-calendar');
      
      if (!calendarContainer) {
        const form = document.getElementById('booking-form');
        if (!form) {
          console.error('Booking form not found');
          return;
        }
        
        const calendarDiv = document.createElement('div');
        calendarDiv.id = 'booking-calendar';
        calendarDiv.className = 'booking-calendar-container';
        
        // Insert into step 1 if it exists
        const firstStep = form.querySelector('.form-step[data-step="1"]');
        if (firstStep) {
          const stepHeader = firstStep.querySelector('.step-header');
          if (stepHeader && stepHeader.nextSibling) {
            firstStep.insertBefore(calendarDiv, stepHeader.nextSibling);
          } else {
            firstStep.appendChild(calendarDiv);
          }
        } else {
          // Fallback: insert at beginning of form
          form.insertBefore(calendarDiv, form.firstChild);
        }
        
        calendarContainer = document.getElementById('booking-calendar');
      }
      
      if (calendarContainer && !this.calendar) {
        try {
          this.calendar = new BookingCalendar('booking-calendar', {
            onSelect: (dates) => {
              this.handleDateSelection(dates);
            }
          });
          
          // Set min date on date input
          const dateInput = document.getElementById('booking-date');
          if (dateInput) {
            const today = new Date();
            dateInput.min = today.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error initializing calendar:', error);
          // Show fallback message
          if (calendarContainer) {
            calendarContainer.innerHTML = `
              <div style="padding: var(--spacing-lg); text-align: center; color: var(--muted);">
                <p>Brug dato-feltet nedenfor til at vælge datoer</p>
              </div>
            `;
          }
        }
      }
    }

    async handleDateSelection(dates) {
      console.log('handleDateSelection called:', dates);
      
      if (!dates.start || !dates.end) {
        console.log('Missing start or end date');
        return;
      }
      
      // Update date input
      const dateInput = document.getElementById('booking-date');
      if (dateInput) {
        const startDateStr = this.calendar.formatDate(dates.start);
        dateInput.value = startDateStr;
        console.log('Updated date input to:', startDateStr);
      }

      // Update nights
      const startDateStr = this.calendar.formatDate(dates.start);
      const endDateStr = this.calendar.formatDate(dates.end);
      const nights = calculateNights(startDateStr, endDateStr);
      
      const nightsSelect = document.getElementById('booking-nights');
      if (nightsSelect) {
        nightsSelect.value = nights;
        console.log('Updated nights to:', nights);
      }

      // Show toast feedback
      showToast(`Vælg ${nights} ${nights === 1 ? 'nat' : 'nætter'} fra ${formatDate(startDateStr)}`, 'success');

      // Check availability
      await this.checkAvailability();
    }

    updateNightsFromDates() {
      const dateInput = document.getElementById('booking-date');
      const nightsSelect = document.getElementById('booking-nights');
      
      if (!dateInput || !dateInput.value || !nightsSelect) return;
      
      // If we have calendar selection, use that
      if (this.calendar) {
        const dates = this.calendar.getSelectedDates();
        if (dates.start && dates.end) {
          const nights = calculateNights(dates.start, dates.end);
          nightsSelect.value = nights;
        }
      }
    }

    updateDatesFromNights() {
      const dateInput = document.getElementById('booking-date');
      const nightsSelect = document.getElementById('booking-nights');
      
      if (!dateInput || !dateInput.value || !nightsSelect || !nightsSelect.value) return;
      
      const startDate = new Date(dateInput.value);
      const nights = parseInt(nightsSelect.value);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + nights);
      
      // Update calendar if it exists
      if (this.calendar) {
        this.calendar.selectedDates.start = startDate;
        this.calendar.selectedDates.end = endDate;
        this.calendar.renderMonth(this.calendar.currentMonth);
        this.calendar.updateSelectionInfo();
      }
    }

    async checkAvailability() {
      const dateInput = document.getElementById('booking-date');
      const nightsSelect = document.getElementById('booking-nights');
      const guestsSelect = document.getElementById('booking-guests');
      
      if (!dateInput || !dateInput.value || !nightsSelect || !nightsSelect.value) {
        return;
      }

      const checkIn = dateInput.value;
      const nights = parseInt(nightsSelect.value);
      const guests = parseInt(guestsSelect?.value) || 2;
      
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);
      const checkOutStr = checkOut.toISOString().split('T')[0];

      this.setLoadingState(true);
      
      try {
        const response = await fetch(`${API_BASE}/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_in: checkIn,
            check_out: checkOutStr,
            guests: guests
          })
        });

        if (!response.ok) throw new Error('Failed to check availability');
        
        const data = await response.json();
        this.availableRooms = data.available || [];
        this.updateAvailableRooms();
      } catch (error) {
        console.error('Error checking availability:', error);
        showToast('Kunne ikke tjekke tilgængelighed. Prøv igen senere.', 'error');
      } finally {
        this.setLoadingState(false);
      }
    }

    async loadRoomsForSelection() {
      const roomsContainer = document.getElementById('rooms-selection');
      if (!roomsContainer) return;

      // Check availability first
      await this.checkAvailability();
    }

    updateAvailableRooms() {
      const roomSelect = document.getElementById('booking-room');
      const roomsContainer = document.getElementById('rooms-selection');
      
      if (!roomsContainer) return;

      const availableRoomIds = this.availableRooms.map(r => r.room_id);
      const nights = parseInt(document.getElementById('booking-nights')?.value) || 1;
      
      // Clear container
      roomsContainer.innerHTML = '';
      
      if (this.availableRooms.length === 0) {
        roomsContainer.innerHTML = '<div class="rooms-loading">Ingen værelser tilgængelige for valgte datoer</div>';
        return;
      }

      // Create room cards
      this.rooms.forEach(room => {
        const isAvailable = availableRoomIds.includes(room.id);
        const roomData = isAvailable ? this.availableRooms.find(r => r.room_id === room.id) : null;
        const totalPrice = roomData ? roomData.total_price : null;
        const pricePerNight = totalPrice ? Math.round(totalPrice / nights) : null;

        const card = document.createElement('div');
        card.className = `room-card ${isAvailable ? '' : 'unavailable'}`;
        card.dataset.roomId = room.id;
        
        if (isAvailable) {
          card.addEventListener('click', () => {
            // Remove selected from all cards
            document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
            // Add selected to clicked card
            card.classList.add('selected');
            // Update hidden select
            if (roomSelect) {
              roomSelect.value = room.id;
              roomSelect.dispatchEvent(new Event('change'));
            }
            this.selectedRoom = room;
            this.showBookingSummary();
          });

          card.innerHTML = `
            <div class="room-card-header">
              <div>
                <div class="room-card-name">${room.name}</div>
                <div class="room-card-capacity">Op til ${room.max_guests} gæster</div>
              </div>
              <div class="room-card-price">
                ${totalPrice ? `
                  <div class="room-price-total">${formatCurrency(totalPrice)}</div>
                  <div class="room-price-per-night">${nights} ${nights === 1 ? 'nat' : 'nætter'} • ${formatCurrency(pricePerNight)}/nat</div>
                ` : ''}
              </div>
            </div>
          `;
        } else {
          card.innerHTML = `
            <div class="room-card-header">
              <div>
                <div class="room-card-name">${room.name}</div>
                <div class="room-card-capacity">Ikke tilgængelig</div>
              </div>
            </div>
          `;
        }

        roomsContainer.appendChild(card);
      });

      // Also update hidden select for form submission
      if (roomSelect) {
        roomSelect.innerHTML = '<option value="">Vælg værelse...</option>';
        this.rooms.forEach(room => {
          const isAvailable = availableRoomIds.includes(room.id);
          const option = document.createElement('option');
          option.value = room.id;
          option.textContent = room.name;
          if (!isAvailable) {
            option.disabled = true;
          }
          roomSelect.appendChild(option);
        });
      }
    }

    updateRoomDetails() {
      const roomSelect = document.getElementById('booking-room');
      if (!roomSelect || !roomSelect.value) {
        this.hideRoomDetails();
        return;
      }

      const selectedRoom = this.rooms.find(r => r.id === parseInt(roomSelect.value));
      if (selectedRoom) {
        this.selectedRoom = selectedRoom;
        this.showRoomDetails(selectedRoom);
      }
    }

    showRoomDetails(room) {
      let detailsEl = document.getElementById('room-details');
      if (!detailsEl) {
        detailsEl = document.createElement('div');
        detailsEl.id = 'room-details';
        detailsEl.className = 'room-details';
        const roomSelect = document.getElementById('booking-room');
        roomSelect.parentElement.appendChild(detailsEl);
      }

      const roomData = this.availableRooms.find(r => r.room_id === room.id);
      const nights = parseInt(document.getElementById('booking-nights')?.value) || 1;
      const totalPrice = roomData ? roomData.total_price : null;
      const pricePerNight = totalPrice ? Math.round(totalPrice / nights) : null;

      detailsEl.innerHTML = `
        <div class="room-details-content">
          <h4>${room.name}</h4>
          <p>Op til ${room.max_guests} gæster</p>
          ${totalPrice ? `
            <div class="room-price">
              <span class="price-total">${formatCurrency(totalPrice)}</span>
              <span class="price-details">for ${nights} ${nights === 1 ? 'nat' : 'nætter'}</span>
              ${pricePerNight ? `<span class="price-per-night">(${formatCurrency(pricePerNight)}/nat)</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
      detailsEl.style.display = 'block';
    }

    hideRoomDetails() {
      const detailsEl = document.getElementById('room-details');
      if (detailsEl) {
        detailsEl.style.display = 'none';
      }
    }

    showBookingSummary() {
      let summaryEl = document.getElementById('booking-summary');
      if (!summaryEl) {
        summaryEl = document.createElement('div');
        summaryEl.id = 'booking-summary';
        summaryEl.className = 'booking-summary';
        const form = document.getElementById('booking-form');
        const submitButton = form.querySelector('.btn-submit');
        if (submitButton) {
          submitButton.parentElement.insertBefore(summaryEl, submitButton);
        }
      }

      const dateInput = document.getElementById('booking-date');
      const nightsSelect = document.getElementById('booking-nights');
      const guestsSelect = document.getElementById('booking-guests');
      const roomSelect = document.getElementById('booking-room');

      if (!dateInput || !dateInput.value || !nightsSelect || !nightsSelect.value) {
        summaryEl.style.display = 'none';
        return;
      }

      const checkIn = dateInput.value;
      const nights = parseInt(nightsSelect.value);
      const guests = parseInt(guestsSelect?.value) || 2;
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);

      const selectedRoomId = roomSelect?.value;
      const selectedRoom = selectedRoomId ? this.rooms.find(r => r.id === parseInt(selectedRoomId)) : null;
      const roomData = selectedRoom ? this.availableRooms.find(r => r.room_id === selectedRoom.id) : null;
      const totalPrice = roomData ? roomData.total_price : null;

      summaryEl.innerHTML = `
        <div class="summary-content">
          <h4>Booking oversigt</h4>
          <div class="summary-row">
            <span class="summary-label">Ankomst:</span>
            <span class="summary-value">${formatDate(checkIn)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Afrejse:</span>
            <span class="summary-value">${formatDate(checkOut.toISOString().split('T')[0])}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Ophold:</span>
            <span class="summary-value">${nights} ${nights === 1 ? 'nat' : 'nætter'}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Gæster:</span>
            <span class="summary-value">${guests}</span>
          </div>
          ${selectedRoom ? `
            <div class="summary-row">
              <span class="summary-label">Værelse:</span>
              <span class="summary-value">${selectedRoom.name}</span>
            </div>
          ` : ''}
          ${totalPrice ? `
            <div class="summary-row summary-total">
              <span class="summary-label">Total pris:</span>
              <span class="summary-value">${formatCurrency(totalPrice)}</span>
            </div>
          ` : ''}
        </div>
      `;
      summaryEl.style.display = 'block';
    }

    hideBookingSummary() {
      const summaryEl = document.getElementById('booking-summary');
      if (summaryEl) {
        summaryEl.style.display = 'none';
      }
    }

    setLoadingState(loading) {
      this.isLoading = loading;
      const submitButton = document.querySelector('.btn-submit');
      if (submitButton) {
        submitButton.disabled = loading;
        if (loading) {
          submitButton.textContent = 'Tjekker tilgængelighed...';
          submitButton.classList.add('loading');
        } else {
          submitButton.textContent = 'Send forespørgsel';
          submitButton.classList.remove('loading');
        }
      }
    }

    resetForm() {
      this.selectedRoom = null;
      this.availableRooms = [];
      this.currentStep = 1;
      this.hideBookingSummary();
      this.hideRoomDetails();
      if (this.calendar) {
        this.calendar.selectedDates = { start: null, end: null };
      }
      // Reset to step 1
      this.goToStep(1);
      // Reset guest buttons
      document.querySelectorAll('.guest-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.guests === '2') {
          btn.classList.add('active');
        }
      });
    }

    async submitBooking(formData) {
      const bookingData = {
        room_id: parseInt(formData.get('room')) || null,
        check_in: formData.get('date') || this.calendar?.getSelectedDates().start,
        check_out: this.calculateCheckOut(formData.get('date'), formData.get('nights')) || this.calendar?.getSelectedDates().end,
        guests: parseInt(formData.get('guests')) || 2,
        guest_name: formData.get('name'),
        guest_email: formData.get('email'),
        guest_phone: formData.get('phone'),
        notes: formData.get('note'),
        source: 'website'
      };
      
      // Validation
      if (!bookingData.check_in || !bookingData.check_out) {
        throw new Error('Vælg venligst ankomst- og afrejsedato');
      }
      
      if (!bookingData.guest_name || !bookingData.guest_email) {
        throw new Error('Navn og email er påkrævet');
      }

      if (!bookingData.room_id) {
        throw new Error('Vælg venligst et værelse');
      }
      
      try {
        const response = await fetch(`${API_BASE}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Booking fejlede');
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Booking error:', error);
        throw error;
      }
    }

    calculateCheckOut(checkIn, nights) {
      if (!checkIn || !nights) return null;
      const date = new Date(checkIn);
      date.setDate(date.getDate() + parseInt(nights));
      return date.toISOString().split('T')[0];
    }
  }

  // Initialize booking engine
  const bookingEngine = new BookingEngine();

  // Update form submission handler
  const modalForm = document.getElementById('booking-form');
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(modalForm);
      const submitButton = modalForm.querySelector('.btn-submit');
      const originalText = submitButton.textContent;
      
      try {
        const submitText = submitButton.querySelector('.submit-text');
        const submitLoading = submitButton.querySelector('.submit-loading');
        
        if (submitText) submitText.style.display = 'none';
        if (submitLoading) submitLoading.style.display = 'inline-flex';
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        
        const result = await bookingEngine.submitBooking(formData);
        
        // Show success animation
        submitButton.style.background = 'var(--olive)';
        submitButton.innerHTML = '<span style="color: white;">✓ Booking oprettet!</span>';
        
        // Show success toast
        showToast(`Tak! Booking #${result.booking_id} er oprettet. Vi kontakter dig snarest.`, 'success');
        
        // Close modal after delay
        setTimeout(() => {
          modalForm.reset();
          bookingEngine.resetForm();
          if (window.closeModal) {
            closeModal();
          }
          submitButton.innerHTML = originalText;
          submitButton.style.background = '';
          submitButton.classList.remove('loading');
          submitButton.disabled = false;
        }, 3000);
        
      } catch (error) {
        const submitText = submitButton.querySelector('.submit-text');
        const submitLoading = submitButton.querySelector('.submit-loading');
        
        if (submitText) submitText.textContent = error.message || 'Fejl ved booking';
        if (submitLoading) submitLoading.style.display = 'none';
        submitButton.style.background = '#d32f2f';
        submitButton.classList.add('error');
        setTimeout(() => {
          submitButton.innerHTML = originalText;
          submitButton.style.background = '';
          submitButton.classList.remove('error', 'loading');
          submitButton.disabled = false;
        }, 4000);
      }
    });

    // Update summary when form changes
    const formInputs = modalForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('change', () => {
        bookingEngine.showBookingSummary();
      });
    });
  }

  // Export for global use
  window.BookingEngine = BookingEngine;
  window.BookingCalendar = BookingCalendar;
  window.showToast = showToast;

})();
