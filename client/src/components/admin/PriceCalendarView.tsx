import { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { da } from 'date-fns/locale';
import { revenueApi, roomsApi } from '../../services/api';
import type { Room } from '../../types';

interface CompetitorPrice {
  id: number;
  source: string;
  url: string;
  room_type: string;
  price: number;
  scraped_at: string;
  availability: 'available' | 'limited' | 'sold_out';
  search_checkin?: string | null;
  search_checkout?: string | null;
}

interface DatePrices {
  date: string;
  competitorPrices: CompetitorPrice[];
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  availability: 'high' | 'medium' | 'low';
}

const PriceCalendarView = () => {
  const [calendarData, setCalendarData] = useState<DatePrices[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filters
  const [filterGuests, setFilterGuests] = useState<number>(2);
  const [filterRoomType, setFilterRoomType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load rooms and competitor prices
      const [roomsData, pricesData] = await Promise.all([
        roomsApi.getAll(),
        revenueApi.getCompetitorPricesWithDates()
      ]);
      
      setRooms(roomsData);
      
      // Group prices by date
      const pricesByDate = new Map<string, CompetitorPrice[]>();
      
      pricesData.forEach((price: CompetitorPrice) => {
        if (price.search_checkin) {
          if (!pricesByDate.has(price.search_checkin)) {
            pricesByDate.set(price.search_checkin, []);
          }
          pricesByDate.get(price.search_checkin)!.push(price);
        }
      });
      
      // Create calendar data for current month
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      const calData: DatePrices[] = daysInMonth.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const prices = pricesByDate.get(dateStr) || [];
        
        const avgPrice = prices.length > 0
          ? Math.round(prices.reduce((sum, p) => sum + p.price, 0) / prices.length)
          : 0;
        
        const minPrice = prices.length > 0
          ? Math.min(...prices.map(p => p.price))
          : 0;
        
        const maxPrice = prices.length > 0
          ? Math.max(...prices.map(p => p.price))
          : 0;
        
        // Calculate availability based on "limited" or "sold_out" status
        const limitedCount = prices.filter(p => p.availability === 'limited').length;
        const soldOutCount = prices.filter(p => p.availability === 'sold_out').length;
        const totalCount = prices.length;
        
        let availability: 'high' | 'medium' | 'low' = 'high';
        if (soldOutCount > totalCount / 2) availability = 'low';
        else if (limitedCount > totalCount / 3) availability = 'medium';
        
        return {
          date: dateStr,
          competitorPrices: prices,
          averagePrice: avgPrice,
          minPrice,
          maxPrice,
          availability
        };
      });
      
      setCalendarData(calData);
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const getAvailabilityColor = (availability: 'high' | 'medium' | 'low') => {
    switch (availability) {
      case 'high': return '#4caf50'; // Green
      case 'medium': return '#ff9800'; // Orange
      case 'low': return '#f44336'; // Red
      default: return '#9e9e9e'; // Gray
    }
  };

  const getAvailabilityText = (availability: 'high' | 'medium' | 'low') => {
    switch (availability) {
      case 'high': return 'God ledighed';
      case 'medium': return 'Begrænset ledighed';
      case 'low': return 'Udsolgt/Få tilbage';
      default: return 'Ukendt';
    }
  };

  const selectedDateData = selectedDate
    ? calendarData.find(d => d.date === selectedDate)
    : null;

  if (loading) {
    return <div className="loading">📅 Indlæser kalender...</div>;
  }

  return (
    <div className="price-calendar-view">
      <div className="calendar-header">
        <button 
          className="month-nav-btn"
          onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))}
        >
          ← Forrige
        </button>
        
        <h2>{format(currentMonth, 'MMMM yyyy', { locale: da })}</h2>
        
        <button 
          className="month-nav-btn"
          onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
        >
          Næste →
        </button>
      </div>

      {/* Filters */}
      <div className="calendar-filters">
        <div className="filter-group">
          <label>👥 Antal gæster:</label>
          <select value={filterGuests} onChange={(e) => setFilterGuests(Number(e.target.value))}>
            <option value={1}>1 person</option>
            <option value={2}>2 personer</option>
            <option value={3}>3 personer</option>
            <option value={4}>4 personer</option>
          </select>
        </div>

        <div className="filter-group">
          <label>🏠 Værelsestype:</label>
          <select value={filterRoomType} onChange={(e) => setFilterRoomType(e.target.value)}>
            <option value="all">Alle typer</option>
            <option value="double">Dobbeltværelse</option>
            <option value="single">Enkeltværelse</option>
            <option value="suite">Suite</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Weekday headers */}
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}

        {/* Calendar days */}
        {calendarData.map(dayData => {
          const date = new Date(dayData.date);
          const dayOfWeek = date.getDay();
          const isSelected = selectedDate === dayData.date;
          const hasData = dayData.competitorPrices.length > 0;

          return (
            <div
              key={dayData.date}
              className={`calendar-day ${isSelected ? 'selected' : ''} ${hasData ? 'has-data' : 'no-data'}`}
              onClick={() => hasData && handleDateClick(dayData.date)}
              style={{
                gridColumn: calendarData.indexOf(dayData) === 0 ? dayOfWeek === 0 ? 7 : dayOfWeek : undefined
              }}
            >
              <div className="day-number">{format(date, 'd')}</div>
              
              {hasData && (
                <>
                  <div className="day-price">
                    {new Intl.NumberFormat('da-DK', { 
                      style: 'currency', 
                      currency: 'DKK',
                      minimumFractionDigits: 0 
                    }).format(dayData.averagePrice)}
                  </div>
                  
                  <div 
                    className="day-availability"
                    style={{ backgroundColor: getAvailabilityColor(dayData.availability) }}
                  >
                    {dayData.competitorPrices.length} priser
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDateData && (
        <div className="date-details-panel">
          <div className="details-header">
            <h3>📅 {format(new Date(selectedDate!), 'EEEE d. MMMM yyyy', { locale: da })}</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedDate(null)}
            >
              ✕
            </button>
          </div>

          <div className="details-summary">
            <div className="summary-stat">
              <span className="stat-label">Gennemsnitspris:</span>
              <span className="stat-value">
                {new Intl.NumberFormat('da-DK', { 
                  style: 'currency', 
                  currency: 'DKK',
                  minimumFractionDigits: 0 
                }).format(selectedDateData.averagePrice)}
              </span>
            </div>

            <div className="summary-stat">
              <span className="stat-label">Prisinterval:</span>
              <span className="stat-value">
                {selectedDateData.minPrice} - {selectedDateData.maxPrice} kr
              </span>
            </div>

            <div className="summary-stat">
              <span className="stat-label">Ledighed:</span>
              <span 
                className="stat-value"
                style={{ color: getAvailabilityColor(selectedDateData.availability) }}
              >
                {getAvailabilityText(selectedDateData.availability)}
              </span>
            </div>
          </div>

          {/* Comparison: Your Rooms vs Competitors */}
          <div className="price-comparison-section">
            <h4>💰 Sammenligning</h4>
            
            {/* Your Rooms */}
            <div className="comparison-group">
              <h5>Dine værelser:</h5>
              <div className="room-price-list">
                {rooms.map(room => (
                  <div key={room.id} className="room-price-item your-room">
                    <span className="room-name">{room.name}</span>
                    <span className="room-price">
                      {new Intl.NumberFormat('da-DK', { 
                        style: 'currency', 
                        currency: 'DKK',
                        minimumFractionDigits: 0 
                      }).format(room.base_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitors */}
            <div className="comparison-group">
              <h5>Konkurrenter:</h5>
              <div className="room-price-list">
                {selectedDateData.competitorPrices.map((comp, idx) => (
                  <div key={idx} className="room-price-item competitor-room">
                    <div className="room-info">
                      <span className="room-source">{comp.source}</span>
                      <span className="room-type">{comp.room_type}</span>
                    </div>
                    <div className="room-price-info">
                      <span className="room-price">
                        {new Intl.NumberFormat('da-DK', { 
                          style: 'currency', 
                          currency: 'DKK',
                          minimumFractionDigits: 0 
                        }).format(comp.price)}
                      </span>
                      <span 
                        className="room-availability"
                        style={{
                          backgroundColor: 
                            comp.availability === 'available' ? '#4caf50' :
                            comp.availability === 'limited' ? '#ff9800' : '#f44336'
                        }}
                      >
                        {comp.availability === 'available' ? 'Ledig' :
                         comp.availability === 'limited' ? 'Få tilbage' : 'Udsolgt'}
                      </span>
                    </div>
                    {comp.url && (
                      <a 
                        href={comp.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="verify-link-small"
                      >
                        🔗 Verificer
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceCalendarView;

