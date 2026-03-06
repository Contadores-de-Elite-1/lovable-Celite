/**
 * webhook-stripe — Edge Function principal de pagamentos V5.0
 *
 * Substitui completamente o webhook-asaas, processando todos os eventos
 * relevantes do Stripe para garantir as 17 bonificações do sistema de comissões.
 *
 * Eventos tratados:
 *  - invoice.payment_succeeded / invoice.paid  → pagamento mensal/ativação (PRINCIPAL)
 *  - invoice.payment_failed                    → pagamento falhou, cliente fica inadimplente
 *  - customer.subscription.deleted             → cancelamento de assinatura
 *  - customer.subscription.updated             → mudança de status da assinatura
 *  - charge.refunded                           → estorno, cancela comissões
 *
 * Fluxo principal (invoice.payment_succeeded):
 *  1. Valida assinatura Stripe (constructEventAsync)
 *  2. Busca cliente por stripe_subscription_id ou stripe_customer_id
 *  3. Garante idempotência via stripe_payment_id
 *  4. Determina se é 1ª mensalidade (ativação) ou recorrência
 *  5. Insere registro em pagamentos
 *  6. Chama calcular-comissoes → dispara as 17 bonificações
 *  7. Registra em audit_logs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { logError, logInfo, logDebug, logWarn } from '../_shared/logger.ts';

// ── Clientes ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Determina a competência (YYYY-MM-DD) de um invoice Stripe.
 * Usa period_start para mapeamento ao mês correto.
 */
function resolverCompetencia(invoice: Stripe.Invoice): string {
  const ts = invoice.period_start ?? Math.floor(Date.now() / 1000);
  const d = new Date(ts * 1000);
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Determina se é o primeiro pagamento comparando a competência
 * com o mês de ativação do cliente (data_ativacao).
 */
function isPrimeiroPagamento(
  competencia: string,
  dataAtivacao: string | null
): boolean {
  if (!dataAtivacao) return true;
  const ativacao = new Date(dataAtivacao);
  const comp = new Date(competencia);
  return (
    ativacao.getFullYear() === comp.getFullYear() &&
    ativacao.getMonth() === comp.getMonth()
  );
}

/**
 * Chama a Edge Function calcular-comissoes de forma robusta.
 * Registra erro no audit_logs mas NÃO relança — pagamento já foi salvo.
 */
async function invocarCalcularComissoes(params: {
  pagamento_id: string;
  cliente_id: string;
  contador_id: string;
  valor_liquido: number;
  competencia: string;
  is_primeira_mensalidade: boolean;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('calcular-comissoes', {
      body: params,
    });

    if (error) {
      logError('[calcular-comissoes] Erro ao calcular comissões', {
        error: error.message,
        pagamento_id: params.pagamento_id,
      });

      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_STRIPE_CALCULO_COMISSOES_ERRO',
        tabela: 'pagamentos',
        registro_id: params.pagamento_id,
        payload: {
          error: error.message,
          params,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logInfo('[calcular-comissoes] Comissões calculadas', {
        pagamento_id: params.pagamento_id,
        is_primeira_mensalidade: params.is_primeira_mensalidade,
      });
    }
  } catch (err) {
    logError('[calcular-comissoes] Exceção ao invocar função', {
      error: err instanceof Error ? err.message : String(err),
      pagamento_id: params.pagamento_id,
    });
  }
}

/**
 * Busca o cliente pelo stripe_subscription_id ou stripe_customer_id.
 * Retorna o cliente com seu contador_id e data_ativacao.
 */
async function buscarCliente(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id ?? null;

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id ?? null;

  // Tenta pelo subscription_id primeiro (mais preciso)
  if (subscriptionId) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, contador_id, data_ativacao, status')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (!error && data) return data;
  }

  // Fallback: pelo customer_id
  if (customerId) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, contador_id, data_ativacao, status')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (!error && data) return data;
  }

  return null;
}

// ── Handlers de eventos ───────────────────────────────────────────────────────

