import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link, Copy, MessageSquare, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const LinksIndicacao = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<'cliente' | 'contador'>('cliente');
  const [canal, setCanal] = useState<'whatsapp' | 'email' | 'linkedin' | 'outros'>('whatsapp');

  // Buscar contador
  const { data: contador } = useQuery({
    queryKey: ['contador', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  // Buscar links
  const { data: links = [] } = useQuery({
    queryKey: ['links', contador?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('links')
        .select('*')
        .eq('contador_id', contador?.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!contador?.id
  });

  // Criar link
  const criarLinkMutation = useMutation({
    mutationFn: async () => {
      const token = Math.random().toString(36).substring(2, 15);
      const targetUrl =
        tipo === 'cliente'
          ? `${window.location.origin}/cadastro-cliente?ref=${token}`
          : `${window.location.origin}/cadastro-contador?ref=${token}`;

      const { data, error } = await supabase
        .from('links')
        .insert({
          contador_id: contador?.id,
          tipo,
          canal,
          token,
          target_url: targetUrl
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success('Link criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar link');
    }
  });

  const copiarLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const compartilharWhatsApp = (url: string) => {
    const mensagem =
      tipo === 'cliente'
        ? `Olá! Conheça nossa solução de contabilidade: ${url}`
        : `Seja um parceiro Contadores de Elite: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const compartilharEmail = (url: string) => {
    const assunto = tipo === 'cliente' ? 'Solução de Contabilidade' : 'Programa Contadores de Elite';
    const corpo = `Confira: ${url}`;
    window.open(`mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER DARK IGUAL AO DE COMISSÕES E SAQUES */}
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#F4C430]">
            Links de Indicação
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Crie e gerencie seus links de indicação
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >

          {/* CARD: CRIAR LINK */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-[#0C1A2A]">
                Criar Novo Link
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Tipo de Link</Label>
                  <Select value={tipo} onValueChange={(v: string) => setTipo(v)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="contador">Contador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Canal</Label>
                  <Select value={canal} onValueChange={(v: string) => setCanal(v)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => criarLinkMutation.mutate()}
                className="w-full bg-[#27AE60] hover:bg-blue-800 text-white"
                disabled={criarLinkMutation.isPending}
              >
                <Link className="mr-2 h-4 w-4" />
                {criarLinkMutation.isPending ? 'Gerando...' : 'Gerar Link'}
              </Button>
            </CardContent>
          </Card>

          {/* CARD: MEUS LINKS */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-[#0C1A2A]">
                Meus Links
              </CardTitle>
            </CardHeader>

            <CardContent>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>Conversões</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {links.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        Nenhum link criado ainda
                      </TableCell>
                    </TableRow>
                  ) : (
                    links.map((link) => {
                      const taxa =
                        link.cliques > 0
                          ? ((link.conversoes / link.cliques) * 100).toFixed(1)
                          : '0.0';

                      return (
                        <TableRow key={link.id} className="hover:bg-gray-50">
                          <TableCell className="capitalize font-medium text-gray-700">
                            {link.tipo}
                          </TableCell>

                          <TableCell className="capitalize text-gray-600">
                            {link.canal}
                          </TableCell>

                          <TableCell>{link.cliques}</TableCell>
                          <TableCell>{link.conversoes}</TableCell>

                          <TableCell className="font-semibold">
                            {taxa}%
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copiarLink(link.target_url || '')}
                                className="border-gray-300"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => compartilharWhatsApp(link.target_url || '')}
                                className="border-gray-300"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => compartilharEmail(link.target_url || '')}
                                className="border-gray-300"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

            </CardContent>
          </Card>

        </motion.div>
      </main>
    </div>
  );
};

export default LinksIndicacao;
