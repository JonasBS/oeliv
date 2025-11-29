import { useState, useEffect } from 'react';
import './PreferencesForm.css';

interface PreferencesData {
  booking_id: number;
  guest_name: string;
  room_name: string;
  room_unit_label: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  already_submitted: boolean;
}

const API_BASE = 'http://localhost:3000/api';

const PreferencesForm = () => {
  // Get token from URL path
  const [token] = useState(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/preferences\/([a-f0-9]+)/i);
    return match ? match[1] : null;
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<PreferencesData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [form, setForm] = useState({
    room_temperature: '',
    floor_heating: false,
    extra_pillows: false,
    extra_blankets: false,
    pillow_type: '',
    blackout_curtains: false,
    has_allergies: false,
    allergies_details: '',
    has_dietary_requirements: false,
    dietary_requirements: [] as string[],
    dietary_details: '',
    breakfast_in_room: false,
    breakfast_time: '',
    breakfast_type: '',
    breakfast_extras: [] as string[],
    coffee_preference: '',
    is_special_occasion: false,
    occasion_type: '',
    occasion_details: '',
    wants_flowers: false,
    wants_champagne: false,
    wants_chocolate: false,
    other_requests: '',
    estimated_arrival_time: '',
    needs_early_checkin: false,
    needs_late_checkout: false,
    needs_parking: false,
    preferred_contact: 'email',
    do_not_disturb_until: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${API_BASE}/preferences/form/${token}`);
        if (!response.ok) {
          throw new Error('Link er ugyldigt eller udløbet');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunne ikke hente formular');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  const handleSubmit = async () => {
    if (!token) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/preferences/form/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke gemme præferencer');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDietaryToggle = (diet: string) => {
    setForm(prev => ({
      ...prev,
      dietary_requirements: prev.dietary_requirements.includes(diet)
        ? prev.dietary_requirements.filter(d => d !== diet)
        : [...prev.dietary_requirements, diet]
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const calculateNights = () => {
    if (!data) return 0;
    const checkIn = new Date(data.check_in);
    const checkOut = new Date(data.check_out);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  if (loading) {
    return (
      <div className="pref-page">
        <div className="pref-loading">
          <div className="loading-logo">LÆRKEGAARD</div>
          <div className="loading-spinner"></div>
          <p>Forbereder din personlige oplevelse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pref-page">
        <div className="pref-error">
          <h2>Beklager</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pref-page success-page">
        <div className="success-content">
          <div className="success-icon-wrap">
            <div className="success-icon">✓</div>
          </div>
          <h1>Tak, {data?.guest_name?.split(' ')[0]}!</h1>
          <p className="success-subtitle">Vi har modtaget dine ønsker</p>
          
          <div className="success-summary">
            {form.room_temperature && (
              <div className="summary-item">
                <span className="summary-icon">🌡️</span>
                <span>
                  {form.room_temperature === 'cool' ? 'Køligt (18°C)' : 
                   form.room_temperature === 'warm' ? 'Varmt (24°C)' : 'Behageligt (21°C)'}
                  {form.floor_heating && ' med gulvvarme'}
                </span>
              </div>
            )}
            {form.is_special_occasion && (
              <div className="summary-item highlight">
                <span className="summary-icon">🎉</span>
                <span>Vi forbereder noget særligt til din {
                  form.occasion_type === 'birthday' ? 'fødselsdag' :
                  form.occasion_type === 'anniversary' ? 'jubilæum' :
                  form.occasion_type === 'honeymoon' ? 'bryllupsrejse' :
                  'anledning'
                }!</span>
              </div>
            )}
            {form.estimated_arrival_time && (
              <div className="summary-item">
                <span className="summary-icon">🚗</span>
                <span>Vi forventer dig omkring kl. {form.estimated_arrival_time}</span>
              </div>
            )}
          </div>

          <div className="success-message">
            <p>
              Vores team vil nu forberede alt til din ankomst den <strong>{formatDate(data?.check_in || '')}</strong>.
            </p>
            <p className="success-tagline">
              Vi glæder os til at byde dig velkommen på Lærkegaard 🌾
            </p>
          </div>

          {/* Experience Guide CTA */}
          <div className="success-guide-cta">
            <div className="guide-cta-content">
              <span className="guide-cta-icon">✨</span>
              <h3>Udforsk området</h3>
              <p>Opdager de bedste oplevelser, restauranter og aktiviteter i nærheden af Lærkegaard</p>
              <a href="/oplevelser" className="guide-cta-btn">
                <span>Se oplevelsesguide</span>
                <span className="guide-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const nights = calculateNights();

  // Step content
  const steps = [
    // Step 0: Welcome
    {
      id: 'welcome',
      content: (
        <div className="step-welcome">
          <div className="welcome-header">
            <div className="welcome-logo">LÆRKEGAARD</div>
            <div className="welcome-tagline">Et øjeblik af ro</div>
          </div>
          
          <div className="welcome-card">
            <div className="guest-greeting">
              <h1>Velkommen, {data.guest_name.split(' ')[0]}</h1>
              <p className="greeting-subtitle">Vi glæder os til at se dig</p>
            </div>
            
            <div className="booking-preview">
              <div className="preview-room">
                <span className="room-name">{data.room_name}</span>
                {data.room_unit_label && <span className="room-unit">{data.room_unit_label}</span>}
              </div>
              <div className="preview-dates">
                <div className="date-block">
                  <span className="date-label">Ankomst</span>
                  <span className="date-value">{formatDate(data.check_in)}</span>
                </div>
                <div className="date-divider">
                  <span className="nights-count">{nights}</span>
                  <span className="nights-label">{nights === 1 ? 'nat' : 'nætter'}</span>
                </div>
                <div className="date-block">
                  <span className="date-label">Afrejse</span>
                  <span className="date-value">{formatDate(data.check_out)}</span>
                </div>
              </div>
            </div>

            <div className="welcome-intro">
              <p>
                For at gøre dit ophold helt perfekt, vil vi gerne vide lidt mere om dine ønsker.
                Det tager kun 2 minutter.
              </p>
            </div>

            <button className="btn-start" onClick={nextStep}>
              <span>Lad os begynde</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      )
    },
    // Step 1: Atmosphere
    {
      id: 'atmosphere',
      content: (
        <div className="step-content">
          <div className="step-header">
            <span className="step-number">01</span>
            <h2>Atmosfære</h2>
            <p>Hvordan skal dit værelse føles når du ankommer?</p>
          </div>

          <div className="question-group">
            <label className="question-label">Temperatur i værelset</label>
            <div className="temp-cards">
              {[
                { value: 'cool', temp: '18°C', label: 'Køligt', desc: 'Frisk og forfriskende', icon: '❄️' },
                { value: 'normal', temp: '21°C', label: 'Behageligt', desc: 'Perfekt balance', icon: '🌿' },
                { value: 'warm', temp: '24°C', label: 'Varmt', desc: 'Lunt og omsluttende', icon: '☀️' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`temp-card ${form.room_temperature === option.value ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, room_temperature: option.value }))}
                >
                  <span className="temp-icon">{option.icon}</span>
                  <span className="temp-value">{option.temp}</span>
                  <span className="temp-label">{option.label}</span>
                  <span className="temp-desc">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="question-group">
            <div className="toggle-option">
              <div className="toggle-info">
                <span className="toggle-icon">🔥</span>
                <div>
                  <span className="toggle-label">Gulvvarme</span>
                  <span className="toggle-desc">Varme gulve fra du træder ind</span>
                </div>
              </div>
              <button
                type="button"
                className={`toggle-btn ${form.floor_heating ? 'active' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, floor_heating: !prev.floor_heating }))}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb"></span>
                </span>
              </button>
            </div>

            <div className="toggle-option">
              <div className="toggle-info">
                <span className="toggle-icon">🌙</span>
                <div>
                  <span className="toggle-label">Mørklægningsgardiner</span>
                  <span className="toggle-desc">For den perfekte nattesøvn</span>
                </div>
              </div>
              <button
                type="button"
                className={`toggle-btn ${form.blackout_curtains ? 'active' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, blackout_curtains: !prev.blackout_curtains }))}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb"></span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )
    },
    // Step 2: Comfort
    {
      id: 'comfort',
      content: (
        <div className="step-content">
          <div className="step-header">
            <span className="step-number">02</span>
            <h2>Komfort</h2>
            <p>Små detaljer der gør en stor forskel</p>
          </div>

          <div className="question-group">
            <label className="question-label">Seng & puder</label>
            <div className="comfort-grid">
              <button
                type="button"
                className={`comfort-card ${form.extra_pillows ? 'selected' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, extra_pillows: !prev.extra_pillows }))}
              >
                <span className="comfort-icon">🛏️</span>
                <span className="comfort-label">Ekstra puder</span>
              </button>
              <button
                type="button"
                className={`comfort-card ${form.extra_blankets ? 'selected' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, extra_blankets: !prev.extra_blankets }))}
              >
                <span className="comfort-icon">🧣</span>
                <span className="comfort-label">Ekstra tæpper</span>
              </button>
            </div>
          </div>

          <div className="question-group">
            <label className="question-label">Pudetype</label>
            <div className="pillow-options">
              {[
                { value: 'soft', label: 'Bløde', icon: '☁️' },
                { value: 'firm', label: 'Faste', icon: '🪨' },
                { value: 'down', label: 'Dun', icon: '🪶' },
                { value: 'synthetic', label: 'Allergifri', icon: '✨' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`pillow-btn ${form.pillow_type === option.value ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, pillow_type: option.value }))}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="question-group">
            <div className="allergy-section">
              <div className="toggle-option">
                <div className="toggle-info">
                  <span className="toggle-icon">⚠️</span>
                  <div>
                    <span className="toggle-label">Jeg har allergier</span>
                    <span className="toggle-desc">Så vi kan tage ekstra hensyn</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle-btn ${form.has_allergies ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, has_allergies: !prev.has_allergies }))}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb"></span>
                  </span>
                </button>
              </div>
              
              {form.has_allergies && (
                <textarea
                  className="allergy-input"
                  placeholder="Fortæl os om dine allergier (f.eks. støvmider, dun, parfume)..."
                  value={form.allergies_details}
                  onChange={(e) => setForm(prev => ({ ...prev, allergies_details: e.target.value }))}
                />
              )}
            </div>
          </div>
        </div>
      )
    },
    // Step 3: Culinary
    {
      id: 'culinary',
      content: (
        <div className="step-content">
          <div className="step-header">
            <span className="step-number">03</span>
            <h2>Kulinarisk</h2>
            <p>Mad er en del af oplevelsen</p>
          </div>

          <div className="question-group">
            <div className="toggle-option large">
              <div className="toggle-info">
                <span className="toggle-icon">☕</span>
                <div>
                  <span className="toggle-label">Morgenmad på værelset</span>
                  <span className="toggle-desc">Start dagen i ro og mag</span>
                </div>
              </div>
              <button
                type="button"
                className={`toggle-btn ${form.breakfast_in_room ? 'active' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, breakfast_in_room: !prev.breakfast_in_room }))}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb"></span>
                </span>
              </button>
            </div>
            
            {form.breakfast_in_room && (
              <div className="breakfast-details">
                <div className="breakfast-section">
                  <label className="breakfast-label">Hvilken type morgenmad?</label>
                  <div className="breakfast-types">
                    {[
                      { value: 'continental', label: 'Kontinental', desc: 'Croissant, marmelade, frugt, yoghurt', icon: '🥐' },
                      { value: 'danish', label: 'Dansk klassisk', desc: 'Rugbrød, ost, pålæg, æg', icon: '🍳' },
                      { value: 'healthy', label: 'Sund & Let', desc: 'Grød, frugt, nødder, smoothie', icon: '🥗' },
                      { value: 'full', label: 'Fuld Lærkegaard', desc: 'Alt det bedste fra gården', icon: '🍽️' }
                    ].map(type => (
                      <button
                        key={type.value}
                        type="button"
                        className={`breakfast-type-btn ${form.breakfast_type === type.value ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, breakfast_type: type.value }))}
                      >
                        <span className="breakfast-type-icon">{type.icon}</span>
                        <div className="breakfast-type-info">
                          <span className="breakfast-type-name">{type.label}</span>
                          <span className="breakfast-type-desc">{type.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="breakfast-section">
                  <label className="breakfast-label">Ekstra til morgenmaden?</label>
                  <div className="breakfast-extras">
                    {[
                      { value: 'freshbread', label: 'Friskbagt brød', icon: '🥖' },
                      { value: 'eggs', label: 'Æg (valgfri tilberedning)', icon: '🥚' },
                      { value: 'bacon', label: 'Bacon', icon: '🥓' },
                      { value: 'salmon', label: 'Røget laks', icon: '🐟' },
                      { value: 'cheese', label: 'Osteudvalg', icon: '🧀' },
                      { value: 'fruit', label: 'Frisk frugt', icon: '🍓' },
                      { value: 'juice', label: 'Friskpresset juice', icon: '🍊' },
                      { value: 'champagne', label: 'Morgenchampagne', icon: '🥂', premium: true }
                    ].map(extra => (
                      <button
                        key={extra.value}
                        type="button"
                        className={`breakfast-extra-btn ${form.breakfast_extras.includes(extra.value) ? 'selected' : ''} ${extra.premium ? 'premium' : ''}`}
                        onClick={() => setForm(prev => ({
                          ...prev,
                          breakfast_extras: prev.breakfast_extras.includes(extra.value)
                            ? prev.breakfast_extras.filter(e => e !== extra.value)
                            : [...prev.breakfast_extras, extra.value]
                        }))}
                      >
                        <span className="extra-icon">{extra.icon}</span>
                        <span className="extra-name">{extra.label}</span>
                        {extra.premium && <span className="premium-badge">Premium</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="breakfast-section">
                  <label className="breakfast-label">Kaffe-præference</label>
                  <div className="coffee-options">
                    {[
                      { value: 'espresso', label: 'Espresso', icon: '☕' },
                      { value: 'americano', label: 'Americano', icon: '🫖' },
                      { value: 'cappuccino', label: 'Cappuccino', icon: '🥛' },
                      { value: 'latte', label: 'Café Latte', icon: '🥛' },
                      { value: 'tea', label: 'Te', icon: '🍵' },
                      { value: 'none', label: 'Ingen kaffe', icon: '🚫' }
                    ].map(coffee => (
                      <button
                        key={coffee.value}
                        type="button"
                        className={`coffee-btn ${form.coffee_preference === coffee.value ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, coffee_preference: coffee.value }))}
                      >
                        <span>{coffee.icon}</span>
                        <span>{coffee.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="breakfast-section">
                  <label className="breakfast-label">Hvornår skal vi servere?</label>
                  <div className="time-options">
                    {['07:30', '08:00', '08:30', '09:00', '09:30', '10:00'].map(time => (
                      <button
                        key={time}
                        type="button"
                        className={`time-btn ${form.breakfast_time === time ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, breakfast_time: time }))}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="question-group">
            <div className="toggle-option">
              <div className="toggle-info">
                <span className="toggle-icon">🥗</span>
                <div>
                  <span className="toggle-label">Særlige kostbehov</span>
                  <span className="toggle-desc">Vi tilpasser menuen til dig</span>
                </div>
              </div>
              <button
                type="button"
                className={`toggle-btn ${form.has_dietary_requirements ? 'active' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, has_dietary_requirements: !prev.has_dietary_requirements }))}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb"></span>
                </span>
              </button>
            </div>
            
            {form.has_dietary_requirements && (
              <div className="dietary-section">
                <div className="dietary-tags">
                  {['Vegetar', 'Veganer', 'Glutenfri', 'Laktosefri', 'Nøddefri', 'Skaldyrsfri'].map(diet => (
                    <button
                      key={diet}
                      type="button"
                      className={`dietary-tag ${form.dietary_requirements.includes(diet) ? 'selected' : ''}`}
                      onClick={() => handleDietaryToggle(diet)}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
                <textarea
                  className="dietary-input"
                  placeholder="Andre kostbehov eller præferencer..."
                  value={form.dietary_details}
                  onChange={(e) => setForm(prev => ({ ...prev, dietary_details: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>
      )
    },
    // Step 4: Special Occasions
    {
      id: 'occasions',
      content: (
        <div className="step-content">
          <div className="step-header">
            <span className="step-number">04</span>
            <h2>Særlige øjeblikke</h2>
            <p>Fejrer du noget specielt?</p>
          </div>

          <div className="question-group">
            <div className="occasion-toggle">
              <button
                type="button"
                className={`occasion-main-btn ${form.is_special_occasion ? 'active' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, is_special_occasion: !prev.is_special_occasion }))}
              >
                <span className="occasion-icon">🎉</span>
                <span className="occasion-text">Ja, jeg fejrer noget!</span>
              </button>
            </div>
            
            {form.is_special_occasion && (
              <div className="occasion-details">
                <div className="occasion-types">
                  {[
                    { value: 'birthday', label: 'Fødselsdag', icon: '🎂' },
                    { value: 'anniversary', label: 'Jubilæum', icon: '💑' },
                    { value: 'honeymoon', label: 'Bryllupsrejse', icon: '💒' },
                    { value: 'proposal', label: 'Forlovelse', icon: '💍' },
                    { value: 'other', label: 'Andet', icon: '✨' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`occasion-type-btn ${form.occasion_type === option.value ? 'selected' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, occasion_type: option.value }))}
                    >
                      <span className="occasion-type-icon">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  className="occasion-input"
                  placeholder="Fortæl os mere, så vi kan gøre det ekstra specielt..."
                  value={form.occasion_details}
                  onChange={(e) => setForm(prev => ({ ...prev, occasion_details: e.target.value }))}
                />

                <div className="extras-section">
                  <label className="extras-label">Skal vi forberede noget på værelset?</label>
                  <div className="extras-grid">
                    {[
                      { key: 'wants_flowers', label: 'Blomster', icon: '💐', price: '+250 kr' },
                      { key: 'wants_champagne', label: 'Champagne', icon: '🍾', price: '+450 kr' },
                      { key: 'wants_chocolate', label: 'Chokolade', icon: '🍫', price: '+150 kr' }
                    ].map(extra => (
                      <button
                        key={extra.key}
                        type="button"
                        className={`extra-btn ${form[extra.key as keyof typeof form] ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, [extra.key]: !prev[extra.key as keyof typeof form] }))}
                      >
                        <span className="extra-icon">{extra.icon}</span>
                        <span className="extra-label">{extra.label}</span>
                        <span className="extra-price">{extra.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    // Step 5: Arrival
    {
      id: 'arrival',
      content: (
        <div className="step-content">
          <div className="step-header">
            <span className="step-number">05</span>
            <h2>Din ankomst</h2>
            <p>Så vi kan være klar til dig</p>
          </div>

          <div className="question-group">
            <label className="question-label">Hvornår forventer du at ankomme?</label>
            <div className="arrival-times">
              {[
                { value: '14:00', label: 'Tidlig eftermiddag', time: '14:00' },
                { value: '15:00', label: 'Check-in tid', time: '15:00', recommended: true },
                { value: '16:00', label: 'Sen eftermiddag', time: '16:00' },
                { value: '17:00', label: 'Tidlig aften', time: '17:00' },
                { value: '18:00', label: 'Aften', time: '18:00+' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`arrival-btn ${form.estimated_arrival_time === option.value ? 'selected' : ''} ${option.recommended ? 'recommended' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, estimated_arrival_time: option.value }))}
                >
                  <span className="arrival-time">{option.time}</span>
                  <span className="arrival-label">{option.label}</span>
                  {option.recommended && <span className="arrival-badge">Anbefalet</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="question-group">
            <div className="arrival-options">
              <div className="toggle-option">
                <div className="toggle-info">
                  <span className="toggle-icon">🌅</span>
                  <div>
                    <span className="toggle-label">Tidlig check-in</span>
                    <span className="toggle-desc">Før kl. 15:00 (efter tilgængelighed)</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle-btn ${form.needs_early_checkin ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, needs_early_checkin: !prev.needs_early_checkin }))}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb"></span>
                  </span>
                </button>
              </div>

              <div className="toggle-option">
                <div className="toggle-info">
                  <span className="toggle-icon">🌙</span>
                  <div>
                    <span className="toggle-label">Sen check-out</span>
                    <span className="toggle-desc">Efter kl. 11:00 (efter tilgængelighed)</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle-btn ${form.needs_late_checkout ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, needs_late_checkout: !prev.needs_late_checkout }))}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb"></span>
                  </span>
                </button>
              </div>

              <div className="toggle-option">
                <div className="toggle-info">
                  <span className="toggle-icon">🚗</span>
                  <div>
                    <span className="toggle-label">Parkering</span>
                    <span className="toggle-desc">Gratis parkering på gården</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle-btn ${form.needs_parking ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, needs_parking: !prev.needs_parking }))}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb"></span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="question-group">
            <label className="question-label">Andet vi skal vide?</label>
            <textarea
              className="other-input"
              placeholder="Særlige ønsker, spørgsmål eller noget du vil dele med os..."
              value={form.other_requests}
              onChange={(e) => setForm(prev => ({ ...prev, other_requests: e.target.value }))}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="pref-page">
      {/* Progress indicator */}
      {currentStep > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>
        </div>
      )}

      {/* Step content */}
      <div className="step-container">
        {steps[currentStep].content}
      </div>

      {/* Navigation */}
      {currentStep > 0 && (
        <div className="step-navigation">
          <button className="nav-btn back" onClick={prevStep}>
            <span className="nav-arrow">←</span>
            <span>Tilbage</span>
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button className="nav-btn next" onClick={nextStep}>
              <span>Næste</span>
              <span className="nav-arrow">→</span>
            </button>
          ) : (
            <button 
              className="nav-btn submit" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span>Gemmer...</span>
              ) : (
                <>
                  <span>Færdig</span>
                  <span className="nav-arrow">✓</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PreferencesForm;