/**
 * invoice.payment_succeeded / invoice.paid
 *
 * Principal handler — processa cada cobrança mensal da assinatura.
 * Responsável por acionar as 17 bonificações via calcular-comissoes.
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  eventId: string
): Promise<void> {
  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id ?? null;

  logInfo('[invoice.payment_succeeded] Iniciando processamento', {
    invoice_id: invoice.id,
    payment_intent_id: paymentIntentId,
    amount_paid: invoice.amount_paid,
    customer: invoice.customer,
  });

  // ── 1. Idempotência: já processamos este pagamento? ─────────────────────────
  if (paymentIntentId) {
    const { data: existente } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('stripe_payment_id', paymentIntentId)
      .maybeSingle();

    if (existente) {
      logInfo('[invoice.payment_succeeded] Pagamento já processado (idempotência)', {
        pagamento_id: existente.id,
        stripe_payment_id: paymentIntentId,
      });
      return;
    }
  }

  // ── 2. Buscar cliente ────────────────────────────────────────────────────────
  const cliente = await buscarCliente(invoice);

  if (!cliente) {
    logWarn('[invoice.payment_succeeded] Cliente não encontrado — invoice ignorado', {
      invoice_id: invoice.id,
      customer: invoice.customer,
      subscription: invoice.subscription,
    });
    return;
  }

  if (!cliente.contador_id) {
    logError('[invoice.payment_succeeded] Cliente sem contador_id', {
      cliente_id: cliente.id,
    });
    return;
  }

  // ── 3. Calcular valores ─────────────────────────────────────────────────────
  // Stripe usa centavos; converter para BRL
  const valorBruto = invoice.amount_due / 100;
  const valorLiquido = invoice.amount_paid / 100;

  if (valorLiquido <= 0) {
    logWarn('[invoice.payment_succeeded] Valor líquido zero ou negativo — ignorado', {
      invoice_id: invoice.id,
      amount_paid: invoice.amount_paid,
    });
    return;
  }

  // ── 4. Determinar competência e tipo ────────────────────────────────────────
  const competencia = resolverCompetencia(invoice);
  const ehPrimeiro = isPrimeiroPagamento(competencia, cliente.data_ativacao);
  const tipoPagamento = ehPrimeiro ? 'ativacao' : 'mensalidade';

  // ── 5. Atualizar data_ativacao se for 1ª mensalidade ────────────────────────
  if (ehPrimeiro && !cliente.data_ativacao) {
    await supabase
      .from('clientes')
      .update({ data_ativacao: competencia, status: 'ativo' })
      .eq('id', cliente.id);
  }

  // ── 6. Inserir pagamento ─────────────────────────────────────────────────────
  const { data: novoPagamento, error: errPagamento } = await supabase
    .from('pagamentos')
    .insert({
      cliente_id: cliente.id,
      tipo: tipoPagamento,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      competencia,
      status: 'pago',
      pago_em: new Date().toISOString(),
      stripe_payment_id: paymentIntentId,
      stripe_event_id: eventId,
    })
    .select('id')
    .single();

  if (errPagamento) {
    logError('[invoice.payment_succeeded] Erro ao inserir pagamento', {
      error: errPagamento.message,
      cliente_id: cliente.id,
    });
    throw errPagamento;
  }

  logInfo('[invoice.payment_succeeded] Pagamento registrado', {
    pagamento_id: novoPagamento.id,
    tipo: tipoPagamento,
    valor_liquido: valorLiquido,
    competencia,
  });

  // ── 7. Calcular comissões (17 bonificações) ─────────────────────────────────
  await invocarCalcularComissoes({
    pagamento_id: novoPagamento.id,
    cliente_id: cliente.id,
    contador_id: cliente.contador_id,
    valor_liquido: valorLiquido,
    competencia,
    is_primeira_mensalidade: ehPrimeiro,
  });

  // ── 8. Audit log ────────────────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    acao: 'WEBHOOK_STRIPE_INVOICE_PAID',
    tabela: 'pagamentos',
    registro_id: novoPagamento.id,
    payload: {
      stripe_event_id: eventId,
      invoice_id: invoice.id,
      stripe_payment_id: paymentIntentId,
      cliente_id: cliente.id,
      contador_id: cliente.contador_id,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      competencia,
      tipo: tipoPagamento,
    },
  });
}

/**
 * invoice.payment_failed
 *
 * Registra falha de pagamento e marca cliente como inadimplente.
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventId: string
): Promise<void> {
  logInfo('[invoice.payment_failed] Falha de pagamento', {
    invoice_id: invoice.id,
    customer: invoice.customer,
  });

  const cliente = await buscarCliente(invoice);
  if (!cliente) return;

  // Marca cliente como inadimplente
  await supabase
    .from('clientes')
    .update({ status: 'inadimplente' })
    .eq('id', cliente.id);

  // Registra no audit
  await supabase.from('audit_logs').insert({
    acao: 'WEBHOOK_STRIPE_INVOICE_FAILED',
    tabela: 'clientes',
    registro_id: cliente.id,
    payload: {
      stripe_event_id: eventId,
      invoice_id: invoice.id,
      customer: invoice.customer,
      attempt_count: invoice.attempt_count,
    },
  });

  logInfo('[invoice.payment_failed] Cliente marcado como inadimplente', {
    cliente_id: cliente.id,
  });
}

/**
 * customer.subscription.deleted
 *
 * Marca o cliente como cancelado quando a assinatura expira.
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  eventId: string
): Promise<void> {
  const subscriptionId = subscription.id;
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  logInfo('[subscription.deleted] Assinatura cancelada', {
    subscription_id: subscriptionId,
    customer: customerId,
  });

  // Busca cliente pela subscription
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (cliente) {
    await supabase
      .from('clientes')
      .update({ status: 'cancelado' })
      .eq('id', cliente.id);

    logInfo('[subscription.deleted] Cliente marcado como cancelado', {
      cliente_id: cliente.id,
    });
  }

  await supabase.from('audit_logs').insert({
    acao: 'WEBHOOK_STRIPE_SUBSCRIPTION_DELETED',
    tabela: 'clientes',
    registro_id: cliente?.id ?? null,
    payload: {
      stripe_event_id: eventId,
      subscription_id: subscriptionId,
      customer_id: customerId,
      canceled_at: subscription.canceled_at,
    },
  });
}

/**
 * customer.subscription.updated
 *
 * Sincroniza status da assinatura (ex: past_due, active, paused).
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  eventId: string
): Promise<void> {
  const subscriptionId = subscription.id;

  logDebug('[subscription.updated] Status atualizado', {
    subscription_id: subscriptionId,
    status: subscription.status,
  });

  if (subscription.status === 'canceled') {
    await handleSubscriptionDeleted(subscription, eventId);
    return;
  }

  // Reativar cliente se assinatura ficou ativa novamente
  if (subscription.status === 'active') {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, status')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (cliente && cliente.status === 'inadimplente') {
      await supabase
        .from('clientes')
        .update({ status: 'ativo' })
        .eq('id', cliente.id);

      logInfo('[subscription.updated] Cliente reativado após adimplência', {
        cliente_id: cliente.id,
      });
    }
  }

  await supabase.from('audit_logs').insert({
    acao: 'WEBHOOK_STRIPE_SUBSCRIPTION_UPDATED',
    payload: {
      stripe_event_id: eventId,
      subscription_id: subscriptionId,
      status: subscription.status,
    },
  });
}

/**
 * charge.refunded
 *
 * Cancela comissões associadas ao pagamento estornado.
 */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  eventId: string
): Promise<void> {
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id ?? null;

  logInfo('[charge.refunded] Processando estorno', {
    charge_id: charge.id,
    amount_refunded: charge.amount_refunded,
    payment_intent: paymentIntentId,
  });

  // Busca pagamento pelo stripe_payment_id (= payment_intent_id)
  const lookupId = paymentIntentId ?? charge.id;
  const { data: pagamento } = await supabase
    .from('pagamentos')
    .select('id')
    .eq('stripe_payment_id', lookupId)
    .maybeSingle();

  if (!pagamento) {
    logWarn('[charge.refunded] Pagamento não encontrado para o estorno', {
      charge_id: charge.id,
      payment_intent: paymentIntentId,
    });
    return;
  }

  // Atualiza status do pagamento
  await supabase
    .from('pagamentos')
    .update({
      status: 'reembolsado',
      observacao: `Estorno de R$ ${(charge.amount_refunded / 100).toFixed(2)}`,
      stripe_event_id: eventId,
    })
    .eq('id', pagamento.id);

  // Cancela comissões vinculadas
  const { data: comissoes } = await supabase
    .from('comissoes')
    .select('id')
    .eq('pagamento_id', pagamento.id)
    .in('status', ['calculada', 'aprovada']);

  if (comissoes && comissoes.length > 0) {
    await supabase
      .from('comissoes')
      .update({ status: 'cancelada', observacao: 'Cancelada por estorno Stripe' })
      .in('id', comissoes.map((c) => c.id));

    logInfo('[charge.refunded] Comissões canceladas por estorno', {
      pagamento_id: pagamento.id,
      comissoes_canceladas: comissoes.length,
    });
  }

  await supabase.from('audit_logs').insert({
    acao: 'WEBHOOK_STRIPE_CHARGE_REFUNDED',
    tabela: 'pagamentos',
    registro_id: pagamento.id,
    payload: {
      stripe_event_id: eventId,
      charge_id: charge.id,
      payment_intent_id: paymentIntentId,
      amount_refunded: charge.amount_refunded,
      comissoes_canceladas: comissoes?.length ?? 0,
    },
  });
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  if (!webhookSecret) {
    logError('STRIPE_WEBHOOK_SECRET não configurado');
    return new Response('Server misconfigured', { status: 500 });
  }

  // ── Validação de assinatura via SDK Stripe ───────────────────────────────────
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logError('Assinatura do webhook inválida', {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response('Unauthorized', { status: 401 });
  }

  logDebug('Webhook Stripe recebido', {
    event_id: event.id,
    event_type: event.type,
  });

  try {
    switch (event.type) {
      // Pagamento mensal de assinatura — PRINCIPAL
      case 'invoice.payment_succeeded':
      case 'invoice.paid':
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
          event.id
        );
        break;

      // Falha de cobrança
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          event.id
        );
        break;

      // Assinatura encerrada
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          event.id
        );
        break;

      // Atualização de status da assinatura
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          event.id
        );
        break;

      // Estorno
      case 'charge.refunded':
        await handleChargeRefunded(
          event.data.object as Stripe.Charge,
          event.id
        );
        break;

      default:
        logDebug('Evento Stripe não tratado — ignorado', { event_type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logError('Erro ao processar evento Stripe', {
      event_id: event.id,
      event_type: event.type,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.substring(0, 500) : undefined,
    });

    await supabase.from('audit_logs').insert({
      acao: 'WEBHOOK_STRIPE_ERRO',
      payload: {
        stripe_event_id: event.id,
        event_type: event.type,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
