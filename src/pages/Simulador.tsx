import { useState } from 'react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const Simulador = () => {
  useScrollToTop();
  const [clientesMes, setClientesMes] = useState(5);
  const [contadoresMes, setContadoresMes] = useState(2);
  const [clientesPorContador, setClientesPorContador] = useState(3);
  const [valorMensalidade, setValorMensalidade] = useState(299);

  const calcularProjecao = (taxaConversao: number) => {
    const meses = 12;
    let totalClientes = 0;
    let totalContadores = 0;
    let receitaMensal = 0;

    for (let mes = 1; mes <= meses; mes++) {
      const novosClientes = clientesMes * taxaConversao;
      const novosContadores = contadoresMes * taxaConversao;
      
      totalClientes += novosClientes;
      totalContadores += novosContadores;
      
      const clientesRedeN1 = totalContadores * clientesPorContador;
      const clientesRedeN2 = totalContadores * (contadoresMes * clientesPorContador);
      
      const comissoesDiretas = totalClientes * valorMensalidade * 0.20;
      const comissoesN1 = clientesRedeN1 * valorMensalidade * 0.05;
      const comissoesN2 = clientesRedeN2 * valorMensalidade * 0.02;
      
      receitaMensal = comissoesDiretas + comissoesN1 + comissoesN2;
    }

    return {
      totalClientes: Math.floor(totalClientes),
      totalContadores: Math.floor(totalContadores),
      receitaMensal: receitaMensal.toFixed(2)
    };
  };

  const conservador = calcularProjecao(0.7);
  const realista = calcularProjecao(0.85);
  const otimista = calcularProjecao(1.0);

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER NO MESMO ESTILO DE COMISSÕES */}
      <header className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#F4C430]">
            Simulador de Crescimento
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Projete seus ganhos com clientes, rede de contadores e comissões mensais.
          </p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif">Seus Números</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Novos Clientes por Mês: {clientesMes}</Label>
                <Slider
                  value={[clientesMes]}
                  onValueChange={(v) => setClientesMes(v[0])}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Novos Contadores por Mês: {contadoresMes}</Label>
                <Slider
                  value={[contadoresMes]}
                  onValueChange={(v) => setContadoresMes(v[0])}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Clientes por Contador: {clientesPorContador}</Label>
                <Slider
                  value={[clientesPorContador]}
                  onValueChange={(v) => setClientesPorContador(v[0])}
                  min={1}
                  max={15}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor da Mensalidade: R$ {valorMensalidade}</Label>
                <Slider
                  value={[valorMensalidade]}
                  onValueChange={(v) => setValorMensalidade(v[0])}
                  min={99}
                  max={999}
                  step={10}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-center">
                  Cenário Conservador (70%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Clientes</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {conservador.totalClientes}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Contadores</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {conservador.totalContadores}
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Receita Mensal</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    R$ {conservador.receitaMensal}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border ring-2 ring-primary">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-center">
                  Cenário Realista (85%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Clientes</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {realista.totalClientes}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Contadores</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {realista.totalContadores}
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Receita Mensal</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    R$ {realista.receitaMensal}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-center">
                  Cenário Otimista (100%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Clientes</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {otimista.totalClientes}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Contadores</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {otimista.totalContadores}
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Receita Mensal</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    R$ {otimista.receitaMensal}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Simulador;
