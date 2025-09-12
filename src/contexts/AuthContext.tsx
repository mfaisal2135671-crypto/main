import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (mobile: string, password: string) => Promise<boolean>;
  register: (mobile: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendVerificationCode: (email: string) => Promise<boolean>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
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
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (mobile: string, password: string, fullName: string): Promise<boolean> => {
    try {
      // Create auth user with mobile as email temporarily
      const { data, error } = await supabase.auth.signUp({
        email: `${mobile}@temp.com`,
        password,
        options: {
          data: {
            mobile_number: mobile,
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              mobile_number: mobile,
              full_name: fullName,
              is_verified: false,
            }
          ]);

        if (profileError) throw profileError;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const login = async (mobile: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${mobile}@temp.com`,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sendVerificationCode = async (email: string): Promise<boolean> => {
    try {
      // Generate a 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the code in user profile (in real app, you'd send via email service)
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            email: email,
            verification_code: code,
            verification_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
        
        // In a real application, you would send this code via email
        alert(`Verification code sent to ${email}: ${code} (Demo mode)`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending verification code:', error);
      return false;
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      if (!user) return false;

      const { data, error } = await supabase
        .from('users')
        .select('verification_code, verification_expires')
        .eq('id', user.id)
        .eq('email', email)
        .single();

      if (error) throw error;

      if (data.verification_code === code && 
          new Date(data.verification_expires) > new Date()) {
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            is_verified: true,
            verification_code: null,
            verification_expires: null 
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setUser({ ...user, is_verified: true, email });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying email:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    sendVerificationCode,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};