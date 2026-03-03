import { Handshake, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const IndicacoesPage = () => {
  const { user } = useAuth();
  const nome = user?.user_metadata?.nome || 'Coworking';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Handshake className="w-6 h-6 text-purple-500" />
            Indicações Recebidas
          </h1>
          <p className="text-muted-foreground mt-1">
            MPEs indicadas por Contadores para o {nome}
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
          Área Coworking
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" /> Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" /> Recusadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">0</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle>Como funciona</CardTitle>
          <CardDescription>
            Fluxo de indicações do Marketplace Contadores de Elite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>1️⃣ Um <strong className="text-foreground">Contador</strong> indica uma MPE para o seu Coworking</p>
            <p>2️⃣ Você recebe a notificação e pode <strong className="text-foreground">aceitar ou recusar</strong></p>
            <p>3️⃣ MPE aceita → pagamento configurado via Stripe</p>
            <p>4️⃣ Plataforma distribui: <strong className="text-foreground">20% ao Contador</strong> + 10% à plataforma</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-[#0C1A2A] to-[#1a2f47] border-purple-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Módulo completo em desenvolvimento</p>
              <p className="text-gray-400 text-sm mt-1">
                Em breve as indicações de Contadores aparecerão aqui para sua análise.
              </p>
            </div>
            <Button disabled className="bg-purple-500/50 text-white cursor-not-allowed gap-2">
              Ver Indicações
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndicacoesPage;
