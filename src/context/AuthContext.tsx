import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import { syncProfileToMemory } from '../services/memory/memoryService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  isOnboarded: boolean;
  needsOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user needs onboarding (has profile but no nickname)
  const needsOnboarding = !!user && !!profile && !profile.nickname;
  const isOnboarded = !!user && !!profile && !!profile.nickname;

  // Fetch or create user profile
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      // First try to get existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // If profile exists, return it
      if (data) {
        return data;
      }

      // Profile doesn't exist, create one
      console.log('Creating new profile for user:', userId);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        // Return a minimal profile object so the app can continue
        return {
          id: userId,
          nickname: null,
          about_me: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile;
      }

      return newProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const newProfile = await fetchProfile(user.id);
      setProfile(newProfile);
    }
  }, [user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          initialLoadComplete = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);

        if (!mounted) return;

        // Skip INITIAL_SESSION event - initializeAuth handles the initial load
        // This prevents a race condition where the listener fires before initializeAuth completes
        if (event === 'INITIAL_SESSION') {
          return;
        }

        // For actual auth changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
        // Set loading true while we fetch the profile
        if (!initialLoadComplete) {
          // Still initializing, let initializeAuth handle it
          return;
        }

        setLoading(true);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // CRITICAL: Await profile fetch before setting loading to false
          // This ensures profile is available when components render
          try {
            const userProfile = await fetchProfile(newSession.user.id);
            if (mounted) {
              setProfile(userProfile);
            }
          } catch (error) {
            console.error('Error fetching profile on auth change:', error);
          }
        } else {
          setProfile(null);
        }

        // Only set loading false AFTER profile is loaded
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up with email
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        return { error: new Error(error.message) };
      }

      // Refresh profile after update
      await refreshProfile();

      // Sync profile to AI memories (nickname, about_me)
      if (updates.nickname || updates.about_me) {
        syncProfileToMemory(user.id, {
          nickname: updates.nickname,
          about_me: updates.about_me
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
    isOnboarded,
    needsOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
