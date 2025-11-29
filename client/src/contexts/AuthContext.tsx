import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface TwoFactorPending {
  pendingId: string;
  phoneHint: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  twoFactorPending: TwoFactorPending | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; requiresTwoFactor?: boolean }>;
  verifyTwoFactor: (code: string) => Promise<{ success: boolean; error?: string }>;
  cancelTwoFactor: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'oeliv_admin_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorPending, setTwoFactorPending] = useState<TwoFactorPending | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check for existing token
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedToken })
          });

          const data = await res.json();

          if (data.valid && data.user) {
            setToken(storedToken);
            setUser(data.user);
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch (err) {
          console.error('Failed to verify token:', err);
          localStorage.removeItem(TOKEN_KEY);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login fejlede' };
      }

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setTwoFactorPending({
          pendingId: data.pendingId,
          phoneHint: data.phoneHint
        });
        return { success: true, requiresTwoFactor: true };
      }

      // Direct login (no 2FA)
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Netværksfejl' };
    }
  };

  const verifyTwoFactor = async (code: string) => {
    if (!twoFactorPending) {
      return { success: false, error: 'Ingen afventende 2FA' };
    }

    try {
      const res = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pendingId: twoFactorPending.pendingId, 
          code 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Verifikation fejlede' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setTwoFactorPending(null);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Netværksfejl' };
    }
  };

  const cancelTwoFactor = () => {
    setTwoFactorPending(null);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setTwoFactorPending(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        twoFactorPending,
        login,
        verifyTwoFactor,
        cancelTwoFactor,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
