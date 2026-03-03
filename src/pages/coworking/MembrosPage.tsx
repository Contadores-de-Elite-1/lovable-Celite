import { UserCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MembrosPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-purple-500" />
            Membros do Coworking
          </h1>
          <p className="text-muted-foreground mt-1">
            MPEs ativas no seu espaço de coworking
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
          Área Coworking
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Novos este mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-500">0</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle>Lista de Membros</CardTitle>
          <CardDescription>
            MPEs com assinaturas ativas no seu espaço
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhum membro ativo ainda. Aceite indicações de Contadores para começar.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-[#0C1A2A] to-[#1a2f47] border-purple-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Gestão completa em desenvolvimento</p>
              <p className="text-gray-400 text-sm mt-1">
                Em breve você poderá gerenciar todos os membros e pagamentos nesta tela.
              </p>
            </div>
            <Button disabled className="bg-purple-500/50 text-white cursor-not-allowed gap-2">
              Convidar Membro
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembrosPage;
