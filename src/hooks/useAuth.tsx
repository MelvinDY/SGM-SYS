import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Session } from '../types';
import { login as apiLogin } from '../api/auth';
import { isTauri } from '../lib/utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for testing when not in Tauri environment
const DEMO_USER: User = {
  id: '1',
  branch_id: '1',
  username: 'admin',
  full_name: 'Administrator',
  role: 'owner',
  is_active: true,
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedSession = localStorage.getItem('emaspos_session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession) as Session;
        // Check if session is still valid
        if (new Date(parsedSession.expires_at) > new Date()) {
          setSession(parsedSession);
          setUser(parsedSession.user);
        } else {
          localStorage.removeItem('emaspos_session');
        }
      } catch {
        localStorage.removeItem('emaspos_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Try Tauri backend login first
      if (isTauri()) {
        const response = await apiLogin({ username, password });
        if (response.success && response.data) {
          const loginData = response.data;
          const newSession: Session = {
            user: loginData.user,
            token: loginData.token,
            expires_at: loginData.expires_at,
          };
          setSession(newSession);
          setUser(loginData.user);
          localStorage.setItem('emaspos_session', JSON.stringify(newSession));
          return true;
        }
        return false;
      }

      // Fallback to demo authentication when not in Tauri
      if (username === 'admin' && password === 'admin') {
        const newSession: Session = {
          user: DEMO_USER,
          token: 'demo-token-' + Date.now(),
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        };
        setSession(newSession);
        setUser(DEMO_USER);
        localStorage.setItem('emaspos_session', JSON.stringify(newSession));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('emaspos_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
