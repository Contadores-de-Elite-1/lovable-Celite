import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, Users, Award } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-burgundy to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary/20 rounded-full mb-6">
            <Crown className="w-10 h-10 text-secondary" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold">
            Programa <span className="text-secondary">Contadores de Elite</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Faça parte de um programa exclusivo de indicações com comissões automáticas, 
            bonificações progressivas e acompanhamento em tempo real.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-secondary/20"
            >
              <TrendingUp className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2">Comissões Automáticas</h3>
              <p className="text-gray-300">
                Receba de 15% a 20% sobre clientes diretos e 3% a 5% de override na rede
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-secondary/20"
            >
              <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2">Construa sua Rede</h3>
              <p className="text-gray-300">
                Indique outros contadores e ganhe com a performance da rede
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-secondary/20"
            >
              <Award className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2">Bonificações Progressivas</h3>
              <p className="text-gray-300">
                Bônus de ativação, progressão e LTV com pagamentos via PIX
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-secondary hover:bg-secondary/90 text-primary text-lg px-8 py-6"
            >
              Começar Agora
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="bg-transparent border-secondary text-secondary hover:bg-secondary hover:text-primary text-lg px-8 py-6"
            >
              Acessar Dashboard
            </Button>
          </div>

          <p className="text-sm text-gray-400 mt-16">
            Powered by <span className="text-secondary">Top Class Escritório Virtual</span> • Aracaju/SE
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
