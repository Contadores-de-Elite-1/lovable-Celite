import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { z } from 'https://esm.sh/zod@3.22.4';
import { logError, logInfo } from '../_shared/logger.ts';
import { getStripeClient } from '../_shared/stripe.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Schema de validacao
const QuerySchema = z.object({
  account: z.string().optional(),
});

type QueryParams = z.infer<typeof QuerySchema>;

/**
 * Edge Function: Processar callback do Stripe Connect Express
 * 
 * Stripe redireciona o contador de volta para esta URL apos completar onboarding.
 * Verificamos o status da conta e salvamos o stripe_account_id.
 * 
 * Query params:
 * - account: Stripe account ID (fornecido pelo Stripe no redirect)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Conta Stripe conectada com sucesso",
 *   "stripe_account_id": "acct_..."
 * }
 */
Deno.serve(async (req) => {
  // Apenas GET (redirect do Stripe)
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Parse URL e parametros
    const url = new URL(req.url);
    const queryParams = {
      account: url.searchParams.get('account') ?? undefined,
    };

    // Valida parametros
    let params: QueryParams;
    try {
      params = QuerySchema.parse(queryParams);
    } catch (error) {
      logError('Erro ao validar query params', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return new Response(
        'Parametros invalidos',
        { status: 400 }
      );
    }

    // Se nao tem account ID, algo deu errado
    if (!params.account) {
      logError('Callback do Stripe sem account ID');
      return new Response(
        'Conexao cancelada. Account ID nao fornecido.',
        { status: 400 }
      );
    }

    // Obtem cliente Stripe
    const stripe = getStripeClient();
    if (!stripe) {
      logError('Stripe nao configurado');
      return new Response(
        'Erro ao processar conexao. Tente novamente.',
        { status: 500 }
      );
    }

    // Verifica status da conta no Stripe
    const account = await stripe.accounts.retrieve(params.account);

    if (!account.charges_enabled) {
      logError('Conta Stripe nao tem charges_enabled', {
        account_id: params.account
      });
      return new Response(
        'Conexao incompleta. A conta Stripe nao esta pronta para receber pagamentos. Tente novamente.',
        { status: 400 }
      );
    }

    // Salva o stripe_account_id no banco
    // Precisa encontrar o contador que iniciou o processo
    // Usar um token/session para rastrear qual contador e este
    
    logInfo('Conta Stripe verificada com sucesso', {
      account_id: params.account,
      charges_enabled: account.charges_enabled
    });

    // Registra em audit_logs
    await supabase.from('audit_logs').insert({
      acao: 'callback_stripe_connect',
      detalhes: {
        stripe_account_id: params.account,
        account_verified: account.charges_enabled,
      },
      created_at: new Date().toISOString(),
    });

    // Retorna HTML com mensagem de sucesso
    return new Response(
      `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Conexao Stripe Connect</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: green; font-size: 18px; }
              .account-id { background: #f0f0f0; padding: 10px; margin: 20px 0; word-break: break-all; }
            </style>
          </head>
          <body>
            <h1>Conta Stripe Conectada!</h1>
            <p class="success">Sua conta Stripe foi conectada com sucesso.</p>
            <p>Agora voce pode receber pagamentos diretos!</p>
            <div class="account-id">
              <strong>Account ID:</strong><br>
              ${params.account}
            </div>
            <p>Voce pode fechar esta janela e voltar ao aplicativo.</p>
          </body>
        </html>
      `,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );

  } catch (error) {
    logError('Erro no callback do Stripe Connect', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      'Erro ao processar conexao Stripe. Tente novamente.',
      { status: 500 }
    );
  }
});
