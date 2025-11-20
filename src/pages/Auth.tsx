import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Crown, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getReferralToken, clearReferralToken } from '@/hooks/useReferralTracking';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password, nome)
        : await signIn(email, password);

      if (error) throw error;

      // Se é cadastro, vincular referral
      if (isSignUp) {
        const referralToken = getReferralToken();
        if (referralToken) {
          // Aguardar um pouco para o trigger criar o contador
          setTimeout(async () => {
            try {
              const { data: user } = await supabase.auth.getUser();
              if (user?.user?.id) {
                // Buscar contador indicador pelo token
                const { data: sponsor } = await supabase
                  .rpc('get_contador_by_referral_token', { token: referralToken })
                  .single();
                
                if (sponsor) {
                  // Atualizar contador recém-criado com sponsor_id
                  await supabase
                    .from('contadores')
                    .update({ sponsor_id: sponsor.contador_id })
                    .eq('user_id', user.user.id);
                  
                  console.log(`[Referral] Contador vinculado ao sponsor: ${sponsor.contador_nome}`);
                  
                  // Limpar token após uso
                  clearReferralToken();
                }
              }
            } catch (err) {
              console.error('[Referral] Erro ao vincular sponsor:', err);
            }
          }, 2000);
        }
      }

      toast({
        title: isSignUp ? 'Conta criada!' : 'Bem-vindo!',
        description: isSignUp 
          ? 'Verifique seu email para confirmar a conta.' 
          : 'Login realizado com sucesso.',
      });

      if (!isSignUp) {
        // Verificar se é primeiro login
        const { data: user } = await supabase.auth.getUser();
        
        if (user?.user?.id) {
          const { data: contador } = await supabase
            .from('contadores')
            .select('primeiro_acesso')
            .eq('user_id', user.user.id)
            .single();

          // Se primeiro acesso, redireciona para onboarding
          if (contador?.primeiro_acesso === true) {
            navigate('/onboarding-contador');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      setResendTimer(60);
      
      // Timer countdown
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada e spam.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsForgotPassword(false);
    setResetEmailSent(false);
    setEmail('');
    setPassword('');
    setNome('');
    setResendTimer(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 backdrop-blur-sm border-[#D4AF37]/30 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            {/* Logo Contadores de Elite */}
            <div className="mx-auto w-32 h-32 bg-white rounded-full p-4 shadow-lg border-4 border-[#D4AF37]/20 flex items-center justify-center">
              <img
                src="/images/logo-contadores-elite.jpeg"
                alt="Contadores de Elite"
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-3xl font-serif" style={{ color: '#0C1A2A' }}>
              Contadores de Elite
            </CardTitle>
            <CardDescription>
              {resetEmailSent 
                ? 'Email enviado com sucesso' 
                : isForgotPassword 
                ? 'Recuperar senha' 
                : isSignUp 
                ? 'Crie sua conta' 
                : 'Entre na sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetEmailSent ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Enviamos um link de recuperação para <strong>{email}</strong>
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  O link é válido por 1 hora. Não recebeu? Verifique sua pasta de spam.
                </p>
                {resendTimer > 0 ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Reenviar em {resendTimer}s
                  </p>
                ) : (
                  <Button
                    onClick={() => {
                      setResetEmailSent(false);
                      handlePasswordReset({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    Reenviar email
                  </Button>
                )}
                <Button
                  onClick={resetForm}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>
            ) : isForgotPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o email da sua conta para receber o link de recuperação
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-secondary"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome Completo</label>
                    <Input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      placeholder="Seu nome"
                      disabled={loading}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Senha</label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors underline"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    disabled={loading}
                  />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-secondary"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
                </Button>

                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[#D4AF37] text-sm mt-6 font-medium">
          Lovable-Celite © 2025
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
