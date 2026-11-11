import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { PlanId } from '@/lib/plans';

export interface AvatarStyle {
  bg: string;
  text: string;
  shape: 'circle' | 'rounded' | 'square';
  ring: 'none' | 'indigo' | 'white' | 'dark';
  size: 'sm' | 'md' | 'lg';
  font: 'normal' | 'bold' | 'mono';
  gradient?: string;
  shadow: boolean;
}

export const DEFAULT_AVATAR_STYLE: AvatarStyle = {
  bg: 'indigo',
  text: 'white',
  shape: 'circle',
  ring: 'indigo',
  size: 'md',
  font: 'bold',
  shadow: true,
};

export interface Profile {
  user_id: string;
  email: string;
  plan: PlanId;
  audits_used: number;
  period_start: string;
  agency_logo_data: string | null;
  avatar_style: AvatarStyle | null;
}

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const PROFILE_COLUMNS = 'user_id, email, plan, audits_used, period_start, agency_logo_data, avatar_style';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  const loadProfile = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('user_id', id)
      .maybeSingle();

    if (error) {
      setProfile(null);
      setProfileError('We could not load your account details. Please refresh the page.');
      return;
    }
    if (!data) {
      setProfile(null);
      setProfileError('Your account is still being set up. Please refresh the page.');
      return;
    }
    setProfileError(null);
    setProfile(data as Profile);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    loadProfile(userId);
  }, [userId, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ session, profile, loading, profileError, refreshProfile, setProfile, signOut }),
    [session, profile, loading, profileError, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

export function useProfile(): Profile {
  const { profile } = useAuth();
  if (!profile) {
    throw new Error('Profile is not loaded');
  }
  return profile;
}
