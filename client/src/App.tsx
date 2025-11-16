import { useState, useEffect } from 'react';
import BookingModal from './components/BookingModal';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import './App.css';

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    // Check if we're on the admin page
    const pathname = window.location.pathname;
    if (pathname.includes('admin')) {
      setIsAdminMode(true);
    }
  }, []);

  const handleOpenBooking = () => {
    setIsModalOpen(true);
  };

  const handleCloseBooking = () => {
    setIsModalOpen(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // If admin mode, show admin panel instead
  if (isAdminMode) {
    return <AdminPanel />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ØLIV Booking System</h1>
        <button 
          className="btn-primary"
          onClick={handleOpenBooking}
          aria-label="Åbn booking"
        >
          Book nu
        </button>
      </header>

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
    </div>
  );
};

export default App;

