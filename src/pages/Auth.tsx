import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Calculator, Building2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getReferralToken, clearReferralToken } from '@/hooks/useReferralTracking';
import { cn } from '@/lib/utils';

// Perfis disponíveis no cadastro tripartite V5.0
type ProfileType = 'contador' | 'mpe' | 'coworking';

interface ProfileOption {
  value: ProfileType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    value: 'contador',
    label: 'Contador',
    description: 'Indique MPEs e gerencie sua rede',
    icon: Calculator,
  },
  {
    value: 'mpe',
    label: 'Empresa (MPE)',
    description: 'Encontre espaços de coworking',
    icon: Building2,
  },
  {
    value: 'coworking',
    label: 'Coworking',
    description: 'Receba indicações de MPEs',
    icon: Users,
  },
];

// Rota de redirecionamento pós-login por role
const ROLE_REDIRECT: Record<AppRole, string> = {
  admin: '/dashboard',
  contador: '/dashboard',
  suporte: '/dashboard',
  mpe: '/mpe/membros',
  coworking: '/coworking/indicacoes',
};

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Campos comuns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Seleção de perfil (somente no cadastro)
  const [profileType, setProfileType] = useState<ProfileType>('contador');

  // Campos extras — MPE
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpjMpe, setCnpjMpe] = useState('');

  // Campos extras — Coworking
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpjCoworking, setCnpjCoworking] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Formata CNPJ para XX.XXX.XXX/XXXX-XX
  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // Cria registro de MPE após signup
  const createMpeRecord = async (userId: string) => {
    const { error } = await supabase.from('mpes').insert({
      user_id: userId,
      nome_empresa: nomeEmpresa.trim(),
      cnpj: cnpjMpe.replace(/\D/g, ''),
      status: 'ativo',
    });
    if (error) console.error('[Auth] Erro ao criar registro MPE:', error);
  };

  // Cria registro de Coworking após signup
  const createCoworkingRecord = async (userId: string) => {
    const { error } = await supabase.from('coworkings').insert({
      user_id: userId,
      nome_fantasia: nomeFantasia.trim(),
      cnpj: cnpjCoworking.replace(/\D/g, ''),
      cidade: cidade.trim(),
      estado: estado.trim().toUpperCase().slice(0, 2),
      status: 'ativo',
    });
    if (error) console.error('[Auth] Erro ao criar registro Coworking:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, nome, profileType as AppRole);
        if (error) throw error;

        // Aguarda trigger handle_new_user executar (Migration 6)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Cria registro específico do perfil
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (userId) {
          if (profileType === 'mpe') await createMpeRecord(userId);
          if (profileType === 'coworking') await createCoworkingRecord(userId);

          // Vincular referral se existir (apenas para contadores)
          if (profileType === 'contador') {
            const referralToken = getReferralToken();
            if (referralToken) {
              try {
                const { data: sponsor } = await supabase
                  .rpc('get_contador_by_referral_token', { token: referralToken })
                  .single();

                if (sponsor) {
                  await supabase
                    .from('contadores')
                    .update({ sponsor_id: sponsor.contador_id })
                    .eq('user_id', userId);

                  console.log(`[Referral] Contador vinculado ao sponsor: ${sponsor.contador_nome}`);
                  clearReferralToken();
                }
              } catch (err) {
                console.error('[Referral] Erro ao vincular sponsor:', err);
              }
            }
          }
        }

        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar a conta.',
        });
      } else {
        // Login — redireciona para a rota correta por role
        const { error } = await signIn(email, password);
        if (error) throw error;

        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso.',
        });

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (userId) {
          // Buscar role para redirecionar corretamente
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .limit(1)
            .single();

          const userRole = (roleData?.role as AppRole) ?? 'contador';

          if (userRole === 'contador') {
            const { data: contador } = await supabase
              .from('contadores')
              .select('primeiro_acesso')
              .eq('user_id', userId)
              .single();

            if (contador?.primeiro_acesso === true) {
              navigate('/onboarding-contador');
              return;
            }
          }

          navigate(ROLE_REDIRECT[userRole] ?? '/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      let errorMessage = 'Erro desconhecido';

      if (error instanceof Error) {
        errorMessage = error.message;

        if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')
        ) {
          errorMessage =
            'Não foi possível conectar ao servidor. O projeto Supabase pode estar pausado ou inicializando. Aguarde alguns minutos e tente novamente.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login.';
        }
      }

      toast({
        title: 'Erro',
        description: errorMessage,
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
    setProfileType('contador');
    setNomeEmpresa('');
    setCnpjMpe('');
    setNomeFantasia('');
    setCnpjCoworking('');
    setCidade('');
    setEstado('');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setProfileType('contador');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="bg-white/95 backdrop-blur-sm border-[#D4AF37]/30 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-32 h-32 flex items-center justify-center">
              <img
                src="/images/logo-contadores-elite.webp"
                alt="Contadores de Elite"
                className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.3)] rounded-full border-2 border-[#D4AF37]/30 bg-white/10 p-2"
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('logo-topclass.png')) {
                    target.src = '/images/logo-topclass.png';
                  }
                }}
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
            {/* ── EMAIL ENVIADO ─────────────────────────────── */}
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
                <Button onClick={resetForm} variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>

            ) : isForgotPassword ? (
              /* ── RECUPERAÇÃO DE SENHA ─────────────────────── */
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
                <Button type="submit" className="w-full bg-primary hover:bg-secondary" disabled={loading}>
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
              /* ── LOGIN / CADASTRO ─────────────────────────── */
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Seletor de perfil — visível apenas no cadastro */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tipo de conta</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PROFILE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const selected = profileType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setProfileType(opt.value)}
                            className={cn(
                              'flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center transition-all duration-150 cursor-pointer',
                              selected
                                ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#0C1A2A]'
                                : 'border-border bg-background text-muted-foreground hover:border-[#D4AF37]/50'
                            )}
                          >
                            <Icon className={cn('h-5 w-5', selected ? 'text-[#D4AF37]' : '')} />
                            <span className="text-xs font-medium leading-tight">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {PROFILE_OPTIONS.find((o) => o.value === profileType)?.description}
                    </p>
                  </div>
                )}

                {/* Nome */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {profileType === 'mpe' ? 'Nome do Responsável' : 'Nome Completo'}
                    </label>
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

                {/* Campos extras — MPE */}
                {isSignUp && profileType === 'mpe' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome da Empresa</label>
                      <Input
                        type="text"
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                        required
                        placeholder="Razão Social ou Nome Fantasia"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CNPJ</label>
                      <Input
                        type="text"
                        value={cnpjMpe}
                        onChange={(e) => setCnpjMpe(formatCnpj(e.target.value))}
                        required
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                {/* Campos extras — Coworking */}
                {isSignUp && profileType === 'coworking' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Coworking</label>
                      <Input
                        type="text"
                        value={nomeFantasia}
                        onChange={(e) => setNomeFantasia(e.target.value)}
                        required
                        placeholder="Nome Fantasia"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CNPJ</label>
                      <Input
                        type="text"
                        value={cnpjCoworking}
                        onChange={(e) => setCnpjCoworking(formatCnpj(e.target.value))}
                        required
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        disabled={loading}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-2">
                        <label className="text-sm font-medium">Cidade</label>
                        <Input
                          type="text"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          required
                          placeholder="São Paulo"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">UF</label>
                        <Input
                          type="text"
                          value={estado}
                          onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                          required
                          placeholder="SP"
                          maxLength={2}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
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

                {/* Senha */}
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
                    <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
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
                  onClick={toggleMode}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[#D4AF37] text-sm mt-6 font-medium">
          Contadores de Elite © 2026
        </p>
      </div>
    </div>
  );
};

export default Auth;
