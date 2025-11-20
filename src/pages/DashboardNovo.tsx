import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  CalendarIcon,
  LogOutIcon,
  TrendingUpIcon,
  WalletIcon,
  LinkIcon,
  CalculatorIcon,
  AwardIcon,
  LineChartIcon,
  UsersIcon,
  CoinsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/commission';

interface Contador {
  id: string;
  nome: string;
  email: string;
  clientes_ativos: number;
  nivel: 'bronze' | 'prata' | 'ouro' | 'diamante';
  total_comissoes: number;
}

interface Comissao {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  competencia: string;
  created_at: string;
  percentual: number;
}

interface ResumoFinanceiro {
  total_ganho: number;
  a_receber: number;
  pago: number;
  mes_atual: number;
  crescimento_percentual: number;
}

export default function DashboardNovo() {
  const { user, signOut } = useAuth();
  const [contador, setContador] = useState<Contador | null>(null);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    total_ganho: 0,
    a_receber: 0,
    pago: 0,
    mes_atual: 0,
    crescimento_percentual: 0,
  });
  const [loading, setLoading] = useState(true);

  // Buscar dados do contador
  useEffect(() => {
    const fetchContador = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('contadores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setContador(data);
      }
    };

    fetchContador();
  }, [user]);

  // Buscar comissoes do contador
  useEffect(() => {
    const fetchComissoes = async () => {
      if (!contador) return;

      const { data, error } = await supabase
        .from('comissoes')
        .select('*')
        .eq('contador_id', contador.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setComissoes(data);
        calcularResumo(data);
      }
      setLoading(false);
    };

    fetchComissoes();
  }, [contador]);

  // Calcular resumo financeiro
  const calcularResumo = (comissoes: Comissao[]) => {
    const total_ganho = comissoes.reduce((acc, c) => acc + c.valor, 0);
    const a_receber = comissoes
      .filter((c) => c.status === 'calculada' || c.status === 'aprovada')
      .reduce((acc, c) => acc + c.valor, 0);
    const pago = comissoes
      .filter((c) => c.status === 'paga')
      .reduce((acc, c) => acc + c.valor, 0);

    const mesAtual = new Date().toISOString().slice(0, 7);
    const mes_atual = comissoes
      .filter((c) => c.competencia.startsWith(mesAtual))
      .reduce((acc, c) => acc + c.valor, 0);

    const mesPassado = new Date();
    mesPassado.setMonth(mesPassado.getMonth() - 1);
    const mesPassadoStr = mesPassado.toISOString().slice(0, 7);
    const valor_mes_passado = comissoes
      .filter((c) => c.competencia.startsWith(mesPassadoStr))
      .reduce((acc, c) => acc + c.valor, 0);

    const crescimento_percentual =
      valor_mes_passado > 0
        ? ((mes_atual - valor_mes_passado) / valor_mes_passado) * 100
        : 0;

    setResumo({
      total_ganho,
      a_receber,
      pago,
      mes_atual,
      crescimento_percentual,
    });
  };

  // Preparar dados para grafico (ultimos 6 meses)
  const prepararDadosGrafico = () => {
    const ultimos6Meses: { mes: string; valor: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mesStr = data.toISOString().slice(0, 7);
      const mesNome = data.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      });

      const valorMes = comissoes
        .filter((c) => c.competencia.startsWith(mesStr))
        .reduce((acc, c) => acc + c.valor, 0);

      ultimos6Meses.push({ mes: mesNome, valor: valorMes });
    }

    return ultimos6Meses;
  };

  // Determinar nivel e progresso
  const getNivelInfo = () => {
    if (!contador) return null;

    const niveis = {
      bronze: { nome: 'Bronze', cor: 'text-orange-600', proximas: 5, proximo: 'Prata' },
      prata: { nome: 'Prata', cor: 'text-gray-400', proximas: 10, proximo: 'Ouro' },
      ouro: { nome: 'Ouro', cor: 'text-yellow-500', proximas: 15, proximo: 'Diamante' },
      diamante: { nome: 'Diamante', cor: 'text-blue-400', proximas: Infinity, proximo: 'Máximo' },
    };

    const info = niveis[contador.nivel];
    const progresso =
      info.proximas < Infinity
        ? (contador.clientes_ativos / info.proximas) * 100
        : 100;

    return { ...info, progresso };
  };

  // Ultimas atividades
  const getUltimasAtividades = () => {
    return comissoes.slice(0, 4).map((c) => ({
      tipo: getTipoComissao(c.tipo),
      valor: c.valor,
      data: new Date(c.created_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: c.status,
    }));
  };

  const getTipoComissao = (tipo: string) => {
    const tipos: Record<string, string> = {
      ativacao: 'Bônus Ativação',
      recorrente: 'Comissão Recorrente',
      override: 'Override Rede',
      bonus_progressao: 'Bônus Progressão',
      bonus_volume: 'Bônus Volume',
      bonus_ltv: 'Bônus LTV',
      bonus_contador: 'Bônus Indicação',
    };
    return tipos[tipo] || tipo;
  };

  const nivelInfo = getNivelInfo();
  const dadosGrafico = prepararDadosGrafico();
  const ultimasAtividades = getUltimasAtividades();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C1A2A] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0C1A2A] p-4">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] rounded-2xl p-5 text-white mb-32">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-300">Bem-vindo,</p>
            <h1 className="text-lg font-semibold text-white">
              {contador?.nome || 'Contador'}
            </h1>
            {nivelInfo && (
              <span className={`text-sm font-medium ${nivelInfo.cor}`}>
                Nível {nivelInfo.nome}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <CalendarIcon className="text-white" size={20} />
            <Button
              variant="ghost"
              size="sm"
              className="text-white flex items-center gap-1 hover:bg-white/20"
              onClick={signOut}
            >
              <LogOutIcon size={16} /> Sair
            </Button>
          </div>
        </div>

        {/* Saldo Disponivel */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl mt-4">
          <p className="text-sm text-gray-200">Saldo Total</p>
          <h2 className="text-3xl font-bold text-white">
            {formatCurrency(resumo.total_ganho)}
          </h2>

          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <p className="text-gray-300">A Receber</p>
              <p className="font-semibold text-yellow-300">
                {formatCurrency(resumo.a_receber)}
              </p>
            </div>
            <div>
              <p className="text-gray-300">Pago</p>
              <p className="font-semibold text-green-300">
                {formatCurrency(resumo.pago)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button className="bg-white text-[#0C1A2A] hover:bg-gray-100 flex-1">
              <WalletIcon size={16} className="mr-2" /> Sacar
            </Button>
            <Button className="bg-[#D4AF37] text-[#0C1A2A] hover:bg-yellow-400 flex-1">
              <LinkIcon size={16} className="mr-2" /> Indicar
            </Button>
          </div>
        </div>
      </div>

      {/* Cards com dados reais */}
      <div className="-mt-28 px-1 grid grid-cols-2 gap-4 mb-6">
        {/* Comissoes do Mes */}
        <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
          <CoinsIcon className="text-green-500" size={24} />
          <div>
            <p className="text-xs text-gray-500">Comissões Mês</p>
            <h3 className="text-lg font-semibold text-[#0C1A2A]">
              {formatCurrency(resumo.mes_atual)}
            </h3>
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              resumo.crescimento_percentual >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {resumo.crescimento_percentual >= 0 ? (
                <ArrowUpIcon size={12} />
              ) : (
                <ArrowDownIcon size={12} />
              )}
              {Math.abs(resumo.crescimento_percentual).toFixed(1)}% vs mês passado
            </p>
          </div>
        </div>

        {/* Clientes Ativos */}
        <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
          <UsersIcon className="text-blue-500" size={24} />
          <div>
            <p className="text-xs text-gray-500">Clientes Ativos</p>
            <h3 className="text-lg font-semibold text-[#0C1A2A]">
              {contador?.clientes_ativos || 0}
            </h3>
            <p className="text-xs text-blue-600 mt-1">
              {nivelInfo && nivelInfo.proximas < Infinity
                ? `Faltam ${nivelInfo.proximas - (contador?.clientes_ativos || 0)} para ${nivelInfo.proximo}`
                : 'Nível máximo'}
            </p>
          </div>
        </div>

        {/* Nivel Atual */}
        <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
          <AwardIcon className="text-yellow-500" size={24} />
          <div>
            <p className="text-xs text-gray-500">Nível Atual</p>
            <h3 className={`text-lg font-semibold ${nivelInfo?.cor}`}>
              {nivelInfo?.nome || 'N/A'}
            </h3>
            {nivelInfo && nivelInfo.proximas < Infinity && (
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-yellow-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(nivelInfo.progresso, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {nivelInfo.progresso.toFixed(0)}% para {nivelInfo.proximo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Taxa de Comissionamento Media */}
        <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
          <LineChartIcon className="text-purple-500" size={24} />
          <div>
            <p className="text-xs text-gray-500">Taxa Média</p>
            <h3 className="text-lg font-semibold text-[#0C1A2A]">
              {contador?.nivel === 'bronze' && '15%'}
              {contador?.nivel === 'prata' && '17,5%'}
              {contador?.nivel === 'ouro' && '20%'}
              {contador?.nivel === 'diamante' && '20%'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Comissão direta</p>
          </div>
        </div>
      </div>

      {/* Grafico de Evolucao */}
      <div className="bg-white rounded-2xl p-4 shadow-md mb-6">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUpIcon size={20} />
          Evolução Últimos 6 Meses
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mes"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#6366F1"
              strokeWidth={2}
              dot={{ fill: '#6366F1', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Acoes Rapidas */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Ações Rápidas</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#6366F1] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 cursor-pointer hover:bg-[#5558E3] transition-colors">
            <TrendingUpIcon size={20} />
            <span>Comissões</span>
          </div>
          <div className="bg-[#22C55E] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 cursor-pointer hover:bg-[#16A34A] transition-colors">
            <WalletIcon size={20} />
            <span>Saques</span>
          </div>
          <div className="bg-[#1434A4] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 cursor-pointer hover:bg-[#0F2980] transition-colors">
            <LinkIcon size={20} />
            <span>Links</span>
          </div>
          <div className="bg-[#D4AF37] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 cursor-pointer hover:bg-[#C49F30] transition-colors">
            <CalculatorIcon size={20} />
            <span>Simulador</span>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="mb-24">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold">Últimas Comissões</h4>
          <a href="/comissoes" className="text-sm text-[#6366F1] hover:underline">
            Ver todas
          </a>
        </div>
        <div className="bg-white rounded-xl shadow-md divide-y">
          {ultimasAtividades.length > 0 ? (
            ultimasAtividades.map((atividade, index) => (
              <div key={index} className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{atividade.tipo}</p>
                  <p className="text-xs text-gray-500">{atividade.data}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {atividade.status === 'paga' && (
                      <CheckCircleIcon size={12} className="text-green-600" />
                    )}
                    {(atividade.status === 'calculada' ||
                      atividade.status === 'aprovada') && (
                      <ClockIcon size={12} className="text-yellow-600" />
                    )}
                    <span className="text-xs text-gray-500 capitalize">
                      {atividade.status}
                    </span>
                  </div>
                </div>
                <span className="text-green-600 font-semibold">
                  +{formatCurrency(atividade.valor)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <CoinsIcon size={48} className="mx-auto mb-2 text-gray-300" />
              <p>Nenhuma comissão registrada ainda</p>
              <p className="text-xs mt-1">
                Suas comissões aparecerão aqui assim que forem geradas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

