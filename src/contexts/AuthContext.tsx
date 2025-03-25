import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  isAdmin: false,
  isLoading: true 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial auth state:", session?.user ? "Logged in" : "Not logged in");
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("User ID:", session.user.id);
          await checkAdminStatus(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        console.log("Auth state changed:", session?.user ? "Logged in" : "Not logged in");
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("User ID:", session.user.id);
          await checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Effect to retry admin check if it fails
  useEffect(() => {
    if (user && !isAdmin && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying admin check (attempt ${retryCount + 1}/3)...`);
        checkAdminStatus(user.id);
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, retryCount]);

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log("Checking admin status for user:", userId);
      
      // First try - check if user is in admins table
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        
        // If there's an error, try a different approach (fallback)
        const { data: adminsData, error: listError } = await supabase
          .from('admins')
          .select('user_id');
          
        if (!listError && adminsData) {
          const isUserAdmin = adminsData.some(admin => admin.user_id === userId);
          console.log("Admin check fallback result:", isUserAdmin ? "Is admin" : "Not admin");
          setIsAdmin(isUserAdmin);
          return;
        }
        
        setIsAdmin(false);
        return;
      }

      console.log("Admin check result:", data ? "Is admin" : "Not admin");
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);