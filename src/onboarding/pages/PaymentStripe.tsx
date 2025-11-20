import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

interface PaymentStripeProps {
  corPrimaria: string;
  corSecundaria?: string;
  plano: string;
  valorPlano: number;
  nomeCliente: string;
  email: string;
  onContinuar: () => void;
  onVoltar: () => void;
}

export const PaymentStripe: React.FC<PaymentStripeProps> = ({
  corPrimaria,
  corSecundaria = '#D4AF37',
  plano,
  valorPlano,
  nomeCliente,
  email,
  onContinuar,
  onVoltar,
}) => {
  const [processando, setProcessando] = useState(false);

  const handlePagamento = async () => {
    setProcessando(true);

    // TODO: Integrar com Stripe Checkout real
    // Simulando processamento
    setTimeout(() => {
      setProcessando(false);
      onContinuar();
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
      {/* Título */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CreditCard className="w-6 h-6" style={{ color: corPrimaria }} />
          <h2 className="text-2xl font-bold" style={{ color: corPrimaria }}>
            Pagamento Seguro
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Complete seu cadastro com o pagamento via Stripe
        </p>
      </div>

      {/* Resumo do Pedido */}
      <div 
        className="rounded-xl p-6 space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(12, 26, 42, 0.1) 0%, rgba(26, 47, 71, 0.15) 100%)',
          border: '1px solid rgba(12, 26, 42, 0.2)',
        }}
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" style={{ color: corPrimaria }} />
          Resumo do Pedido
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium">{nomeCliente}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Plano:</span>
            <span className="font-medium">{plano}</span>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-semibold">Total Mensal:</span>
              <span className="text-2xl font-bold" style={{ color: corPrimaria }}>
                R$ {valorPlano.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cobrança recorrente mensal via Stripe
            </p>
          </div>
        </div>
      </div>

      {/* Benefícios */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 text-sm">
          O que está incluído:
        </h4>
        <ul className="space-y-2">
          {[
            '30 dias de teste gratuito',
            'Acesso completo ao portal',
            'Suporte prioritário',
            'Cancele quando quiser',
          ].map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corPrimaria }} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Segurança */}
      <div 
        className="rounded-lg p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
        }}
      >
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0C1A2A' }} />
          <div className="space-y-1">
            <p className="text-sm font-medium" style={{ color: '#0C1A2A' }}>
              Pagamento 100% Seguro
            </p>
            <p className="text-xs" style={{ color: 'rgba(12, 26, 42, 0.8)' }}>
              Seus dados de pagamento são criptografados e processados pelo Stripe,
              líder mundial em pagamentos online. Não armazenamos informações de cartão.
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Logo */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500 mb-2">Pagamento processado por</p>
        <div className="flex items-center justify-center gap-2">
          <svg
            className="h-6"
            viewBox="0 0 60 25"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#635BFF"
              d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z"
            />
          </svg>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onVoltar}
          disabled={processando}
          className="flex-1 py-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handlePagamento}
          disabled={processando}
          className="flex-1 py-6 font-medium"
          style={{ backgroundColor: corPrimaria }}
        >
          {processando ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processando...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Pagar R$ {valorPlano.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      {/* Nota de rodapé */}
      <p className="text-xs text-center text-gray-500">
        Ao clicar em "Pagar", você será redirecionado para o Stripe Checkout seguro
      </p>
    </div>
  );
};

