import { CreditCard, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PagamentoPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Pagamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a assinatura do seu espaço de coworking
          </p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
          Área MPE
        </Badge>
      </div>

      <Card className="border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            Pagamento Seguro via Stripe
          </CardTitle>
          <CardDescription>
            Todos os pagamentos são processados de forma segura pela Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>✅ Pagamento mensal automatizado</p>
            <p>✅ Notificação por email antes de cada cobrança</p>
            <p>✅ Cancelamento a qualquer momento</p>
            <p>✅ Histórico completo de transações</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-[#0C1A2A] to-[#1a2f47] border-emerald-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Módulo de pagamento em desenvolvimento</p>
              <p className="text-gray-400 text-sm mt-1">
                A integração com Stripe será liberada em breve.
              </p>
            </div>
            <Button disabled className="bg-emerald-500/50 text-white cursor-not-allowed gap-2">
              Assinar Plano
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagamentoPage;
