import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, Users, Award } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-elite-navy via-elite-navy-mid to-elite-navy">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-elite-gold/20 rounded-full mb-6 border-2 border-elite-gold/30">
            <Crown className="w-10 h-10 text-elite-gold" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white">
            Programa <span className="text-elite-gold">Contadores de Elite</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-elite-gold-dark max-w-3xl mx-auto">
            Faça parte de um programa exclusivo de indicações com comissões automáticas, 
            bonificações progressivas e acompanhamento em tempo real.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border-2 border-elite-gold/30 shadow-lg hover:shadow-xl hover:border-elite-gold/50 transition-all"
            >
              <div className="w-12 h-12 bg-elite-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-elite-gold" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-2 text-elite-navy">Comissões Automáticas</h3>
              <p className="text-elite-navy-mid">
                Receba de 15% a 20% sobre clientes diretos e 3% a 5% de override na rede
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border-2 border-elite-gold/30 shadow-lg hover:shadow-xl hover:border-elite-gold/50 transition-all"
            >
              <div className="w-12 h-12 bg-elite-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-elite-gold" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-2 text-elite-navy">Construa sua Rede</h3>
              <p className="text-elite-navy-mid">
                Indique outros contadores e ganhe com a performance da rede
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border-2 border-elite-gold/30 shadow-lg hover:shadow-xl hover:border-elite-gold/50 transition-all"
            >
              <div className="w-12 h-12 bg-elite-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-elite-gold" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-2 text-elite-navy">Bonificações Progressivas</h3>
              <p className="text-elite-navy-mid">
                Bônus de ativação, progressão e LTV com pagamentos via PIX
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-elite-gold hover:bg-elite-gold-dark text-elite-navy text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Começar Agora
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-2 border-elite-gold text-elite-gold hover:bg-elite-gold hover:text-elite-navy text-lg px-8 py-6 font-semibold transition-all"
            >
              Acessar Dashboard
            </Button>
          </div>

          <p className="text-sm text-elite-gold-dark/70 mt-16">
            Lovable-Celite © 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
