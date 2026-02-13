import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Tentar obter sessão com retry em caso de erro de rede
    const getSessionWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            return;
          }
        } catch (err) {
          if (i === retries - 1) {
            console.error('[Auth] Erro ao obter sessão após', retries, 'tentativas:', err);
            setLoading(false);
          } else {
            // Aguardar antes de tentar novamente (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
    };

    getSessionWithRetry();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      // Tratar erro de conexão com mensagem mais clara
      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return { 
            error: new Error('Não foi possível conectar ao servidor. O projeto Supabase pode estar pausado. Aguarde alguns minutos ou entre em contato com o suporte.') 
          };
        }
      }
      
      return { error };
    } catch (err) {
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        return { 
          error: new Error('Erro de conexão: Não foi possível conectar ao servidor. Verifique sua internet ou tente novamente em alguns minutos.') 
        };
      }
      return { error: err instanceof Error ? err : new Error('Erro desconhecido ao fazer login') };
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
