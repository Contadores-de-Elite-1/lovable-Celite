import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { CarrosselFotos } from '@/components/CarrosselFotos';
import { fotosEspaco } from '@/data/fotosEspaco';

interface Plano {
  id: 'basico' | 'profissional' | 'premium';
  nome: string;
  preco: number;
  features: string[];
  recomendado?: boolean;
}

interface PlanSelectionProps {
  corPrimaria: string;
  corSecundaria?: string;
  onPlanoSelecionado: (
    plano: 'basico' | 'profissional' | 'premium'
  ) => void;
  onVoltar: () => void;
  planoAtual?: 'basico' | 'profissional' | 'premium' | null;
}

const PLANOS: Plano[] = [
  {
    id: 'basico',
    nome: 'Plano PRO',
    preco: 110,
    features: [
      'Endereço comercial e fiscal completo',
      'Recebimento ilimitado de correspondências',
      'Atendimento telefônico profissional',
      'Recepção de clientes e visitantes',
      'Desconto especial na locação de salas',
    ],
  },
  {
    id: 'profissional',
    nome: 'Plano PREMIUM',
    preco: 130,
    recomendado: true,
    features: [
      'Todos os benefícios do Plano PRO',
      '2 horas mensais em sala executiva',
      'Sala para até 4 pessoas',
      'Horas não-cumulativas',
      'Desconto especial na locação de salas',
    ],
  },
  {
    id: 'premium',
    nome: 'Plano TOP',
    preco: 180,
    features: [
      'Todos os benefícios do Plano PRO',
      '5 horas mensais em sala executiva',
      'Sala para até 4 pessoas',
      'Horas não-cumulativas',
      'Desconto especial na locação de salas',
    ],
  },
];

export const PlanSelection: React.FC<PlanSelectionProps> = ({
  corPrimaria,
  corSecundaria = '#D4AF37',
  onPlanoSelecionado,
  onVoltar,
  planoAtual,
}) => {
  const [planoSelecionado, setPlanoSelecionado] = useState<
    'basico' | 'profissional' | 'premium' | null
  >(planoAtual || null);

  const handleContinuar = () => {
    if (planoSelecionado) {
      onPlanoSelecionado(planoSelecionado);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold" style={{ color: corPrimaria }}>
          Escolha seu plano
        </h2>
        <p className="text-gray-600">
          Primeiro pagamento no ato do contrato
        </p>
      </div>

      {/* Cards de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANOS.map((plano) => (
          <motion.div
            key={plano.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPlanoSelecionado(plano.id)}
            className={`relative p-6 rounded-xl cursor-pointer border-2 transition-all ${
              planoSelecionado === plano.id
                ? 'border-[' + corPrimaria + '] bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            style={
              planoSelecionado === plano.id
                ? {
                    borderColor: corPrimaria || '#D4AF37',
                    backgroundColor: `${corPrimaria || '#D4AF37'}08`,
                  }
                : {}
            }
          >
            {/* Badge Recomendado */}
            {plano.recomendado && (
              <div
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full shadow-lg"
                style={{ backgroundColor: corSecundaria, color: corPrimaria }}
              >
                ⭐ Recomendado
              </div>
            )}

            {/* Checkbox */}
            <div
              className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center"
              style={
                planoSelecionado === plano.id
                  ? {
                      borderColor: corPrimaria,
                      backgroundColor: corPrimaria,
                    }
                  : { borderColor: '#d1d5db' }
              }
            >
              {planoSelecionado === plano.id && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Nome e Preço */}
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {plano.nome}
            </h3>

            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">
                R$ {plano.preco}
              </span>
              <span className="text-gray-600 text-sm">/mês</span>
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {plano.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span
                    className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: corPrimaria }}
                  />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Galeria de Imagens dos Serviços */}
      {fotosEspaco && fotosEspaco.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
            Nossos Serviços em Imagens
          </h3>
          <CarrosselFotos fotos={fotosEspaco} />
        </div>
      )}

      {/* Informação */}
      <div 
        className="rounded-lg p-4 text-sm"
        style={{
          background: `linear-gradient(135deg, rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.08) 0%, rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.08) 100%)`,
          border: `1px solid rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.15)`,
          color: corPrimaria,
        }}
      >
        <p>
          💡 <strong>Dica:</strong> Todos os planos incluem endereço comercial completo,
          recebimento de correspondências e atendimento telefônico profissional.
          Escolha o plano que melhor atende às suas necessidades de uso de salas.
        </p>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onVoltar}
          className="flex-1 py-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={handleContinuar}
          disabled={!planoSelecionado}
          className="flex-1 py-6 font-medium"
          style={
            planoSelecionado
              ? { backgroundColor: corPrimaria }
              : { opacity: 0.5 }
          }
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

