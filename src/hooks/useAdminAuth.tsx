import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AdminAuthContextType {
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: any; user?: User | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  user: User | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async (currentUser: User | null) => {
      if (currentUser) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();
        
        if (data && data.role === 'admin') {
          setIsAdmin(true);
          setUser(currentUser);
        } else {
          setIsAdmin(false);
          setUser(null);
          // Don't sign out here, as a newly signed up user won't have a role yet.
          // await supabase.auth.signOut(); 
        }
      } else {
        setIsAdmin(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      return { success: false, error };
    }
    // The onAuthStateChange listener will handle setting user and admin status
    return { success: true };
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      return { success: false, error };
    }
    
    // The user is created but does not have an admin role yet.
    // This must be done manually in the Supabase dashboard.
    return { success: true, user: data.user };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, login, signUp, logout, isLoading, user }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}