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

interface GoogleLoginData {
  name: string;
  googleId: string;
  email?: string;
  picture?: string;
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
  ) => Promise<boolean>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'knapsack_auth';
const HASH_REGEX = /^[a-f0-9]{64}$/i;
const EMPTY_AUTH: AuthState = {
  name: '',
  surname: '',
  email: '',
  password: '',
  pin: '',
  loggedIn: false,
};

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

      const nextAuth: AuthState = {
        ...storedAuth,
        email: normalizedEmail,
        password: passwordHash,
        pin: '',
        loggedIn: true,
      };

      const storageId = getAuthStorageId(nextAuth);
      if (storageId) {
        setActiveUserStorageId(storageId);
        migrateLegacyDataToUser(storageId);
      }

      setAuth(nextAuth);
      persistAuth(nextAuth);
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
  ): Promise<boolean> => {
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
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayıt başarısız';
      setError(message);
      return false;
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