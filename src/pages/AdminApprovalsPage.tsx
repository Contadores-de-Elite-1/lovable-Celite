import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  StatusTrendChart,
  CommissionTypeChart,
  TopContadoresChart,
} from '@/components/charts/ApprovalCharts';

interface Commission {
  id: string;
  contador_id: string;
  contador?: {
    contadores?: {
      user_id: string;
      profiles?: {
        nome: string;
      };
    };
  };
  tipo_comissao: string;
  valor: number;
  status_comissao: string;
  created_at: string;
  competencia: string;
}

const AdminApprovalsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ status: 'calculada' });
  const [selectedItem, setSelectedItem] = useState<Commission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Check admin
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return !!data;
    },
    enabled: !!user,
  });

  // Summary
  const { data: summary } = useQuery({
    queryKey: ['approvals-summary'],
    queryFn: async () => {
      const { data: commissions } = await supabase
        .from('comissoes')
        .select('status_comissao');

      const pending = commissions?.filter((c) => c.status_comissao === 'calculada').length || 0;
      const approved = commissions?.filter((c) => c.status_comissao === 'aprovada').length || 0;
      const rejected = commissions?.filter((c) => c.status_comissao === 'cancelada').length || 0;

      return { pending, approved, rejected };
    },
    enabled: isAdmin === true,
  });

  // All commissions for charts
  const { data: allCommissions = [], isLoading: isLoadingCharts } = useQuery({
    queryKey: ['approvals-all-for-charts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('comissoes')
        .select(`
          *,
          contadores (user_id, profiles (nome))
        `)
        .order('created_at', { ascending: false });

      return data || [];
    },
    enabled: isAdmin === true,
  });

  // Commissions list
  const { data: commissions, isLoading, refetch } = useQuery({
    queryKey: ['approvals-list', filters.status],
    queryFn: async () => {
      const { data } = await supabase
        .from('comissoes')
        .select(`
          *,
          clientes (nome_empresa),
          contadores (user_id, profiles (nome))
        `)
        .eq('status_comissao', filters.status)
        .order('created_at', { ascending: false });

      return data || [];
    },
    enabled: isAdmin === true,
  });

  // Approve
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comissoes')
        .update({ status_comissao: 'aprovada' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✓ Comissão aprovada!');
      refetch();
      setShowModal(false);
      setSelectedItem(null);
    },
    onError: () => toast.error('Erro ao aprovar'),
  });

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comissoes')
        .update({
          status_comissao: 'cancelada',
          observacao: rejectionReason || 'Rejeitado',
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✓ Comissão rejeitada');
      refetch();
      setShowModal(false);
      setSelectedItem(null);
      setRejectionReason('');
    },
    onError: () => toast.error('Erro ao rejeitar'),
  });

  if (isAdminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm border-red-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 font-serif">
              <AlertTriangle className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Você não possui permissões para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-yellow-400">
            Aprovações
          </h1>
          <p className="text-blue-100 text-sm mt-1">Gerencie comissões pendentes</p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 pb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stats - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pending */}
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                      Pendentes
                    </p>
                    <p className="text-3xl font-serif font-bold text-blue-900 mt-2">
                      {summary?.pending || 0}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Approved */}
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                      Aprovadas
                    </p>
                    <p className="text-3xl font-serif font-bold text-green-600 mt-2">
                      {summary?.approved || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Rejected */}
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                      Rejeitadas
                    </p>
                    <p className="text-3xl font-serif font-bold text-red-600 mt-2">
                      {summary?.rejected || 0}
                    </p>
                  </div>
                  <XCircle className="h-10 w-10 text-red-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-blue-900">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters({ status: v })}
              >
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calculada">Pendentes</SelectItem>
                  <SelectItem value="aprovada">Aprovadas</SelectItem>
                  <SelectItem value="cancelada">Rejeitadas</SelectItem>
                  <SelectItem value="paga">Pagas</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Analytics Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h2 className="text-lg font-serif font-bold text-blue-900 mb-4">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Trend Chart */}
              <StatusTrendChart data={allCommissions} isLoading={isLoadingCharts} />

              {/* Commission Type Chart */}
              <CommissionTypeChart data={allCommissions} isLoading={isLoadingCharts} />

              {/* Top Contadores Chart */}
              <TopContadoresChart data={allCommissions} isLoading={isLoadingCharts} />
            </div>
          </div>

          {/* List */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-blue-900">
                Comissões ({commissions?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : commissions?.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="h-8 w-8 mx-auto opacity-30 mb-2" />
                  <p className="text-sm">Nenhuma comissão encontrada</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {commissions?.map((commission) => (
                    <motion.button
                      key={commission.id}
                      onClick={() => {
                        setSelectedItem(commission);
                        setShowModal(true);
                      }}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                      whileHover={{ x: 4 }}
                    >
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {commission.contadores?.profiles?.nome || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {commission.competencia}
                        </p>
                      </div>

                      {/* Amount + Status */}
                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="font-serif font-bold text-blue-900 text-sm">
                          R$ {Number(commission.valor).toFixed(0)}
                        </p>
                        <div className="flex gap-1 justify-end mt-1">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {commission.tipo_comissao === 'recorrente'
                              ? 'Recorrente'
                              : 'Comissão'}
                          </Badge>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-gray-300 ml-2 group-hover:text-gray-400" />
                    </motion.button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Modal */}
      {selectedItem && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-sm rounded-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-blue-900">
                Revisar Comissão
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {selectedItem.contadores?.profiles?.nome}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Tipo:</span>
                  <span className="font-medium text-gray-900">
                    {selectedItem.tipo_comissao}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Competência:</span>
                  <span className="font-medium text-gray-900">
                    {selectedItem.competencia}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                  <span className="text-gray-700 text-sm">Valor:</span>
                  <span className="font-serif text-2xl font-bold text-blue-900">
                    R$ {Number(selectedItem.valor).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Rejection reason */}
              {selectedItem.status_comissao !== 'aprovada' && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Motivo da rejeição (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans resize-none"
                  rows={2}
                />
              )}

              {/* Actions */}
              {selectedItem.status_comissao === 'calculada' ? (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => approveMutation.mutate(selectedItem.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg py-6 text-base"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(selectedItem.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg py-6 text-base"
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
                  </Button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-blue-900">
                    Esta comissão já foi {selectedItem.status_comissao}.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminApprovalsPage;
