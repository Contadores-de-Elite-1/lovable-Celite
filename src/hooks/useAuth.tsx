import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Roles suportados pelo sistema tripartite V5.0
export type AppRole = 'admin' | 'contador' | 'suporte' | 'mpe' | 'coworking';

// Prioridade para determinar o role principal quando usuário tem múltiplos roles
const ROLE_PRIORITY: AppRole[] = ['admin', 'contador', 'mpe', 'coworking', 'suporte'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    nome: string,
    role?: AppRole
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // Busca roles do usuário sempre que a sessão muda
  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const userRoles = data.map((r) => r.role as AppRole);
          const primaryRole = ROLE_PRIORITY.find((r) => userRoles.includes(r)) ?? null;
          setRole(primaryRole);
        } else {
          setRole(null);
        }
        setRoleLoading(false);
      });
  }, [user?.id]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Obter sessão com retry em caso de falha de rede
    const getSessionWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
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
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
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

      if (error) {
        if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')
        ) {
          return {
            error: new Error(
              'Não foi possível conectar ao servidor. O projeto Supabase pode estar pausado. Aguarde alguns minutos ou entre em contato com o suporte.'
            ),
          };
        }
      }

      return { error };
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))
      ) {
        return {
          error: new Error(
            'Erro de conexão: Não foi possível conectar ao servidor. Verifique sua internet ou tente novamente em alguns minutos.'
          ),
        };
      }
      return { error: err instanceof Error ? err : new Error('Erro desconhecido ao fazer login') };
    }
  };

  // role é passado no metadata para o trigger handle_new_user (Migration 6)
  const signUp = async (
    email: string,
    password: string,
    nome: string,
    role: AppRole = 'contador'
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome, role },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, roleLoading, signIn, signUp, signOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
