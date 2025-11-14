import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Award, Network, ExternalLink, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface NetworkMember {
  id: string;
  nome: string;
  nivel: string;
  status: string;
  clientes_ativos: number;
  xp: number;
  children?: NetworkMember[];
}

interface NetworkStats {
  totalIndicacoes: number;
  indicacoesAativas: number;
  profundidade: number;
  taxaConversao: number;
}

const Rede = () => {
  const { user } = useAuth();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch current user's contador info
  const { data: currentContador } = useQuery({
    queryKey: ['my-contador', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contadores')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch all direct children
  const { data: directChildren = [] } = useQuery({
    queryKey: ['network-children', currentContador?.id],
    queryFn: async () => {
      if (!currentContador?.id) return [];
      const { data } = await supabase
        .from('rede_contadores')
        .select(`
          child_id,
          nivel_rede,
          contadores!inner (
            id,
            nivel,
            status,
            clientes_ativos,
            xp,
            profiles (nome)
          )
        `)
        .eq('sponsor_id', currentContador.id)
        .order('created_at', { ascending: false });

      return (data || []).map((item: {
        contadores: {
          id: string;
          nivel: string;
          status: string;
          clientes_ativos: number;
          xp: number;
          profiles?: { nome: string };
        };
        nivel_rede: number;
      }) => ({
        id: item.contadores.id,
        nome: item.contadores.profiles?.nome || 'Sem nome',
        nivel: item.contadores.nivel || 'bronze',
        status: item.contadores.status || 'ativo',
        clientes_ativos: item.contadores.clientes_ativos || 0,
        xp: item.contadores.xp || 0,
        nivel_rede: item.nivel_rede,
      }));
    },
    enabled: !!currentContador?.id,
  });

  // Fetch network stats
  const { data: stats } = useQuery({
    queryKey: ['network-stats', currentContador?.id],
    queryFn: async () => {
      if (!currentContador?.id) return null;

      // Total referrals
      const { data: allReferrals } = await supabase
        .from('rede_contadores')
        .select('id')
        .eq('sponsor_id', currentContador.id);

      // Active referrals (status = 'ativo')
      const { data: activeReferrals } = await supabase
        .from('rede_contadores')
        .select('contadores(status)')
        .eq('sponsor_id', currentContador.id);

      const totalIndicacoes = allReferrals?.length || 0;
      const activeCount = activeReferrals?.filter(
        (r: { contadores?: { status: string } }) => r.contadores?.status === 'ativo'
      ).length || 0;

      // Calculate network depth (max nivel_rede)
      const { data: depthData } = await supabase
        .from('rede_contadores')
        .select('nivel_rede')
        .eq('sponsor_id', currentContador.id)
        .order('nivel_rede', { ascending: false })
        .limit(1);

      const profundidade = depthData?.[0]?.nivel_rede || 1;

      // Calculate conversion rate
      const taxaConversao =
        totalIndicacoes > 0
          ? Math.round((activeCount / totalIndicacoes) * 100)
          : 0;

      return {
        totalIndicacoes,
        indicacoesAativas: activeCount,
        profundidade,
        taxaConversao,
      };
    },
    enabled: !!currentContador?.id,
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const getNivelColor = (nivel: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800',
      prata: 'bg-gray-100 text-gray-800',
      ouro: 'bg-yellow-100 text-yellow-800',
      diamante: 'bg-blue-100 text-blue-800',
    };
    return colors[nivel] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'ativo'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (!currentContador) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando rede...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-yellow-400">Minha Rede</h1>
          <p className="text-blue-100 text-sm mt-1">Visualize e gerencie sua rede de indicações</p>
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
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Total de Indicações
                </CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  {stats?.totalIndicacoes || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Contadores indicados</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Indicações Ativas
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-green-600">
                  {stats?.indicacoesAativas || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Com status ativo</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Nível da Rede
                </CardTitle>
                <Award className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  {stats?.profundidade || 1}
                </div>
                <p className="text-xs text-gray-500 mt-1">Níveis de profundidade</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Taxa de Conversão
                </CardTitle>
                <Network className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  {stats?.taxaConversao || 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Indicações convertidas</p>
              </CardContent>
            </Card>
          </div>

          {/* Network Visualization */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-blue-900">Estrutura da Rede</CardTitle>
              <CardDescription>
                Seus contadores indicados (até 5 níveis de profundidade)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {directChildren.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Network className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm">Comece a indicar contadores para construir sua rede</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* Root node */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-serif font-bold text-blue-900 text-lg">
                          {currentContador.profiles?.nome || 'Você'}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getNivelColor(currentContador.nivel || 'bronze')}>
                            {(currentContador.nivel || 'bronze').charAt(0).toUpperCase() +
                              (currentContador.nivel || 'bronze').slice(1)}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {currentContador.clientes_ativos || 0} clientes
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Children tree */}
                  <div className="ml-4 border-l-2 border-gray-200 pl-4 space-y-2">
                    {directChildren.map((child, index) => (
                      <motion.div
                        key={child.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        <div className="absolute -left-6 top-4 w-4 h-0.5 bg-gray-300"></div>

                        <button
                          onClick={() => toggleExpanded(child.id)}
                          className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all hover:border-blue-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {child.nome}
                              </p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge className={getNivelColor(child.nivel)}>
                                  {child.nivel.charAt(0).toUpperCase() + child.nivel.slice(1)}
                                </Badge>
                                <Badge className={getStatusColor(child.status)}>
                                  {child.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {child.clientes_ativos} clientes
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Nível {child.nivel_rede}
                                </Badge>
                              </div>
                            </div>
                            {expandedNodes.has(child.id) ? (
                              <span className="text-gray-400 ml-2">▼</span>
                            ) : (
                              <span className="text-gray-400 ml-2">▶</span>
                            )}
                          </div>
                        </button>

                        {/* Expanded info */}
                        {expandedNodes.has(child.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 ml-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-2"
                          >
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className="font-medium text-gray-900">
                                {child.status === 'ativo' ? '✓ Ativo' : '✗ Inativo'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Clientes:</span>
                              <span className="font-medium text-gray-900">
                                {child.clientes_ativos}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Experiência:</span>
                              <span className="font-medium text-gray-900">{child.xp} XP</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Profundidade:</span>
                              <span className="font-medium text-gray-900">Nível {child.nivel_rede}</span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {directChildren.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif text-blue-900">
                    Links de Indicação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Compartilhe seu link para indicar novos contadores
                  </p>
                  <Button
                    onClick={() => window.location.href = '/links'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gerenciar Links
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif text-blue-900">
                    Bônus de Rede
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Veja suas comissões e bônus de rede na seção de Comissões
                  </p>
                  <Button
                    onClick={() => window.location.href = '/comissoes'}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg py-2"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Ver Comissões
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Rede;
