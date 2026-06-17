import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Perfil del residente en sesión (fila `users` + datos de su casa/residencial).
export interface Profile {
  id: string;
  name: string;
  email: string | null;
  houseId: string | null;
  houseAddress: string | null;
  residentialId: string | null;
  residentialName: string | null;
  rol: string | null;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | undefined>(undefined);

async function loadProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("users")
    .select("id,name,email,house_id,residential_id,houses(address),residentials(name),rols(name)")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as {
    id: string; name: string; email: string | null;
    house_id: string | null; residential_id: string | null;
    houses: { address: string | null } | null;
    residentials: { name: string | null } | null;
    rols: { name: string | null } | null;
  };
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    houseId: row.house_id,
    houseAddress: row.houses?.address ?? null,
    residentialId: row.residential_id,
    residentialName: row.residentials?.name ?? null,
    rol: row.rols?.name ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) setProfile(await loadProfile());
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      setProfile(s ? await loadProfile() : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setProfile(await loadProfile());
    return {};
  }, []);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
