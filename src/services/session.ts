import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type UserRole = 'logistics_manager' | 'admin' | 'supplier';
export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  supplier_id: string | null;
}

interface SessionState {
  status: SessionStatus;
  session: Session | null;
  profile: UserProfile | null;
  error: string | null;
}

interface SessionContextValue extends SessionState {
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const initialState: SessionState = {
  status: 'loading',
  session: null,
  profile: null,
  error: null,
};

const SessionContext = createContext<SessionContextValue | null>(null);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected authentication error occurred.';
}

async function loadProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, supplier_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  if (!data) throw new Error('No profile is linked to this account. Contact your administrator.');
  if (data.id !== userId) throw new Error('The profile does not match the authenticated account.');
  if (typeof data.full_name !== 'string' || !data.full_name.trim()) {
    throw new Error('Your profile is missing a valid full name. Contact your administrator.');
  }
  if (data.role !== 'logistics_manager' && data.role !== 'admin' && data.role !== 'supplier') {
    throw new Error('Your profile has an unsupported role. Contact your administrator.');
  }
  if (data.role === 'supplier' && (typeof data.supplier_id !== 'string' || !data.supplier_id.trim())) {
    throw new Error('Your supplier profile is missing a valid supplier assignment. Contact your administrator.');
  }
  if (data.supplier_id !== null && typeof data.supplier_id !== 'string') {
    throw new Error('Your profile contains an invalid supplier assignment. Contact your administrator.');
  }

  return {
    id: data.id,
    full_name: data.full_name.trim(),
    role: data.role,
    supplier_id: data.supplier_id,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const stateRef = useRef(state);
  const sessionRevision = useRef(0);
  stateRef.current = state;

  const syncSession = useCallback(async (session: Session | null) => {
    sessionRevision.current += 1;
    const revision = sessionRevision.current;
    if (!session) {
      setState({ status: 'unauthenticated', session: null, profile: null, error: null });
      return;
    }

    setState((current) => ({
      status: 'loading',
      session,
      profile: current.session?.user.id === session.user.id ? current.profile : null,
      error: null,
    }));

    try {
      const profile = await loadProfile(session.user.id);
      if (sessionRevision.current === revision) {
        setState({ status: 'authenticated', session, profile, error: null });
      }
    } catch (error) {
      if (sessionRevision.current === revision) {
        setState({ status: 'error', session, profile: null, error: getErrorMessage(error) });
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    let pendingProfileLoad: number | undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authEventReceived = true;
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
      const current = stateRef.current;
      if (
        (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
        session &&
        current.status === 'authenticated' &&
        current.profile &&
        current.session?.user.id === session.user.id
      ) {
        const refreshedState = { ...current, session };
        stateRef.current = refreshedState;
        setState(refreshedState);
        return;
      }

      if (pendingProfileLoad !== undefined) window.clearTimeout(pendingProfileLoad);
      pendingProfileLoad = window.setTimeout(() => {
        if (active) void syncSession(session);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authEventReceived) return;
      if (error) {
        setState({ status: 'error', session: null, profile: null, error: `Could not restore your session: ${error.message}` });
        return;
      }
      void syncSession(data.session);
    }).catch((error: unknown) => {
      if (!active || authEventReceived) return;
      setState({ status: 'error', session: null, profile: null, error: `Could not restore your session: ${getErrorMessage(error)}` });
    });

    return () => {
      active = false;
      if (pendingProfileLoad !== undefined) window.clearTimeout(pendingProfileLoad);
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Enter a valid email address.');
    }
    if (!password) throw new Error('Enter your password.');

    sessionRevision.current += 1;
    const revision = sessionRevision.current;
    setState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      const message = getErrorMessage(error);
      if (sessionRevision.current === revision) {
        setState((current) => ({
          ...current,
          status: 'unauthenticated',
          error: message,
        }));
      }
      throw new Error(message);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Enter a valid email address.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (password.length < 8) throw new Error('Use a password with at least 8 characters.');

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    setIsPasswordRecovery(false);
  }, []);

  const signOut = useCallback(async () => {
    sessionRevision.current += 1;
    const revision = sessionRevision.current;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Could not sign out: ${error.message}`);
    if (sessionRevision.current === revision) {
      setIsPasswordRecovery(false);
      setState({ status: 'unauthenticated', session: null, profile: null, error: null });
    }
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    ...state,
    isPasswordRecovery,
    signIn,
    requestPasswordReset,
    updatePassword,
    signOut,
  }), [state, isPasswordRecovery, signIn, requestPasswordReset, updatePassword, signOut]);

  return createElement(SessionContext.Provider, { value, children });
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider.');
  return context;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '--';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

export function getRoleLabel(role: UserRole) {
  if (role === 'logistics_manager') return 'Logistics Manager';
  if (role === 'admin') return 'Administrator';
  return 'Supplier account';
}
