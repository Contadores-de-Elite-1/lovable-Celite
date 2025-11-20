import { useState, useCallback } from 'react';

export interface OnboardingData {
  // Dados do contador (obtidos via URL)
  contadorId: string;
  contadorNome: string;
  contadorLogo: string;
  contadorCorPrimaria: string;
  contadorCorSecundaria: string;

  // Plano selecionado
  planoSelecionado: 'basico' | 'profissional' | 'premium' | null;

  // Dados do cliente
  nomeEmpresa: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: {
    rua: string;
    numero: string;
    cidade: string;
    estado: string;
    cep: string;
  };

  // Documentos
  documentos: {
    contratoSocial: File | null;
    certidao: File | null;
    comprovanteMoradia: File | null;
  };

  // Assinatura
  assinatura: string | null; // Base64 do canvas

  // Pagamento
  stripePaymentIntentId: string | null;
  statusPagamento: 'pendente' | 'processando' | 'aprovado' | 'falhou' | null;
}

interface UseOnboardingReturn {
  data: OnboardingData;
  etapaAtual: number;
  totalEtapas: number;
  atualizarDados: (novosDados: Partial<OnboardingData>) => void;
  proximaEtapa: () => void;
  etapaAnterior: () => void;
  irParaEtapa: (etapa: number) => void;
  resetar: () => void;
  progresso: number;
}

const ETAPAS = [
  'welcome',
  'planSelection',
  'dataUpload',
  'contractSignature',
  'paymentStripe',
  'success',
];

const DADOS_INICIAIS: OnboardingData = {
  contadorId: '',
  contadorNome: '',
  contadorLogo: '',
  contadorCorPrimaria: '#6366F1',
  contadorCorSecundaria: '#4F46E5',
  planoSelecionado: null,
  nomeEmpresa: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: {
    rua: '',
    numero: '',
    cidade: '',
    estado: '',
    cep: '',
  },
  documentos: {
    contratoSocial: null,
    certidao: null,
    comprovanteMoradia: null,
  },
  assinatura: null,
  stripePaymentIntentId: null,
  statusPagamento: null,
};

export const useOnboarding = (contadorId: string): UseOnboardingReturn => {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    ...DADOS_INICIAIS,
    contadorId,
  });

  const atualizarDados = useCallback((novosDados: Partial<OnboardingData>) => {
    setData((prev) => ({
      ...prev,
      ...novosDados,
    }));
  }, []);

  const proximaEtapa = useCallback(() => {
    setEtapaAtual((prev) => Math.min(prev + 1, ETAPAS.length - 1));
  }, []);

  const etapaAnterior = useCallback(() => {
    setEtapaAtual((prev) => Math.max(prev - 1, 0));
  }, []);

  const irParaEtapa = useCallback((etapa: number) => {
    setEtapaAtual(Math.max(0, Math.min(etapa, ETAPAS.length - 1)));
  }, []);

  const resetar = useCallback(() => {
    setEtapaAtual(0);
    setData({
      ...DADOS_INICIAIS,
      contadorId,
    });
  }, [contadorId]);

  const progresso = Math.round(((etapaAtual + 1) / ETAPAS.length) * 100);

  return {
    data,
    etapaAtual,
    totalEtapas: ETAPAS.length,
    atualizarDados,
    proximaEtapa,
    etapaAnterior,
    irParaEtapa,
    resetar,
    progresso,
  };
};

