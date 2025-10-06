import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const login = (email: string, password: string, role: string) => {
    const mockUser: User = {
      id: '1',
      role: role as any,
      fullName: 'John Doe',
      email: email,
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      onboardingCompleted: true,
      themePreference: 'light',
    };
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        theme,
        setTheme,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
