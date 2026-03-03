import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award,
  CreditCard,
  Shield,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function ContadorOnboarding() {
  const navigate = useNavigate();
  const { user, role, roleLoading } = useAuth();
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [temLogomarca, setTemLogomarca] = useState<boolean | null>(null);
  const [logoArquivo, setLogoArquivo] = useState<File | null>(null);

  // Aguarda role carregar antes de decidir
  if (roleLoading || (user && role === null)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  // Apenas contadores e admins acessam o onboarding de contador
  const podeAcessar = role === 'contador' || role === 'admin';
  if (user && !podeAcessar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#0C1A2A] mb-4">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 mb-6">
            Esta área é exclusiva para Contadores.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-[#0C1A2A] text-white px-6 py-2 rounded-lg hover:bg-[#1a2f47] transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // Fase 0.1 - Boas-vindas
  const TelaBoasVindas = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-8 md:p-12 bg-white shadow-2xl border-2 border-[#D4AF37]/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#D4AF37]/20 rounded-full mb-4 border-4 border-[#D4AF37]/30">
            <img
              src="/images/logo-contadores-elite.jpeg"
              alt="Contadores de Elite"
              className="w-16 h-16 object-contain rounded-full"
            />
          </div>
          <h1 className="text-4xl font-bold text-[#0C1A2A] mb-2">
            Bem-vindo ao Programa
          </h1>
          <h2 className="text-3xl font-bold text-[#D4AF37] mb-4">
            Contadores de Elite
          </h2>
          <p className="text-lg text-gray-700">
            Transforme sua carteira de clientes em uma fonte de renda recorrente e escalável
          </p>
        </div>

        {/* Como funciona */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Como funciona o programa:
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/20 p-6 rounded-xl border-2 border-[#D4AF37]/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-[#0C1A2A]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Ganhe até 100% no 1º Pagamento
                  </h4>
                  <p className="text-sm text-gray-700">
                    Bônus de Ativação: receba o valor integral do primeiro pagamento do cliente (líquido de taxas)
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-[#0C1A2A]/10 to-[#1a2f47]/20 p-6 rounded-xl border-2 border-[#0C1A2A]/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0C1A2A] rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Comissões Recorrentes de 15%-20%
                  </h4>
                  <p className="text-sm text-gray-700">
                    Ganhe todos os meses enquanto o cliente permanecer ativo. Renda passiva garantida!
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#B8941F]/20 p-6 rounded-xl border-2 border-[#D4AF37]/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-[#0C1A2A]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    17 Tipos de Bonificações
                  </h4>
                  <p className="text-sm text-gray-700">
                    Bônus de progressão, volume, retenção (LTV), override de rede e muito mais
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-gradient-to-br from-[#0C1A2A]/10 to-[#1a2f47]/20 p-6 rounded-xl border-2 border-[#0C1A2A]/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0C1A2A] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Evolução por Performance
                  </h4>
                  <p className="text-sm text-gray-700">
                    Bronze → Prata → Ouro → Diamante. Quanto mais clientes, maior sua comissão!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Níveis */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">
              Níveis de Performance:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-1">🥉</div>
                <div className="font-semibold text-[#0C1A2A]">Bronze</div>
                <div className="text-sm text-gray-600">1-4 clientes</div>
                <div className="text-sm font-medium text-[#D4AF37]">15%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🥈</div>
                <div className="font-semibold text-[#0C1A2A]">Prata</div>
                <div className="text-sm text-gray-600">5-9 clientes</div>
                <div className="text-sm font-medium text-[#D4AF37]">17,5%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🥇</div>
                <div className="font-semibold text-[#0C1A2A]">Ouro</div>
                <div className="text-sm text-gray-600">10-14 clientes</div>
                <div className="text-sm font-medium text-[#D4AF37]">20%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">💎</div>
                <div className="font-semibold text-[#0C1A2A]">Diamante</div>
                <div className="text-sm text-gray-600">15+ clientes</div>
                <div className="text-sm font-medium text-[#D4AF37]">20% + Lead</div>
              </div>
            </div>
          </div>

          {/* Exemplo Prático */}
          <div className="bg-[#0C1A2A]/10 border-2 border-[#D4AF37]/30 rounded-xl p-6">
            <h4 className="font-semibold text-[#0C1A2A] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
              Exemplo Prático:
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✅ Você indica 1 cliente (Plano PREMIUM - R$ 130/mês)</p>
              <p className="pl-6">
                → <strong>1º mês:</strong> R$ 125,93 (Bônus Ativação - 100%)
              </p>
              <p className="pl-6">
                → <strong>Mês 2+:</strong> R$ 18,89/mês (Comissão 15% recorrente)
              </p>
              <p className="pl-6 font-semibold text-[#D4AF37]">
                → Total 1 ano: R$ 333,72 por cliente!
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => setEtapa(2)}
            size="lg"
            className="text-lg px-8 py-6 text-white"
            style={{ backgroundColor: '#D4AF37' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8941F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D4AF37'}
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Próximo: Como você vai receber seus pagamentos
          </p>
        </div>
      </Card>
    </div>
  );

  // Fase 0.2 - Como você vai receber
  const TelaRecebimento = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full p-8 md:p-12 bg-white shadow-2xl border-2 border-[#D4AF37]/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/20 rounded-full mb-4 border-4 border-[#D4AF37]/30">
            <CreditCard className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Como você vai receber
          </h1>
          <p className="text-lg text-gray-600">
            Pagamentos automáticos, seguros e transparentes
          </p>
        </div>

        {/* Destaque Principal */}
        <div className="bg-gradient-to-r from-[#0C1A2A] to-[#1a2f47] text-white rounded-xl p-8 mb-8 text-center border-2 border-[#D4AF37]/30 shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-[#D4AF37]">
            Pagamentos via Stripe
          </h2>
          <p className="text-gray-300 mb-4">
            Líder mundial em pagamentos online
          </p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <div>
              <div className="text-3xl font-bold text-[#D4AF37]">25</div>
              <div className="text-gray-300">Dia do pagamento</div>
            </div>
            <div className="w-px h-12 bg-[#D4AF37]/30"></div>
            <div>
              <div className="text-3xl font-bold text-[#D4AF37]">2-3</div>
              <div className="text-gray-300">Dias para cair</div>
            </div>
            <div className="w-px h-12 bg-[#D4AF37]/30"></div>
            <div>
              <div className="text-3xl font-bold text-[#D4AF37]">100%</div>
              <div className="text-gray-300">Automático</div>
            </div>
          </div>
        </div>

        {/* Benefícios */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
            <Clock className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Receba SEMPRE no dia 25 de cada mês
              </h3>
              <p className="text-sm text-gray-600">
                Captou clientes em Janeiro? Recebe dia 25 de Fevereiro. Previsibilidade total!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
            <DollarSign className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Direto na sua conta bancária
              </h3>
              <p className="text-sm text-gray-600">
                PIX automático do Stripe para sua conta. Sem burocracia, sem complicação.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-[#0C1A2A] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Totalmente automático
              </h3>
              <p className="text-sm text-gray-600">
                Não precisa solicitar saque. O sistema calcula, aprova e paga automaticamente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
            <Shield className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Transparência total no app
              </h3>
              <p className="text-sm text-gray-600">
                Veja todas as comissões calculadas, aprovadas e pagas em tempo real no seu dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Valor Mínimo */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h4 className="font-semibold text-yellow-900 mb-2">
            ℹ️ Valor mínimo: R$ 100
          </h4>
          <p className="text-sm text-yellow-800">
            Se suas comissões do mês forem abaixo de R$ 100, o sistema acumula automaticamente 
            para o mês seguinte. Você não perde nada!
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-4 text-center">
            Linha do tempo do pagamento:
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0C1A2A] text-[#D4AF37] rounded-full flex items-center justify-center font-semibold flex-shrink-0 border-2 border-[#D4AF37]/30">
                1
              </div>
              <div>
                <strong>Cliente contrata</strong> → Sistema calcula comissão na hora
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0C1A2A] text-[#D4AF37] rounded-full flex items-center justify-center font-semibold flex-shrink-0 border-2 border-[#D4AF37]/30">
                2
              </div>
              <div>
                <strong>Dia 1º do mês seguinte</strong> → Sistema aprova automaticamente
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#D4AF37] text-[#0C1A2A] rounded-full flex items-center justify-center font-semibold flex-shrink-0 border-2 border-[#0C1A2A]/30">
                3
              </div>
              <div>
                <strong>Dia 25</strong> → Dinheiro vai para sua conta Stripe
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#D4AF37] text-[#0C1A2A] rounded-full flex items-center justify-center font-semibold flex-shrink-0 border-2 border-[#0C1A2A]/30">
                4
              </div>
              <div>
                <strong>2-3 dias depois</strong> → Cai na sua conta bancária 💰
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => setEtapa(3)}
            size="lg"
            className="text-lg px-8 py-6 w-full md:w-auto text-white"
            style={{ backgroundColor: '#D4AF37' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8941F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D4AF37'}
          >
            Conectar Conta Stripe
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Leva apenas 2 minutos para configurar
          </p>
        </div>
      </Card>
    </div>
  );

  // Fase 0.3 - Conectar Stripe (placeholder - será implementado depois)
  const TelaConectarStripe = () => {
    const handleConectarStripe = async () => {
      setLoading(true);
      
      try {
        // Marcar primeiro_acesso como false
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user?.id) {
          await supabase
            .from('contadores')
            .update({ primeiro_acesso: false })
            .eq('user_id', userData.user.id);
        }

        // TODO: Chamar Edge Function para criar Stripe Connected Account
        // const { data } = await supabase.functions.invoke('create-stripe-account');
        
        // Por enquanto, simula sucesso e redireciona para dashboard
        setTimeout(() => {
          setLoading(false);
          navigate('/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Erro ao conectar Stripe:', error);
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 bg-white shadow-2xl border-2 border-[#D4AF37]/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/20 rounded-full mb-4 border-4 border-[#D4AF37]/30">
              <CreditCard className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Conectar Conta Stripe
            </h1>
            <p className="text-lg text-gray-600">
              Última etapa para começar a receber
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">
              O que você vai precisar:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>CPF ou CNPJ</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Nome completo ou Razão Social</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Data de nascimento (se Pessoa Física)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Telefone e endereço completo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Dados bancários (banco, agência, conta)</span>
              </li>
            </ul>
          </div>

          {/* Segurança */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-green-700 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">
                  100% Seguro
                </h4>
                <p className="text-sm text-green-800">
                  Seus dados são processados diretamente pelo Stripe, líder mundial em pagamentos. 
                  Não armazenamos informações bancárias.
                </p>
              </div>
            </div>
          </div>

          {/* Pergunta sobre Logomarca */}
          <div className="bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-[#0C1A2A] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              Sua Logomarca nos Links de Indicação
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Você tem uma logomarca própria que gostaria de usar nos links de indicação compartilhados com seus clientes?
            </p>
            
            <div className="flex gap-4 mb-4">
              <Button
                type="button"
                variant={temLogomarca === true ? 'default' : 'outline'}
                onClick={() => setTemLogomarca(true)}
                className="flex-1"
                style={temLogomarca === true ? { backgroundColor: '#D4AF37', color: '#0C1A2A' } : {}}
              >
                Sim, tenho logomarca
              </Button>
              <Button
                type="button"
                variant={temLogomarca === false ? 'default' : 'outline'}
                onClick={() => setTemLogomarca(false)}
                className="flex-1"
                style={temLogomarca === false ? { backgroundColor: '#0C1A2A', color: '#D4AF37' } : {}}
              >
                Não, não tenho
              </Button>
            </div>

            {/* Upload de Logo se tiver */}
            {temLogomarca === true && (
              <div className="mt-4">
                <Label htmlFor="logo-upload" className="text-sm font-medium text-[#0C1A2A] mb-2 block">
                  Enviar sua logomarca (PNG, JPG - Máx. 2MB)
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 2 * 1024 * 1024) {
                      setLogoArquivo(file);
                    } else {
                      alert('Arquivo deve ser menor que 2MB');
                    }
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#D4AF37] file:text-[#0C1A2A] hover:file:bg-[#B8941F]"
                />
                {logoArquivo && (
                  <p className="text-xs text-[#0C1A2A] mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    {logoArquivo.name}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  💡 Sua logomarca aparecerá no cabeçalho dos links de indicação, personalizando a experiência para seus clientes
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button
              onClick={handleConectarStripe}
              disabled={loading || temLogomarca === null}
              size="lg"
              className="text-lg px-8 py-6 w-full disabled:opacity-50 text-white"
              style={loading || temLogomarca === null ? {} : { backgroundColor: '#D4AF37' }}
              onMouseEnter={(e) => {
                if (!loading && temLogomarca !== null) {
                  e.currentTarget.style.backgroundColor = '#B8941F';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && temLogomarca !== null) {
                  e.currentTarget.style.backgroundColor = '#D4AF37';
                }
              }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  Conectar com Stripe
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-center text-xs text-gray-500">
              {temLogomarca === null && 'Por favor, responda sobre a logomarca antes de continuar'}
              {temLogomarca !== null && 'Ao continuar, você será redirecionado para o Stripe para completar seu cadastro de forma segura'}
            </p>
          </div>
        </Card>
      </div>
    );
  };

  // Renderiza a etapa atual
  if (etapa === 1) return <TelaBoasVindas />;
  if (etapa === 2) return <TelaRecebimento />;
  if (etapa === 3) return <TelaConectarStripe />;

  return null;
}

