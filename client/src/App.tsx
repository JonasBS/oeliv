import { useState, useEffect } from 'react';
import BookingModal from './components/BookingModal';
import BookingCalendar from './components/BookingCalendar';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/admin/AdminLogin';
import FeedbackForm from './components/FeedbackForm';
import PreferencesForm from './components/PreferencesForm';
import ExperienceGuide from './components/ExperienceGuide';
import Toast from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Protected Admin wrapper
const ProtectedAdmin = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f3ea'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e0dcd4',
            borderTopColor: '#656c48',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#666' }}>Indlæser...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminPanel />;
};

const AppContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [feedbackToken, setFeedbackToken] = useState<string | null>(null);
  const [preferencesToken, setPreferencesToken] = useState<string | null>(null);
  const [isExperienceGuide, setIsExperienceGuide] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const pathname = currentUrl.pathname;

    if (pathname.startsWith('/feedback')) {
      const tokenSegment = pathname.split('/feedback/')[1];
      const token = tokenSegment || currentUrl.searchParams.get('token');
      setFeedbackToken(token || null);
      return;
    }

    if (pathname.startsWith('/preferences')) {
      const tokenSegment = pathname.split('/preferences/')[1];
      const token = tokenSegment || currentUrl.searchParams.get('token');
      setPreferencesToken(token || null);
      return;
    }

    if (pathname.startsWith('/oplevelser') || pathname.startsWith('/experiences') || pathname.startsWith('/guide')) {
      setIsExperienceGuide(true);
      return;
    }

    if (pathname.includes('admin')) {
      setIsAdminMode(true);
    }
  }, []);

  const handleOpenBooking = () => {
    console.log('🎯 handleOpenBooking called - opening modal');
    setIsModalOpen(true);
    console.log('✅ Modal state set to true');
  };

  const handleDateSelect = (dates: { start: Date | null; end: Date | null }) => {
    setSelectedDates(dates);
    if (dates.start && dates.end) {
      handleOpenBooking();
    }
  };

  const handleCloseBooking = () => {
    setIsModalOpen(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Expose handleOpenBooking globally so external buttons can trigger it
  useEffect(() => {
    console.log('🔧 Exposing openOelivBooking to window object');
    (window as any).openOelivBooking = handleOpenBooking;
    console.log('✅ window.openOelivBooking is now available');
    return () => {
      delete (window as any).openOelivBooking;
    };
  }, []);

  // If admin mode, show protected admin panel
  if (isAdminMode) {
    return <ProtectedAdmin />;
  }

  if (feedbackToken) {
    return <FeedbackForm token={feedbackToken} />;
  }

  if (preferencesToken) {
    return <PreferencesForm />;
  }

  if (isExperienceGuide) {
    return <ExperienceGuide />;
  }

  return (
    <>
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--sand)',
        padding: 'var(--spacing-xl)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          textAlign: 'center',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <h1 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--olive)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            ØLIV
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--muted)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            Book dit ophold hos os
          </p>
        </div>
        
        <BookingCalendar 
          onSelect={handleDateSelect}
          selectedDates={selectedDates}
        />
        
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <button 
            onClick={handleOpenBooking}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: 600,
              background: 'var(--olive)',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(101, 108, 72, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Book nu
          </button>
        </div>
      </div>

      {isModalOpen && (
        <BookingModal 
          onClose={handleCloseBooking} 
          showToast={showToast}
        />
      )}

      {toastMessage && (
        <Toast 
          message={toastMessage.message} 
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
