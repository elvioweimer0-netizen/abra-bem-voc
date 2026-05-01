import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Profile = Tables<"profiles"> & {
  username?: string | null;
  must_change_password?: boolean | null;
  first_login_at?: string | null;
  welcome_banner_dismissed?: boolean | null;
  login_count?: number | null;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string, unidade: Enums<"unidade_tipo">) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar perfil", error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          setTimeout(async () => {
            try {
              if (event === "SIGNED_IN") {
                void (supabase as any).rpc("increment_login_count", { _user_id: session.user.id });
              }
              await fetchProfile(session.user.id);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    const email = `${username.trim().toLowerCase()}@curio.app`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    if (user?.id) {
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update({ must_change_password: false })
        .eq("user_id", user.id);
      if (profileError) throw profileError;
      setProfile((current) => current ? { ...current, must_change_password: false } : current);
    }
  };

  const signUp = async (email: string, password: string, nome: string, unidade: Enums<"unidade_tipo">) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, unidade, cargo: "colaborador" },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
