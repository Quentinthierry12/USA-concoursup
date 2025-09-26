import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au démarrage
    const checkSession = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          // Vérifier que l'utilisateur existe toujours en base
          const { data, error } = await supabase
            .from('concour_users')
            .select('*')
            .eq('id', userData.id)
            .single();
          
          if (data && !error) {
            setUser(data);
          } else {
            localStorage.removeItem('currentUser');
          }
        } catch (error) {
          localStorage.removeItem('currentUser');
        }
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('concour_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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