import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Eye } from 'lucide-react';

interface Payment {
  id: string;
  cliente_id: string;
  tipo: string;
  valor_bruto: number;
  valor_liquido: number;
  competencia: string;
  status: string;
  pago_em?: string;
  stripe_payment_id?: string;
  stripe_charge_id?: string;
  created_at: string;
}

interface PaymentHistoryProps {
  clienteId?: string;
  title?: string;
  limit?: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  received: 'bg-green-100 text-green-800',
};

const typeLabels: Record<string, string> = {
  ativacao: 'Ativação',
  mensalidade: 'Mensalidade',
  manual: 'Manual',
  recurring: 'Recorrente',
};

export function PaymentHistory({
  clienteId,
  title = 'Histórico de Pagamentos',
  limit = 10,
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [clienteId]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('pagamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      const { data, error: fetchError } = await query.limit(limit);

      if (fetchError) throw fetchError;

      setPayments(data || []);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setError('Erro ao carregar histórico de pagamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const baseClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return <Badge className={baseClass}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-red-800">{error}</CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Nenhum pagamento registrado</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          Você não tem pagamentos registrados ainda
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Total de {payments.length} pagamento{payments.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-sm">
                    {typeLabels[payment.tipo] || payment.tipo}
                  </p>
                  {getStatusBadge(payment.status)}
                </div>
                <p className="text-xs text-gray-600">
                  Competência: {formatDate(payment.competencia)}
                  {payment.pago_em && ` • Pago em: ${formatDate(payment.pago_em)}`}
                </p>
                {payment.stripe_payment_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID Stripe: {payment.stripe_payment_id.substring(0, 18)}...
                  </p>
                )}
              </div>

              <div className="text-right ml-4">
                <p className="font-bold text-lg">
                  {formatCurrency(payment.valor_liquido)}
                </p>
                <p className="text-xs text-gray-500">
                  Bruto: {formatCurrency(payment.valor_bruto)}
                </p>
              </div>

              <div className="ml-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Handle view details
                    console.log('View payment details:', payment.id);
                  }}
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {payment.stripe_payment_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Open Stripe Dashboard for this payment
                      const stripeUrl = `https://dashboard.stripe.com/payments/${payment.stripe_payment_id}`;
                      window.open(stripeUrl, '_blank');
                    }}
                    title="Ver no Stripe Dashboard"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {payments.length >= limit && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              // Navigate to full payment history
              window.location.href = '/pagamentos';
            }}
          >
            Ver todos os pagamentos
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
