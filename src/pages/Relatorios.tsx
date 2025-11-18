import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  calculateCommissionStats,
  formatCurrency,
} from '@/lib/commission';
import {
  convertToCSV,
  downloadCSV,
  generateCSVFilename,
  formatDateForCSV,
  formatCurrencyForCSV,
} from '@/lib/csv';

const Relatorios = () => {
  const { user } = useAuth();
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorios', user?.id, dateStart, dateEnd],
    queryFn: async () => {
      // Buscar contador
      const { data: contador } = await supabase
        .from('contadores')
        .select('id, nivel, clientes_ativos, xp, profiles(nome)')
        .eq('user_id', user?.id)
        .single();

      if (!contador) return null;

      // Buscar comissões com filtros opcionais
      let comissoesQuery = supabase
        .from('comissoes')
        .select('*, clientes(nome), tipo_comissao, valor, competencia, status_comissao, created_at')
        .eq('contador_id', contador.id);

      if (dateStart) {
        comissoesQuery = comissoesQuery.gte('competencia', dateStart);
      }
      if (dateEnd) {
        comissoesQuery = comissoesQuery.lte('competencia', dateEnd);
      }

      const { data: comissoes } = await comissoesQuery.order('competencia', {
        ascending: false,
      });

      // Buscar indicações
      const { data: indicacoes } = await supabase
        .from('indicacoes')
        .select('created_at, status')
        .eq('contador_id', contador.id);

      return {
        contador,
        comissoes: comissoes || [],
        indicacoes: indicacoes || [],
      };
    },
    enabled: !!user,
  });

  // Calcular dados dos gráficos
  const chartData = useMemo(() => {
    if (!relatorioData?.comissoes) return null;

    const comissoes = relatorioData.comissoes;

    // Dados por mês (últimos 12 meses)
    const monthlyData = new Map<
      string,
      { total: number; recorrente: number; ativacao: number; bonus: number }
    >();

    comissoes.forEach((c: {
      competencia: string;
      valor: number;
      tipo_comissao: string;
    }) => {
      const date = new Date(c.competencia);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          total: 0,
          recorrente: 0,
          ativacao: 0,
          bonus: 0,
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.total += Number(c.valor);

      if (c.tipo_comissao === 'recorrente') {
        data.recorrente += Number(c.valor);
      } else if (c.tipo_comissao === 'ativacao') {
        data.ativacao += Number(c.valor);
      } else if (c.tipo_comissao.includes('bonus')) {
        data.bonus += Number(c.valor);
      }
    });

    const monthlyChartData = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        total: Number(data.total.toFixed(2)),
        recorrente: Number(data.recorrente.toFixed(2)),
        ativacao: Number(data.ativacao.toFixed(2)),
        bonus: Number(data.bonus.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    const typeData = new Map<string, number>();
    comissoes.forEach((c: {
      tipo_comissao: string;
      valor: number;
    }) => {
      const type = c.tipo_comissao || 'desconhecido';
      typeData.set(type, (typeData.get(type) || 0) + Number(c.valor));
    });

    const typeChartData = Array.from(typeData.entries())
      .map(([name, value]) => ({
        name: name.replace('_', ' ').charAt(0).toUpperCase() + name.slice(1),
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);

    const statusData = new Map<string, number>();
    comissoes.forEach((c: {
      status_comissao: string;
      valor: number;
    }) => {
      const status = c.status_comissao || 'desconhecido';
      statusData.set(status, (statusData.get(status) || 0) + Number(c.valor));
    });

    const statusChartData = Array.from(statusData.entries()).map(([name, value]) => ({
      name:
        name === 'calculada'
          ? 'Calculada'
          : name === 'aprovada'
            ? 'Aprovada'
            : name === 'paga'
              ? 'Paga'
              : 'Cancelada',
      value: Number(value.toFixed(2)),
    }));

    return {
      monthly: monthlyChartData,
      type: typeChartData,
      status: statusChartData,
    };
  }, [relatorioData]);

  const stats = useMemo(() => {
    if (!relatorioData?.comissoes) return null;

    const commissionData = relatorioData.comissoes.map((c: {
      valor: number;
      tipo_comissao: string;
      status_comissao: string;
      competencia: string;
    }) => ({
      valor: Number(c.valor),
      tipo_comissao: c.tipo_comissao,
      status_comissao: c.status_comissao,
      competencia: c.competencia,
    }));
    const calculatedStats = calculateCommissionStats(commissionData);

    return calculatedStats;
  }, [relatorioData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const handleDownloadCSV = () => {
    if (!relatorioData?.comissoes || relatorioData.comissoes.length === 0) {
      alert('Nenhuma comissão para exportar');
      return;
    }

    try {
      const rows = relatorioData.comissoes.map((c: {
        competencia: string;
        tipo_comissao: string;
        valor: number;
        status_comissao: string;
        clientes?: { nome: string };
      }) => [
        formatDateForCSV(c.competencia),
        c.tipo_comissao,
        formatCurrencyForCSV(Number(c.valor)),
        c.status_comissao,
        c.clientes?.nome || 'N/A',
      ]);

      const csv = convertToCSV(rows, ['Data', 'Tipo', 'Valor (R$)', 'Status', 'Cliente']);
      const filename = generateCSVFilename('relatorio_comissoes');
      downloadCSV(csv, filename);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar dados. Por favor, tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* HEADER NO MESMO ESTILO DE COMISSÕES */}
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-white p-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#F4C430]">
              Relatórios
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Análises detalhadas de desempenho e comissões
            </p>
          </div>
          <Button
            onClick={handleDownloadCSV}
            className="bg-[#27AE60] hover:bg-green-900 text-white font-medium rounded-lg py-2 px-4 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Filters */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-serif text-blue-900">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setDateStart('');
                      setDateEnd('');
                    }}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Limpar Filtros
                  </Button>
                </div>

                <div className="flex items-end justify-end">
                  <Badge variant="outline" className="text-sm">
                    {relatorioData?.comissoes.length || 0} registros
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

                            {/* KPI Cards – 2x2 a partir de ~480px */}
          <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Total Acumulado
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  R$ {stats?.totalAcumulado.toFixed(0) || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Todas as comissões</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Pago</CardTitle>
                <Download className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-green-600">
                  R$ {stats?.totalPago.toFixed(0) || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Comissões pagas</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Total Pendente
                </CardTitle>
                <Calendar className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-orange-600">
                  R$ {stats?.totalPendente.toFixed(0) || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Aguardando aprovação</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Média Mensal</CardTitle>
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  R$ {stats?.mediaMonthly.toFixed(0) || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Média por mês</p>
              </CardContent>
            </Card>
          </div>



          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Trend */}
            {chartData?.monthly && chartData.monthly.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-blue-900">Tendência Mensal</CardTitle>
                  <CardDescription>Comissões nos últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        dot={{ fill: '#3b82f6', r: 4 }}
                        strokeWidth={2}
                        name="Total"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Commission Type Distribution */}
            {chartData?.type && chartData.type.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-blue-900">Por Tipo</CardTitle>
                  <CardDescription>Distribuição de comissões</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.type} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#666" style={{ fontSize: '12px' }} />
                      <YAxis dataKey="name" type="category" stroke="#666" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Status Distribution - Pie Chart */}
          {chartData?.status && chartData.status.length > 0 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-blue-900">Status das Comissões</CardTitle>
                <CardDescription>Proporção por status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.status}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: R$ ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.status.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Summary */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-blue-900">Resumo Detalhado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-serif font-bold text-blue-900 mb-4">Comissões</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Total de registros</span>
                      <span className="font-semibold text-gray-900">
                        {stats?.totalComissoes || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Valor total</span>
                      <span className="font-semibold text-blue-900">
                        R$ {stats?.totalAcumulado.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Média por comissão</span>
                      <span className="font-semibold text-gray-900">
                        R{'$ '}
                        {stats && stats.totalComissoes > 0
                          ? (stats.totalAcumulado / stats.totalComissoes).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-blue-900 mb-4">Perfil do Contador</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Nível</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {relatorioData?.contador.nivel || 'bronze'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Clientes ativos</span>
                      <span className="font-semibold text-gray-900">
                        {relatorioData?.contador.clientes_ativos || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Experiência (XP)</span>
                      <span className="font-semibold text-gray-900">
                        {relatorioData?.contador.xp || 0} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Relatorios;
