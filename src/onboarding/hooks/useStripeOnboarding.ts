import { useState, useCallback } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface UseStripeOnboardingReturn {
  stripe: Stripe | null;
  loading: boolean;
  error: string | null;
  createPaymentIntent: (
    valorPlano: number,
    email: string,
    nomeEmpresa: string,
    contadorId: string
  ) => Promise<string | null>;
  processPayment: (
    clientSecret: string,
    paymentMethodId: string
  ) => Promise<boolean>;
}

// Valor líquido após taxa Stripe (2.9% + R$0.30)
export const calcularValorLiquido = (valorBruto: number): number => {
  const stripeFee = valorBruto * 0.029 + 0.30;
  return valorBruto - stripeFee;
};

// Comissão do contador (15% sobre valor líquido)
export const calcularComissaoContador = (valorBruto: number): number => {
  const valorLiquido = calcularValorLiquido(valorBruto);
  return valorLiquido * 0.15;
};

export const useStripeOnboarding = (): UseStripeOnboardingReturn => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar Stripe
  if (!stripe && typeof window !== 'undefined') {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      setError('Stripe key não configurada');
      setLoading(false);
    } else {
      loadStripe(stripeKey)
        .then((stripeInstance) => {
          setStripe(stripeInstance);
          setLoading(false);
        })
        .catch((err) => {
          setError(`Erro ao carregar Stripe: ${err.message}`);
          setLoading(false);
        });
    }
  }

  const createPaymentIntent = useCallback(
    async (
      valorPlano: number,
      email: string,
      nomeEmpresa: string,
      contadorId: string
    ): Promise<string | null> => {
      try {
        const response = await fetch('/api/onboarding/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valorPlano,
            email,
            nomeEmpresa,
            contadorId,
            valorLiquido: calcularValorLiquido(valorPlano),
            comissaoContador: calcularComissaoContador(valorPlano),
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar payment intent');
        }

        const data = await response.json();
        return data.clientSecret || null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro desconhecido'
        );
        return null;
      }
    },
    []
  );

  const processPayment = useCallback(
    async (clientSecret: string, paymentMethodId: string): Promise<boolean> => {
      if (!stripe) {
        setError('Stripe não inicializado');
        return false;
      }

      try {
        // Confirmar pagamento com Stripe
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentMethodId,
        });

        if (result.error) {
          setError(result.error.message || 'Erro no pagamento');
          return false;
        }

        if (result.paymentIntent?.status === 'succeeded') {
          return true;
        }

        setError('Pagamento não foi processado');
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        return false;
      }
    },
    [stripe]
  );

  return {
    stripe,
    loading,
    error,
    createPaymentIntent,
    processPayment,
  };
};

