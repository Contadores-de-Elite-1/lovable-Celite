import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { supabase } from '@/integrations/supabase/client';
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
  Copy,
  Share2,
  X,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/commission';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Lazy load do grafico (so carrega quando necessario)
const GraficoEvolucao = lazy(() => import('@/components/GraficoEvolucao'));

interface DashboardData {
  contador: {
    id?: string;
    nome: string;
    nivel: string;
    clientes_ativos: number;
  };
  resumo: {
    total_ganho: number;
    a_receber: number;
    pago: number;
    mes_atual: number;
    crescimento: number;
  };
  ultimas_comissoes: Array<{
    tipo: string;
    valor: number;
    status: string;
    created_at: string;
  }>;
}

// Skeleton para loading rapido
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#F5F6F8] p-4 animate-pulse">
    <div className="bg-gray-300 rounded-2xl h-48 mb-32"></div>
    <div className="grid grid-cols-2 gap-4 -mt-28 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
      ))}
    </div>
    <div className="bg-gray-200 rounded-xl h-64 mb-6"></div>
  </div>
);

export default function Dashboard() {
  useScrollToTop();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  const [modalLinkAberto, setModalLinkAberto] = useState(false);
  const [linkRastreavel, setLinkRastreavel] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);

  // Buscar dados otimizados (UMA query so)
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;

      try {
        // OTIMIZACAO 1: Usar RPC para calcular no servidor
        const { data: dashboardData, error } = await supabase.rpc(
          'obter_dashboard_contador',
          { user_id_param: user.id }
        );

        if (!error && dashboardData) {
          setData(dashboardData);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao buscar dados via RPC:', error);
      }
      
      // FALLBACK: Se RPC nao existir, busca manual (otimizada)
      await fetchDashboardFallback();
      setLoading(false);
    };

    fetchDashboard();
  }, [user]);

  // Buscar link rastreavel do contador
  useEffect(() => {
    const fetchLinkRastreavel = async () => {
      if (!user || !data?.contador?.id) return;

      const { data: contador } = await supabase
        .from('contadores')
        .select('link_rastreavel')
        .eq('user_id', user.id)
        .single();

      if (contador?.link_rastreavel) {
        setLinkRastreavel(contador.link_rastreavel);
      }
    };

    fetchLinkRastreavel();
  }, [user, data]);

  // Fallback se RPC nao existir
  const fetchDashboardFallback = async () => {
    if (!user) return;

    // Busca contador (apenas campos basicos que existem)
    const { data: contador, error: contadorError } = await supabase
      .from('contadores')
      .select('id, nivel, clientes_ativos')
      .eq('user_id', user.id)
      .single();

    if (contadorError || !contador) {
      console.error('[Dashboard] Erro ao buscar contador:', contadorError);
      setError('Perfil de contador não encontrado. Entre em contato com o suporte.');
      return;
    }

    // Busca APENAS resumo agregado (mais rapido)
    const { data: comissoes, error: comissoesError } = await supabase
      .from('comissoes')
      .select('valor, status, competencia, created_at, tipo')
      .eq('contador_id', contador.id)
      .order('created_at', { ascending: false })
      .limit(10); // So ultimas 10 (nao 50!)

    // Se der erro (nao se for vazio), retorna
    if (comissoesError) {
      console.error('[Dashboard] Erro ao buscar comissoes:', comissoesError);
      setError('Erro ao carregar comissões. Tente novamente.');
      return;
    }

    // Se nao houver comissoes, define array vazio
    const comissoesValidas = comissoes || [];

    // Calcular resumo (otimizado) - usa comissoesValidas
    const total_ganho = comissoesValidas.reduce((acc, c) => acc + c.valor, 0);
    const a_receber = comissoesValidas
      .filter((c) => c.status === 'calculada' || c.status === 'aprovada')
      .reduce((acc, c) => acc + c.valor, 0);
    const pago = total_ganho - a_receber;

    const mesAtual = new Date().toISOString().slice(0, 7);
    const mes_atual = comissoesValidas
      .filter((c) => c.competencia?.startsWith(mesAtual))
      .reduce((acc, c) => acc + c.valor, 0);

    setData({
      contador: {
        id: contador.id,
        nome: user.email?.split('@')[0] || 'Contador', // Usa email como nome temporario
        nivel: contador.nivel,
        clientes_ativos: contador.clientes_ativos,
      },
      resumo: {
        total_ganho,
        a_receber,
        pago,
        mes_atual,
        crescimento: 0, // Simplificado
      },
      ultimas_comissoes: comissoesValidas.slice(0, 4).map((c) => ({
        tipo: c.tipo,
        valor: c.valor,
        status: c.status,
        created_at: c.created_at,
      })),
    });
  };

  // Lazy loading do grafico com IntersectionObserver
  useEffect(() => {
    if (!data?.contador?.id) return;

    const graficoRef = document.getElementById('grafico-container');
    if (!graficoRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMostrarGrafico(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(graficoRef);

    return () => observer.disconnect();
  }, [data]);

  // Funcoes do modal de link
  const abrirModalLink = () => {
    setModalLinkAberto(true);
  };

  const gerarLinkUnico = async () => {
    if (!data?.contador?.id) return;

    setGerandoLink(true);

    try {
      const token = `${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
      
      const { error } = await supabase
        .from('contadores')
        .update({ link_rastreavel: token })
        .eq('id', data.contador.id);

      if (error) throw error;

      setLinkRastreavel(token);
      toast.success('Link único gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast.error('Erro ao gerar link. Tente novamente.');
    } finally {
      setGerandoLink(false);
    }
  };

  const copiarLink = () => {
    const linkCompleto = `${window.location.origin}/onboarding/${linkRastreavel}`;
    navigator.clipboard.writeText(linkCompleto);
    setLinkCopiado(true);
    toast.success('Link copiado!');
    setTimeout(() => setLinkCopiado(false), 3000);
  };

  const compartilharWhatsApp = () => {
    const linkCompleto = `${window.location.origin}/onboarding/${linkRastreavel}`;
    const mensagem = `🚀 Transforme sua empresa com serviços profissionais completos!\n\n✅ Soluções modernas e eficientes\n✅ Planos a partir de R$ 110/mês\n✅ Suporte especializado\n\nConheça agora: ${linkCompleto}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const compartilharEmail = () => {
    const linkCompleto = `${window.location.origin}/onboarding/${linkRastreavel}`;
    const assunto = 'Lovable-Celite - Serviços Profissionais';
    const corpo = `Olá!\n\nConheça nossos serviços profissionais, uma solução completa para sua empresa.\n\nAcesse: ${linkCompleto}\n\nAté breve!`;
    window.open(`mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
  };

  // Helpers
  const getNivelInfo = () => {
    if (!data) return null;

    const niveis = {
      bronze: { nome: 'Bronze', cor: 'text-orange-600', proximas: 5, proximo: 'Prata', taxa: '15%' },
      prata: { nome: 'Prata', cor: 'text-gray-400', proximas: 10, proximo: 'Ouro', taxa: '17,5%' },
      ouro: { nome: 'Ouro', cor: 'text-yellow-500', proximas: 15, proximo: 'Diamante', taxa: '20%' },
      diamante: { nome: 'Diamante', cor: 'text-blue-400', proximas: Infinity, proximo: 'Máximo', taxa: '20%' },
    };

    const nivel = data.contador.nivel as keyof typeof niveis;
    const info = niveis[nivel];
    const progresso =
      info.proximas < Infinity
        ? (data.contador.clientes_ativos / info.proximas) * 100
        : 100;

    return { ...info, progresso };
  };

  const getTipoComissao = (tipo: string) => {
    const tipos: Record<string, string> = {
      ativacao: 'Ativação',
      recorrente: 'Recorrente',
      override: 'Override',
      bonus_progressao: 'Progressão',
      bonus_volume: 'Volume',
      bonus_ltv: 'LTV',
      bonus_contador: 'Indicação',
    };
    return tipos[tipo] || tipo;
  };

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <UsersIcon className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-2 font-medium">Erro ao carregar dados</p>
          <p className="text-sm text-gray-500 mb-4">
            {error || 'Não foi possível carregar seu perfil. Verifique sua conexão ou tente novamente.'}
          </p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const nivelInfo = getNivelInfo();

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0C1A2A] p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] rounded-2xl p-5 text-white mb-32">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-300">Bem-vindo,</p>
            <h1 className="text-lg font-semibold text-white">
              {data.contador.nome}
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
              className="text-white hover:bg-white/20"
              onClick={signOut}
            >
              <LogOutIcon size={16} /> Sair
            </Button>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl mt-4">
          <p className="text-sm text-gray-200">Saldo Total</p>
          <h2 className="text-3xl font-bold text-white">
            {formatCurrency(data.resumo.total_ganho)}
          </h2>

          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <p className="text-gray-300">A Receber</p>
              <p className="font-semibold text-yellow-300">
                {formatCurrency(data.resumo.a_receber)}
              </p>
            </div>
            <div>
              <p className="text-gray-300">Pago</p>
              <p className="font-semibold text-green-300">
                {formatCurrency(data.resumo.pago)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button 
              onClick={() => navigate('/saques')}
              className="bg-white text-[#0C1A2A] hover:bg-gray-100 flex-1"
            >
              <WalletIcon size={16} className="mr-2" /> Sacar
            </Button>
            <Button 
              onClick={abrirModalLink}
              className="bg-[#D4AF37] text-[#0C1A2A] hover:bg-yellow-400 flex-1"
            >
              <LinkIcon size={16} className="mr-2" /> Indicar
            </Button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="-mt-28 px-1 grid grid-cols-2 gap-4 mb-6">
        {/* Comissoes Mes */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <CoinsIcon className="text-green-500 mb-2" size={24} />
          <p className="text-xs text-gray-500">Comissões Mês</p>
          <h3 className="text-lg font-semibold">{formatCurrency(data.resumo.mes_atual)}</h3>
          {data.resumo.crescimento !== 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              data.resumo.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.resumo.crescimento >= 0 ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
              {Math.abs(data.resumo.crescimento).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Clientes */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <UsersIcon className="text-blue-500 mb-2" size={24} />
          <p className="text-xs text-gray-500">Clientes Ativos</p>
          <h3 className="text-lg font-semibold">{data.contador.clientes_ativos}</h3>
          {nivelInfo && nivelInfo.proximas < Infinity && (
            <p className="text-xs text-blue-600 mt-1">
              Faltam {nivelInfo.proximas - data.contador.clientes_ativos}
            </p>
          )}
        </div>

        {/* Nivel */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <AwardIcon className="text-yellow-500 mb-2" size={24} />
          <p className="text-xs text-gray-500">Nível</p>
          <h3 className={`text-lg font-semibold ${nivelInfo?.cor}`}>
            {nivelInfo?.nome}
          </h3>
          {nivelInfo && nivelInfo.proximas < Infinity && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(nivelInfo.progresso, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Taxa */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <LineChartIcon className="text-purple-500 mb-2" size={24} />
          <p className="text-xs text-gray-500">Taxa Média</p>
          <h3 className="text-lg font-semibold">{nivelInfo?.taxa}</h3>
          <p className="text-xs text-gray-500 mt-1">Comissão direta</p>
        </div>
      </div>

      {/* Grafico de Evolucao (lazy loaded) */}
      <div id="grafico-container" className="bg-white rounded-2xl p-4 shadow-md mb-6">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUpIcon size={20} />
          Evolução de Comissões
        </h4>
        {mostrarGrafico && data.contador.id ? (
          <Suspense
            fallback={
              <div className="h-64 bg-gray-50 rounded animate-pulse flex items-center justify-center">
                <p className="text-gray-400 text-sm">Carregando gráfico...</p>
              </div>
            }
          >
            <GraficoEvolucao contadorId={data.contador.id} />
          </Suspense>
        ) : (
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded flex items-center justify-center">
            <div className="text-center">
              <LineChartIcon size={48} className="mx-auto mb-2 text-blue-400" />
              <p className="text-gray-600">Role para ver o gráfico</p>
              <p className="text-xs text-gray-400 mt-1">Carrega automaticamente</p>
            </div>
          </div>
        )}
      </div>

      {/* Acoes Rapidas */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Ações Rápidas</h4>
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => navigate('/comissoes')}
            className="bg-[#6366F1] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 active:scale-95 transition-transform hover:bg-indigo-700"
          >
            <TrendingUpIcon size={20} />
            <span>Comissões</span>
          </button>
          <button 
            onClick={() => navigate('/saques')}
            className="bg-[#22C55E] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 active:scale-95 transition-transform hover:bg-green-700"
          >
            <WalletIcon size={20} />
            <span>Saques</span>
          </button>
          <button 
            onClick={() => navigate('/links')}
            className="bg-[#1434A4] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 active:scale-95 transition-transform hover:bg-blue-800"
          >
            <LinkIcon size={20} />
            <span>Links</span>
          </button>
          <button 
            onClick={() => navigate('/simulador')}
            className="bg-[#D4AF37] p-3 rounded-xl text-white flex flex-col items-center text-xs gap-1 active:scale-95 transition-transform hover:bg-yellow-500"
          >
            <CalculatorIcon size={20} />
            <span>Simulador</span>
          </button>
        </div>
      </div>

      {/* Ultimas Comissoes */}
      <div className="mb-24">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold">Últimas Comissões</h4>
          <a href="/comissoes" className="text-sm text-[#6366F1]">
            Ver todas
          </a>
        </div>
        <div className="bg-white rounded-xl shadow-md divide-y">
          {data.ultimas_comissoes.length > 0 ? (
            data.ultimas_comissoes.map((comissao, index) => (
              <div key={index} className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{getTipoComissao(comissao.tipo)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comissao.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {comissao.status === 'paga' && (
                      <CheckCircleIcon size={12} className="text-green-600" />
                    )}
                    {comissao.status !== 'paga' && (
                      <ClockIcon size={12} className="text-yellow-600" />
                    )}
                    <span className="text-xs text-gray-500 capitalize">
                      {comissao.status}
                    </span>
                  </div>
                </div>
                <span className="text-green-600 font-semibold">
                  +{formatCurrency(comissao.valor)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <CoinsIcon size={48} className="mx-auto mb-2 text-gray-300" />
              <p>Nenhuma comissão ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE LINK DE INDICACAO */}
      <Dialog open={modalLinkAberto} onOpenChange={setModalLinkAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              Seu Link de Indicação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!linkRastreavel ? (
              /* NAO TEM LINK - GERAR */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Gere seu link único
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                  Compartilhe com quantos clientes quiser. Todos os clientes que se cadastrarem através dele serão vinculados a você!
                </p>
                <Button
                  onClick={gerarLinkUnico}
                  disabled={gerandoLink}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 w-full"
                >
                  {gerandoLink ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5 mr-2" />
                      Gerar Link Único
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* JA TEM LINK - EXIBIR E COMPARTILHAR */
              <div className="space-y-4">
                {/* LINK */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Seu link permanente:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 overflow-x-auto">
                      {`${window.location.origin}/onboarding/${linkRastreavel}`}
                    </div>
                    <Button
                      onClick={copiarLink}
                      variant={linkCopiado ? "default" : "outline"}
                      className={linkCopiado ? "bg-green-600 hover:bg-green-700 shrink-0" : "shrink-0"}
                    >
                      {linkCopiado ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* INFO */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    <strong>💡 Dica:</strong> Este é seu link único e permanente. Compartilhe com quantos clientes quiser!
                  </p>
                </div>

                {/* BOTOES DE COMPARTILHAMENTO */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-3">
                    Compartilhar via:
                  </label>
                  <div className="space-y-2">
                    <Button
                      onClick={compartilharWhatsApp}
                      variant="outline"
                      className="w-full justify-start border-green-300 hover:bg-green-50"
                    >
                      <MessageSquare className="w-5 h-5 text-green-600 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">WhatsApp</div>
                        <div className="text-xs text-gray-600">Enviar mensagem</div>
                      </div>
                    </Button>

                    <Button
                      onClick={compartilharEmail}
                      variant="outline"
                      className="w-full justify-start border-blue-300 hover:bg-blue-50"
                    >
                      <Mail className="w-5 h-5 text-blue-600 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Email</div>
                        <div className="text-xs text-gray-600">Enviar por email</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
