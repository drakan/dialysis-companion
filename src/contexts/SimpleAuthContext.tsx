import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => void;
  createUser: (username: string, password: string, role?: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('dialyse_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('dialyse_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Set current user context for RLS policies
      await supabase.rpc('set_current_user', {
        username_value: username
      });

      const { data, error } = await supabase.rpc('authenticate_user', {
        username_input: username,
        password_input: password
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const userData = data[0];
        const user: User = {
          id: userData.user_id,
          username: userData.username,
          role: userData.role
        };
        
        // Store user data
        localStorage.setItem('dialyse_user', JSON.stringify(user));
        localStorage.setItem('dialyse_current_user', username);
        
        setUser(user);
        return { error: null };
      } else {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = () => {
    localStorage.removeItem('dialyse_user');
    localStorage.removeItem('dialyse_current_user');
    setUser(null);
  };

  const createUser = async (username: string, password: string, role: string = 'user') => {
    try {
      const { error } = await supabase.rpc('create_user', {
        username_input: username,
        password_input: password,
        role_input: role
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return { error: new Error('Utilisateur non connecté') };
    
    try {
      const { error } = await supabase.rpc('update_user_password', {
        username_input: user.username,
        new_password: newPassword
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    createUser,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};