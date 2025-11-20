import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContadorRede {
  id: string;
  user_id: string;
  nome: string;
  nivel: string;
  status: string;
  clientes_ativos: number;
  created_at: string;
  total_comissoes_geradas: number;
}

const MinhaRede = () => {
  useScrollToTop();
  const { user } = useAuth();

  // Buscar dados do contador logado
  const { data: contadorLogado } = useQuery({
    queryKey: ['contador-logado', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contadores')
        .select('id, user_id')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Buscar contadores indicados (rede direta)
  const { data: redeIndicados, isLoading } = useQuery({
    queryKey: ['rede-indicados', contadorLogado?.id],
    queryFn: async () => {
      if (!contadorLogado?.id) return [];

      // Buscar contadores onde sponsor_id = meu id
      const { data: indicados } = await supabase
        .from('contadores')
        .select(`
          id,
          user_id,
          nivel,
          status,
          clientes_ativos,
          created_at
        `)
        .eq('sponsor_id', contadorLogado.id)
        .order('created_at', { ascending: false });

      if (!indicados) return [];

      // Para cada indicado, buscar nome do usuário e comissões
      const indicadosComDados = await Promise.all(
        indicados.map(async (indicado) => {
          // Buscar nome do usuário
          const { data: userData } = await supabase.auth.admin.getUserById(indicado.user_id);
          const nome = userData?.user?.user_metadata?.nome || 'Sem nome';

          // Buscar total de comissões geradas (override que você recebeu desse indicado)
          const { data: comissoes } = await supabase
            .from('comissoes')
            .select('valor')
            .eq('contador_id', contadorLogado.id)
            .eq('tipo_comissao', 'override');

          const totalComissoes = comissoes?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

          return {
            ...indicado,
            nome,
            total_comissoes_geradas: totalComissoes,
          };
        })
      );

      return indicadosComDados as ContadorRede[];
    },
    enabled: !!contadorLogado?.id,
  });

  // Buscar estatísticas gerais da rede
  const { data: stats } = useQuery({
    queryKey: ['rede-stats', contadorLogado?.id],
    queryFn: async () => {
      if (!contadorLogado?.id) return null;

      // Total de indicados ativos
      const { count: totalIndicados } = await supabase
        .from('contadores')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', contadorLogado.id)
        .eq('status', 'ativo');

      // Total de clientes na rede (dos indicados)
      const { data: indicados } = await supabase
        .from('contadores')
        .select('id, clientes_ativos')
        .eq('sponsor_id', contadorLogado.id);

      const totalClientesRede = indicados?.reduce((sum, c) => sum + (c.clientes_ativos || 0), 0) || 0;

      // Total de comissões override recebidas
      const { data: comissoesOverride } = await supabase
        .from('comissoes')
        .select('valor')
        .eq('contador_id', contadorLogado.id)
        .eq('tipo_comissao', 'override')
        .eq('status_comissao', 'paga');

      const totalOverride = comissoesOverride?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

      return {
        totalIndicados: totalIndicados || 0,
        totalClientesRede,
        totalOverride,
      };
    },
    enabled: !!contadorLogado?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando sua rede...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Minha Rede
          </h1>
          <p className="text-purple-100 text-sm mt-1">
            Visualize seus indicados e comissões de override (segundo nível)
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ESTATÍSTICAS DA REDE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Contadores na Rede</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">
                      {stats?.totalIndicados || 0}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Você é sponsor
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Clientes da Rede</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">
                      {stats?.totalClientesRede || 0}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Total na rede
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Override Recebido</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                      R$ {stats?.totalOverride?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      5% da rede
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LISTA DE INDICADOS */}
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="font-serif text-[#0C1A2A] flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Seus Indicados (Nível 1)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!redeIndicados || redeIndicados.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum indicado ainda
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    Comece a indicar outros contadores usando seu link único. Quando eles venderem,
                    você recebe 5% de comissão (override)!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redeIndicados.map((indicado, index) => (
                    <motion.div
                      key={indicado.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {indicado.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{indicado.nome}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                {indicado.nivel}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                indicado.status === 'ativo' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {indicado.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-gray-500 text-xs">Clientes</p>
                            <p className="font-semibold text-gray-900">{indicado.clientes_ativos || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500 text-xs">Override Gerado</p>
                            <p className="font-semibold text-green-600">
                              R$ {indicado.total_comissoes_geradas.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500 text-xs">Membro desde</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(indicado.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* INFO SOBRE SISTEMA DE REDE */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-2">
                    Como Funciona o Sistema de Rede (Override)
                  </h3>
                  <ul className="text-sm text-indigo-800 space-y-2">
                    <li>✅ <strong>Indique contadores:</strong> Compartilhe seu link único com outros contadores</li>
                    <li>✅ <strong>Você vira Sponsor:</strong> Quando eles se cadastrarem, você é o sponsor deles</li>
                    <li>✅ <strong>Receba 5% Override:</strong> Sempre que seus indicados venderem, você recebe 5% automático</li>
                    <li>✅ <strong>Renda Passiva:</strong> Quanto mais sua rede cresce, mais você ganha</li>
                    <li>✅ <strong>Exemplo:</strong> Seu indicado vende R$ 130/mês → Você recebe R$ 6,25/mês de override</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default MinhaRede;

