import { useState, useMemo } from 'react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/commission';

const Calculadora = () => {
  useScrollToTop();
  // Inputs do usuario
  const [numClientes, setNumClientes] = useState<string>('');
  const [valorPlano, setValorPlano] = useState<number>(130); // Plano Profissional
  const [nivelContador, setNivelContador] = useState<'bronze' | 'prata' | 'ouro' | 'diamante'>('bronze');
  const [numContadoresRede, setNumContadoresRede] = useState<string>('');
  const [clientesPorContadorRede, setClientesPorContadorRede] = useState<string>('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Taxas por nivel
  const taxas = {
    bronze: { ativacao: 0.15, recorrente: 0.15 },
    prata: { ativacao: 0.175, recorrente: 0.175 },
    ouro: { ativacao: 0.20, recorrente: 0.20 },
    diamante: { ativacao: 0.20, recorrente: 0.20 },
  };

  // Calculos das 17 bonificacoes
  const projecao = useMemo(() => {
    const taxa = taxas[nivelContador];
    const totalClientesDiretos = numClientes ? Number(numClientes) : 0;
    const numContadores = numContadoresRede ? Number(numContadoresRede) : 0;
    const clientesPorContador = clientesPorContadorRede ? Number(clientesPorContadorRede) : 0;
    const totalClientesRede = numContadores * clientesPorContador;

    // 1. Ativacao (diretos)
    const ativacao = totalClientesDiretos * valorPlano * taxa.ativacao;

    // 2-5. Recorrentes (Bronze, Prata, Ouro, Diamante) - simplificado
    const recorrenteMensal = totalClientesDiretos * valorPlano * taxa.recorrente;

    // 6. Override 1º Pagamento (20% sobre ativacao da rede)
    const override1Pag = totalClientesRede * valorPlano * 0.20;

    // 7-10. Override Recorrente (simplificado)
    const overrideRecorrente = totalClientesRede * valorPlano * 0.05; // 5% medio

    // 11. Bonus Indicacao Contador (R$200 por contador)
    const bonusContador = numContadoresRede * 200;

    // 12-14. Bonus Progressao (Prata: R$500, Ouro: R$1000, Diamante: R$2000)
    let bonusProgressao = 0;
    if (nivelContador === 'prata' && totalClientesDiretos >= 5) bonusProgressao = 500;
    if (nivelContador === 'ouro' && totalClientesDiretos >= 10) bonusProgressao = 1000;
    if (nivelContador === 'diamante' && totalClientesDiretos >= 15) bonusProgressao = 2000;

    // 15. Bonus Volume (Diamante: R$100 a cada 5 clientes apos 15)
    let bonusVolume = 0;
    if (nivelContador === 'diamante' && totalClientesDiretos > 15) {
      const clientesAlemDiamante = totalClientesDiretos - 15;
      bonusVolume = Math.floor(clientesAlemDiamante / 5) * 100;
    }

    // 16. Bonus LTV (simplificado: 5% sobre valor recorrente total)
    const bonusLTV = (recorrenteMensal * 12) * 0.05; // 5% do valor anual

    // 17. Lead Diamante (apenas para Diamante, R$500/mes)
    const leadDiamante = nivelContador === 'diamante' ? 500 : 0;

    // Totais
    const totalMensal = 
      recorrenteMensal + 
      overrideRecorrente + 
      bonusVolume + 
      leadDiamante;
    
    const totalUnico = 
      ativacao + 
      override1Pag + 
      bonusContador + 
      bonusProgressao;

    const totalAnual = (totalMensal * 12) + totalUnico + bonusLTV;

    return {
      // Ganhos diretos
      ativacao,
      recorrenteMensal,
      
      // Ganhos de rede
      override1Pag,
      overrideRecorrente,
      
      // Bonus de desempenho
      bonusContador,
      bonusProgressao,
      bonusVolume,
      bonusLTV,
      leadDiamante,
      
      // Totais
      totalMensal,
      totalUnico,
      totalAnual,
    };
  }, [numClientes, valorPlano, nivelContador, numContadoresRede, clientesPorContadorRede]);

  const nivelConfig = {
    bronze: { nome: 'Bronze', cor: 'text-orange-600', bgCor: 'bg-orange-100', minClientes: 0, maxClientes: 4 },
    prata: { nome: 'Prata', cor: 'text-gray-600', bgCor: 'bg-gray-100', minClientes: 5, maxClientes: 9 },
    ouro: { nome: 'Ouro', cor: 'text-yellow-600', bgCor: 'bg-yellow-100', minClientes: 10, maxClientes: 14 },
    diamante: { nome: 'Diamante', cor: 'text-blue-600', bgCor: 'bg-blue-100', minClientes: 15, maxClientes: Infinity },
  };

  // Detectar nivel recomendado baseado em clientes
  const detectarNivelRecomendado = (): typeof nivelContador => {
    const numClien = numClientes ? Number(numClientes) : 0;
    if (numClien >= 15) return 'diamante';
    if (numClien >= 10) return 'ouro';
    if (numClien >= 5) return 'prata';
    return 'bronze';
  };

  const nivelRecomendado = detectarNivelRecomendado();
  const nivelInfo = nivelConfig[nivelContador];
  const nivelRecomendadoInfo = nivelConfig[nivelRecomendado];
  
  // Verificar se ha discrepancia
  const temDiscrepancia = nivelContador !== nivelRecomendado;
  const contadoresAtualizado = numClientes ? Number(numClientes) : 0;

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0C1A2A]">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-white pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-300">Ferramentas</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#F4C430] flex items-center gap-2">
            <Calculator size={28} />
            Calculadora de Projeções
          </h1>
          <p className="text-sm mt-2 text-gray-200 max-w-2xl">
            Simule seus ganhos futuros com as 17 bonificações do programa.
            Ajuste os parâmetros e veja seu potencial de crescimento!
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
          {/* INPUTS - FLUTUANDO */}
          <Card className="bg-white border-0 shadow-md -mt-16">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-[#0C1A2A] flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Parâmetros da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna 1: Dados Diretos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                    Seus Clientes Diretos
                  </h3>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <Users className="h-4 w-4" />
                      Número de Clientes
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={numClientes}
                      onChange={(e) => setNumClientes(e.target.value)}
                      className="border-gray-300 bg-white [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantos clientes você planeja ter?
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <DollarSign className="h-4 w-4" />
                      Valor do Plano (R$)
                    </Label>
                    <select
                      value={valorPlano}
                      onChange={(e) => setValorPlano(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1] text-sm bg-white"
                    >
                      <option value={100}>Básico - R$ 100/mês</option>
                      <option value={130}>Profissional - R$ 130/mês</option>
                      <option value={180}>Premium - R$ 180/mês</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Plano médio dos seus clientes
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <Award className="h-4 w-4" />
                      Seu Nível Atual
                    </Label>
                    <select
                      value={nivelContador}
                      onChange={(e) => setNivelContador(e.target.value as typeof nivelContador)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1] text-sm bg-white"
                    >
                      <option value="bronze">Bronze (0+ clientes)</option>
                      <option value="prata">Prata (5+ clientes)</option>
                      <option value="ouro">Ouro (10+ clientes)</option>
                      <option value="diamante">Diamante (15+ clientes)</option>
                    </select>
                    
                    {/* Aviso de Discrepancia */}
                    {temDiscrepancia && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">
                          ⚠️ Nível Recomendado
                        </p>
                        <p className="text-xs text-yellow-700">
                          Com <strong>{contadoresAtualizado} clientes</strong>, você poderia ser{' '}
                          <span className={`font-bold ${nivelRecomendadoInfo.cor}`}>
                            {nivelRecomendadoInfo.nome}
                          </span>
                          {nivelContador !== nivelRecomendado && 
                            nivelContador === 'bronze' && nivelRecomendado !== 'bronze'
                            ? ' e ganhar mais!'
                            : !temDiscrepancia ? '' : '.'
                          }
                        </p>
                        <button
                          onClick={() => setNivelContador(nivelRecomendado)}
                          className="mt-2 text-xs font-medium text-yellow-700 hover:text-yellow-900 underline"
                        >
                          Atualizar para {nivelRecomendadoInfo.nome}
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Seu nível determina suas taxas de comissão
                    </p>
                  </div>
                </div>

                {/* Coluna 2: Dados de Rede */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                    Sua Rede de Contadores
                  </h3>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <Users className="h-4 w-4" />
                      Contadores Indicados
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      placeholder="0"
                      value={numContadoresRede}
                      onChange={(e) => setNumContadoresRede(e.target.value)}
                      className="border-gray-300 bg-white [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantos contadores você planeja indicar?
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Clientes por Contador (média)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      value={clientesPorContadorRede}
                      onChange={(e) => setClientesPorContadorRede(e.target.value)}
                      className="border-gray-300 bg-white [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      disabled={!numContadoresRede || Number(numContadoresRede) === 0}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Média de clientes por contador da sua rede
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">Como funciona?</p>
                        <p>
                          Você ganha <strong>override</strong> (comissão extra) sobre as vendas
                          dos contadores que você indicar. Quanto maior sua rede, maior seu ganho!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RESULTADOS - KPI CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800">Ganho Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold text-green-700">
                  {formatCurrency(projecao.totalMensal)}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Recorrente + Overrides + Bônus
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800">Ganho Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold text-blue-700">
                  {formatCurrency(projecao.totalAnual)}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  (Mensal x 12) + Único + LTV
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-800">Seu Nível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Award className={`h-12 w-12 ${nivelInfo.cor}`} />
                  <div>
                    <div className={`text-2xl font-bold ${nivelInfo.cor}`}>
                      {nivelInfo.nome}
                    </div>
                    <p className="text-xs text-purple-600">
                      {taxas[nivelContador].ativacao * 100}% de comissão
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* BREAKDOWN DETALHADO */}
          <Card className="bg-white border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif text-[#0C1A2A]">
                  Detalhamento das 17 Bonificações
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-[#6366F1]"
                >
                  {showBreakdown ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {showBreakdown && (
              <CardContent>
                <div className="space-y-4">
                  {/* Ganhos Diretos */}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 pb-2 border-b">
                      💰 Ganhos Diretos
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">#1 - Ativação</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(projecao.ativacao)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">#2-5 - Recorrente Mensal</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(projecao.recorrenteMensal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ganhos de Rede */}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 pb-2 border-b">
                      🌐 Ganhos de Rede (Override)
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                        <span className="text-sm text-gray-700">#6 - Override 1º Pagamento</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(projecao.override1Pag)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                        <span className="text-sm text-gray-700">#7-10 - Override Recorrente</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(projecao.overrideRecorrente)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                        <span className="text-sm text-gray-700">#11 - Bônus Indicação Contador</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(projecao.bonusContador)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bonus de Desempenho */}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 pb-2 border-b">
                      🏆 Bônus de Desempenho
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded">
                        <span className="text-sm text-gray-700">#12-14 - Bônus Progressão</span>
                        <span className="font-semibold text-purple-600">
                          {formatCurrency(projecao.bonusProgressao)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded">
                        <span className="text-sm text-gray-700">#15 - Bônus Volume</span>
                        <span className="font-semibold text-purple-600">
                          {formatCurrency(projecao.bonusVolume)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded">
                        <span className="text-sm text-gray-700">#16 - Bônus LTV</span>
                        <span className="font-semibold text-purple-600">
                          {formatCurrency(projecao.bonusLTV)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded">
                        <span className="text-sm text-gray-700">#17 - Lead Diamante</span>
                        <span className="font-semibold text-purple-600">
                          {formatCurrency(projecao.leadDiamante)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t-2">
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-white rounded-lg">
                      <span className="font-bold">TOTAL ANUAL</span>
                      <span className="text-2xl font-bold">
                        {formatCurrency(projecao.totalAnual)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* CTA FINAL */}
          <Card className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white border-0 shadow-lg">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-2">
                Pronto para alcançar esses números?
              </h3>
              <p className="text-blue-100 mb-6">
                Comece hoje mesmo a construir sua rede e aumentar seus ganhos!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="bg-white text-[#6366F1] hover:bg-gray-100 font-semibold"
                  size="lg"
                >
                  Ver Simulador de Crescimento
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  size="lg"
                >
                  Compartilhar Projeção
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Calculadora;

