import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  calculateTotalCommissions,
  calculatePaidCommissions,
  calculateCommissionStats,
  formatCurrency,
} from '@/lib/commission';
import { filterByMultipleCriteria } from '@/lib/filters';
import { convertToCSV, downloadCSV, generateCSVFilename } from '@/lib/csv';

const Comissoes = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState('mes-atual');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: allComissoes, isLoading } = useQuery({
    queryKey: ['comissoes', user?.id],
    queryFn: async () => {
      const { data: contador } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!contador) return [];

      const { data } = await supabase
        .from('comissoes')
        .select(
          `
          *,
          clientes (nome, cnpj),
          pagamentos (valor_bruto, pago_em)
        `
        )
        .eq('contador_id', contador.id)
        .order('created_at', { ascending: false });

      return data || [];
    },
    enabled: !!user,
  });

  // Apply filters using tested utility
  const comissoes = useMemo(() => {
    if (!allComissoes) return [];

    const filterData = allComissoes.map(c => ({
      competencia: c.competencia,
      status_comissao: c.status_comissao,
    }));

    return filterByMultipleCriteria(filterData, {
      startDate: dateStart || undefined,
      endDate: dateEnd || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }).map(filtered => {
      return allComissoes.find(c => c.competencia === filtered.competencia);
    }).filter(Boolean) as typeof allComissoes;
  }, [allComissoes, dateStart, dateEnd, statusFilter]);

  const diretas =
    comissoes?.filter((c) => c.tipo_comissao === 'ativacao' || c.tipo_comissao === 'recorrente') ||
    [];
  const overrides = comissoes?.filter((c) => c.tipo_comissao === 'override') || [];
  const bonus =
    comissoes?.filter(
      (c) =>
        c.tipo_comissao === 'bonus_progressao' ||
        c.tipo_comissao === 'bonus_volume' ||
        c.tipo_comissao === 'bonus_ltv' ||
        c.tipo_comissao === 'bonus_contador'
    ) || [];

  // Use tested utility to calculate commission stats
  const stats = useMemo(() => {
    if (!comissoes) return null;
    const commissionData = comissoes.map(c => ({
      valor: Number(c.valor),
      tipo_comissao: c.tipo_comissao,
      status_comissao: c.status_comissao,
      competencia: c.competencia,
    }));
    return calculateCommissionStats(commissionData);
  }, [comissoes]);

  // Calculate totals using utility results
  const totalProvisionadas = useMemo(() => {
    if (!comissoes) return 0;
    return comissoes
      .filter((c) => c.status_comissao === 'calculada')
      .reduce((acc, c) => acc + Number(c.valor), 0);
  }, [comissoes]);

  const totalLiberadas = useMemo(() => {
    if (!comissoes) return 0;
    return comissoes
      .filter((c) => c.status_comissao === 'paga')
      .reduce((acc, c) => acc + Number(c.valor), 0);
  }, [comissoes]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'secondary' | 'default' | 'destructive'; label: string; color: string }> = {
      calculada: { variant: 'secondary', label: 'Calculada', color: 'bg-blue-100 text-blue-800' },
      aprovada: { variant: 'default', label: 'Aprovada', color: 'bg-yellow-100 text-yellow-800' },
      paga: { variant: 'default', label: 'Paga', color: 'bg-green-100 text-green-800' },
      cancelada: { variant: 'destructive', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    };
    return variants[status] || variants.calculada;
  };

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      ativacao: 'Ativação',
      recorrente: 'Recorrente',
      override: 'Override',
      bonus_progressao: 'Bônus Progressão',
      bonus_volume: 'Bônus Volume',
      bonus_ltv: 'Bônus LTV',
      bonus_contador: 'Bônus Contador',
    };
    return labels[tipo] || tipo.replace('_', ' ');
  };

  const handleDownloadCSV = () => {
    if (!comissoes || comissoes.length === 0) {
      alert('Nenhuma comissão para exportar');
      return;
    }

    try {
      // Prepare data in format expected by convertToCSV
      const rows = comissoes.map((c) => [
        c.clientes?.nome || 'N/A',
        new Date(c.competencia).toLocaleDateString('pt-BR'),
        getTipoLabel(c.tipo_comissao),
        Number(c.valor).toFixed(2),
        getStatusBadge(c.status_comissao).label,
      ]);

      // Use tested CSV utility to generate CSV with proper escaping
      const csv = convertToCSV(rows, ['Cliente', 'Competência', 'Tipo', 'Valor (R$)', 'Status']);

      // Use tested CSV utility to download
      const filename = generateCSVFilename('comissoes');
      downloadCSV(csv, filename);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar dados. Por favor, tente novamente.');
    }
  };

  const ComissoesTable = ({ data }: { data: typeof comissoes }) => (
    <div className="overflow-x-auto">
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
              <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                Nenhuma comissão encontrada
              </TableCell>
            </TableRow>
          ) : (
            data.map((comissao) => {
              const statusInfo = getStatusBadge(comissao.status_comissao);
              return (
                <TableRow key={comissao.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {comissao.clientes?.nome || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {new Date(comissao.competencia).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="capitalize text-gray-700">
                    {getTipoLabel(comissao.tipo_comissao)}
                  </TableCell>
                  <TableCell className="font-semibold text-blue-900">
                    R$ {Number(comissao.valor).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando comissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-yellow-400">Comissões</h1>
          <p className="text-blue-100 text-sm mt-1">Acompanhe suas comissões e exporte dados</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Provisionadas</CardTitle>
                <Clock className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  R$ {totalProvisionadas.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Aguardando aprovação</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Liberadas</CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-green-600">
                  R$ {totalLiberadas.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Já pagas</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  R$ {(totalProvisionadas + totalLiberadas).toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Provisionadas + Pagas</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-serif text-blue-900">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Data Inicial
                  </Label>
                  <Input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">Data Final</Label>
                  <Input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="calculada">Calculada</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="paga">Paga</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setDateStart('');
                      setDateEnd('');
                      setStatusFilter('all');
                    }}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleDownloadCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-4 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Commissions Table */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-blue-900">
                Detalhamento de Comissões ({comissoes?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="diretas">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="diretas" className="text-sm">
                    Diretas ({diretas.length})
                  </TabsTrigger>
                  <TabsTrigger value="overrides" className="text-sm">
                    Overrides ({overrides.length})
                  </TabsTrigger>
                  <TabsTrigger value="bonus" className="text-sm">
                    Bônus ({bonus.length})
                  </TabsTrigger>
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
