import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare, Mail, Share2, ExternalLink, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const LinksIndicacao = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Buscar contador e seu link único
  const { data: contador, isLoading } = useQuery({
    queryKey: ['contador-link', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contadores')
        .select('id, link_rastreavel, clientes_ativos')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  // Buscar estatísticas do link (clientes convertidos via link)
  const { data: estatisticas } = useQuery({
    queryKey: ['link-stats', contador?.id],
    queryFn: async () => {
      if (!contador?.id) return null;
      
      // Buscar clientes que vieram pelo link do contador
      const { data: clientes, count } = await supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('contador_id', contador.id);

      // Buscar comissões geradas por esses clientes
      const { data: comissoes } = await supabase
        .from('comissoes')
        .select('valor')
        .eq('contador_id', contador.id)
        .eq('status', 'paga');

      const totalComissoes = comissoes?.reduce((sum, c) => sum + c.valor, 0) || 0;

      return {
        totalClientes: count || 0,
        clientesAtivos: clientes?.filter(c => c.status === 'ativo').length || 0,
        totalComissoes,
        conversaoEstimada: 0 // TODO: Implementar tracking de cliques
      };
    },
    enabled: !!contador?.id
  });

  // Gerar link único (apenas se não existir)
  const gerarLinkMutation = useMutation({
    mutationFn: async () => {
      if (!contador?.id) throw new Error('Contador não encontrado');

      // Gerar token único
      const token = `${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
      
      // Atualizar contador com link rastreável
      const { error } = await supabase
        .from('contadores')
        .update({ link_rastreavel: token })
        .eq('id', contador.id);

      if (error) throw error;
      
      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contador-link'] });
      toast.success('Link único gerado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao gerar link');
    }
  });

  const linkCompleto = contador?.link_rastreavel 
    ? `${window.location.origin}/onboarding/${contador.link_rastreavel}`
    : '';

  const copiarLink = () => {
    navigator.clipboard.writeText(linkCompleto);
    setLinkCopiado(true);
    toast.success('Link copiado para área de transferência!');
    setTimeout(() => setLinkCopiado(false), 3000);
  };

  const compartilharWhatsApp = () => {
    const mensagem = `🚀 Transforme sua empresa com a Top Class Escritório Virtual!\n\n✅ Contabilidade completa e moderna\n✅ Planos a partir de R$ 100/mês\n✅ Suporte especializado\n\nConheça agora: ${linkCompleto}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const compartilharEmail = () => {
    const assunto = 'Top Class Escritório Virtual - Contabilidade Moderna';
    const corpo = `Olá!\n\nConheça a Top Class Escritório Virtual, uma solução completa de contabilidade para sua empresa.\n\nAcesse: ${linkCompleto}\n\nAté breve!`;
    window.open(`mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
  };

  const abrirLinkNovaAba = () => {
    window.open(linkCompleto, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-white p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#F4C430]">
            Meu Link de Indicação
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Compartilhe e ganhe comissões em cada cliente indicado
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Clientes Indicados</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                      {estatisticas?.totalClientes || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Clientes Ativos</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">
                      {estatisticas?.clientesAtivos || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Total Ganho</p>
                    <p className="text-3xl font-bold text-amber-900 mt-1">
                      R$ {(estatisticas?.totalComissoes || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MEU LINK ÚNICO */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardTitle className="font-serif text-[#0C1A2A] flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Seu Link Único de Indicação
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {!contador?.link_rastreavel ? (
                /* NÃO TEM LINK - GERAR PELA PRIMEIRA VEZ */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Share2 className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Gere seu link único de indicação
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Este link será seu link permanente para indicar clientes. 
                    Você poderá compartilhá-lo quantas vezes quiser!
                  </p>
                  <Button
                    onClick={() => gerarLinkMutation.mutate()}
                    disabled={gerarLinkMutation.isPending}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {gerarLinkMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5 mr-2" />
                        Gerar Meu Link Único
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* JÁ TEM LINK - EXIBIR E COMPARTILHAR */
                <div className="space-y-6">
                  {/* LINK COM BOTÃO COPIAR */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Seu link permanente:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm text-gray-700 overflow-x-auto">
                        {linkCompleto}
                      </div>
                      <Button
                        onClick={copiarLink}
                        variant={linkCopiado ? "default" : "outline"}
                        className={linkCopiado ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {linkCopiado ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Dica:</strong> Este é seu link único e permanente. Compartilhe com 
                      quantos clientes quiser. Todos os clientes que se cadastrarem através dele 
                      serão automaticamente vinculados a você!
                    </p>
                  </div>

                  {/* BOTÕES DE COMPARTILHAMENTO */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-3">
                      Compartilhar via:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        onClick={compartilharWhatsApp}
                        variant="outline"
                        className="h-auto py-4 justify-start border-green-300 hover:bg-green-50"
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
                        className="h-auto py-4 justify-start border-blue-300 hover:bg-blue-50"
                      >
                        <Mail className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Email</div>
                          <div className="text-xs text-gray-600">Enviar por email</div>
                        </div>
                      </Button>

                      <Button
                        onClick={abrirLinkNovaAba}
                        variant="outline"
                        className="h-auto py-4 justify-start border-indigo-300 hover:bg-indigo-50"
                      >
                        <ExternalLink className="w-5 h-5 text-indigo-600 mr-3" />
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Visualizar</div>
                          <div className="text-xs text-gray-600">Abrir em nova aba</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* COMO FUNCIONA */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-[#0C1A2A]">
                Como funciona?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Compartilhe seu link</h4>
                    <p className="text-sm text-gray-600">
                      Envie para seus clientes via WhatsApp, email, redes sociais ou qualquer outro canal
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Cliente se cadastra</h4>
                    <p className="text-sm text-gray-600">
                      O cliente preenche os dados, escolhe o plano e realiza o pagamento
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Você recebe comissões!</h4>
                    <p className="text-sm text-gray-600">
                      Ganhe até 100% no 1º pagamento + 15-20% recorrente todo mês enquanto o cliente estiver ativo
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default LinksIndicacao;
