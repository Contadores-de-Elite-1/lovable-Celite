import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare, Mail, Share2, ExternalLink, CheckCircle2, TrendingUp, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';

const LinksIndicacao = () => {
  useScrollToTop();
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

  // Buscar estatísticas completas (clientes + contadores + comissões)
  const { data: estatisticas } = useQuery({
    queryKey: ['link-stats', contador?.id],
    queryFn: async () => {
      if (!contador?.id) return null;
      
      // Buscar clientes diretos
      const { data: clientes, count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('contador_id', contador.id);

      // Buscar contadores indicados (com você como sponsor)
      const { data: contadoresIndicados, count: totalIndicados } = await supabase
        .from('contadores')
        .select('*', { count: 'exact' })
        .eq('sponsor_id', contador.id)
        .eq('status', 'ativo');

      // Buscar comissões diretas (15%)
      const { data: comissoesDiretas } = await supabase
        .from('comissoes')
        .select('valor')
        .eq('contador_id', contador.id)
        .eq('tipo_comissao', 'direta')
        .eq('status_comissao', 'paga');

      // Buscar comissões override (5%)
      const { data: comissoesOverride } = await supabase
        .from('comissoes')
        .select('valor')
        .eq('contador_id', contador.id)
        .eq('tipo_comissao', 'override')
        .eq('status_comissao', 'paga');

      const totalComissoesDiretas = comissoesDiretas?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
      const totalComissoesOverride = comissoesOverride?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

      return {
        totalClientes: totalClientes || 0,
        clientesAtivos: clientes?.filter(c => c.status === 'ativo').length || 0,
        totalIndicados: totalIndicados || 0,
        totalComissoesDiretas,
        totalComissoesOverride,
        totalComissoes: totalComissoesDiretas + totalComissoesOverride,
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

  // Link universal que funciona em QUALQUER página do site
  const linkCompleto = contador?.link_rastreavel 
    ? `${window.location.origin}/auth?ref=${contador.link_rastreavel}`
    : '';
  
  // Link base (pode ser usado em qualquer página adicionando ?ref=TOKEN)
  const linkBaseUniversal = contador?.link_rastreavel
    ? `${window.location.origin}/?ref=${contador.link_rastreavel}`
    : '';

  const copiarLink = () => {
    navigator.clipboard.writeText(linkCompleto);
    setLinkCopiado(true);
    toast.success('Link copiado para área de transferência!');
    setTimeout(() => setLinkCopiado(false), 3000);
  };

  const compartilharWhatsApp = () => {
    const mensagem = `🚀 Transforme sua empresa com serviços profissionais completos!\n\n✅ Soluções modernas e eficientes\n✅ Planos a partir de R$ 110/mês\n✅ Suporte especializado\n\nConheça agora: ${linkCompleto}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const compartilharEmail = () => {
    const assunto = 'Lovable-Celite - Serviços Profissionais';
    const corpo = `Olá!\n\nConheça nossos serviços profissionais, uma solução completa para sua empresa.\n\nAcesse: ${linkCompleto}\n\nAté breve!`;
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
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#0F2940] text-white p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl md:text-3xl font-serif font-bold text-[#D4AF37]">
            Meu Link de Indicação
          </h1>
          <p className="text-gray-300 text-xs md:text-sm mt-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {/* CLIENTES INDICADOS */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700 font-medium">Clientes Indicados</p>
                    <p className="text-xl md:text-2xl font-bold text-green-900 mt-1">
                      {estatisticas?.totalClientes || 0}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {estatisticas?.clientesAtivos || 0} ativos
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CONTADORES INDICADOS */}
            <Card className="bg-gradient-to-br from-[#0C1A2A]/5 to-[#0F2940]/10 border-[#0C1A2A]/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#0C1A2A] font-medium">Contadores na Rede</p>
                    <p className="text-xl md:text-2xl font-bold text-[#0C1A2A] mt-1">
                      {estatisticas?.totalIndicados || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Você é sponsor
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#0C1A2A] rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COMISSÕES DIRETAS */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Comissões Diretas</p>
                    <p className="text-xl md:text-2xl font-bold text-blue-900 mt-1">
                      R$ {estatisticas?.totalComissoesDiretas?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      15% dos clientes
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-base md:text-xl">💵</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COMISSÕES OVERRIDE */}
            <Card className="bg-gradient-to-br from-[#D4AF37]/5 to-[#D4AF37]/10 border-[#D4AF37]/30">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#0C1A2A] font-medium">Override (Rede)</p>
                    <p className="text-xl md:text-2xl font-bold text-[#0C1A2A] mt-1">
                      R$ {estatisticas?.totalComissoesOverride?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      5% dos indicados
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <span className="text-base md:text-xl">📈</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TOTAL GERAL */}
            <Card className="bg-gradient-to-br from-[#0C1A2A] to-[#0F2940] border-[#0C1A2A]">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#D4AF37] font-medium">Total Ganho</p>
                    <p className="text-xl md:text-2xl font-bold text-white mt-1">
                      R$ {(estatisticas?.totalComissoes || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Todas as comissões
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <span className="text-base md:text-xl">💰</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MEU LINK ÚNICO */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-[#0C1A2A]/5 to-[#D4AF37]/5 p-4 md:p-6">
              <CardTitle className="font-serif text-[#0C1A2A] flex items-center gap-2 text-base md:text-lg">
                <Share2 className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
                Seu Link Único de Indicação
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              {!contador?.link_rastreavel ? (
                /* NÃO TEM LINK - GERAR PELA PRIMEIRA VEZ */
                <div className="text-center py-6 md:py-8 px-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-[#0C1A2A]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Share2 className="w-7 h-7 md:w-8 md:h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-[#0C1A2A] mb-2">
                    Gere seu link único de indicação
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Este link será seu link permanente para indicar clientes. 
                    Você poderá compartilhá-lo quantas vezes quiser!
                  </p>
                  <Button
                    onClick={() => gerarLinkMutation.mutate()}
                    disabled={gerarLinkMutation.isPending}
                    size="lg"
                    className="bg-[#0C1A2A] hover:bg-[#0F2940] text-white"
                  >
                    {gerarLinkMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mr-2" />
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

                  {/* INFO UNIVERSAL */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-green-900 font-semibold">
                      ✅ Sistema Universal de Rastreamento
                    </p>
                    <p className="text-sm text-green-800">
                      Este link funciona em <strong>QUALQUER página</strong> do site! Você pode adicionar <code className="bg-white px-1 rounded">?ref={contador?.link_rastreavel}</code> a qualquer URL.
                    </p>
                    <div className="text-xs text-green-700 mt-2 space-y-1">
                      <p>📌 <strong>Indicar Clientes:</strong> Receba 15% das mensalidades</p>
                      <p>📌 <strong>Indicar Contadores:</strong> Receba 5% de tudo que eles venderem (override)</p>
                      <p>📌 <strong>Use em:</strong> Landing pages, emails, QR codes, redes sociais, materiais de marketing</p>
                    </div>
                  </div>

                  {/* LINK UNIVERSAL BASE */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Link Base Universal (adicione a qualquer página):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 font-mono text-xs text-gray-700 overflow-x-auto">
                        {linkBaseUniversal}
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(linkBaseUniversal);
                          toast.success('Link universal copiado!');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Exemplo: <code>https://seusite.com/dashboard?ref={contador?.link_rastreavel}</code>
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

          {/* QR CODE */}
          {contador?.link_rastreavel && (
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-[#0C1A2A]/5 to-[#D4AF37]/5 p-4 md:p-6">
                <CardTitle className="font-serif text-[#0C1A2A] flex items-center gap-2 text-base md:text-lg">
                  <QrCode className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
                  QR Code para Marketing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex justify-center md:justify-start">
                    <QRCodeGenerator url={linkCompleto} />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="font-semibold text-[#0C1A2A] text-base md:text-lg">
                      Use este QR Code em:
                    </h3>
                    <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-[#D4AF37] mt-0.5">✓</span>
                        <span><strong>Cartões de visita:</strong> Imprima no verso do seu cartão</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#D4AF37] mt-0.5">✓</span>
                        <span><strong>Folders e flyers:</strong> Materiais impressos de marketing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#D4AF37] mt-0.5">✓</span>
                        <span><strong>Banners e stands:</strong> Eventos e feiras</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#D4AF37] mt-0.5">✓</span>
                        <span><strong>Redes sociais:</strong> Stories do Instagram, posts do Facebook</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#D4AF37] mt-0.5">✓</span>
                        <span><strong>Email signature:</strong> Adicione à sua assinatura de email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#D4AF37] mt-0.5">✓</span>
                        <span><strong>Apresentações:</strong> Slides de PowerPoint/Google Slides</span>
                      </li>
                    </ul>
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-3 mt-4">
                      <p className="text-xs md:text-sm text-[#0C1A2A]">
                        <strong>💡 Dica Pro:</strong> Qualquer pessoa que escanear este QR Code será automaticamente vinculada a você e você receberá comissões!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
