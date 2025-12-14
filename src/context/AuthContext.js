import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, ADMIN_EMAILS } from '../services/supabase';
import Storage from '../services/storage';
import SupabaseStorage from '../services/supabaseStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    // Listener per i cambiamenti di sessione
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Carica username dal profilo
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        const userData = {
          id: session.user.id,
          email: session.user.email,
          username: profile?.username || session.user.email.split('@')[0],
          isAdmin: ADMIN_EMAILS.includes(session.user.email),
        };

        await Storage.setCurrentUser(userData);
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        await Storage.removeCurrentUser();
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    // Verifica se c'è una sessione attiva in Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Carica username dal profilo
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      const userData = {
        id: session.user.id,
        email: session.user.email,
        username: profile?.username || session.user.email.split('@')[0],
        isAdmin: ADMIN_EMAILS.includes(session.user.email),
      };

      await Storage.setCurrentUser(userData);
      setUser(userData);
    } else {
      // Se non c'è sessione Supabase, controlla localStorage
      const storedUser = await Storage.getCurrentUser();
      if (storedUser) {
        // Se c'è un utente in storage ma non sessione, fai logout
        await Storage.removeCurrentUser();
        setUser(null);
      }
    }
    
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Carica username dal profilo
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username || email.split('@')[0],
        isAdmin: ADMIN_EMAILS.includes(data.user.email),
      };

      await Storage.setCurrentUser(userData);
      setUser(userData);

      // Sync data from cloud
      await SupabaseStorage.fullSync();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, username) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Crea il profilo con lo username
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { success: true, message: 'Registrazione completata! Verifica la tua email.' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await Storage.removeCurrentUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
