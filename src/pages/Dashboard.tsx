import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Award, DollarSign, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart as RechartLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  calculateCommissionStats,
  calculateMonthlyAverage,
  formatCurrency,
} from '@/lib/commission';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [contador, setContador] = useState<{
    id: string;
    nome?: string;
    nivel?: string;
    clientes_ativos?: number;
    xp?: number;
    profiles?: { nome: string };
  } | null>(null);
  const [stats, setStats] = useState({
    clientes: 0,
    comissoes: 0,
    xp: 0,
    nivel: 'bronze',
    crescimento: 0,
  });
  const [chartData, setChartData] = useState<Array<{ mes: string; total: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: contadorData } = await supabase
      .from('contadores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (contadorData) {
      setContador(contadorData);

      // Buscar comissões dos últimos 12 meses
      const hoje = new Date();
      const dozeAnosAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
      const dataFormatada = dozeAnosAtras.toISOString().split('T')[0];

      const { data: comissoesData } = await supabase
        .from('comissoes')
        .select('valor, competencia, status')
        .eq('contador_id', contadorData.id)
        .gte('competencia', dataFormatada)
        .order('competencia', { ascending: true });

      // Calcular dados do mês atual
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const primeiroDiaMesFormatado = primeiroDiaMes.toISOString().split('T')[0];

      const comissoesAtual = comissoesData?.filter(
        (c) => c.competencia >= primeiroDiaMesFormatado
      ) || [];

      // Use tested utility to calculate total for current month
      const totalComissoesAtual = comissoesAtual.reduce(
        (sum, c) => sum + Number(c.valor),
        0
      );

      // Calcular crescimento (mês anterior vs atual)
      const primeiroDiaMesAnterior = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - 1,
        1
      );
      const primeiroDiaMesAnteriorFormatado = primeiroDiaMesAnterior
        .toISOString()
        .split('T')[0];
      const ultimoDiaMesAnterior = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        0
      );
      const ultimoDiaMesAnteriorFormatado = ultimoDiaMesAnterior
        .toISOString()
        .split('T')[0];

      const comissoesMesAnterior = comissoesData?.filter(
        (c) =>
          c.competencia >= primeiroDiaMesAnteriorFormatado &&
          c.competencia <= ultimoDiaMesAnteriorFormatado
      ) || [];

      // Calculate previous month total
      const totalComissoesMesAnterior = comissoesMesAnterior.reduce(
        (sum, c) => sum + Number(c.valor),
        0
      );

      // Calculate growth rate
      const crescimento =
        totalComissoesMesAnterior > 0
          ? ((totalComissoesAtual - totalComissoesMesAnterior) /
              totalComissoesMesAnterior) *
            100
          : 0;

      // Preparar dados para gráfico (últimos 12 meses)
      const meses = Array.from({ length: 12 }, (_, i) => {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - 11 + i, 1);
        return {
          mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          data: data.toISOString().split('T')[0],
        };
      });

      const dados = meses.map((mes) => {
        const comissoesMes = comissoesData?.filter((c) =>
          c.competencia.startsWith(mes.data.substring(0, 7))
        ) || [];
        const total = comissoesMes.reduce((sum, c) => sum + Number(c.valor), 0);
        return {
          mes: mes.mes,
          total: total,
        };
      });

      setChartData(dados);
      setStats({
        clientes: contadorData.clientes_ativos || 0,
        comissoes: totalComissoesAtual,
        xp: contadorData.xp || 0,
        nivel: contadorData.nivel || 'bronze',
        crescimento: Math.round(crescimento * 10) / 10,
      });
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Contadores de Elite</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white text-white hover:bg-white hover:text-blue-900"
          >
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-blue-900">
                Bem-vindo, {contador?.nome || 'Contador'}!
              </h2>
              <p className="text-gray-600 mt-1">
                Nível:{' '}
                <span className="text-yellow-500 capitalize font-semibold">
                  {stats.nivel}
                </span>
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Clientes Ativos
                </CardTitle>
                <Users className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  {stats.clientes}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total de clientes</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Comissões
                </CardTitle>
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  R$ {stats.comissoes.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Mês atual</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Experiência
                </CardTitle>
                <Award className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  {stats.xp}
                </div>
                <p className="text-xs text-gray-500 mt-1">Pontos XP</p>
              </CardContent>
            </Card>

            <Card
              className={`bg-white border-0 shadow-sm hover:shadow-md transition-shadow ${
                stats.crescimento > 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Crescimento
                </CardTitle>
                <TrendingUp
                  className={`h-5 w-5 ${
                    stats.crescimento > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-serif font-bold ${
                    stats.crescimento > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stats.crescimento > 0 ? '+' : ''}{stats.crescimento}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  vs. mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-serif text-blue-900 flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Tendência de Comissões (Últimos 12 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="mes"
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#666' }}
                      label={{ value: 'R$', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Comissões"
                      stroke="#001f3f"
                      strokeWidth={2}
                      dot={{ fill: '#FFD700', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </RechartLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  <p>Sem dados de comissões nos últimos 12 meses</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-blue-900">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/links')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-6 h-auto text-base"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Gerar Link de Indicação
                </Button>
                <Button
                  onClick={() => navigate('/simulador')}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium rounded-lg py-6 h-auto text-base"
                >
                  Ver Simulador
                </Button>
                <Button
                  onClick={() => navigate('/comissoes')}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium rounded-lg py-6 h-auto text-base"
                >
                  Minhas Comissões
                </Button>
                <Button
                  onClick={() => navigate('/rede')}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium rounded-lg py-6 h-auto text-base"
                >
                  Minha Rede
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-blue-900">
                Bem-vindo ao Programa!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Você está no programa Contadores de Elite! Comece indicando clientes e gerando
                comissões automáticas. Acompanhe seu desempenho em tempo real.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => navigate('/perfil')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                >
                  Completar Perfil
                </Button>
                <Button
                  onClick={() => navigate('/materiais')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                >
                  Ver Materiais
                </Button>
                <Button
                  onClick={() => navigate('/educacao')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                >
                  Aprender
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

// Icon component
const LinkIcon = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default Dashboard;
