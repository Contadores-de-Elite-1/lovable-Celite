import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, Users, Award } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-gold/10 rounded-full mb-6">
            <Crown className="w-10 h-10 text-brand-gold" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-brand-navy">
            Programa <span className="text-brand-gold">Contadores de Elite</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Faça parte de um programa exclusivo de indicações com comissões automáticas, 
            bonificações progressivas e acompanhamento em tempo real.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <TrendingUp className="w-12 h-12 text-brand-gold mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-navy">Comissões Automáticas</h3>
              <p className="text-gray-600">
                Receba de 15% a 20% sobre clientes diretos e 3% a 5% de override na rede
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <Users className="w-12 h-12 text-brand-gold mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-navy">Construa sua Rede</h3>
              <p className="text-gray-600">
                Indique outros contadores e ganhe com a performance da rede
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <Award className="w-12 h-12 text-brand-gold mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-navy">Bonificações Progressivas</h3>
              <p className="text-gray-600">
                Bônus de ativação, progressão e LTV com pagamentos via PIX
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy text-lg px-8 py-6 font-semibold"
            >
              Começar Agora
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white text-lg px-8 py-6 font-semibold"
            >
              Acessar Dashboard
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-16">
            Lovable-Celite © 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
