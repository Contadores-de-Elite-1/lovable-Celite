import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Shield
} from 'lucide-react';
import type { 
  PayoutsSummary, 
  ExpectedPayout, 
  CommissionDiff, 
  AuditoriaFilters,
  AdminContador
} from '@/types/auditoria';

const AuditoriaComissoes = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AuditoriaFilters>({
    competencia: new Date().toISOString().slice(0, 8) + '01',
    status: 'all',
    contadorId: null,
  });

  const updateFilter = <K extends keyof AuditoriaFilters>(
    key: K,
    value: AuditoriaFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Verificação de admin
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc('has_role', {
        _user_id: user?.id,
        _role: 'admin'
      });
      return data as boolean;
    },
    enabled: !!user,
  });

  // Query 1: Totais (Cards)
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['payouts-summary', filters.competencia],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('expected_payouts_summary' as const, { 
          p_month: filters.competencia 
        })
        .single();
      
      if (error) throw error;
      return data as unknown as PayoutsSummary;
    },
    enabled: isAdmin === true,
  });

  // Query 2: Lista de Pendências
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: [
      'expected-payouts',
      filters.competencia,
      filters.status,
      filters.contadorId,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_expected_payouts' as const, {
        p_month: filters.competencia,
        p_status: filters.status === 'all' ? null : filters.status,
        p_contador: filters.contadorId,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;
      return (data || []) as unknown as ExpectedPayout[];
    },
    enabled: isAdmin === true,
  });

  // Query 3: Diferenças Shadow vs Oficial
  const { data: diffs, isLoading: diffsLoading } = useQuery({
    queryKey: ['commission-diffs', filters.competencia],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('diff_commissions' as const, {
        p_month: filters.competencia,
      });

      if (error) throw error;
      return (data || []) as unknown as CommissionDiff[];
    },
    enabled: isAdmin === true,
  });

  // Query 4: Lista de Contadores (para dropdown) usando RPC
  const { data: contadores } = useQuery({
    queryKey: ['admin-contadores-list'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_admin_contadores' as const, {
        p_q: null,
        p_limit: 50,
        p_offset: 0,
      });
      
      if (error) throw error;
      return (data || []) as unknown as AdminContador[];
    },
    enabled: isAdmin === true,
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você não possui permissões de administrador para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-primary text-primary-foreground p-6 rounded-lg">
          <h1 className="text-3xl font-serif font-bold">Auditoria de Comissões</h1>
          <p className="text-sm opacity-90">
            Pendências de pagamento e diferenças entre shadow/oficial
          </p>
        </header>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro: Competência (Mês/Ano) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Competência</label>
                <input
                  type="month"
                  value={filters.competencia.slice(0, 7)}
                  onChange={(e) => {
                    const yyyyMm = e.target.value;
                    updateFilter('competencia', `${yyyyMm}-01`);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              {/* Filtro: Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(v) => updateFilter('status', v as AuditoriaFilters['status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro: Contador */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Contador</label>
                <Select 
                  value={filters.contadorId || 'all'} 
                  onValueChange={(v) => updateFilter('contadorId', v === 'all' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Contadores</SelectItem>
                    {contadores?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome || c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Totais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Pendentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendências
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : `R$ ${summary?.pending.toFixed(2) || '0.00'}`}
              </div>
              <p className="text-xs text-muted-foreground">Status: pending</p>
            </CardContent>
          </Card>

          {/* Card 2: Agendados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Agendamento
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : `R$ ${summary?.scheduled.toFixed(2) || '0.00'}`}
              </div>
              <p className="text-xs text-muted-foreground">Status: scheduled</p>
            </CardContent>
          </Card>

          {/* Card 3: Pagos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagos no Mês
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : `R$ ${summary?.paid.toFixed(2) || '0.00'}`}
              </div>
              <p className="text-xs text-muted-foreground">Status: paid</p>
            </CardContent>
          </Card>

          {/* Card 4: Cancelados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cancelados
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : `R$ ${summary?.canceled.toFixed(2) || '0.00'}`}
              </div>
              <p className="text-xs text-muted-foreground">Status: canceled</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela 1: Pendências */}
        <Card>
          <CardHeader>
            <CardTitle>Pendências de Pagamento</CardTitle>
            <p className="text-sm text-muted-foreground">
              {payouts?.length || 0} registro(s) encontrado(s)
            </p>
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : payouts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contador ID</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Rules Version</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts?.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-mono text-xs">
                          {payout.contador_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(payout.competencia).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {Number(payout.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payout.rules_version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payout.status === 'paid'
                                ? 'default'
                                : payout.status === 'pending'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela 2: Diferenças */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Diferenças (Shadow vs Oficial)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {diffs?.filter(d => Math.abs(d.delta) > 0.01).length || 0} diferença(s) detectada(s)
            </p>
          </CardHeader>
          <CardContent>
            {diffsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : diffs?.filter(d => Math.abs(d.delta) > 0.01).length === 0 ? (
              <div className="text-center py-8 text-green-600 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  Nenhuma diferença encontrada - Sistema em conformidade ✓
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contador</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Shadow</TableHead>
                      <TableHead className="text-right">Oficial</TableHead>
                      <TableHead className="text-right">Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diffs
                      ?.filter(d => Math.abs(d.delta) > 0.01)
                      .map((diff, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">
                            {diff.contador_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {diff.cliente_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {new Date(diff.competencia).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{diff.tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {Number(diff.valor_shadow).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {Number(diff.valor_oficial).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                diff.delta > 0
                                  ? 'text-red-600 font-semibold'
                                  : 'text-blue-600 font-semibold'
                              }
                            >
                              {diff.delta > 0 ? '+' : ''}
                              R$ {Number(diff.delta).toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditoriaComissoes;
