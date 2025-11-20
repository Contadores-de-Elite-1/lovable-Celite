import React, { ReactNode } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import { motion } from 'framer-motion';

interface OnboardingLayoutProps {
  children: ReactNode;
  progresso: number;
  etapaAtual: number;
  totalEtapas: number;
  contadorLogo?: string;
  contadorCorPrimaria?: string;
  contadorNome?: string;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  progresso,
  etapaAtual,
  totalEtapas,
  contadorLogo,
  contadorCorPrimaria = '#6366F1',
  contadorNome,
}) => {
  return (
    <div
      className="min-h-screen bg-[#F5F6F8] flex flex-col"
      style={{
        background: `linear-gradient(135deg, rgba(12, 26, 42, 0.02) 0%, rgba(26, 47, 71, 0.01) 50%, #F5F6F8 100%)`,
      }}
    >
      {/* Progress Bar */}
      <ProgressBar
        progresso={progresso}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        corPrimaria={contadorCorPrimaria}
      />

      {/* Header - Com logo do contador */}
      <div className="bg-white border-b py-4 px-4" style={{ borderBottomColor: `${contadorCorPrimaria}20` }}>
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
          {contadorLogo && (
            <img 
              src={contadorLogo} 
              alt={contadorNome}
              className="h-8 object-contain"
            />
          )}
          <h2 className="text-lg font-semibold" style={{ color: contadorCorPrimaria }}>
            {contadorNome || 'Lovable-Celite'}
          </h2>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-3 px-4 text-center" style={{ borderTopColor: `${contadorCorPrimaria}20` }}>
        <p className="text-xs text-gray-500">
          {contadorNome || 'Lovable-Celite'} © 2025 | Todos os dados são seguros e criptografados
        </p>
      </footer>
    </div>
  );
};

