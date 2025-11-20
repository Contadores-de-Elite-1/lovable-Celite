// Cliente Stripe centralizado para Edge Functions
// Singleton pattern para reutilizar conexao

import Stripe from 'https://esm.sh/stripe@14.21.0';
import { logError } from './logger.ts';

let stripeClient: Stripe | null = null;

/**
 * Obtem instancia do cliente Stripe
 * 
 * Singleton: cria uma vez e reutiliza em todas as chamadas
 * 
 * @returns Instancia do Stripe ou null se nao configurado
 */
export function getStripeClient(): Stripe | null {
  // Se ja existe, retorna
  if (stripeClient) {
    return stripeClient;
  }

  // Busca secret key do ambiente
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');

  // Se nao tiver configurado, retorna null
  if (!secretKey) {
    logError('STRIPE_SECRET_KEY nao configurado', {
      hint: 'Configure a variavel de ambiente STRIPE_SECRET_KEY no Supabase'
    });
    return null;
  }

  // Valida formato da chave (deve comecar com sk_)
  if (!secretKey.startsWith('sk_')) {
    logError('STRIPE_SECRET_KEY em formato invalido', {
      hint: 'A chave deve comecar com sk_test_ (sandbox) ou sk_live_ (producao)'
    });
    return null;
  }

  // Cria instancia do Stripe
  try {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      // Configuracao adicional se necessario
      typescript: true,
    });

    return stripeClient;
  } catch (error) {
    logError('Erro ao criar cliente Stripe', {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return null;
  }
}

/**
 * Valida se Stripe esta configurado corretamente
 * 
 * @returns true se configurado, false caso contrario
 */
export function isStripeConfigured(): boolean {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  return !!secretKey && secretKey.startsWith('sk_');
}

/**
 * Obtem webhook secret do ambiente
 * 
 * @returns Webhook secret ou null
 */
export function getStripeWebhookSecret(): string | null {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    logError('STRIPE_WEBHOOK_SECRET nao configurado', {
      hint: 'Configure a variavel de ambiente STRIPE_WEBHOOK_SECRET no Supabase'
    });
    return null;
  }

  // Valida formato (deve comecar com whsec_)
  if (!webhookSecret.startsWith('whsec_')) {
    logError('STRIPE_WEBHOOK_SECRET em formato invalido', {
      hint: 'A chave deve comecar com whsec_'
    });
    return null;
  }

  return webhookSecret;
}

/**
 * Obtem Stripe Connect Client ID do ambiente
 * 
 * @returns Client ID ou null
 */
export function getStripeConnectClientId(): string | null {
  const clientId = Deno.env.get('STRIPE_CONNECT_CLIENT_ID');
  
  if (!clientId) {
    logError('STRIPE_CONNECT_CLIENT_ID nao configurado', {
      hint: 'Configure a variavel de ambiente STRIPE_CONNECT_CLIENT_ID no Supabase'
    });
    return null;
  }

  // Valida formato (deve comecar com ca_)
  if (!clientId.startsWith('ca_')) {
    logError('STRIPE_CONNECT_CLIENT_ID em formato invalido', {
      hint: 'A chave deve comecar com ca_'
    });
    return null;
  }

  return clientId;
}

/**
 * Obtem Price IDs dos planos do ambiente
 * 
 * @returns Objeto com Price IDs ou null se nao configurado
 */
export function getStripePriceIds(): {
  pro: string;
  premium: string;
  top: string;
} | null {
  const pro = Deno.env.get('STRIPE_PRICE_PRO');
  const premium = Deno.env.get('STRIPE_PRICE_PREMIUM');
  const top = Deno.env.get('STRIPE_PRICE_TOP');

  if (!pro || !premium || !top) {
    logError('Price IDs nao configurados', {
      hint: 'Configure STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM e STRIPE_PRICE_TOP no Supabase'
    });
    return null;
  }

  return { pro, premium, top };
}
