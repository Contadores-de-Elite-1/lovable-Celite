import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function CheckoutConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  const status = searchParams.get('checkout');
  const isSuccess = status === 'success';
  const isCancel = status === 'cancel';

  useEffect(() => {
    if (isSuccess && user) {
      // Wait a bit for webhook to process
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else {
      setLoading(false);
    }
  }, [isSuccess, user]);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const { data: contador } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!contador) return;

      const { data: cliente } = await supabase
        .from('clientes')
        .select('stripe_subscription_id, status')
        .eq('contador_id', contador.id)
        .not('stripe_subscription_id', 'is', null)
        .maybeSingle();

      setHasSubscription(!!cliente && cliente.status === 'ativo');
    } catch (error) {
      console.error('[CHECKOUT_CONFIRMATION] Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    navigate('/pagamentos');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {isSuccess && (
          <>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
              <CardTitle className="text-2xl text-green-900">
                {loading ? 'Processando...' : 'Pagamento Confirmado!'}
              </CardTitle>
              <CardDescription>
                {loading
                  ? 'Aguarde enquanto confirmamos sua assinatura'
                  : hasSubscription
                  ? 'Sua assinatura está ativa e pronta para uso'
                  : 'Sua assinatura será ativada em instantes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-green-900 text-sm">O que acontece agora?</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Sua assinatura foi ativada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Você já pode começar a receber comissões</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Convide clientes e construa sua rede</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                  size="lg"
                >
                  Ir para Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate('/links')}
                  variant="outline"
                  className="w-full"
                >
                  Ver Meus Links de Indicação
                </Button>
              </div>

              <p className="text-xs text-center text-gray-600">
                Você receberá um email de confirmação do Stripe com os detalhes da sua assinatura
              </p>
            </CardContent>
          </>
        )}

        {isCancel && (
          <>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl text-amber-900">Pagamento Cancelado</CardTitle>
              <CardDescription>
                Você cancelou o processo de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-800">
                  Não se preocupe! Você pode assinar quando quiser.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate('/pagamentos')}
                  className="w-full"
                  size="lg"
                >
                  Tentar Novamente
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Voltar para Dashboard
                </Button>
              </div>

              <p className="text-xs text-center text-gray-600">
                Precisa de ajuda? Entre em contato com nosso suporte
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
