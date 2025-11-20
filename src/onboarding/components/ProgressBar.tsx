import React from 'react';

interface ProgressBarProps {
  progresso: number; // 0-100
  etapaAtual: number; // 0-5
  totalEtapas: number; // 6
  corPrimaria?: string;
}

const NOMES_ETAPAS = [
  'Boas-vindas',
  'Plano',
  'Dados',
  'Contrato',
  'Pagamento',
  'Confirmação',
];

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progresso,
  etapaAtual,
  totalEtapas,
  corPrimaria = '#6366F1',
}) => {
  return (
    <div className="w-full bg-white border-b sticky top-0 z-10">
      {/* Barra de progresso visual */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progresso}%`, backgroundColor: corPrimaria }}
        />
      </div>

      {/* Etapas com números */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">
            Etapa {etapaAtual + 1} de {totalEtapas}
          </span>
          <span className="text-xs font-medium text-gray-600">
            {progresso}% completo
          </span>
        </div>

        {/* Indicadores de etapas */}
        <div className="flex gap-1 justify-between">
          {Array.from({ length: totalEtapas }).map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full transition-all ${
                index < etapaAtual + 1
                  ? 'opacity-100'
                  : 'opacity-30'
              }`}
              style={{
                backgroundColor: corPrimaria,
              }}
              title={NOMES_ETAPAS[index]}
            />
          ))}
        </div>

        {/* Nome da etapa atual */}
        <p className="text-xs text-gray-500 mt-2">
          {NOMES_ETAPAS[etapaAtual]}
        </p>
      </div>
    </div>
  );
};

