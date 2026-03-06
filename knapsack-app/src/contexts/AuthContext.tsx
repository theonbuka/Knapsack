import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState } from '../types';
import { Encryption } from '../utils/encryption';
import { RegisterSchema, LoginSchema, validateAndSanitize } from '../utils/validation';
import { SecureStorage } from '../utils/secureStorage';
import {
  clearActiveUserStorageId,
  getAuthStorageId,
  migrateLegacyDataToUser,
  setActiveUserStorageId,
} from '../utils/accountStorage';
import {
  getSupabaseAuthClient,
  getSupabaseEmailRedirectUrl,
  isSupabaseAuthConfigured,
} from '../utils/supabaseAuth';

interface GoogleLoginData {
  name: string;
  googleId: string;
  email?: string;
  picture?: string;
}

interface RegisterResult {
  success: boolean;
  requiresVerification?: boolean;
  message?: string;
}

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (data: GoogleLoginData) => void;
  logout: (purge?: boolean) => void;
  register: (
    name: string,
    surname: string,
    email: string,
    password: string
  ) => Promise<RegisterResult>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'knapsack_auth';
const HASH_REGEX = /^[a-f0-9]{64}$/i;
const LOCAL_TEST_EMAIL_SUFFIX = '@knapsack.local';
const EMPTY_AUTH: AuthState = {
  name: '',
  surname: '',
  email: '',
  password: '',
  pin: '',
  loggedIn: false,
};

function isLocalBypassEmail(email: string): boolean {
  return email.endsWith(LOCAL_TEST_EMAIL_SUFFIX);
}

function isEmailNotConfirmedError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('email not confirmed') || normalized.includes('email_not_confirmed');
}

function normalizeAuthState(raw: unknown): AuthState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<AuthState>;
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  const surname = typeof candidate.surname === 'string' ? candidate.surname : '';
  const email = typeof candidate.email === 'string' ? candidate.email.trim().toLowerCase() : undefined;
  const password = typeof candidate.password === 'string' ? candidate.password : '';
  const pin = typeof candidate.pin === 'string' ? candidate.pin : '';
  const googleId = typeof candidate.googleId === 'string' ? candidate.googleId : undefined;
  const picture = typeof candidate.picture === 'string' ? candidate.picture : undefined;

  if (!name && !surname && !email && !password && !pin && !googleId) {
    return null;
  }

  const normalized: AuthState = {
    name,
    surname,
    email,
    password,
    pin,
    loggedIn: Boolean(candidate.loggedIn),
    googleId,
    picture,
  };

  // Migrate old plaintext password records to hashed format.
  if (normalized.password && !HASH_REGEX.test(normalized.password)) {
    normalized.password = Encryption.hashPin(normalized.password);
  }

  // Migrate old plaintext PIN records to hashed format.
  if (normalized.pin && !HASH_REGEX.test(normalized.pin)) {
    normalized.pin = Encryption.hashPin(normalized.pin);
  }

  // Legacy fallback: if only pin exists, treat it as password hash.
  if (!normalized.password && normalized.pin) {
    normalized.password = normalized.pin;
  }

  return normalized;
}

