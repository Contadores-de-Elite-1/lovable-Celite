import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Relatorios = () => {
  const { user } = useAuth();
  
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorios', user?.id],
    queryFn: async () => {
      // Buscar contador
      const { data: contador } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!contador) return null;

      // Buscar comissões
      const { data: comissoes } = await supabase
        .from('comissoes')
        .select('valor, competencia, status')
        .eq('contador_id', contador.id)
        .order('competencia', { ascending: false });

      // Buscar indicações
      const { data: indicacoes } = await supabase
        .from('indicacoes')
        .select('created_at, status')
        .eq('contador_id', contador.id);

      // Calcular estatísticas de comissões
      const hoje = new Date();
      const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const mesPassadoFormatado = mesPassado.toISOString().split('T')[0];
      
      const comissoesUltimoMes = comissoes?.filter(c => 
        c.competencia >= mesPassadoFormatado
      ) || [];
      
      const totalUltimoMes = comissoesUltimoMes.reduce((sum, c) => sum + Number(c.valor), 0);
      const totalAcumulado = comissoes?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
      const mediaMensal = comissoes && comissoes.length > 0 
        ? totalAcumulado / comissoes.length 
        : 0;

      // Calcular estatísticas de indicações
      const mesAtualInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const indicacoesEsteMes = indicacoes?.filter(i => 
        new Date(i.created_at) >= mesAtualInicio
      ).length || 0;
      
      const totalIndicacoes = indicacoes?.length || 0;
      const mediaIndicacoesMensal = totalIndicacoes > 0 
        ? Math.round(totalIndicacoes / 12) 
        : 0;

      return {
        comissoes: {
          ultimoMes: totalUltimoMes,
          mediaMensal,
          totalAcumulado
        },
        indicacoes: {
          esteMes: indicacoesEsteMes,
          mediaMensal: mediaIndicacoesMensal,
          total: totalIndicacoes
        }
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Análises detalhadas de desempenho e comissões
            </p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Relatório de Comissões
              </CardTitle>
              <CardDescription>
                Análise completa das suas comissões mensais e anuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Último mês</span>
                  <span className="font-semibold">
                    R$ {relatorioData?.comissoes.ultimoMes.toFixed(2) || '0,00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Média mensal</span>
                  <span className="font-semibold">
                    R$ {relatorioData?.comissoes.mediaMensal.toFixed(2) || '0,00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total acumulado</span>
                  <span className="font-semibold text-primary">
                    R$ {relatorioData?.comissoes.totalAcumulado.toFixed(2) || '0,00'}
                  </span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Relatório Detalhado
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Relatório de Indicações
              </CardTitle>
              <CardDescription>
                Acompanhe o crescimento da sua rede de indicações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Este mês</span>
                  <span className="font-semibold">
                    {relatorioData?.indicacoes.esteMes || 0} indicações
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Média mensal</span>
                  <span className="font-semibold">
                    {relatorioData?.indicacoes.mediaMensal || 0} indicações
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de indicações</span>
                  <span className="font-semibold text-primary">
                    {relatorioData?.indicacoes.total || 0}
                  </span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Relatório Detalhado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Relatórios</CardTitle>
            <CardDescription>Acesse relatórios gerados anteriormente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum relatório gerado ainda</p>
                <p className="text-sm mt-2">
                  Gere seu primeiro relatório para começar o histórico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
