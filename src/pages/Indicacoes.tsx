import { Handshake, ArrowRight, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Indicacoes = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Handshake className="w-6 h-6 text-[#D4AF37]" />
            Marketplace de Indicações
          </h1>
          <p className="text-muted-foreground mt-1">
            Indique MPEs para Coworkings parceiros e ganhe comissões automáticas
          </p>
        </div>
        <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30">
          Em breve
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-[#D4AF37]" />
              Fluxo 1 — Indicação Direta
            </CardTitle>
            <CardDescription>
              Seu cliente assina um plano no Coworking através da sua indicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ Você indica uma MPE para um Coworking parceiro</p>
              <p>✅ O Coworking confirma a conversão</p>
              <p>✅ <strong className="text-foreground">20% da mensalidade</strong> vai para você como comissão</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              Fluxo 2 — Recorrência LTV
            </CardTitle>
            <CardDescription>
              Ganhe sobre cada pagamento mensal dos seus indicados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ MPE indicada por você continua pagando mensalidade</p>
              <p>✅ Cobrança automática via Stripe</p>
              <p>✅ <strong className="text-foreground">10% recorrente</strong> para você todo mês</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-[#0C1A2A] to-[#1a2f47] border-[#D4AF37]/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Funcionalidade em desenvolvimento</p>
              <p className="text-gray-400 text-sm mt-1">
                O Marketplace completo será liberado em breve. Você receberá uma notificação por email.
              </p>
            </div>
            <Button
              disabled
              className="bg-[#D4AF37]/50 text-[#0C1A2A] cursor-not-allowed gap-2"
            >
              Nova Indicação
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Indicacoes;
