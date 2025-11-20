import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { z } from 'https://esm.sh/zod@3.22.4';
import { logError, logInfo } from '../_shared/logger.ts';
import { getStripeClient, getStripeConnectClientId } from '../_shared/stripe.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Schema de validacao para o request
const RequestSchema = z.object({
  contador_id: z.string().uuid('contador_id deve ser um UUID valido'),
  redirect_url: z.string().url('redirect_url deve ser uma URL valida'),
});

type RequestBody = z.infer<typeof RequestSchema>;

/**
 * Edge Function: Gerar link de onboarding do Stripe Connect Express
 * 
 * Permite que contadores se conectem ao Stripe para receber pagamentos diretos.
 * 
 * Input:
 * {
 *   "contador_id": "uuid-do-contador",
 *   "redirect_url": "https://seu-app.com/callback-stripe-connect"
 * }
 * 
 * Output (sucesso):
 * {
 *   "success": true,
 *   "url": "https://connect.stripe.com/express/...",
 *   "message": "Link gerado com sucesso"
 * }
 * 
 * Output (erro):
 * {
 *   "error": "Mensagem de erro",
 *   "code": "ERROR_CODE"
 * }
 */
Deno.serve(async (req) => {
  // Apenas POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Obtem cliente Stripe
    const stripe = getStripeClient();
    if (!stripe) {
      logError('Stripe nao configurado');
      return new Response(
        JSON.stringify({
          error: 'Stripe nao configurado. Configure STRIPE_SECRET_KEY no Supabase Secrets.',
          code: 'STRIPE_NOT_CONFIGURED'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtem Connect Client ID
    const clientId = getStripeConnectClientId();
    if (!clientId) {
      logError('Stripe Connect Client ID nao configurado');
      return new Response(
        JSON.stringify({
          error: 'Stripe Connect nao configurado.',
          code: 'CONNECT_NOT_CONFIGURED'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse e valida o request
    let body: RequestBody;
    try {
      const rawBody = await req.json();
      body = RequestSchema.parse(rawBody);
    } catch (error) {
      logError('Erro ao validar request', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return new Response(
        JSON.stringify({
          error: 'Dados invalidos no request',
          code: 'INVALID_REQUEST'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Busca contador no banco
    const { data: contador, error: fetchError } = await supabase
      .from('contadores')
      .select('id, nome, email, stripe_account_id')
      .eq('id', body.contador_id)
      .single();

    if (fetchError || !contador) {
      logError('Contador nao encontrado', {
        contador_id: body.contador_id,
        error: fetchError?.message
      });
      return new Response(
        JSON.stringify({
          error: 'Contador nao encontrado',
          code: 'CONTADOR_NOT_FOUND'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Se contador ja tem Stripe Connect ativado, retorna o account ID
    if (contador.stripe_account_id) {
      logInfo('Contador ja tem Stripe Connect ativado', {
        contador_id: contador.id,
        stripe_account_id: contador.stripe_account_id
      });
      return new Response(
        JSON.stringify({
          success: true,
          already_connected: true,
          stripe_account_id: contador.stripe_account_id,
          message: 'Contador ja esta conectado ao Stripe Connect'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gera link de onboarding do Stripe Connect Express
    try {
      const accountLink = await stripe.accountLinks.create({
        type: 'account_onboarding',
        account: contador.id, // Usa contador_id como account ID no Stripe
        refresh_url: body.redirect_url,
        return_url: body.redirect_url,
      });

      logInfo('Link de onboarding Stripe Connect gerado', {
        contador_id: contador.id,
        account_link_id: accountLink.id,
        url_prefix: accountLink.url.substring(0, 50)
      });

      // Registra em audit_logs
      await supabase.from('audit_logs').insert({
        acao: 'gerar_link_stripe_connect',
        detalhes: {
          contador_id: contador.id,
          account_link_id: accountLink.id,
        },
        created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          url: accountLink.url,
          message: 'Link de onboarding Stripe Connect gerado com sucesso'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      logError('Erro ao gerar link de onboarding', {
        contador_id: contador.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return new Response(
        JSON.stringify({
          error: 'Erro ao gerar link de onboarding do Stripe Connect',
          code: 'STRIPE_ERROR'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    logError('Erro na funcao gerar-link-stripe-connect', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
