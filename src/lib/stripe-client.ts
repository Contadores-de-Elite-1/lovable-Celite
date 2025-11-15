/**
 * Stripe Client - Frontend
 *
 * Cliente TypeScript para integração com Stripe
 * Gerencia checkout, assinaturas e portal do cliente
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para configuração do checkout
 */
export interface CheckoutConfig {
  contadorId: string;
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Interface para resposta do checkout
 */
export interface CheckoutResponse {
  success: boolean;
  session_id: string;
  url: string;
  customer_id: string;
}

/**
 * Classe principal do Stripe Client
 */
export class StripeClient {
  /**
   * Cria uma sessão de checkout do Stripe
   *
   * @param config - Configuração do checkout
   * @returns Promise com URL de redirecionamento
   */
  static async createCheckoutSession(
    config: CheckoutConfig
  ): Promise<CheckoutResponse> {
    const {
      contadorId,
      priceId,
      successUrl = `${window.location.origin}/dashboard?checkout=success`,
      cancelUrl = `${window.location.origin}/pagamentos?checkout=cancel`,
    } = config;

    console.log('[STRIPE_CLIENT] Creating checkout session...');
    console.log('[STRIPE_CLIENT] Contador ID:', contadorId);

    try {
      // Chamar edge function create-checkout-session
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            contador_id: contadorId,
            price_id: priceId,
            success_url: successUrl,
            cancel_url: cancelUrl,
          },
        }
      );

      if (error) {
        console.error('[STRIPE_CLIENT] Error creating checkout:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data || !data.url) {
        throw new Error('No checkout URL returned');
      }

      console.log('[STRIPE_CLIENT] Checkout session created:', data.session_id);
      return data;
    } catch (error) {
      console.error('[STRIPE_CLIENT] Checkout error:', error);
      throw error;
    }
  }

  /**
   * Redireciona para checkout do Stripe
   *
   * @param config - Configuração do checkout
   */
  static async redirectToCheckout(config: CheckoutConfig): Promise<void> {
    try {
      const checkout = await this.createCheckoutSession(config);

      console.log('[STRIPE_CLIENT] Redirecting to:', checkout.url);

      // Redirecionar para o Stripe Checkout
      window.location.href = checkout.url;
    } catch (error) {
      console.error('[STRIPE_CLIENT] Redirect error:', error);
      throw error;
    }
  }

  /**
   * Busca o status da assinatura do contador
   *
   * @param contadorId - ID do contador
   * @returns Status da assinatura
   */
  static async getSubscriptionStatus(contadorId: string) {
    try {
      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('stripe_subscription_id, stripe_customer_id, status, plano')
        .eq('contador_id', contadorId)
        .not('stripe_subscription_id', 'is', null)
        .maybeSingle();

      if (error) {
        console.error('[STRIPE_CLIENT] Error fetching subscription:', error);
        return null;
      }

      return cliente;
    } catch (error) {
      console.error('[STRIPE_CLIENT] Get subscription error:', error);
      return null;
    }
  }

  /**
   * Verifica se o contador tem assinatura ativa
   *
   * @param contadorId - ID do contador
   * @returns true se tem assinatura ativa
   */
  static async hasActiveSubscription(contadorId: string): Promise<boolean> {
    const subscription = await this.getSubscriptionStatus(contadorId);
    return subscription?.status === 'ativo';
  }

  /**
   * Busca URL do portal do cliente (gerenciar assinatura)
   * Nota: Requer implementação de edge function adicional
   *
   * @param customerId - ID do cliente no Stripe
   * @returns URL do portal
   */
  static async getCustomerPortalUrl(customerId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-customer-portal-session',
        {
          body: {
            customer_id: customerId,
            return_url: window.location.origin + '/pagamentos',
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to create portal session');
      }

      return data.url;
    } catch (error) {
      console.error('[STRIPE_CLIENT] Portal error:', error);
      throw error;
    }
  }
}

/**
 * Hook React para usar Stripe Client
 * Uso:
 *
 * const { createCheckout, loading, error } = useStripeCheckout();
 *
 * const handleSubscribe = async () => {
 *   await createCheckout({ contadorId: '...' });
 * };
 */
export function useStripeCheckout() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createCheckout = async (config: CheckoutConfig) => {
    setLoading(true);
    setError(null);

    try {
      await StripeClient.redirectToCheckout(config);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create checkout';
      setError(errorMessage);
      console.error('[useStripeCheckout] Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createCheckout, loading, error };
}

// React import (será resolvido pelo bundler)
import React from 'react';

export default StripeClient;
