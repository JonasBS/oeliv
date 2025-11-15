import { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <span className="toast-message">{message}</span>
      <button 
        type="button"
        className="toast-close" 
        onClick={onClose}
        aria-label="Luk besked"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