function loadLegacyAuth(): AuthState | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeAuthState(parsed);
    if (!normalized) {
      return null;
    }

    SecureStorage.setSecure(AUTH_KEY, normalized);
    return normalized;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const stored = SecureStorage.getSecure<AuthState>(AUTH_KEY);
      const normalizedStored = normalizeAuthState(stored);
      if (normalizedStored) {
        if (normalizedStored.loggedIn) {
          const storageId = getAuthStorageId(normalizedStored);
          if (storageId) {
            setActiveUserStorageId(storageId);
            migrateLegacyDataToUser(storageId);
          }
        } else {
          clearActiveUserStorageId();
        }
        SecureStorage.setSecure(AUTH_KEY, normalizedStored);
        return normalizedStored;
      }

      const legacyStored = loadLegacyAuth();
      if (legacyStored?.loggedIn) {
        const storageId = getAuthStorageId(legacyStored);
        if (storageId) {
          setActiveUserStorageId(storageId);
          migrateLegacyDataToUser(storageId);
        }
      } else {
        clearActiveUserStorageId();
      }
      return legacyStored || EMPTY_AUTH;
    } catch (err) {
      console.error('Failed to load auth:', err);
      return EMPTY_AUTH;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const persistAuth = useCallback((nextAuth: AuthState) => {
    const hasProfileData = Boolean(
      nextAuth.name ||
      nextAuth.surname ||
      nextAuth.email ||
      nextAuth.password ||
      nextAuth.pin ||
      nextAuth.googleId
    );

    try {
      if (hasProfileData) {
        SecureStorage.setSecure(AUTH_KEY, nextAuth);
      } else {
        SecureStorage.remove(AUTH_KEY);
      }
    } catch (err) {
      console.error('Failed to persist auth state:', err);
    }
  }, []);

  const logout = useCallback((purge = false) => {
    clearActiveUserStorageId();

    setAuth(prev => {
      if (purge) {
        try {
          SecureStorage.remove(AUTH_KEY);
        } catch (err) {
          console.error('Failed to remove auth:', err);
        }
        return EMPTY_AUTH;
      }

      const nextAuth: AuthState = {
        ...prev,
        loggedIn: false,
      };

      persistAuth(nextAuth);

      return nextAuth;
    });

    setError(null);
  }, [persistAuth]);

  const loginWithGoogle = useCallback((data: GoogleLoginData) => {
    const nextAuth: AuthState = {
      name: data.name,
      surname: '',
      email: data.email?.toLowerCase(),
      password: '',
      pin: '',
      loggedIn: true,
      googleId: data.googleId,
      picture: data.picture,
    };

    const storageId = getAuthStorageId(nextAuth);
    if (storageId) {
      setActiveUserStorageId(storageId);
      migrateLegacyDataToUser(storageId);
    }

    setAuth(nextAuth);
    setError(null);

    persistAuth(nextAuth);
  }, [persistAuth]);

  const isAuthenticated = auth.loggedIn && (!!auth.password || !!auth.pin || !!auth.googleId);

  // Session expiration (30 minutes inactivity)
  useEffect(() => {
    if (!isAuthenticated) return;

    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, SESSION_TIMEOUT);
    };

    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Start timer

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, logout]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);

      const validated = validateAndSanitize<{ email: string; password: string }>(
        LoginSchema,
        { email, password }
      );
      const normalizedEmail = validated.email.toLowerCase();

      const shouldUseSupabaseEmailAuth = isSupabaseAuthConfigured() && !isLocalBypassEmail(normalizedEmail);
      if (shouldUseSupabaseEmailAuth) {
        const supabase = getSupabaseAuthClient();
        if (supabase) {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: validated.password,
          });

          if (signInError && isEmailNotConfirmedError(signInError.message)) {
            setError('Email adresini doğrulamadan giriş yapamazsın. Aktivasyon mailindeki bağlantıyı aç.');
            return false;
          }

          if (!signInError && data.user) {
            const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;
            const nameFromMetadata = typeof metadata.name === 'string'
              ? metadata.name
              : typeof metadata.given_name === 'string'
                ? metadata.given_name
                : '';
            const surnameFromMetadata = typeof metadata.surname === 'string' ? metadata.surname : '';
            const fallbackName = normalizedEmail.split('@')[0];

            const supabaseAuthState: AuthState = {
              name: (nameFromMetadata || fallbackName || 'Kullanıcı').trim(),
              surname: surnameFromMetadata.trim(),
              email: normalizedEmail,
              password: Encryption.hashPin(validated.password),
              pin: '',
              loggedIn: true,
            };

            const supabaseStorageId = getAuthStorageId(supabaseAuthState);
            if (supabaseStorageId) {
              setActiveUserStorageId(supabaseStorageId);
              migrateLegacyDataToUser(supabaseStorageId);
            }

            setAuth(supabaseAuthState);
            persistAuth(supabaseAuthState);

            // Session tokens are not needed in this local-first app.
            void supabase.auth.signOut();
            return true;
          }
        }
      }

      // Get stored auth and support plaintext migration fallback.
      const storedAuth = normalizeAuthState(SecureStorage.getSecure<AuthState>(AUTH_KEY)) || loadLegacyAuth();
      if (!storedAuth) {
        setError('Kullanıcı bulunamadı');
        return false;
      }

      if (storedAuth.googleId && !storedAuth.password && !storedAuth.pin) {
        setError('Bu hesap Google ile giriş gerektirir');
        return false;
      }

      if (!storedAuth.email || storedAuth.email !== normalizedEmail) {
        setError('Email veya şifre hatalı');
        return false;
      }

      const storedSecret = storedAuth.password || storedAuth.pin;
      if (!storedSecret) {
        setError('Kullanıcı bulunamadı');
        return false;
      }

      const isHashedMatch = Encryption.verifyPin(validated.password, storedSecret);
      const isLegacyPlainMatch = storedSecret === validated.password;
      if (!isHashedMatch && !isLegacyPlainMatch) {
        setError('Email veya şifre hatalı');
        return false;
      }

      const passwordHash = isLegacyPlainMatch ? Encryption.hashPin(validated.password) : storedSecret;

      const localAuthState: AuthState = {
        ...storedAuth,
        email: normalizedEmail,
        password: passwordHash,
        pin: '',
        loggedIn: true,
      };

      const localStorageId = getAuthStorageId(localAuthState);
      if (localStorageId) {
        setActiveUserStorageId(localStorageId);
        migrateLegacyDataToUser(localStorageId);
      }

      setAuth(localAuthState);
      persistAuth(localAuthState);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Giriş başarısız';
      setError(message);
      return false;
    }
  };

  const register = async (
    name: string,
    surname: string,
    email: string,
    password: string
  ): Promise<RegisterResult> => {
    try {
      setError(null);

      const validated = validateAndSanitize<{
        name: string;
        surname: string;
        email: string;
        password: string;
      }>(RegisterSchema, {
        name,
        surname,
        email,
        password,
      });

      const normalizedEmail = validated.email.toLowerCase();
      const shouldUseSupabaseEmailAuth = isSupabaseAuthConfigured() && !isLocalBypassEmail(normalizedEmail);

      if (shouldUseSupabaseEmailAuth) {
        const supabase = getSupabaseAuthClient();
        if (!supabase) {
          setError('Supabase bağlantısı kurulamadı. Lütfen tekrar deneyin.');
          return { success: false };
        }

        const redirectTo = getSupabaseEmailRedirectUrl();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: validated.password,
          options: {
            data: {
              name: validated.name,
              surname: validated.surname,
            },
            ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
          },
        });

        if (signUpError) {
          setError(`Kayıt başarısız: ${signUpError.message}`);
          return { success: false };
        }

        if (data.session) {
          setError('Aktivasyon emaili için Supabase Authentication > Email > Confirm email ayarını açmalısın.');
          void supabase.auth.signOut();
          return { success: false };
        }

        const identityCount = Array.isArray(data.user?.identities) ? data.user.identities.length : 1;
        if (identityCount === 0) {
          setError('Bu email zaten kayıtlı. Giriş yapmayı deneyin.');
          return { success: false };
        }

        clearActiveUserStorageId();

        const pendingAuth: AuthState = {
          name: validated.name,
          surname: validated.surname,
          email: normalizedEmail,
          password: '',
          pin: '',
          loggedIn: false,
        };

        setAuth(pendingAuth);
        persistAuth(pendingAuth);

        return {
          success: false,
          requiresVerification: true,
          message: 'Aktivasyon emaili gönderildi. Mail içinde hoş geldiniz mesajı ve öne çıkan özellikler yer alır.',
        };
      }

      const hashedPassword = Encryption.hashPin(validated.password);
      const newAuth: AuthState = {
        name: validated.name,
        surname: validated.surname,
        email: normalizedEmail,
        password: hashedPassword,
        pin: '',
        loggedIn: true,
      };

      const storageId = getAuthStorageId(newAuth);
      if (storageId) {
        setActiveUserStorageId(storageId);
        migrateLegacyDataToUser(storageId);
      }

      setAuth(newAuth);
      persistAuth(newAuth);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayıt başarısız';
      setError(message);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{
      auth,
      login,
      loginWithGoogle,
      logout,
      register,
      isAuthenticated,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}