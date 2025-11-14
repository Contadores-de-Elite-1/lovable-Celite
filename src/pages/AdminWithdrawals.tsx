import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WithdrawalRequest {
  id: string;
  contador_id: string;
  contador_nome: string;
  contador_email: string;
  valor_solicitado: number;
  status: string;
  metodo_pagamento: string;
  chave_pix?: string;
  titular_conta?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  solicitado_em: string;
  processada_em?: string;
  observacao?: string;
}

const AdminWithdrawals = () => {
  const { user } = useAuth();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comprovante, setComprovante] = useState('');
  const [obsAdmin, setObsAdmin] = useState('');

  // Check if admin
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      return roles?.role === 'admin';
    },
    enabled: !!user,
  });

  // Get pending withdrawals
  const { data: withdrawals = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-withdrawals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('solicitacoes_saque')
        .select(`
          id,
          contador_id,
          valor_solicitado,
          status,
          metodo_pagamento,
          dados_bancarios,
          solicitado_em,
          processada_em,
          observacao,
          contadores (
            nome,
            email
          )
        `)
        .eq('status', 'pendente')
        .order('solicitado_em', { ascending: true });

      return (data || []).map((row: any) => ({
        id: row.id,
        contador_id: row.contador_id,
        contador_nome: row.contadores?.nome,
        contador_email: row.contadores?.email,
        valor_solicitado: row.valor_solicitado,
        status: row.status,
        metodo_pagamento: row.metodo_pagamento,
        chave_pix: row.dados_bancarios?.chave_pix,
        titular_conta: row.dados_bancarios?.titular_conta,
        banco: row.dados_bancarios?.banco,
        agencia: row.dados_bancarios?.agencia,
        conta: row.dados_bancarios?.conta,
        solicitado_em: row.solicitado_em,
        processada_em: row.processada_em,
        observacao: row.observacao,
      })) as WithdrawalRequest[];
    },
    enabled: isAdmin === true,
  });

  // Process withdrawal mutation
  const processWithdrawal = useMutation({
    mutationFn: async () => {
      if (!selectedWithdrawal || !user?.id) throw new Error('Missing data');

      const { error } = await supabase.rpc('fn_processar_solicitacao_saque', {
        p_solicitacao_id: selectedWithdrawal.id,
        p_user_id: user.id,
        p_comprovante_url: comprovante || null,
        p_observacao: obsAdmin || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✓ Saque processado com sucesso!');
      setShowModal(false);
      setSelectedWithdrawal(null);
      setComprovante('');
      setObsAdmin('');
      refetch();
    },
    onError: () => toast.error('Erro ao processar saque'),
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm border-red-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">Apenas admins podem acessar esta página.</p>
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
            Solicitações de Saque
          </h1>
          <p className="text-blue-100 text-sm mt-1">Gerencie retiradas de contadores</p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 pb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Pendentes</p>
                    <p className="text-3xl font-serif font-bold text-yellow-600 mt-2">
                      {withdrawals.filter(w => w.status === 'pendente').length}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Total Pendente</p>
                    <p className="text-3xl font-serif font-bold text-blue-600 mt-2">
                      R$ {withdrawals
                        .filter(w => w.status === 'pendente')
                        .reduce((acc, w) => acc + w.valor_solicitado, 0)
                        .toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawals Table */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-serif text-blue-900">Solicitações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma solicitação de saque pendente
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contador</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Solicitado em</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-semibold text-gray-900">{withdrawal.contador_nome}</p>
                              <p className="text-xs text-gray-500">{withdrawal.contador_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            R$ {withdrawal.valor_solicitado.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {withdrawal.metodo_pagamento === 'pix' ? 'PIX' : 'Transferência'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(withdrawal.solicitado_em).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowModal(true);
                              }}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Processar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Process Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Processar Saque</DialogTitle>
            <DialogDescription>
              {selectedWithdrawal?.contador_nome} - R$ {selectedWithdrawal?.valor_solicitado.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* Bank Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Dados Bancários</h4>
                {selectedWithdrawal.chave_pix && (
                  <p className="text-sm">
                    <strong>PIX:</strong> {selectedWithdrawal.chave_pix}
                  </p>
                )}
                {selectedWithdrawal.titular_conta && (
                  <p className="text-sm">
                    <strong>Titular:</strong> {selectedWithdrawal.titular_conta}
                  </p>
                )}
                {selectedWithdrawal.banco && (
                  <p className="text-sm">
                    <strong>Banco:</strong> {selectedWithdrawal.banco}
                    {selectedWithdrawal.agencia && ` / Agência: ${selectedWithdrawal.agencia}`}
                    {selectedWithdrawal.conta && ` / Conta: ${selectedWithdrawal.conta}`}
                  </p>
                )}
              </div>

              {/* Comprovante */}
              <div>
                <Label className="text-sm font-medium">URL do Comprovante (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={comprovante}
                  onChange={(e) => setComprovante(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Observação */}
              <div>
                <Label className="text-sm font-medium">Observação (opcional)</Label>
                <Textarea
                  placeholder="Adicionar nota do admin..."
                  value={obsAdmin}
                  onChange={(e) => setObsAdmin(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => processWithdrawal.mutate()}
                  disabled={processWithdrawal.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processWithdrawal.isPending ? 'Processando...' : 'Confirmar Saque'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
