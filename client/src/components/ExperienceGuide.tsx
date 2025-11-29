import { useState, useEffect } from 'react';
import './ExperienceGuide.css';

interface Experience {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  duration?: string;
  distance?: string;
  price?: string;
  tags: string[];
  highlight?: boolean;
  bookable?: boolean;
  featured?: boolean;
  address?: string;
  link?: string;
  personalReason?: string;
  score?: number;
  bookingNotice?: string;
  availableSlots?: string[];
  seasonal?: boolean;
}

interface PersonalizedData {
  personalized: boolean;
  guestName?: string;
  isFirstVisit?: boolean;
  occasion?: string;
  segment?: string;
  personalGreeting?: string;
  featured?: Experience[];
  recommendations?: Experience[];
  allFeatured?: Experience[];
  allExperiences?: Experience[];
}

const API_BASE = 'http://localhost:3000/api';

// Helper to check if image is a URL or emoji
const isImageUrl = (image: string): boolean => {
  return image.startsWith('http://') || image.startsWith('https://');
};

// Render image - either as img tag or emoji
const renderImage = (image: string, alt: string, className: string) => {
  if (isImageUrl(image)) {
    return <img src={image} alt={alt} className={className} loading="lazy" />;
  }
  return <span className={`${className} emoji`}>{image}</span>;
};

const CATEGORIES = [
  { id: 'alle', label: 'Alle', icon: '✨' },
  { id: 'featured', label: 'Vores tilbud', icon: '🏠' },
  { id: 'natur', label: 'Natur', icon: '🌿' },
  { id: 'mad', label: 'Mad & Drikke', icon: '🍽️' },
  { id: 'kultur', label: 'Kultur', icon: '🎨' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'aktivitet', label: 'Aktiviteter', icon: '🚴' }
];

// Fallback data if API fails
const FALLBACK_FEATURED: Experience[] = [
  {
    id: 'laerkegaard-sauna',
    category: 'featured',
    title: 'Privat sauna ved havet',
    subtitle: 'Eksklusiv for Lærkegaards gæster',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    duration: '2 timer',
    price: '450 kr',
    tags: ['Eksklusiv', 'Wellness', 'Privat'],
    featured: true,
    bookable: true
  },
  {
    id: 'laerkegaard-picnic',
    category: 'featured',
    title: 'Gourmet picnickurv',
    subtitle: 'Tag Bornholm med ud i naturen',
    image: 'https://images.unsplash.com/photo-1526484631228-d8c29adff45f?w=800&q=80',
    price: '395 kr for 2 pers.',
    tags: ['Romantik', 'Mad', 'Natur'],
    featured: true,
    bookable: true
  },
  {
    id: 'laerkegaard-cykel',
    category: 'featured',
    title: 'Lån af el-cykler',
    subtitle: 'Udforsk øen ubesværet',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    price: '250 kr / dag',
    tags: ['Aktiv', 'Frihed'],
    featured: true,
    bookable: true
  },
  {
    id: 'laerkegaard-champagne',
    category: 'featured',
    title: 'Champagne & jordbær',
    subtitle: 'Overraskelse på værelset',
    image: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80',
    price: '495 kr',
    tags: ['Romantik', 'Fejring'],
    featured: true,
    bookable: true
  }
];

interface BookingForm {
  date: string;
  timeSlot: string;
  guests: number;
  notes: string;
}

// Helper to generate calendar days
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
  
  const days: (number | null)[] = [];
  
  // Add empty slots for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  
  // Add the days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  return days;
};

const MONTH_NAMES = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December'
];

const DAY_NAMES = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

