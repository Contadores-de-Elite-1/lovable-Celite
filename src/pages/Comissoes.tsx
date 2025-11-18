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
import { DollarSign, TrendingUp, Clock, Download, Wallet, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { calculateCommissionStats } from '@/lib/commission';
import { filterByMultipleCriteria } from '@/lib/filters';
import { convertToCSV, downloadCSV, generateCSVFilename } from '@/lib/csv';

const Comissoes = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState('mes-atual'); // mantido para compatibilidade futura
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessingSaque, setIsProcessingSaque] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const { data: allComissoes, isLoading, refetch: refetchComissoes } = useQuery({
    queryKey: ['comissoes', contador?.id],
    queryFn: async () => {
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
    enabled: !!contador?.id,
  });

  // Get user profile for payment methods
  const { data: userProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('banco, agencia, conta, tipo_conta, titular_conta, chave_pix')
        .eq('id', user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Apply filters
  const comissoes = useMemo(() => {
    if (!allComissoes) return [];

    const filterData = allComissoes.map((c) => ({
      competencia: c.competencia,
      status_comissao: c.status_comissao,
    }));

    return filterByMultipleCriteria(filterData, {
      startDate: dateStart || undefined,
      endDate: dateEnd || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    })
      .map((filtered) => {
        return allComissoes.find((c) => c.competencia === filtered.competencia);
      })
      .filter(Boolean) as typeof allComissoes;
  }, [allComissoes, dateStart, dateEnd, statusFilter]);

  const diretas =
    comissoes?.filter(
      (c) => c.tipo_comissao === 'ativacao' || c.tipo_comissao === 'recorrente'
    ) || [];
  const overrides = comissoes?.filter((c) => c.tipo_comissao === 'override') || [];
  const bonus =
    comissoes?.filter(
      (c) =>
        c.tipo_comissao === 'bonus_progressao' ||
        c.tipo_comissao === 'bonus_volume' ||
        c.tipo_comissao === 'bonus_ltv' ||
        c.tipo_comissao === 'bonus_contador'
    ) || [];

  // Stats (mantido se precisar depois)
  const stats = useMemo(() => {
    if (!comissoes) return null;
    const commissionData = comissoes.map((c) => ({
      valor: Number(c.valor),
      tipo_comissao: c.tipo_comissao,
      status_comissao: c.status_comissao,
      competencia: c.competencia,
    }));
    return calculateCommissionStats(commissionData);
  }, [comissoes]);

  // Totais
  const totalProvisionadas = useMemo(() => {
    if (!comissoes) return 0;
    return comissoes
      .filter((c) => c.status_comissao === 'calculada')
      .reduce((acc, c) => acc + Number(c.valor), 0);
  }, [comissoes]);

  const totalAprovadas = useMemo(() => {
    if (!comissoes) return 0;
    return comissoes
      .filter((c) => c.status_comissao === 'aprovada')
      .reduce((acc, c) => acc + Number(c.valor), 0);
  }, [comissoes]);

  const totalLiberadas = useMemo(() => {
    if (!comissoes) return 0;
    return comissoes
      .filter((c) => c.status_comissao === 'paga')
      .reduce((acc, c) => acc + Number(c.valor), 0);
  }, [comissoes]);

  const handleSolicitarSaque = async (confirmed: boolean = false) => {
    if (!contador || !user?.id) {
      toast.error('Erro: Contador não encontrado');
      return;
    }

    if (totalAprovadas < 100) {
      toast.error('Valor mínimo para saque é R$ 100,00');
      return;
    }

    if (!userProfile?.chave_pix && !userProfile?.conta) {
      toast.error('Complete seus dados bancários no Perfil antes de solicitar saque');
      return;
    }

    if (!confirmed) {
      setShowConfirmModal(true);
      return;
    }

    setIsProcessingSaque(true);

    try {
      const aprovadas = comissoes.filter((c) => c.status_comissao === 'aprovada');

      const { error } = await supabase.from('solicitacoes_saque').insert({
        contador_id: contador.id,
        valor_solicitado: totalAprovadas,
        comissoes_ids: aprovadas.map((c) => c.id),
        metodo_pagamento: userProfile?.chave_pix ? 'pix' : 'transferencia',
        dados_bancarios: {
          banco: userProfile?.banco,
          agencia: userProfile?.agencia,
          conta: userProfile?.conta,
          tipo_conta: userProfile?.tipo_conta,
          titular_conta: userProfile?.titular_conta,
          chave_pix: userProfile?.chave_pix,
        },
      });

      if (error) throw error;

      setShowConfirmModal(false);
      toast.success('✅ Solicitação de saque enviada! Você será notificado em breve.');
      refetchComissoes();
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      toast.error('Erro ao solicitar saque. Tente novamente.');
    } finally {
      setIsProcessingSaque(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'secondary' | 'default' | 'destructive'; label: string; color: string }
    > = {
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
      const rows = comissoes.map((c) => [
        c.clientes?.nome || 'N/A',
        new Date(c.competencia).toLocaleDateString('pt-BR'),
        getTipoLabel(c.tipo_comissao),
        Number(c.valor).toFixed(2),
        getStatusBadge(c.status_comissao).label,
      ]);

      const csv = convertToCSV(rows, ['Cliente', 'Competência', 'Tipo', 'Valor (R$)', 'Status']);
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
                <TableRow key={comissao.id} className="hover:bg-[#F5F6F8]">
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
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366F1] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando comissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0C1A2A]">
      {/* MODAL CONFIRMAÇÃO SAQUE */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Confirmar Solicitação de Saque
            </DialogTitle>
            <DialogDescription>Verifique os dados antes de confirmar</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Saque Info */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-blue-900">Dados do Saque</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Valor</p>
                  <p className="font-bold text-green-600">R$ {totalAprovadas.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Comissões</p>
                  <p className="font-bold text-gray-900">
                    {comissoes.filter((c) => c.status_comissao === 'aprovada').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
              <p className="text-sm font-semibold text-gray-900">Dados Bancários</p>
              {userProfile?.chave_pix && (
                <div className="text-sm">
                  <p className="text-xs text-gray-600">PIX</p>
                  <p className="font-mono text-gray-900 break-all">{userProfile.chave_pix}</p>
                </div>
              )}
              {userProfile?.titular_conta && (
                <div className="text-sm">
                  <p className="text-xs text-gray-600">Titular</p>
                  <p className="font-semibold text-gray-900">{userProfile.titular_conta}</p>
                </div>
              )}
              {userProfile?.banco && (
                <div className="text-sm">
                  <p className="text-xs text-gray-600">Banco</p>
                  <p className="text-gray-900">
                    {userProfile.banco}
                    {userProfile.agencia && ` / Agência: ${userProfile.agencia}`}
                    {userProfile.conta && ` / Conta: ${userProfile.conta}`}
                  </p>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-800">
              ⚠️ Após confirmar, sua solicitação será enviada para processamento. Você receberá
              notificação quando concluída.
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleSolicitarSaque(true)}
              disabled={isProcessingSaque}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessingSaque ? 'Processando...' : 'Confirmar Saque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-white pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-300">Área do Contador</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#F4C430] flex items-center gap-2">
            Comissões
          </h1>
          <p className="text-sm mt-2 text-gray-200 max-w-md">
            Acompanhe suas comissões, solicite saque e exporte seus dados financeiros.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* 1) FILTROS – FLUTUANDO LOGO ABAIXO DO HEADER */}
          <Card className="bg-white border-0 shadow-md -mt-16">
            <CardHeader>
              <CardTitle className="text-base font-serif text-[#0C1A2A]">Filtros</CardTitle>
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
                    className="border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Data Final
                  </Label>
                  <Input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1] text-sm bg-white"
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

          {/* 2) KPI CARDS – AGORA FIXO EM 2 COLUNAS (2x2 EM QUALQUER LARGURA) */}
          <section className="grid grid-cols-2 gap-4">
            <Card className="bg-white border-0 shadow-md">
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

            <Card className="bg-white border-0 shadow-md">
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

            <Card className="bg-white border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Disponível para Saque
                </CardTitle>
                <Wallet className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-purple-600">
                  R$ {totalAprovadas.toFixed(0)}
                </div>
                <Button
                  onClick={() => handleSolicitarSaque(false)}
                  disabled={totalAprovadas < 100 || isProcessingSaque}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {isProcessingSaque
                    ? 'Processando...'
                    : totalAprovadas >= 100
                    ? 'Solicitar Saque'
                    : 'Mínimo R$ 100'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  {totalAprovadas >= 100
                    ? 'Clique para solicitar saque'
                    : `Faltam R$ ${(100 - totalAprovadas).toFixed(2)}`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-md">
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
          </section>

          {/* 3) EXPORTAR CSV */}
          <div className="flex justify-end">
            <Button
              onClick={handleDownloadCSV}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium rounded-lg py-2 px-4 flex items-center gap-2 shadow-sm"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* 4) TABELA + TABS */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-[#0C1A2A]">
                Detalhamento de Comissões ({comissoes?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="diretas">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-[#F5F6F8]">
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
                <TabsContent value="diretas" className="mt-2">
                  <ComissoesTable data={diretas} />
                </TabsContent>
                <TabsContent value="overrides" className="mt-2">
                  <ComissoesTable data={overrides} />
                </TabsContent>
                <TabsContent value="bonus" className="mt-2">
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
