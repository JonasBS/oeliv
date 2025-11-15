// Booking Engine Frontend
(function() {
  'use strict';

  // Use environment variable if set, otherwise use current origin
  // For production, set window.API_BASE_URL in HTML before loading this script
  const API_BASE = (window.API_BASE_URL || window.location.origin) + '/api';
  
  // ========================================
  // Calendar Component
  // ========================================
  
  class BookingCalendar {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      this.options = {
        minDate: options.minDate || new Date(),
        maxDate: options.maxDate || this.addMonths(new Date(), 12),
        selectMode: options.selectMode || 'range', // 'single' or 'range'
        onSelect: options.onSelect || null,
        ...options
      };
      this.selectedDates = { start: null, end: null };
      this.availability = {};
      this.init();
    }

    addMonths(date, months) {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    }

    async init() {
      await this.loadAvailability();
      this.render();
    }

    async loadAvailability() {
      const start = this.formatDate(this.options.minDate);
      const end = this.formatDate(this.options.maxDate);
      
      try {
        const response = await fetch(`${API_BASE}/availability?start_date=${start}&end_date=${end}`);
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
      }
    }

    formatDate(date) {
      return date.toISOString().split('T')[0];
    }

    render() {
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      this.container.innerHTML = `
        <div class="booking-calendar">
          <div class="calendar-header">
            <button class="calendar-nav prev-month" type="button">‹</button>
            <h3 class="calendar-month-year"></h3>
            <button class="calendar-nav next-month" type="button">›</button>
          </div>
          <div class="calendar-grid"></div>
          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-color available"></span> Ledig</span>
            <span class="legend-item"><span class="legend-color booked"></span> Optaget</span>
            <span class="legend-item"><span class="legend-color selected"></span> Valgt</span>
          </div>
        </div>
      `;
      
      this.currentMonth = currentMonth;
      this.renderMonth(currentMonth);
      
      // Event listeners
      this.container.querySelector('.prev-month').addEventListener('click', () => {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.renderMonth(this.currentMonth);
      });
      
      this.container.querySelector('.next-month').addEventListener('click', () => {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.renderMonth(this.currentMonth);
      });
    }

    renderMonth(month) {
      const monthYear = month.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
      this.container.querySelector('.calendar-month-year').textContent = monthYear;
      
      const grid = this.container.querySelector('.calendar-grid');
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
      const isPast = date < new Date().setHours(0, 0, 0, 0);
      const isSelected = this.isDateSelected(date);
      
      day.className = 'calendar-day';
      if (!isCurrentMonth) day.classList.add('other-month');
      if (isPast) day.classList.add('past');
      if (isSelected) day.classList.add('selected');
      
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
      
      if (!isPast && isCurrentMonth) {
        day.addEventListener('click', () => this.selectDate(date));
      }
      
      return day;
    }

    isDateSelected(date) {
      if (!this.selectedDates.start) return false;
      if (this.options.selectMode === 'single') {
        return this.formatDate(date) === this.formatDate(this.selectedDates.start);
      }
      if (!this.selectedDates.end) {
        return this.formatDate(date) === this.formatDate(this.selectedDates.start);
      }
      const dateStr = this.formatDate(date);
      const startStr = this.formatDate(this.selectedDates.start);
      const endStr = this.formatDate(this.selectedDates.end);
      return dateStr >= startStr && dateStr <= endStr;
    }

    selectDate(date) {
      if (this.options.selectMode === 'single') {
        this.selectedDates.start = date;
        this.selectedDates.end = null;
      } else {
        if (!this.selectedDates.start || this.selectedDates.end) {
          this.selectedDates.start = date;
          this.selectedDates.end = null;
        } else {
          if (date < this.selectedDates.start) {
            this.selectedDates.end = this.selectedDates.start;
            this.selectedDates.start = date;
          } else {
            this.selectedDates.end = date;
          }
        }
      }
      
      this.renderMonth(this.currentMonth);
      
      if (this.options.onSelect) {
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
  // Booking Form Handler
  // ========================================
  
  class BookingEngine {
    constructor() {
      this.calendar = null;
      this.selectedRoom = null;
      this.bookingData = {};
      this.rooms = [];
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
              }
            }
          });
        });
        observer.observe(bookingModal, { attributes: true });
      }
    }

    async loadRooms() {
      try {
        const response = await fetch(`${API_BASE}/rooms`);
        this.rooms = await response.json();
        this.updateRoomSelect();
      } catch (error) {
        console.error('Error loading rooms:', error);
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
          roomSelect.appendChild(option);
        });
      }
    }

    initCalendar() {
      const calendarContainer = document.getElementById('booking-calendar');
      if (!calendarContainer) {
        // Create calendar container
        const form = document.getElementById('booking-form');
        if (form) {
          const calendarDiv = document.createElement('div');
          calendarDiv.id = 'booking-calendar';
          calendarDiv.className = 'booking-calendar-container';
          form.insertBefore(calendarDiv, form.firstChild);
        }
      }
      
      if (calendarContainer) {
        this.calendar = new BookingCalendar('booking-calendar', {
          onSelect: (dates) => {
            this.handleDateSelection(dates);
          }
        });
      }
    }

    async handleDateSelection(dates) {
      if (!dates.start || !dates.end) return;
      
      // Check availability
      const guests = parseInt(document.getElementById('booking-guests')?.value) || 2;
      const roomId = document.getElementById('booking-room')?.value;
      
      try {
        const response = await fetch(`${API_BASE}/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_in: dates.start,
            check_out: dates.end,
            guests: guests,
            room_id: roomId || null
          })
        });
        
        const data = await response.json();
        
        if (data.available && data.available.length > 0) {
          this.updateAvailableRooms(data.available, dates);
        } else {
          this.showNoAvailability();
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      }
    }

    updateAvailableRooms(rooms, dates) {
      // Update room selector with available rooms
      const roomSelect = document.getElementById('booking-room');
      if (roomSelect && this.rooms.length > 0) {
        // Clear and rebuild options
        roomSelect.innerHTML = '<option value="">Vælg værelse...</option>';
        
        const availableRoomIds = rooms.map(r => r.room_id);
        
        this.rooms.forEach(room => {
          const isAvailable = availableRoomIds.includes(room.id);
          const option = document.createElement('option');
          option.value = room.id;
          
          if (isAvailable) {
            const roomData = rooms.find(r => r.room_id === room.id);
            const price = roomData ? roomData.total_price : null;
            option.textContent = `${room.name} (op til ${room.max_guests} gæster)${price ? ` - ${price} DKK` : ''}`;
          } else {
            option.textContent = `${room.name} - Ikke tilgængelig`;
            option.disabled = true;
          }
          
          roomSelect.appendChild(option);
        });
      }
      
      // Update dates in form
      const dateInput = document.getElementById('booking-date');
      if (dateInput && dates.start) {
        dateInput.value = dates.start;
      }
      
      // Calculate nights
      if (dates.start && dates.end) {
        const nights = this.calculateNights(dates.start, dates.end);
        const nightsSelect = document.getElementById('booking-nights');
        if (nightsSelect) {
          nightsSelect.value = nights;
        }
      }
    }

    calculateNights(start, end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    showNoAvailability() {
      // Show message that no rooms are available
      console.log('No availability for selected dates');
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
      
      if (!bookingData.check_in || !bookingData.check_out) {
        throw new Error('Please select dates');
      }
      
      if (!bookingData.guest_name || !bookingData.guest_email) {
        throw new Error('Name and email are required');
      }
      
      try {
        const response = await fetch(`${API_BASE}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Booking failed');
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
        submitButton.textContent = 'Booker...';
        submitButton.disabled = true;
        
        const result = await bookingEngine.submitBooking(formData);
        
        // Show success
        if (window.showToast) {
          showToast(`Tak! Booking #${result.booking_id} er oprettet. Vi kontakter dig snarest.`);
        }
        
        // Close modal
        setTimeout(() => {
          modalForm.reset();
          if (window.closeModal) {
            closeModal();
          }
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }, 2000);
        
      } catch (error) {
        submitButton.textContent = error.message || 'Fejl ved booking';
        submitButton.style.background = '#d32f2f';
        setTimeout(() => {
          submitButton.textContent = originalText;
          submitButton.style.background = '';
          submitButton.disabled = false;
        }, 3000);
      }
    });
  }

  // Export for global use
  window.BookingEngine = BookingEngine;
  window.BookingCalendar = BookingCalendar;

})();