const ExperienceGuide = () => {
  const [activeCategory, setActiveCategory] = useState('alle');
  const [savedExperiences, setSavedExperiences] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalizedData, setPersonalizedData] = useState<PersonalizedData | null>(null);
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [featuredExperiences, setFeaturedExperiences] = useState<Experience[]>(FALLBACK_FEATURED);
  
  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingExperience, setBookingExperience] = useState<Experience | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    date: '',
    timeSlot: '',
    guests: 2,
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Get token from URL if present
  const getTokenFromUrl = () => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/oplevelser\/([a-f0-9]+)/i);
    return match ? match[1] : null;
  };

  // Load saved from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('laerkegaard-saved-experiences');
    if (saved) {
      setSavedExperiences(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('laerkegaard-saved-experiences', JSON.stringify(savedExperiences));
  }, [savedExperiences]);

  // Fetch experiences
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = getTokenFromUrl();
      
      try {
        if (token) {
          // Fetch personalized recommendations
          const response = await fetch(`${API_BASE}/recommendations/personalized/${token}`);
          if (response.ok) {
            const data = await response.json();
            setPersonalizedData(data);
            setFeaturedExperiences(data.allFeatured || FALLBACK_FEATURED);
            setAllExperiences(data.allExperiences || []);
          } else {
            throw new Error('Failed to fetch personalized');
          }
        } else {
          // Fetch all experiences
          const response = await fetch(`${API_BASE}/recommendations/experiences`);
          if (response.ok) {
            const data = await response.json();
            setFeaturedExperiences(data.featured || FALLBACK_FEATURED);
            setAllExperiences(data.experiences || []);
          }
        }
      } catch (error) {
        console.error('Error fetching experiences:', error);
        // Use fallback data
        setFeaturedExperiences(FALLBACK_FEATURED);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedExperiences(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // Open booking modal
  const handleBookClick = (exp: Experience, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookingExperience(exp);
    setBookingForm({
      date: '',
      timeSlot: '',
      guests: 2,
      notes: ''
    });
    setBookingSuccess(false);
    setBookingError(null);
    setAvailableSlots(exp.availableSlots || []);
    setShowBookingModal(true);
  };

  // Check availability when date changes
  const handleDateChange = async (date: string) => {
    setBookingForm(prev => ({ ...prev, date, timeSlot: '' }));
    
    if (bookingExperience?.availableSlots && date) {
      try {
        const response = await fetch(
          `${API_BASE}/experience-bookings/availability/${bookingExperience.id}/${date}`
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.availableSlots || []);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailableSlots(bookingExperience.availableSlots || []);
      }
    }
  };

  // Submit booking
  const handleBookingSubmit = async () => {
    if (!bookingExperience) return;
    
    // Get guest info from preferences token if available
    const token = getTokenFromUrl();
    let guestName = '';
    let guestEmail = '';
    let guestPhone = '';
    
    if (personalizedData?.guestName) {
      guestName = personalizedData.guestName;
    }
    
    // Validate
    if (!bookingForm.date) {
      setBookingError('Vælg venligst en dato');
      return;
    }
    
    if (bookingExperience.availableSlots && !bookingForm.timeSlot) {
      setBookingError('Vælg venligst et tidspunkt');
      return;
    }
    
    setBookingLoading(true);
    setBookingError(null);
    
    try {
      const response = await fetch(`${API_BASE}/experience-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_id: bookingExperience.id,
          guest_name: guestName || 'Gæst',
          guest_email: guestEmail || undefined,
          guest_phone: guestPhone || undefined,
          booking_date: bookingForm.date,
          time_slot: bookingForm.timeSlot || undefined,
          guests: bookingForm.guests,
          notes: bookingForm.notes || undefined
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Booking fejlede');
      }
      
      setBookingSuccess(true);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Der opstod en fejl');
    } finally {
      setBookingLoading(false);
    }
  };

  // Get min date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if a date is in the past
  const isDateInPast = (year: number, month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  };

  // Handle calendar day click
  const handleCalendarDayClick = (day: number) => {
    if (isDateInPast(calendarDate.year, calendarDate.month, day)) return;
    
    const dateStr = `${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    handleDateChange(dateStr);
  };

  // Navigate calendar months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      let newMonth = direction === 'next' ? prev.month + 1 : prev.month - 1;
      let newYear = prev.year;
      
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      
      return { year: newYear, month: newMonth };
    });
  };

  // Check if can navigate to previous month
  const canNavigatePrev = () => {
    const today = new Date();
    return calendarDate.year > today.getFullYear() || 
           (calendarDate.year === today.getFullYear() && calendarDate.month > today.getMonth());
  };

  // Format selected date for display
  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getFilteredExperiences = () => {
    const allExp = [...featuredExperiences, ...allExperiences];
    
    if (showSaved) {
      return allExp.filter(exp => savedExperiences.includes(exp.id));
    }
    if (activeCategory === 'alle') {
      return allExperiences;
    }
    if (activeCategory === 'featured') {
      return featuredExperiences;
    }
    return allExperiences.filter(exp => exp.category === activeCategory);
  };

  const filteredExperiences = getFilteredExperiences();

  if (loading) {
    return (
      <div className="guide-page">
        <div className="guide-loading">
          <div className="loading-logo">LÆRKEGAARD</div>
          <div className="loading-spinner"></div>
          <p>Finder oplevelser til dig...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guide-page">
      {/* Header */}
      <header className="guide-header">
        <div className="header-bg"></div>
        <div className="header-content">
          <div className="header-logo">LÆRKEGAARD</div>
          <h1>Oplev Bornholm</h1>
          <p>Din guide til solskinsøens bedste oplevelser</p>
          <div className="header-location">
            <span>📍</span> Allinge · Nordbornholm
          </div>
        </div>
      </header>

      {/* Personalized Welcome */}
      {personalizedData?.personalized && personalizedData.personalGreeting && (
        <section className="personalized-section">
          <div className="section-container">
            <div className="personalized-card">
              <div className="personalized-badge">✨ Personligt udvalgt til dig</div>
              <p className="personalized-greeting">{personalizedData.personalGreeting}</p>
              
              {personalizedData.recommendations && personalizedData.recommendations.length > 0 && (
                <div className="personalized-recommendations">
                  <h3>Vi anbefaler til dit ophold</h3>
                  <div className="recommendation-chips">
                    {personalizedData.recommendations.slice(0, 4).map(rec => (
                      <button
                        key={rec.id}
                        className="recommendation-chip"
                        onClick={() => setSelectedExperience(rec)}
                      >
                        <span className="chip-icon">{rec.image}</span>
                        <span className="chip-text">
                          <strong>{rec.title}</strong>
                          {rec.personalReason && <em>{rec.personalReason}</em>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured - Lærkegaards egne tilbud */}
      <section className="featured-section">
        <div className="section-container">
          <div className="featured-header">
            <h2 className="section-title">
              <span className="title-icon">🏠</span>
              Hos Lærkegaard
            </h2>
            <p className="featured-subtitle">Eksklusive oplevelser kun for vores gæster</p>
          </div>
          <div className="featured-grid">
            {featuredExperiences.slice(0, 4).map(exp => (
              <div 
                key={exp.id} 
                className="featured-card"
                onClick={() => setSelectedExperience(exp)}
                role="button"
                tabIndex={0}
                aria-label={`Læs mere om ${exp.title}`}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedExperience(exp)}
              >
                <div className="featured-badge-corner">Kun hos os</div>
                <div className="featured-image">
                  {renderImage(exp.image, exp.title, 'featured-img')}
                </div>
                <div className="featured-content">
                  <h3>{exp.title}</h3>
                  <p>{exp.subtitle}</p>
                  {exp.price && <span className="featured-price">{exp.price}</span>}
                </div>
                {exp.bookable && (
                  <button 
                    className="featured-book-btn"
                    onClick={(e) => handleBookClick(exp, e)}
                  >
                    Book nu
                  </button>
                )}
              </div>
            ))}
          </div>
          {featuredExperiences.length > 4 && (
            <button 
              className="see-all-featured"
              onClick={() => { setActiveCategory('featured'); setShowSaved(false); }}
            >
              Se alle vores tilbud ({featuredExperiences.length}) →
            </button>
          )}
        </div>
      </section>

      {/* Highlights from area */}
      <section className="highlights-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="title-icon">⭐</span>
            Oplevelser i området
          </h2>
          <div className="highlights-scroll">
            {allExperiences.filter(exp => exp.highlight).slice(0, 6).map(exp => (
              <div 
                key={exp.id} 
                className="highlight-card"
                onClick={() => setSelectedExperience(exp)}
                role="button"
                tabIndex={0}
                aria-label={`Læs mere om ${exp.title}`}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedExperience(exp)}
              >
                <div className="highlight-image">
                  {renderImage(exp.image, exp.title, 'highlight-img')}
                </div>
                <div className="highlight-content">
                  <span className="highlight-category">
                    {CATEGORIES.find(c => c.id === exp.category)?.icon} {CATEGORIES.find(c => c.id === exp.category)?.label}
                  </span>
                  <h3>{exp.title}</h3>
                  <p>{exp.subtitle}</p>
                  {exp.distance && <span className="highlight-distance">📍 {exp.distance}</span>}
                </div>
                <button 
                  className={`save-btn ${savedExperiences.includes(exp.id) ? 'saved' : ''}`}
                  onClick={(e) => toggleSave(exp.id, e)}
                  aria-label={savedExperiences.includes(exp.id) ? 'Fjern fra gemte' : 'Gem oplevelse'}
                >
                  {savedExperiences.includes(exp.id) ? '❤️' : '🤍'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="filter-section">
        <div className="section-container">
          <div className="filter-row">
            <div className="category-filters">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-btn ${activeCategory === cat.id && !showSaved ? 'active' : ''}`}
                  onClick={() => { setActiveCategory(cat.id); setShowSaved(false); }}
                  aria-pressed={activeCategory === cat.id && !showSaved}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>
            <button 
              className={`saved-filter-btn ${showSaved ? 'active' : ''}`}
              onClick={() => setShowSaved(!showSaved)}
              aria-pressed={showSaved}
            >
              <span>❤️</span>
              <span>Mine gemte</span>
              {savedExperiences.length > 0 && (
                <span className="saved-count">{savedExperiences.length}</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Experience Grid */}
      <section className="experiences-section">
        <div className="section-container">
          {showSaved && savedExperiences.length === 0 ? (
            <div className="empty-saved">
              <span className="empty-icon">🤍</span>
              <h3>Ingen gemte oplevelser</h3>
              <p>Tryk på hjertet for at gemme oplevelser du vil huske</p>
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="empty-saved">
              <span className="empty-icon">🔍</span>
              <h3>Ingen oplevelser fundet</h3>
              <p>Prøv en anden kategori</p>
            </div>
          ) : (
            <div className="experiences-grid">
              {filteredExperiences.map(exp => (
                <div 
                  key={exp.id} 
                  className={`experience-card ${exp.featured ? 'is-featured' : ''}`}
                  onClick={() => setSelectedExperience(exp)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Læs mere om ${exp.title}`}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedExperience(exp)}
                >
                  {exp.featured && <div className="card-featured-badge">Lærkegaard</div>}
                  <div className="card-header">
                    <div className="card-image">
                      {renderImage(exp.image, exp.title, 'card-img')}
                    </div>
                    <button 
                      className={`save-btn ${savedExperiences.includes(exp.id) ? 'saved' : ''}`}
                      onClick={(e) => toggleSave(exp.id, e)}
                      aria-label={savedExperiences.includes(exp.id) ? 'Fjern fra gemte' : 'Gem oplevelse'}
                    >
                      {savedExperiences.includes(exp.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="card-body">
                    <h3>{exp.title}</h3>
                    <p className="card-subtitle">{exp.subtitle}</p>
                    <div className="card-meta">
                      {exp.distance && <span className="meta-item">📍 {exp.distance}</span>}
                      {exp.duration && <span className="meta-item">⏱️ {exp.duration}</span>}
                      {exp.price && <span className="meta-item price">💰 {exp.price}</span>}
                    </div>
                    <div className="card-tags">
                      {exp.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {exp.bookable && (
                    <div className="card-footer">
                      <span className="bookable-badge">📅 Kan bookes</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bornholm Info Section */}
      <section className="info-section">
        <div className="section-container">
          <div className="info-card">
            <div className="info-icon">🌞</div>
            <h3>Vidste du?</h3>
            <p>Bornholm har flest solskinstimer i Danmark - op til 300 timer mere om året end resten af landet. Derfor kaldes øen også "Solskinsøen"!</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="section-container">
          <div className="contact-card">
            <div className="contact-icon">💬</div>
            <h3>Brug for hjælp?</h3>
            <p>Vi hjælper gerne med at planlægge din perfekte dag på Bornholm. Kontakt os for tips og reservationer.</p>
            <div className="contact-buttons">
              <a href="tel:+4512345678" className="contact-btn">
                <span>📞</span> Ring til os
              </a>
              <a href="sms:+4512345678" className="contact-btn">
                <span>💬</span> Send SMS
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="guide-footer">
        <div className="footer-logo">LÆRKEGAARD</div>
        <p>Lærkegårdsvej 5 · 3770 Allinge · Bornholm</p>
        <p className="footer-tagline">Et øjeblik af ro på solskinsøen</p>
      </footer>

      {/* Experience Detail Modal */}
      {selectedExperience && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedExperience(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="experience-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setSelectedExperience(null)}
              aria-label="Luk"
            >
              ✕
            </button>
            
            <div className={`modal-header ${selectedExperience.featured ? 'featured-modal' : ''}`}>
              {selectedExperience.featured && (
                <div className="modal-featured-badge">🏠 Kun hos Lærkegaard</div>
              )}
              <div className="modal-image">
                {renderImage(selectedExperience.image, selectedExperience.title, 'modal-img')}
              </div>
              <button 
                className={`save-btn large ${savedExperiences.includes(selectedExperience.id) ? 'saved' : ''}`}
                onClick={(e) => toggleSave(selectedExperience.id, e)}
                aria-label={savedExperiences.includes(selectedExperience.id) ? 'Fjern fra gemte' : 'Gem oplevelse'}
              >
                {savedExperiences.includes(selectedExperience.id) ? '❤️ Gemt' : '🤍 Gem'}
              </button>
            </div>

            <div className="modal-body">
              {!selectedExperience.featured && (
                <span className="modal-category">
                  {CATEGORIES.find(c => c.id === selectedExperience.category)?.icon} {CATEGORIES.find(c => c.id === selectedExperience.category)?.label}
                </span>
              )}
              <h2 id="modal-title">{selectedExperience.title}</h2>
              <p className="modal-subtitle">{selectedExperience.subtitle}</p>
              
              {selectedExperience.personalReason && (
                <div className="modal-personal-reason">
                  <span>✨</span> {selectedExperience.personalReason}
                </div>
              )}
              
              <div className="modal-meta">
                {selectedExperience.distance && (
                  <div className="meta-block">
                    <span className="meta-icon">📍</span>
                    <div>
                      <span className="meta-label">Afstand</span>
                      <span className="meta-value">{selectedExperience.distance}</span>
                    </div>
                  </div>
                )}
                {selectedExperience.duration && (
                  <div className="meta-block">
                    <span className="meta-icon">⏱️</span>
                    <div>
                      <span className="meta-label">Varighed</span>
                      <span className="meta-value">{selectedExperience.duration}</span>
                    </div>
                  </div>
                )}
                {selectedExperience.price && (
                  <div className="meta-block">
                    <span className="meta-icon">💰</span>
                    <div>
                      <span className="meta-label">Pris</span>
                      <span className="meta-value">{selectedExperience.price}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedExperience.description && (
                <p className="modal-description">{selectedExperience.description}</p>
              )}

              {selectedExperience.bookingNotice && (
                <div className="modal-notice">
                  <span>ℹ️</span> {selectedExperience.bookingNotice}
                </div>
              )}

              {selectedExperience.availableSlots && (
                <div className="modal-slots">
                  <span className="slots-label">Ledige tider:</span>
                  <div className="slots-grid">
                    {selectedExperience.availableSlots.map(slot => (
                      <button key={slot} className="slot-btn">{slot}</button>
                    ))}
                  </div>
                </div>
              )}

              {selectedExperience.address && (
                <div className="modal-address">
                  <span className="address-icon">📍</span>
                  <span>{selectedExperience.address}</span>
                </div>
              )}

              <div className="modal-tags">
                {selectedExperience.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="modal-actions">
                {selectedExperience.featured && selectedExperience.bookable && (
                  <button 
                    className="book-btn primary"
                    onClick={(e) => {
                      setSelectedExperience(null);
                      handleBookClick(selectedExperience, e);
                    }}
                  >
                    <span>📅</span> Book hos Lærkegaard
                  </button>
                )}
                {selectedExperience.link && (
                  <a 
                    href={selectedExperience.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link-btn"
                  >
                    <span>🔗</span> Besøg hjemmeside
                  </a>
                )}
                {!selectedExperience.featured && selectedExperience.bookable && (
                  <button className="book-btn">
                    <span>📅</span> Book denne oplevelse
                  </button>
                )}
                {selectedExperience.address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedExperience.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-btn"
                  >
                    <span>🗺️</span> Vis på kort
                  </a>
                )}
              </div>
              
              {selectedExperience.bookable && !selectedExperience.featured && (
                <p className="book-note">Kontakt receptionen for reservation</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && bookingExperience && (
        <div 
          className="modal-overlay booking-modal-overlay" 
          onClick={() => setShowBookingModal(false)}
        >
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowBookingModal(false)}
            >
              ✕
            </button>
            
            {bookingSuccess ? (
              <div className="booking-success">
                <div className="success-icon">✓</div>
                <h2>Tak for din booking!</h2>
                <p>Vi har modtaget din forespørgsel på:</p>
                <div className="success-details">
                  <span className="success-exp-icon">{bookingExperience.image}</span>
                  <strong>{bookingExperience.title}</strong>
                  <span>{bookingForm.date} {bookingForm.timeSlot && `kl. ${bookingForm.timeSlot}`}</span>
                </div>
                <p className="success-note">
                  Vi bekræfter din booking hurtigst muligt via email eller SMS.
                </p>
                <button 
                  className="success-close-btn"
                  onClick={() => setShowBookingModal(false)}
                >
                  Luk
                </button>
              </div>
            ) : (
              <>
                <div className="booking-modal-header">
                  <span className="booking-exp-icon">{bookingExperience.image}</span>
                  <div>
                    <h2>Book {bookingExperience.title}</h2>
                    <p>{bookingExperience.subtitle}</p>
                  </div>
                </div>
                
                <div className="booking-modal-body">
                  {bookingExperience.bookingNotice && (
                    <div className="booking-notice">
                      <span>ℹ️</span> {bookingExperience.bookingNotice}
                    </div>
                  )}
                  
                  {/* Custom Calendar */}
                  <div className="booking-field">
                    <label>Vælg dato</label>
                    <div className="oeliv-calendar">
                      <div className="calendar-header">
                        <button 
                          type="button"
                          className="calendar-nav-btn"
                          onClick={() => navigateMonth('prev')}
                          disabled={!canNavigatePrev()}
                          aria-label="Forrige måned"
                        >
                          ←
                        </button>
                        <span className="calendar-month-year">
                          {MONTH_NAMES[calendarDate.month]} {calendarDate.year}
                        </span>
                        <button 
                          type="button"
                          className="calendar-nav-btn"
                          onClick={() => navigateMonth('next')}
                          aria-label="Næste måned"
                        >
                          →
                        </button>
                      </div>
                      
                      <div className="calendar-weekdays">
                        {DAY_NAMES.map(day => (
                          <span key={day} className="weekday">{day}</span>
                        ))}
                      </div>
                      
                      <div className="calendar-days">
                        {generateCalendarDays(calendarDate.year, calendarDate.month).map((day, index) => {
                          if (day === null) {
                            return <span key={`empty-${index}`} className="calendar-day empty" />;
                          }
                          
                          const dateStr = `${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isPast = isDateInPast(calendarDate.year, calendarDate.month, day);
                          const isSelected = bookingForm.date === dateStr;
                          const isToday = new Date().toISOString().split('T')[0] === dateStr;
                          
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`calendar-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                              onClick={() => handleCalendarDayClick(day)}
                              disabled={isPast}
                              aria-label={`${day}. ${MONTH_NAMES[calendarDate.month]}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      
                      {bookingForm.date && (
                        <div className="calendar-selected">
                          <span className="selected-icon">📅</span>
                          <span className="selected-date">{formatSelectedDate(bookingForm.date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Time Slots */}
                  {bookingExperience.availableSlots && (
                    <div className="booking-field">
                      <label>Vælg tidspunkt</label>
                      {!bookingForm.date ? (
                        <p className="field-hint">Vælg først en dato ovenfor</p>
                      ) : availableSlots.length === 0 ? (
                        <div className="no-slots-message">
                          <span>😔</span>
                          <p>Ingen ledige tider denne dag</p>
                          <small>Prøv en anden dato</small>
                        </div>
                      ) : (
                        <div className="time-slot-grid">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              className={`time-slot-btn ${bookingForm.timeSlot === slot ? 'selected' : ''}`}
                              onClick={() => setBookingForm(prev => ({ ...prev, timeSlot: slot }))}
                            >
                              <span className="slot-time">{slot}</span>
                              <span className="slot-label">Ledig</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Guests Selector */}
                  <div className="booking-field">
                    <label>Antal personer</label>
                    <div className="guests-selector">
                      <button
                        type="button"
                        className="guest-btn"
                        onClick={() => setBookingForm(prev => ({ 
                          ...prev, 
                          guests: Math.max(1, prev.guests - 1) 
                        }))}
                        disabled={bookingForm.guests <= 1}
                        aria-label="Fjern person"
                      >
                        <span>−</span>
                      </button>
                      <div className="guests-display">
                        <span className="guests-count">{bookingForm.guests}</span>
                        <span className="guests-label">{bookingForm.guests === 1 ? 'person' : 'personer'}</span>
                      </div>
                      <button
                        type="button"
                        className="guest-btn"
                        onClick={() => setBookingForm(prev => ({ 
                          ...prev, 
                          guests: Math.min(10, prev.guests + 1) 
                        }))}
                        disabled={bookingForm.guests >= 10}
                        aria-label="Tilføj person"
                      >
                        <span>+</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="booking-field">
                    <label>Bemærkninger <span className="optional">(valgfrit)</span></label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Særlige ønsker, allergier, overraskelser..."
                      className="booking-textarea"
                      rows={3}
                    />
                  </div>
                  
                  {/* Price Summary */}
                  {bookingExperience.price && (
                    <div className="booking-price-summary">
                      <div className="price-row">
                        <span className="price-label">{bookingExperience.title}</span>
                        <span className="price-value">{bookingExperience.price}</span>
                      </div>
                      {bookingForm.guests > 1 && (
                        <div className="price-row guests-row">
                          <span className="price-label">Antal: {bookingForm.guests} personer</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {bookingError && (
                    <div className="booking-error">
                      <span>⚠️</span> {bookingError}
                    </div>
                  )}
                </div>
                
                <div className="booking-modal-footer">
                  <button 
                    className="booking-cancel-btn"
                    onClick={() => setShowBookingModal(false)}
                  >
                    Annuller
                  </button>
                  <button 
                    className="booking-submit-btn"
                    onClick={handleBookingSubmit}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Sender...' : 'Send forespørgsel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceGuide;
