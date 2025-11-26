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
import { toast } from 'sonner';
import {
  StatusTrendChart,
  CommissionTypeChart,
  TopContadoresChart,
} from '@/components/charts/ApprovalCharts';
import { Skeleton } from '@/components/ui/skeleton';

interface Commission {
  id: string;
  contador_id: string;
  contador?: {
    contadores?: {
      user_id: string;
      nivel?: string;
    };
  };
  contador_nome?: string;
  contador_email?: string;
  tipo: string;
  valor: number;
  status: string;
  created_at: string;
  competencia: string;
}

const AdminApprovalsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ status: 'calculada' });
  const [selectedItem, setSelectedItem] = useState<Commission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Check admin usando RPC (mesma forma que outras páginas)
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      return data as boolean;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  // Summary
  const { data: summary } = useQuery({
    queryKey: ['approvals-summary'],
    queryFn: async () => {
      const { data: commissions } = await supabase
        .from('comissoes')
        .select('status');

      const pending = commissions?.filter((c) => c.status === 'calculada').length || 0;
      const approved = commissions?.filter((c) => c.status === 'aprovada').length || 0;
      const rejected = commissions?.filter((c) => c.status === 'cancelada').length || 0;

      return { pending, approved, rejected };
    },
    enabled: isAdmin === true,
  });

  // All commissions for charts (LIMITADO para performance)
  const { data: allCommissions = [], isLoading: isLoadingCharts } = useQuery({
    queryKey: ['approvals-all-for-charts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('comissoes')
        .select(`
          *,
          contadores!inner (user_id, nivel)
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Limite para melhor performance

      if (!data || data.length === 0) return [];

      // Buscar user_ids únicos
      const userIds = [...new Set(data.map((c: any) => c.contadores?.user_id).filter(Boolean))];
      
      // Buscar contadores pelos user_ids
      const { data: contadoresInfo } = await supabase
        .from('contadores')
        .select('id, user_id')
        .in('user_id', userIds);
      
      // Criar mapa contador_id -> user_id
      const contadorToUserId = new Map(contadoresInfo?.map((c: any) => [c.id, c.user_id]) || []);

      // Usar RPC list_admin_contadores para buscar nomes
      const { data: contadoresData } = await supabase.rpc('list_admin_contadores', {
        p_q: null,
        p_limit: 1000,
        p_offset: 0,
      }).catch(() => ({ data: null }));

      // Criar mapa user_id -> nome/email
      const nomeMap = new Map<string, { nome: string; email: string }>();
      
      if (contadoresData && contadoresInfo) {
        contadoresData.forEach((c: any) => {
          const userId = contadorToUserId.get(c.id);
          if (userId) {
            nomeMap.set(userId, { nome: c.nome || 'Sem nome', email: c.email || '' });
          }
        });
      }

      // Adicionar nome/email às comissões
      return data.map((c: any) => {
        const userInfo = nomeMap.get(c.contadores?.user_id) || { nome: 'Contador ID: ' + (c.contador_id?.slice(0, 8) || 'N/A'), email: '' };
        return {
          ...c,
          contador_nome: userInfo.nome,
          contador_email: userInfo.email,
        };
      });
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
          contadores!inner (user_id, nivel)
        `)
        .eq('status', filters.status)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) return [];

      // Buscar user_ids únicos
      const userIds = [...new Set(data.map((c: any) => c.contadores?.user_id).filter(Boolean))];
      
      // Buscar contadores pelos user_ids
      const { data: contadoresInfo } = await supabase
        .from('contadores')
        .select('id, user_id')
        .in('user_id', userIds);
      
      // Criar mapa contador_id -> user_id
      const contadorToUserId = new Map(contadoresInfo?.map((c: any) => [c.id, c.user_id]) || []);

      // Usar RPC list_admin_contadores para buscar nomes
      const { data: contadoresData } = await supabase.rpc('list_admin_contadores', {
        p_q: null,
        p_limit: 1000,
        p_offset: 0,
      }).catch(() => ({ data: null }));

      // Criar mapa user_id -> nome/email
      const nomeMap = new Map<string, { nome: string; email: string }>();
      
      if (contadoresData && contadoresInfo) {
        contadoresData.forEach((c: any) => {
          const userId = contadorToUserId.get(c.id);
          if (userId) {
            nomeMap.set(userId, { nome: c.nome || 'Sem nome', email: c.email || '' });
          }
        });
      }

      return data.map((c: any) => {
        const userInfo = nomeMap.get(c.contadores?.user_id) || { nome: 'Contador ID: ' + (c.contador_id?.slice(0, 8) || 'N/A'), email: '' };
        return {
          ...c,
          contador_nome: userInfo.nome,
          contador_email: userInfo.email,
        };
      });
    },
    enabled: isAdmin === true,
  });

  // Approve using RLS function
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('fn_aprovar_comissao', {
        p_comissao_id: id,
        p_user_id: user?.id,
        p_observacao: null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✓ Comissão aprovada com auditoria!');
      refetch();
      setShowModal(false);
      setSelectedItem(null);
    },
    onError: () => toast.error('Erro ao aprovar comissão'),
  });

  // Reject using RLS function
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('fn_rejeitar_comissao', {
        p_comissao_id: id,
        p_user_id: user?.id,
        p_motivo: rejectionReason || 'Rejeitado pelo admin',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✓ Comissão rejeitada com notificação');
      refetch();
      setShowModal(false);
      setSelectedItem(null);
      setRejectionReason('');
    },
    onError: () => toast.error('Erro ao rejeitar comissão'),
  });

  // Aguardar carregamento completo ANTES de qualquer decisão
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se ainda está carregando OU isAdmin ainda não foi definido, mostrar loading
  if (isAdminLoading || isAdmin === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Só aqui temos certeza: isAdminLoading === false E isAdmin tem valor definido
  // Só mostrar restrito se TIVER CERTEZA que não é admin
  if (isAdmin === false) {
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
      {/* Header - renderiza IMEDIATAMENTE */}
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
        {isLoadingCharts ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando dados...</p>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Stats - Mobile First com Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pending */}
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                {!summary ? (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                        Pendentes
                      </p>
                      <p className="text-3xl font-serif font-bold text-blue-900 mt-2">
                        {summary.pending || 0}
                      </p>
                    </div>
                    <Clock className="h-10 w-10 text-yellow-400 opacity-20" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved */}
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                {!summary ? (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                        Aprovadas
                      </p>
                      <p className="text-3xl font-serif font-bold text-green-600 mt-2">
                        {summary.approved || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-400 opacity-20" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejected */}
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                {!summary ? (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                        Rejeitadas
                      </p>
                      <p className="text-3xl font-serif font-bold text-red-600 mt-2">
                        {summary.rejected || 0}
                      </p>
                    </div>
                    <XCircle className="h-10 w-10 text-red-400 opacity-20" />
                  </div>
                )}
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
                    <button
                      key={commission.id}
                      onClick={() => {
                        setSelectedItem(commission);
                        setShowModal(true);
                      }}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                    >
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {commission.contador_nome || 'N/A'}
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
                            {commission.tipo === 'recorrente'
                              ? 'Recorrente'
                              : 'Comissão'}
                          </Badge>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-gray-300 ml-2 group-hover:text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
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
                {selectedItem.contador_nome || 'N/A'}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Tipo:</span>
                  <span className="font-medium text-gray-900">
                    {selectedItem.tipo}
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
              {selectedItem.status !== 'aprovada' && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Motivo da rejeição (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans resize-none"
                  rows={2}
                />
              )}

              {/* Actions */}
              {selectedItem.status === 'calculada' ? (
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
                    Esta comissão já foi {selectedItem.status}.
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
