import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Comissoes = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState('mes-atual');

  const { data: comissoes, isLoading } = useQuery({
    queryKey: ['comissoes', user?.id, periodo],
    queryFn: async () => {
      const { data: contador } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!contador) return [];

      const { data } = await supabase
        .from('comissoes')
        .select(`
          *,
          clientes (nome, cnpj),
          pagamentos (valor_bruto, pago_em)
        `)
        .eq('contador_id', contador.id)
        .order('created_at', { ascending: false });

      return data || [];
    },
    enabled: !!user
  });

  const diretas = comissoes?.filter(c => c.tipo === 'ativacao' || c.tipo === 'recorrente') || [];
  const overrides = comissoes?.filter(c => c.tipo === 'override') || [];
  const bonus = comissoes?.filter(c => 
    c.tipo === 'bonus_progressao' || 
    c.tipo === 'bonus_volume' || 
    c.tipo === 'bonus_ltv' || 
    c.tipo === 'bonus_contador'
  ) || [];

  const totalProvisionadas = comissoes?.filter(c => c.status === 'calculada').reduce((acc, c) => acc + Number(c.valor), 0) || 0;
  const totalLiberadas = comissoes?.filter(c => c.status === 'paga').reduce((acc, c) => acc + Number(c.valor), 0) || 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      calculada: { variant: 'secondary', label: 'Calculada' },
      aprovada: { variant: 'default', label: 'Aprovada' },
      paga: { variant: 'default', label: 'Paga' },
      cancelada: { variant: 'destructive', label: 'Cancelada' }
    };
    return variants[status] || variants.calculada;
  };

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      'ativacao': 'Ativação',
      'recorrente': 'Recorrente',
      'override': 'Override',
      'bonus_progressao': 'Bônus Progressão',
      'bonus_volume': 'Bônus Volume',
      'bonus_ltv': 'Bônus LTV',
      'bonus_contador': 'Bônus Contador'
    };
    return labels[tipo] || tipo.replace('_', ' ');
  };

  const ComissoesTable = ({ data }: { data: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Competência</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              Nenhuma comissão encontrada
            </TableCell>
          </TableRow>
        ) : (
          data.map((comissao) => {
            const statusInfo = getStatusBadge(comissao.status);
            return (
              <TableRow key={comissao.id}>
                <TableCell className="font-medium">{comissao.clientes?.nome}</TableCell>
                <TableCell>{new Date(comissao.competencia).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="capitalize">{getTipoLabel(comissao.tipo)}</TableCell>
                <TableCell className="font-semibold text-foreground">
                  R$ {Number(comissao.valor).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-serif font-bold">Comissões</h1>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Provisionadas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  R$ {totalProvisionadas.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Liberadas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  R$ {totalLiberadas.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  R$ {(totalProvisionadas + totalLiberadas).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif">Detalhamento de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="diretas">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diretas">Comissões Diretas ({diretas.length})</TabsTrigger>
            <TabsTrigger value="overrides">Overrides ({overrides.length})</TabsTrigger>
            <TabsTrigger value="bonus">Bônus ({bonus.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="diretas" className="mt-6">
            <ComissoesTable data={diretas} />
          </TabsContent>
          <TabsContent value="overrides" className="mt-6">
            <ComissoesTable data={overrides} />
          </TabsContent>
          <TabsContent value="bonus" className="mt-6">
            <ComissoesTable data={bonus} />
          </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Comissoes;
