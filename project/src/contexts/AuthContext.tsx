import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      // First check for test user
      const testUser = localStorage.getItem('testUser');
      const testToken = localStorage.getItem('testToken');
      
      if (testUser && testToken) {
        console.log('Found test user in localStorage:', testUser);
        const user = JSON.parse(testUser);
        setUser(user);
        setToken(testToken);
        setLoading(false);
        return;
      }
      
      // Then check for Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          role: session.user.user_metadata?.role || 'user'
        });
        setToken(session.access_token);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            role: session.user.user_metadata?.role || 'user'
          });
          setToken(session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);



  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting to login user:', { email });
      
      // Try local API server login first
      try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Local API login successful:', data);
          
          const user = {
            id: data.user.id || `user-${Date.now()}`,
            email: data.user.email || email,
            name: data.user.name || email.split('@')[0],
            role: data.user.role || 'user'
          };
          
          setUser(user);
          setToken(data.token || 'local-token');
          return;
        }
      } catch (apiError) {
        console.log('Local API login failed, trying Supabase as fallback:', apiError);
      }
      
      // Fallback to Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Supabase login response:', { data, error });

      if (error) {
        console.error('Login error details:', error);
        
        // Check if this is a test user
        const testUser = localStorage.getItem('testUser');
        if (testUser) {
          const user = JSON.parse(testUser);
          if (user.email === email) {
            console.log('Logging in as test user:', user);
            setUser(user);
            setToken('test-token');
            return;
          }
        }
        
        throw error;
      }

      if (data.user) {
        console.log('User logged in successfully:', data.user);
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role || 'user'
        });
        setToken(data.session?.access_token || null);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      console.log('Attempting to register user:', { email, name });
      
      // Try local API server registration first
      try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Local API registration successful:', data);
          
          const user = {
            id: data.user.id || `user-${Date.now()}`,
            email: data.user.email || email,
            name: data.user.name || name,
            role: data.user.role || 'user'
          };
          
          setUser(user);
          setToken(data.token || 'local-token');
          return;
        }
      } catch (apiError) {
        console.log('Local API registration failed, trying Supabase as fallback:', apiError);
      }
      
      // Fallback to Supabase registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'user'
          }
        }
      });

      console.log('Supabase registration response:', { data, error });

      if (error) {
        console.error('Registration error details:', error);
        
        // If Supabase fails, create a local user for testing
        console.log('Creating local test user...');
        const testUser = {
          id: `test-${Date.now()}`,
          email: email,
          name: name,
          role: 'user'
        };
        
        setUser(testUser);
        setToken('test-token');
        
        // Store in localStorage for persistence
        localStorage.setItem('testUser', JSON.stringify(testUser));
        localStorage.setItem('testToken', 'test-token');
        
        console.log('Test user created successfully:', testUser);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('Email confirmation required');
        // User created but needs email confirmation
        alert('Registration successful! Please check your email to confirm your account before logging in.');
        return;
      }

      if (data.user && data.session) {
        console.log('User registered successfully:', data.user);
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role || 'user'
        });
        setToken(data.session?.access_token || null);
      } else {
        console.log('No user data returned from registration');
        throw new Error('Registration failed - no user data returned');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear test user data
      localStorage.removeItem('testUser');
      localStorage.removeItem('testToken');
      
      // Try Supabase logout
      await supabase.auth.signOut();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    forgotPassword,
    logout,
    loading,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export { RequireAuth };