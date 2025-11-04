import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Award, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [contador, setContador] = useState<any>(null);
  const [stats, setStats] = useState({
    clientes: 0,
    comissoes: 0,
    xp: 0,
    nivel: 'bronze'
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: contadorData } = await supabase
      .from('contadores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (contadorData) {
      setContador(contadorData);
      
      // Buscar comissões do mês atual
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const primeiroDiaMesFormatado = primeiroDiaMes.toISOString().split('T')[0];
      
      const { data: comissoesData } = await supabase
        .from('comissoes')
        .select('valor, status')
        .eq('contador_id', contadorData.id)
        .gte('competencia', primeiroDiaMesFormatado);
      
      const totalComissoes = comissoesData?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
      
      setStats({
        clientes: contadorData.clientes_ativos,
        comissoes: totalComissoes,
        xp: contadorData.xp,
        nivel: contadorData.nivel
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-navy text-white p-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold">Contadores de Elite</h1>
          <Button variant="outline" onClick={handleLogout} className="border-white text-white hover:bg-white hover:text-brand-navy">
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Bem-vindo, {contador?.user_id || 'Contador'}!
              </h2>
              <p className="text-muted-foreground">Nível: <span className="text-brand-gold capitalize font-semibold">{stats.nivel}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <Users className="h-4 w-4 text-brand-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">{stats.clientes}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de clientes ativos</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Comissões</CardTitle>
                <DollarSign className="h-4 w-4 text-brand-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">R$ {stats.comissoes.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Experiência</CardTitle>
                <Award className="h-4 w-4 text-brand-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">{stats.xp}</div>
                <p className="text-xs text-muted-foreground mt-1">Pontos XP acumulados</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
                <TrendingUp className="h-4 w-4 text-brand-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">+0%</div>
                <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-brand-navy">Primeiros Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Bem-vindo ao Programa Contadores de Elite! Complete seu perfil e comece a indicar clientes.
              </p>
              <div className="grid gap-2">
                <Button className="bg-brand-navy hover:bg-brand-gold hover:text-brand-navy" onClick={() => navigate('/links')}>
                  Gerar Link de Indicação
                </Button>
                <Button variant="outline" className="border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white" onClick={() => navigate('/simulador')}>
                  Ver Simulador de Crescimento
                </Button>
                <Button variant="outline" className="border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white" onClick={() => navigate('/comissoes')}>
                  Ver Minhas Comissões
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
