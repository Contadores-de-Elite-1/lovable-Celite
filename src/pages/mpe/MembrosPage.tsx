import { LayoutDashboard, Building2, Wifi, Coffee, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const MembrosPage = () => {
  const { user } = useAuth();
  const nome = user?.user_metadata?.nome || 'Empresa';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-500" />
            Bem-vindo, {nome}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o espaço de coworking da sua empresa
          </p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
          Área MPE
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">Ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Coworking Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Nenhum vinculado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Próximo Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Benefícios do coworking */}
      <Card className="border-emerald-500/20">
        <CardHeader>
          <CardTitle>Benefícios do Coworking</CardTitle>
          <CardDescription>O que você tem acesso ao usar um espaço parceiro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Wifi, label: 'Internet de alta velocidade' },
              { icon: Coffee, label: 'Café e copa equipada' },
              { icon: Users, label: 'Salas de reunião' },
              { icon: Building2, label: 'Endereço fiscal' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center"
              >
                <Icon className="w-6 h-6 text-emerald-500" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-[#0C1A2A] to-[#1a2f47] border-emerald-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Módulo completo em desenvolvimento</p>
              <p className="text-gray-400 text-sm mt-1">
                Em breve você poderá escolher coworkings parceiros e fazer o pagamento via Stripe.
              </p>
            </div>
            <Button disabled className="bg-emerald-500/50 text-white cursor-not-allowed gap-2">
              Escolher Coworking
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembrosPage;
