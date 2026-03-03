// hooks/useAuth.ts — Auth state management
import { useEffect, useState } from 'react';
import { authService } from '@/service/auth-service';
import { useAppStore } from '@/store/app-store';

export function useAuth() {
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    authService.getSession().then((session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const signIn = async (email: string, password: string) => {
    const { user } = await authService.signInWithEmail(email, password);
    setUser(user);
  };

  const signUp = async (email: string, password: string) => {
    const { user } = await authService.signUp(email, password);
    setUser(user ?? null);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  return { user, loading, signIn, signUp, signOut, signInWithGoogle };
}
