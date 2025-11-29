import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, startOfDay, isEqual } from 'date-fns';
import { da } from 'date-fns/locale';
import { availabilityApi } from '../services/api';
import type { AvailabilityItem, DateSelection } from '../types';
import './BookingCalendar.css';

interface BookingCalendarProps {
  onSelect: (dates: DateSelection) => void;
  selectedDates: DateSelection;
}

const BookingCalendar = ({ onSelect, selectedDates }: BookingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, AvailabilityItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragMovedRef = useRef(false);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(addMonths(currentMonth, 1));
      const data = await availabilityApi.getRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      
      const availabilityMap: Record<string, AvailabilityItem[]> = {};
      data.forEach(item => {
        if (!availabilityMap[item.date]) {
          availabilityMap[item.date] = [];
        }
        availabilityMap[item.date].push(item);
      });
      
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
      dragMovedRef.current = false;
      setHoverDate(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  useEffect(() => {
    if (!selectedDates.start) {
      setSelectionAnchor(null);
    }
  }, [selectedDates.start]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return;

    if (!selectedDates.start || selectedDates.end) {
      onSelect({ start: date, end: null });
      setSelectionAnchor(date);
      setHoverDate(null);
      return;
    }

    if (isBefore(date, selectedDates.start)) {
      onSelect({ start: date, end: selectedDates.start });
      setSelectionAnchor(date);
    } else if (isEqual(date, selectedDates.start)) {
      onSelect({ start: date, end: null });
      setSelectionAnchor(date);
    } else {
      onSelect({ start: selectedDates.start, end: date });
      setSelectionAnchor(selectedDates.start);
    }
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDates.start) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const startStr = format(selectedDates.start, 'yyyy-MM-dd');
    if (selectedDates.end) {
      const endStr = format(selectedDates.end, 'yyyy-MM-dd');
      return dateStr === startStr || dateStr === endStr;
    }
    return dateStr === startStr;
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedDates.start) return false;
    
    if (selectedDates.end) {
      const dateTime = date.getTime();
      const startTime = selectedDates.start.getTime();
      const endTime = selectedDates.end.getTime();
      return dateTime > startTime && dateTime < endTime;
    }
    
    if (hoverDate && date > selectedDates.start && date <= hoverDate) {
      return true;
    }
    
    return false;
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability[dateStr];
    // Allow selection even if no availability data (will be checked later)
    if (!avail || avail.length === 0) return true;
    return avail.some(a => a.available === 1 || (a.remaining_units !== undefined && a.remaining_units > 0));
  };

  const handleDateMouseDown = (day: Date, isPast: boolean, isCurrentMonth: boolean, isBooked: boolean) => (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    if (isPast || !isCurrentMonth || isBooked) return;
    event.preventDefault();
    const today = startOfDay(new Date());
    if (isBefore(day, today)) return;
    dragMovedRef.current = false;
    setIsDragging(true);
    setSelectionAnchor(day);
    // Don't override onClick logic - only set start if we don't already have one, or if we have both
    if (!selectedDates.start || selectedDates.end) {
      onSelect({ start: day, end: null });
    }
  };

  const handleDateMouseEnter = (day: Date, isPast: boolean, isCurrentMonth: boolean, isBooked: boolean) => {
    if (!isDragging || !selectionAnchor) return;
    if (isPast || !isCurrentMonth || isBooked) return;

    dragMovedRef.current = true;
    let startDate = selectionAnchor;
    let endDate = day;
    if (isBefore(day, selectionAnchor)) {
      startDate = day;
      endDate = selectionAnchor;
    }
    onSelect({ start: startDate, end: endDate });
    setHoverDate(day);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfDay(new Date(monthStart));
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = startOfDay(new Date(monthEnd));
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = startOfDay(new Date());

    return days.map(day => {
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isPast = isBefore(day, today);
      const isSelected = isDateSelected(day);
      const isInRange = isDateInRange(day);
      const isAvailable = isDateAvailable(day);
      const isBooked = !isAvailable && !isPast && isCurrentMonth;

      const dayClasses = [
        'calendar-day',
        !isCurrentMonth && 'other-month',
        isPast && 'past',
        isSelected && 'selected',
        isInRange && 'in-range',
        isBooked && 'booked',
        isAvailable && 'available',
      ].filter(Boolean).join(' ');

      const handleClick = !isPast && isCurrentMonth && !isBooked ? () => {
        if (dragMovedRef.current) {
          dragMovedRef.current = false;
          return;
        }
        handleDateClick(day);
      } : undefined;

      const handleMouseEnter = !isPast && isCurrentMonth && !isBooked
        ? () => {
            if (isDragging) {
              handleDateMouseEnter(day, isPast, isCurrentMonth, isBooked);
            } else if (selectedDates.start && !selectedDates.end) {
              setHoverDate(day);
            }
          }
        : undefined;

      return (
        <button
          key={day.toISOString()}
          type="button"
          className={dayClasses}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseDown={handleDateMouseDown(day, isPast, isCurrentMonth, isBooked)}
          disabled={isPast || !isCurrentMonth || isBooked}
          aria-label={format(day, 'EEEE, d. MMMM yyyy', { locale: da })}
          tabIndex={handleClick ? 0 : -1}
        >
          {format(day, 'd')}
        </button>
      );
    });
  };

  const renderSelectionInfo = () => {
    if (!selectedDates.start) return null;

    if (selectedDates.start && selectedDates.end) {
      const nights = Math.ceil(
        (selectedDates.end.getTime() - selectedDates.start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return (
        <div className="selection-info selection-complete">
          <div className="selection-row">
            <span className="selection-label">Ankomst:</span>
            <span className="selection-date">
              {format(selectedDates.start, 'EEEE, d. MMMM yyyy', { locale: da })}
            </span>
          </div>
          <div className="selection-row">
            <span className="selection-label">Afrejse:</span>
            <span className="selection-date">
              {format(selectedDates.end, 'EEEE, d. MMMM yyyy', { locale: da })}
            </span>
          </div>
          <div className="selection-row selection-total">
            <span className="selection-nights">📅 {nights} {nights === 1 ? 'nat' : 'nætter'}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="selection-info">
        <div className="selection-row">
          <span className="selection-label">Ankomst:</span>
          <span className="selection-date selected">
            {format(selectedDates.start, 'EEEE, d. MMMM yyyy', { locale: da })}
          </span>
        </div>
        <div className="selection-row selection-prompt">
          <span className="selection-prompt-text">👆 Klik nu på din afrejsedato</span>
        </div>
      </div>
    );
  };

  return (
    <div className="booking-calendar">
      {loading && <div className="calendar-loading">Indlæser tilgængelighed...</div>}
      
      <div className="calendar-header">
        <button 
          type="button"
          className="calendar-nav prev-month" 
          onClick={handlePreviousMonth}
          aria-label="Forrige måned"
        >
          ‹
        </button>
        <h3 className="calendar-month-year">
          {format(currentMonth, 'MMMM yyyy', { locale: da })}
        </h3>
        <button 
          type="button"
          className="calendar-nav next-month" 
          onClick={handleNextMonth}
          aria-label="Næste måned"
        >
          ›
        </button>
      </div>

      {renderSelectionInfo()}

      <div className="calendar-grid">
        {['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'].map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
        {renderCalendar()}
      </div>

      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-color available"></span> Ledig
        </span>
        <span className="legend-item">
          <span className="legend-color booked"></span> Optaget
        </span>
        <span className="legend-item">
          <span className="legend-color selected"></span> Valgt
        </span>
        <span className="legend-item">
          <span className="legend-color in-range"></span> I perioden
        </span>
      </div>
    </div>
  );
};

export default BookingCalendar;

