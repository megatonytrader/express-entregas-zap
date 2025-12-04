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

    if (error) {
      setIsLoading(false);
      return { success: false, error };
    }

    if (data.user) {
      // Create a profile for the new user, as it's required by the database schema.
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        nome: email.split('@')[0] || 'Novo Usuário',
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        setIsLoading(false);
        // Return profile error to the UI
        return { success: false, error: profileError };
      }
    }

    setIsLoading(false);
    
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