import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Session } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for testing
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
      // TODO: Replace with actual Tauri command
      // For now, use demo authentication
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
