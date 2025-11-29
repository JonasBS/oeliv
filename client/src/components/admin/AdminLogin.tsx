import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login, verifyTwoFactor, cancelTwoFactor, twoFactorPending, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(username, password);
    
    if (!result.success && !result.requiresTwoFactor) {
      setError(result.error || 'Login fejlede');
    }

    setSubmitting(false);
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await verifyTwoFactor(twoFactorCode);
    
    if (!result.success) {
      setError(result.error || 'Verifikation fejlede');
    }

    setSubmitting(false);
  };

  const handleCancelTwoFactor = () => {
    cancelTwoFactor();
    setTwoFactorCode('');
    setError('');
  };

  if (isLoading) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="login-loading">
            <div className="spinner"></div>
            <p>Indlæser...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2FA verification step
  if (twoFactorPending) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="login-header">
            <h1>ØLIV</h1>
            <h2>Bekræft login</h2>
          </div>

          <form onSubmit={handleTwoFactorSubmit} className="login-form">
            <div className="two-factor-info">
              <div className="two-factor-icon">📱</div>
              <p>
                Vi har sendt en 6-cifret kode til dit telefonnummer 
                <strong> ****{twoFactorPending.phoneHint}</strong>
              </p>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="twoFactorCode">Indtast kode</label>
              <input
                id="twoFactorCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoComplete="one-time-code"
                required
                autoFocus
                className="two-factor-input"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={submitting || twoFactorCode.length !== 6}
            >
              {submitting ? 'Verificerer...' : 'Bekræft'}
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={handleCancelTwoFactor}
            >
              ← Tilbage til login
            </button>
          </form>

          <div className="login-footer">
            <p>Koden udløber om 5 minutter</p>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="login-header">
          <h1>ØLIV</h1>
          <h2>Admin Login</h2>
        </div>

        <form onSubmit={handleLoginSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Brugernavn</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Brugernavn"
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Adgangskode</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Adgangskode"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={submitting}
          >
            {submitting ? 'Logger ind...' : 'Log ind'}
          </button>
        </form>

        <div className="login-footer">
          <p>ØLIV Booking System</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
