import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SaqueRecord {
  id: string;
  valor_solicitado: number;
  status: string;
  metodo_pagamento: string;
  solicitado_em: string;
  processada_em?: string;
  observacao?: string;
  comprovante_url?: string;
}

const Saques = () => {
  useScrollToTop();
  const { user } = useAuth();
  const [expandedSaque, setExpandedSaque] = useState<string | null>(null);

  // Get contador info
  const { data: contador } = useQuery({
    queryKey: ['contador', user?.id],
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

  // Get withdrawal requests
  const { data: saques = [], isLoading } = useQuery({
    queryKey: ['saques', contador?.id],
    queryFn: async () => {
      if (!contador) return [];

      const { data } = await supabase
        .from('solicitacoes_saque')
        .select('*')
        .eq('contador_id', contador.id)
        .order('solicitado_em', { ascending: false });

      return (data || []) as SaqueRecord[];
    },
    enabled: !!contador?.id,
  });

  // Calculate stats
  const stats = {
    total: saques.reduce((acc, s) => acc + s.valor_solicitado, 0),
    pendentes: saques
      .filter((s) => s.status === 'pendente')
      .reduce((acc, s) => acc + s.valor_solicitado, 0),
    processados: saques
      .filter((s) => s.status === 'processada')
      .reduce((acc, s) => acc + s.valor_solicitado, 0),
    rejeitados: saques
      .filter((s) => s.status === 'rejeitada')
      .reduce((acc, s) => acc + s.valor_solicitado, 0),
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'secondary' | 'default' | 'destructive'; label: string; color: string; icon: React.ReactNode }
    > = {
      pendente: {
        variant: 'secondary',
        label: 'Em Processamento',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-4 w-4" />,
      },
      processada: {
        variant: 'default',
        label: 'Transferido',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-4 w-4" />,
      },
      rejeitada: {
        variant: 'destructive',
        label: 'Rejeitado',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-4 w-4" />,
      },
    };
    return variants[status] || variants.pendente;
  };

  const getMetodoLabel = (metodo: string) => {
    return metodo === 'pix' ? 'PIX' : 'Transferência Bancária';
  };

  const getDiasAguardando = (solicitadoEm: string, processadaEm?: string) => {
    const start = new Date(solicitadoEm);
    const end = processadaEm ? new Date(processadaEm) : new Date();
    const dias = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return dias;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando saques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0C1A2A]">
      {/* Header com fundo escuro e conteúdo em tons de cinza (igual Comissões) */}
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-gray-200 px-4 py-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Área do Contador
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-serif font-bold text-[#F4C430]">
            Saques
          </h1>
          <p className="mt-1 text-sm md:text-base text-gray-300 max-w-xl">
            Acompanhe o histórico e o status das suas solicitações de saque.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 pb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Summary Cards – 2x2 sempre que couber */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Solicitado</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-blue-900">
                  R$ {stats.total.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{saques.length} solicitação(ões)</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Em Processamento</CardTitle>
                <Clock className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-yellow-600">
                  R$ {stats.pendentes.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {saques.filter((s) => s.status === 'pendente').length} pendente(s)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Transferidos</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-green-600">
                  R$ {stats.processados.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {saques.filter((s) => s.status === 'processada').length} processado(s)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Rejeitados</CardTitle>
                <XCircle className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-red-600">
                  R$ {stats.rejeitados.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {saques.filter((s) => s.status === 'rejeitada').length} rejeitado(s)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Saques Table */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-serif text-blue-900">Histórico de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              {saques.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Você ainda não tem solicitações de saque
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Solicitado em</TableHead>
                        <TableHead>Dias Aguardando</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saques.map((saque) => {
                        const statusInfo = getStatusBadge(saque.status);
                        const diasAguardando = getDiasAguardando(
                          saque.solicitado_em,
                          saque.processada_em
                        );

                        return (
                          <motion.tr
                            key={saque.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              setExpandedSaque(expandedSaque === saque.id ? null : saque.id)
                            }
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <TableCell className="font-semibold text-green-600">
                              R$ {saque.valor_solicitado.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {getMetodoLabel(saque.metodo_pagamento)}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusInfo.color}>
                                <span className="flex items-center gap-1">
                                  {statusInfo.icon}
                                  {statusInfo.label}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {new Date(saque.solicitado_em).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-gray-700">
                              {diasAguardando} dia(s)
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expanded Details */}
          {expandedSaque && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif text-blue-900">
                    Detalhes do Saque
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {saques
                    .filter((s) => s.id === expandedSaque)
                    .map((saque) => (
                      <div key={saque.id} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Valor</p>
                            <p className="text-lg font-bold text-green-600">
                              R$ {saque.valor_solicitado.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Método</p>
                            <p className="text-lg font-bold text-gray-900">
                              {getMetodoLabel(saque.metodo_pagamento)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">
                              Solicitado em
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {new Date(saque.solicitado_em).toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          {saque.processada_em && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">
                                Processado em
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {new Date(saque.processada_em).toLocaleDateString('pt-BR', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          )}
                        </div>

                        {saque.comprovante_url && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                              Comprovante
                            </p>
                            <a
                              href={saque.comprovante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Ver Comprovante
                            </a>
                          </div>
                        )}

                        {saque.observacao && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                              Observações
                            </p>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {saque.observacao}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Saques;
