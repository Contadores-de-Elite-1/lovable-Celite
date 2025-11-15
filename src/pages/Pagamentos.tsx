import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Loader2, CreditCard, Smartphone, Banknote, Zap } from 'lucide-react';
import { asaasClient } from '@/lib/asaas-client';
import { StripeClient } from '@/lib/stripe-client';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  cpf_cnpj: string;
  asaas_customer_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status?: string;
  plano?: string;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  value: number;
  nextDueDate: string;
  billingType: string;
}

type BillingType = 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_ACCOUNT';

export default function Pagamentos() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<any>(null);
  const [billingType, setBillingType] = useState<BillingType>('CREDIT_CARD');
  const [paymentValue, setPaymentValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'STRIPE' | 'ASAAS'>('STRIPE');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    loadClienteData();
  }, [user, authLoading, navigate]);

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
        .select('id, nome, email, cpf_cnpj, asaas_customer_id, stripe_customer_id, stripe_subscription_id, status, plano')
        .eq('contador_id', contadorData.id)
        .maybeSingle();

      if (clienteData) {
        setCliente(clienteData as Cliente);

        // Load ASAAS subscription if exists
        if (clienteData.asaas_customer_id) {
          await loadSubscriptionInfo(clienteData.asaas_customer_id);
        }

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

  const loadSubscriptionInfo = async (customerId: string) => {
    try {
      const payments = await asaasClient.getCustomerPayments(customerId);

      // Find active subscription (most recent)
      const activePayments = payments.filter(
        (p) =>
          p.status === 'OPEN' ||
          p.status === 'CONFIRMED' ||
          p.status === 'RECEIVED'
      );

      if (activePayments.length > 0) {
        const latestPayment = activePayments[0];
        setSubscription({
          id: latestPayment.id,
          status: latestPayment.status,
          value: latestPayment.value,
          nextDueDate: latestPayment.dueDate,
          billingType: latestPayment.billingType,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar informações de pagamento:', error);
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

  const handleCreateOrUpdateCustomer = async () => {
    if (!cliente) return;

    try {
      setIsProcessing(true);
      setMessage(null);

      // If no Asaas customer ID, create one
      if (!cliente.asaas_customer_id) {
        const newCustomer = await asaasClient.createCustomer({
          name: cliente.nome,
          email: cliente.email,
          cpfCnpj: cliente.cpf_cnpj,
          observation: `Cliente/Contador criado em ${new Date().toLocaleDateString('pt-BR')}`,
        });

        // Update database with Asaas customer ID
        const { error: updateError } = await supabase
          .from(cliente.asaas_customer_id ? 'clientes' : 'contadores')
          .update({ asaas_customer_id: newCustomer.id })
          .eq('id', cliente.id);

        if (updateError) throw updateError;

        setCliente({ ...cliente, asaas_customer_id: newCustomer.id });
        setMessage({
          type: 'success',
          text: 'Cliente registrado com sucesso! Agora você pode criar uma assinatura.',
        });
      } else {
        setMessage({ type: 'success', text: 'Cliente já registrado no Asaas.' });
      }

      setShowPaymentForm(true);
    } catch (error) {
      console.error('Erro ao criar/atualizar cliente:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao processar cliente',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!cliente || !cliente.asaas_customer_id || !paymentValue) {
      setMessage({ type: 'error', text: 'Dados incompletos para criar pagamento' });
      return;
    }

    try {
      setIsProcessing(true);
      setMessage(null);

      const amount = parseFloat(paymentValue);
      if (isNaN(amount) || amount <= 0) {
        setMessage({ type: 'error', text: 'Valor inválido' });
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      const payment = await asaasClient.createPayment({
        customerId: cliente.asaas_customer_id,
        billingType,
        value: amount,
        dueDate,
        description: 'Pagamento - Contadores de Elite',
      });

      // Save payment record to database
      const { error: dbError } = await supabase.from('pagamentos').insert({
        cliente_id: cliente.id,
        tipo: 'manual',
        valor_bruto: amount,
        valor_liquido: amount,
        competencia: new Date().toISOString().split('T')[0],
        status: 'pending',
        asaas_payment_id: payment.id,
        asaas_event_id: 'MANUAL_PAYMENT_CREATED',
      });

      if (dbError) {
        console.warn('Aviso ao salvar em DB:', dbError);
        // Don't fail if DB insert fails - payment is still created in Asaas
      }

      setMessage({
        type: 'success',
        text: `Pagamento criado! Link: ${payment.invoiceUrl || 'Verifique no Asaas'}`,
      });

      setPaymentValue('');
      setShowPaymentForm(false);

      // Reload subscription info
      if (cliente.asaas_customer_id) {
        await loadSubscriptionInfo(cliente.asaas_customer_id);
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao criar pagamento',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!cliente) return;

    try {
      setIsProcessing(true);
      setMessage(null);

      // Get contador_id from cliente or use cliente.id
      const { data: contadorData } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!contadorData) {
        throw new Error('Contador não encontrado');
      }

      console.log('[PAGAMENTOS] Creating Stripe checkout for contador:', contadorData.id);

      // Redirect to Stripe checkout
      await StripeClient.redirectToCheckout({
        contadorId: contadorData.id,
        successUrl: `${window.location.origin}/pagamentos?checkout=success`,
        cancelUrl: `${window.location.origin}/pagamentos?checkout=cancel`,
      });
    } catch (error) {
      console.error('Erro ao criar checkout Stripe:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao criar checkout',
      });
      setIsProcessing(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="container mx-auto py-8">
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
    <div className="container mx-auto py-8">
      <div className="grid gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <p className="text-gray-600 mt-2">Gerencie suas assinaturas e pagamentos</p>
        </div>

        {/* Messages */}
        {message && (
          <Card className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <CardContent className="pt-6 flex items-gap gap-3">
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
              <p className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Gateway Selection */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Escolha sua forma de pagamento
            </CardTitle>
            <CardDescription>Selecione Stripe (recomendado) ou ASAAS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedGateway === 'STRIPE'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedGateway('STRIPE')}
              >
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 text-primary" />
                  {selectedGateway === 'STRIPE' && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">Stripe</h3>
                <p className="text-sm text-gray-600">Pagamento internacional, seguro e rápido</p>
                {!stripeSubscription && (
                  <Button
                    onClick={handleStripeCheckout}
                    disabled={isProcessing}
                    className="w-full mt-4"
                    variant={selectedGateway === 'STRIPE' ? 'default' : 'outline'}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Assinar com Stripe
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedGateway === 'ASAAS'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedGateway('ASAAS')}
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  {selectedGateway === 'ASAAS' && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">ASAAS</h3>
                <p className="text-sm text-gray-600">Gateway nacional com PIX e boleto</p>
                {!cliente.asaas_customer_id && selectedGateway === 'ASAAS' && (
                  <Button
                    onClick={handleCreateOrUpdateCustomer}
                    disabled={isProcessing}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      'Registrar no ASAAS'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Dados do cliente registrado no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Nome</Label>
                <p className="font-medium">{cliente.nome}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <p className="font-medium">{cliente.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">CPF/CNPJ</Label>
                <p className="font-medium">{cliente.cpf_cnpj || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Status</Label>
                <p className="font-medium">
                  {stripeSubscription?.status === 'ativo' ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Ativo (Stripe)
                    </span>
                  ) : cliente.asaas_customer_id ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Ativo (ASAAS)
                    </span>
                  ) : (
                    <span className="text-amber-600">Sem assinatura</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Subscription Info */}
        {stripeSubscription && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Assinatura Stripe Ativa
              </CardTitle>
              <CardDescription>Sua assinatura via Stripe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <p className="font-medium">
                    <span className={stripeSubscription.status === 'ativo' ? 'text-green-600' : 'text-amber-600'}>
                      {stripeSubscription.status === 'ativo' ? '✓ Ativo' : stripeSubscription.status}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Plano</Label>
                  <p className="font-medium">{stripeSubscription.plano || 'Standard'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Customer ID</Label>
                  <p className="font-medium text-xs text-gray-500">{stripeSubscription.stripe_customer_id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Subscription ID</Label>
                  <p className="font-medium text-xs text-gray-500">{stripeSubscription.stripe_subscription_id}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Gerencie sua assinatura diretamente no portal do Stripe
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ASAAS Subscription Info */}
        {subscription && selectedGateway === 'ASAAS' && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Assinatura ASAAS Ativa
              </CardTitle>
              <CardDescription>Informações da sua assinatura ASAAS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Valor</Label>
                  <p className="font-medium text-lg">R$ {subscription.value.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Próximo Vencimento</Label>
                  <p className="font-medium">
                    {new Date(subscription.nextDueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <p className="font-medium">
                    <span
                      className={
                        subscription.status === 'RECEIVED'
                          ? 'text-green-600'
                          : subscription.status === 'CONFIRMED'
                            ? 'text-blue-600'
                            : 'text-amber-600'
                      }
                    >
                      {subscription.status}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Forma de Pagamento</Label>
                  <p className="font-medium">{subscription.billingType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods - ASAAS */}
        {cliente.asaas_customer_id && !showPaymentForm && selectedGateway === 'ASAAS' && (
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento Disponíveis</CardTitle>
              <CardDescription>Escolha como deseja pagar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                     onClick={() => { setBillingType('CREDIT_CARD'); setShowPaymentForm(true); }}>
                  <CreditCard className="w-8 h-8 mb-2 text-blue-600" />
                  <h3 className="font-medium">Cartão de Crédito</h3>
                  <p className="text-sm text-gray-600">Parcelamento disponível</p>
                </div>
                <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                     onClick={() => { setBillingType('PIX'); setShowPaymentForm(true); }}>
                  <Smartphone className="w-8 h-8 mb-2 text-green-600" />
                  <h3 className="font-medium">PIX</h3>
                  <p className="text-sm text-gray-600">Transferência imediata</p>
                </div>
                <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                     onClick={() => { setBillingType('BOLETO'); setShowPaymentForm(true); }}>
                  <Banknote className="w-8 h-8 mb-2 text-amber-600" />
                  <h3 className="font-medium">Boleto</h3>
                  <p className="text-sm text-gray-600">Código para pagamento</p>
                </div>
                <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                     onClick={() => { setBillingType('DEBIT_ACCOUNT'); setShowPaymentForm(true); }}>
                  <Banknote className="w-8 h-8 mb-2 text-purple-600" />
                  <h3 className="font-medium">Débito em Conta</h3>
                  <p className="text-sm text-gray-600">Automático mensalmente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form - ASAAS */}
        {cliente.asaas_customer_id && showPaymentForm && selectedGateway === 'ASAAS' && (
          <Card>
            <CardHeader>
              <CardTitle>Novo Pagamento</CardTitle>
              <CardDescription>Crie um pagamento único ou assinatura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentValue}
                  onChange={(e) => setPaymentValue(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div>
                <Label htmlFor="billing">Forma de Pagamento</Label>
                <Select value={billingType} onValueChange={(value) => setBillingType(value as BillingType)}>
                  <SelectTrigger id="billing" disabled={isProcessing}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="DEBIT_ACCOUNT">Débito em Conta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreatePayment}
                  disabled={isProcessing || !paymentValue}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Criar Pagamento'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentForm(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
