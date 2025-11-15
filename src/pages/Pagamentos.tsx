import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, Loader2, Zap, CreditCard, Calendar, TestTube } from 'lucide-react';
import { StripeClient } from '@/lib/stripe-client';
import { isTestMode } from '@/lib/stripe-config';
import { useToast } from '@/hooks/use-toast';
import { trackCheckoutStep, CheckoutEvents } from '@/lib/analytics';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  cpf_cnpj?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status?: string;
  plano?: string;
}

export default function Pagamentos() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const testMode = isTestMode();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    // Track page view
    trackCheckoutStep(CheckoutEvents.VIEWED_PRICING, {
      testMode,
    });

    loadClienteData();
  }, [user, authLoading, navigate]);

  // Handle checkout redirect
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      setMessage({
        type: 'success',
        text: 'Pagamento processado com sucesso! Sua assinatura está ativa.',
      });
    } else if (checkoutStatus === 'cancel') {
      setMessage({
        type: 'error',
        text: 'Pagamento cancelado. Você pode tentar novamente quando quiser.',
      });
    }
  }, [searchParams]);

  const loadClienteData = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      // Get current user's contador info
      const { data: contadorData, error: contadorError } = await supabase
        .from('contadores')
        .select('id, nome, email, cpf_cnpj')
        .eq('user_id', user?.id)
        .single();

      if (contadorError) {
        setMessage({ type: 'error', text: 'Contador não encontrado' });
        return;
      }

      // Check if contador has a cliente record (subscription info)
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id, nome, email, cpf_cnpj, stripe_customer_id, stripe_subscription_id, status, plano')
        .eq('contador_id', contadorData.id)
        .maybeSingle();

      if (clienteData) {
        setCliente(clienteData as Cliente);

        // Load Stripe subscription if exists
        if (clienteData.stripe_subscription_id) {
          await loadStripeSubscriptionInfo(contadorData.id);
        }
      } else {
        // No cliente record yet - use contador data
        setCliente({
          id: contadorData.id,
          nome: contadorData.nome,
          email: contadorData.email,
          cpf_cnpj: contadorData.cpf_cnpj,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados do cliente' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStripeSubscriptionInfo = async (contadorId: string) => {
    try {
      const subscription = await StripeClient.getSubscriptionStatus(contadorId);
      setStripeSubscription(subscription);
    } catch (error) {
      console.error('Erro ao carregar informações de assinatura Stripe:', error);
    }
  };

  const handleStripeCheckout = async () => {
    if (!cliente) return;

    // Track button click
    trackCheckoutStep(CheckoutEvents.CLICKED_SUBSCRIBE, {
      clienteId: cliente.id,
      testMode,
    });

    try {
      setIsProcessing(true);
      setMessage(null);

      // Get contador_id
      const { data: contadorData } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!contadorData) {
        throw new Error('Contador não encontrado');
      }

      console.log('[PAGAMENTOS] Creating Stripe checkout for contador:', contadorData.id);

      // Show loading toast
      toast({
        title: "Processando...",
        description: "Criando sessão de pagamento segura",
      });

      // Track session creation
      trackCheckoutStep(CheckoutEvents.SESSION_CREATED, {
        contadorId: contadorData.id,
        testMode,
      });

      // Redirect to Stripe checkout
      await StripeClient.redirectToCheckout({
        contadorId: contadorData.id,
        successUrl: `${window.location.origin}/checkout-confirmation?checkout=success`,
        cancelUrl: `${window.location.origin}/checkout-confirmation?checkout=cancel`,
      });

      // Track redirect (might not fire if redirect is immediate)
      trackCheckoutStep(CheckoutEvents.REDIRECTED_TO_STRIPE, {
        contadorId: contadorData.id,
        testMode,
      });
    } catch (error) {
      console.error('Erro ao criar checkout Stripe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar checkout';

      // Track error
      trackCheckoutStep(CheckoutEvents.ERROR, {
        error: errorMessage,
        testMode,
      });

      setMessage({
        type: 'error',
        text: errorMessage,
      });

      // Show error toast
      toast({
        variant: "destructive",
        title: "Erro no pagamento",
        description: errorMessage,
      });

      setIsProcessing(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 md:py-8">
        <div className="grid gap-6 md:gap-8">
          {/* Header Skeleton */}
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Main Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>

          {/* Info Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-800">
            Nenhum cliente encontrado. Por favor, complete seu perfil primeiro.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:py-8">
      <div className="grid gap-6 md:gap-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold">Assinaturas</h1>
            {testMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                <TestTube className="w-3.5 h-3.5" />
                Modo Teste
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
            Gerencie sua assinatura com Stripe
          </p>
        </div>

        {/* Messages */}
        {message && (
          <Card className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <CardContent className="pt-6 flex items-start gap-3">
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm md:text-base ${message.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                {message.text}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main CTA - If no subscription */}
        {!stripeSubscription && (
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Assine o Plano Premium</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Comece a receber comissões e ganhar com sua rede
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm md:text-base">Comissões recorrentes</p>
                    <p className="text-xs md:text-sm text-gray-600">Ganhe mensalmente com seus clientes ativos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm md:text-base">Rede multinível</p>
                    <p className="text-xs md:text-sm text-gray-600">Ganhe com indicações de até 5 níveis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm md:text-base">Bônus progressivos</p>
                    <p className="text-xs md:text-sm text-gray-600">Desbloqueie recompensas ao subir de nível</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStripeCheckout}
                disabled={isProcessing}
                className="w-full h-12 text-base md:text-lg"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Assinar Agora
                  </>
                )}
              </Button>

              <p className="text-xs md:text-sm text-center text-gray-600">
                Pagamento seguro via Stripe • Cancele quando quiser
              </p>
            </CardContent>
          </Card>
        )}

        {/* Active Subscription Info */}
        {stripeSubscription && (
          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Assinatura Ativa
              </CardTitle>
              <CardDescription>Sua assinatura está ativa via Stripe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <Label className="text-xs text-gray-600">Status</Label>
                  <p className="font-bold text-lg text-green-600 mt-1">
                    {stripeSubscription.status === 'ativo' ? '✓ Ativo' : stripeSubscription.status}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <Label className="text-xs text-gray-600">Plano</Label>
                  <p className="font-bold text-lg mt-1">{stripeSubscription.plano || 'Premium'}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <Label className="text-xs text-gray-600 mb-2 block">Informações da Conta</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">Customer ID</Label>
                    <p className="font-mono text-xs text-gray-700 break-all">
                      {stripeSubscription.stripe_customer_id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Subscription ID</Label>
                    <p className="font-mono text-xs text-gray-700 break-all">
                      {stripeSubscription.stripe_subscription_id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs md:text-sm text-gray-600 text-center">
                  Para gerenciar sua assinatura (atualizar cartão, cancelar, etc),<br className="hidden md:block" />
                  acesse o portal do Stripe através do seu email de confirmação
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Informações da Conta</CardTitle>
            <CardDescription>Dados do seu cadastro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Nome</Label>
                <p className="font-medium text-sm md:text-base">{cliente.nome}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Email</Label>
                <p className="font-medium text-sm md:text-base break-all">{cliente.email}</p>
              </div>
              {cliente.cpf_cnpj && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">CPF/CNPJ</Label>
                  <p className="font-medium text-sm md:text-base">{cliente.cpf_cnpj}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Status da Assinatura</Label>
                <p className="font-medium text-sm md:text-base">
                  {stripeSubscription?.status === 'ativo' ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Ativo (Stripe)
                    </span>
                  ) : (
                    <span className="text-amber-600">Sem assinatura</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-blue-900 mb-1">
                  Precisa de ajuda?
                </h3>
                <p className="text-xs md:text-sm text-blue-800">
                  Entre em contato com nosso suporte através do email:
                  <br />
                  <a href="mailto:suporte@contadoresdeelite.com" className="font-medium underline">
                    suporte@contadoresdeelite.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
