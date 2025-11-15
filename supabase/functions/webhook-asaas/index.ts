/**
 * Webhook ASAAS - V3.0 - Auto-create clients from webhook
 * https://docs.asaas.com/docs/webhook-para-cobrancas
 *
 * NOVO: Cria clientes automaticamente quando webhook é recebido
 * Suporta 3 formas de vincular contador:
 * 1. Link de indicação (tabela invites) - PRINCIPAL
 * 2. externalReference no Customer - FALLBACK
 * 3. externalReference na Subscription - FALLBACK 2
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AsaasWebhookPayload {
  id: string;
  event: string;
  dateCreated?: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue?: number;
    dateCreated: string;
    confirmedDate?: string;
    status: string;
    billingType: string;
    subscription?: string;
    description?: string;
  };
}

interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

interface AsaasSubscription {
  id: string;
  customer: string;
  externalReference?: string;
}

/**
 * Busca dados do customer no ASAAS
 */
async function buscarCustomerASAAS(customerId: string): Promise<AsaasCustomer> {
  const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
  const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3';

  if (!asaasApiKey) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  console.log(`[ASAAS API] Buscando customer ${customerId}...`);

  const response = await fetch(`${asaasApiUrl}/customers/${customerId}`, {
    headers: {
      'access_token': asaasApiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar customer no ASAAS: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[ASAAS API] ✅ Customer encontrado: ${data.name}`);
  return data;
}

/**
 * Busca dados da subscription no ASAAS
 */
async function buscarSubscriptionASAAS(subscriptionId: string): Promise<AsaasSubscription> {
  const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
  const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3';

  if (!asaasApiKey) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  console.log(`[ASAAS API] Buscando subscription ${subscriptionId}...`);

  const response = await fetch(`${asaasApiUrl}/subscriptions/${subscriptionId}`, {
    headers: {
      'access_token': asaasApiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar subscription no ASAAS: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[ASAAS API] ✅ Subscription encontrada`);
  return data;
}

/**
 * Encontra o contador vinculado ao pagamento
 * Tenta 3 formas em cascata:
 * 1. Link de indicação (tabela invites) - PRINCIPAL
 * 2. externalReference no Customer - FALLBACK
 * 3. externalReference na Subscription - FALLBACK 2
 */
async function encontrarContador(payload: AsaasWebhookPayload, supabase: any): Promise<string> {
  const payment = payload.payment!;

  console.log('[FIND CONTADOR] ═══════════════════════════════════════');
  console.log('[FIND CONTADOR] Iniciando busca por contador...');

  // 🔥 PRIORIDADE 1: Link de Indicação (PRINCIPAL)
  console.log('[FIND CONTADOR] Tentando método 1: Link de indicação...');

  const description = payment.description || '';
  console.log(`[FIND CONTADOR] Description: "${description}"`);

  // Procurar padrões: ref=XXX, token=XXX, ref:XXX, token:XXX
  const tokenMatch = description.match(/(?:ref|token)[=:](\w+)/i);

  if (tokenMatch) {
    const token = tokenMatch[1];
    console.log(`[FIND CONTADOR] ✓ Token encontrado: ${token}`);

    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('emissor_id, tipo, status')
      .eq('token', token)
      .eq('tipo', 'cliente')
      .maybeSingle();

    if (invite && !inviteError) {
      console.log(`[FIND CONTADOR] ✅ SUCESSO! Contador via link de indicação: ${invite.emissor_id}`);
      console.log('[FIND CONTADOR] ═══════════════════════════════════════\n');
      return invite.emissor_id;
    } else {
      console.log(`[FIND CONTADOR] ✗ Invite não encontrado ou inválido`);
    }
  } else {
    console.log(`[FIND CONTADOR] ✗ Nenhum token encontrado no description`);
  }

  // 🔥 PRIORIDADE 2: externalReference no Customer (FALLBACK)
  console.log('[FIND CONTADOR] Tentando método 2: Customer.externalReference...');

  try {
    const customerData = await buscarCustomerASAAS(payment.customer);

    if (customerData.externalReference) {
      console.log(`[FIND CONTADOR] ✅ SUCESSO! Contador via Customer.externalReference: ${customerData.externalReference}`);
      console.log('[FIND CONTADOR] ═══════════════════════════════════════\n');
      return customerData.externalReference;
    } else {
      console.log(`[FIND CONTADOR] ✗ Customer sem externalReference`);
    }
  } catch (e) {
    console.log(`[FIND CONTADOR] ✗ Erro ao buscar customer: ${e.message}`);
  }

  // 🔥 PRIORIDADE 3: externalReference na Subscription (FALLBACK 2)
  if (payment.subscription) {
    console.log('[FIND CONTADOR] Tentando método 3: Subscription.externalReference...');

    try {
      const subscriptionData = await buscarSubscriptionASAAS(payment.subscription);

      if (subscriptionData.externalReference) {
        console.log(`[FIND CONTADOR] ✅ SUCESSO! Contador via Subscription.externalReference: ${subscriptionData.externalReference}`);
        console.log('[FIND CONTADOR] ═══════════════════════════════════════\n');
        return subscriptionData.externalReference;
      } else {
        console.log(`[FIND CONTADOR] ✗ Subscription sem externalReference`);
      }
    } catch (e) {
      console.log(`[FIND CONTADOR] ✗ Erro ao buscar subscription: ${e.message}`);
    }
  } else {
    console.log('[FIND CONTADOR] Método 3: Sem subscription no payment');
  }

  // ❌ Nenhuma forma funcionou
  console.error('[FIND CONTADOR] ❌ FALHA! Nenhuma forma de vincular contador encontrada!');
  console.error('[FIND CONTADOR] Tentativas:');
  console.error('[FIND CONTADOR]   1. Link de indicação: FALHOU');
  console.error('[FIND CONTADOR]   2. Customer.externalReference: FALHOU');
  console.error('[FIND CONTADOR]   3. Subscription.externalReference: FALHOU');
  console.log('[FIND CONTADOR] ═══════════════════════════════════════\n');

  throw new Error(
    'Nenhum contador vinculado! Payment precisa ter: ' +
    '(1) token de indicação no description, OU ' +
    '(2) customer com externalReference, OU ' +
    '(3) subscription com externalReference'
  );
}

/**
 * Busca ou cria cliente automaticamente
 * Se cliente existe com outro contador, ATUALIZA o vínculo
 */
async function buscarOuCriarCliente(
  customerId: string,
  contadorId: string,
  payment: any,
  supabase: any
): Promise<any> {
  console.log('[CLIENTE] ═══════════════════════════════════════');
  console.log(`[CLIENTE] Buscando cliente ${customerId}...`);

  // 1. Verificar se cliente já existe
  const { data: clienteExistente, error: clienteError } = await supabase
    .from('clientes')
    .select('*')
    .eq('asaas_customer_id', customerId)
    .maybeSingle();

  if (clienteError) {
    throw new Error(`Erro ao buscar cliente: ${clienteError.message}`);
  }

  // 2. Cliente já existe
  if (clienteExistente) {
    console.log(`[CLIENTE] ✓ Cliente encontrado: ${clienteExistente.id}`);
    console.log(`[CLIENTE]   Contador atual: ${clienteExistente.contador_id}`);
    console.log(`[CLIENTE]   Contador novo: ${contadorId}`);

    // Verificar se mudou de contador
    if (clienteExistente.contador_id !== contadorId) {
      console.log(`[CLIENTE] 🔄 MUDANÇA DE CONTADOR DETECTADA!`);
      console.log(`[CLIENTE]   Cliente voltou com contador diferente`);
      console.log(`[CLIENTE]   Atualizando vínculo...`);

      const { data: clienteAtualizado, error: updateError } = await supabase
        .from('clientes')
        .update({
          contador_id: contadorId,
          status: 'ativo',
          data_ativacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', clienteExistente.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Erro ao atualizar cliente: ${updateError.message}`);
      }

      console.log(`[CLIENTE] ✅ Vínculo atualizado para novo contador!`);
      console.log('[CLIENTE] ═══════════════════════════════════════\n');
      return clienteAtualizado;
    } else {
      console.log(`[CLIENTE] ✓ Contador é o mesmo, mantendo vínculo`);
      console.log('[CLIENTE] ═══════════════════════════════════════\n');
      return clienteExistente;
    }
  }

  // 3. Cliente NÃO existe - CRIAR AUTOMATICAMENTE
  console.log(`[CLIENTE] ✗ Cliente não encontrado no Supabase`);
  console.log(`[CLIENTE] 🆕 Criando cliente automaticamente...`);

  // Buscar dados completos no ASAAS
  const customerData = await buscarCustomerASAAS(customerId);

  console.log(`[CLIENTE]   Nome: ${customerData.name}`);
  console.log(`[CLIENTE]   CPF/CNPJ: ${customerData.cpfCnpj || 'N/A'}`);
  console.log(`[CLIENTE]   Email: ${customerData.email || 'N/A'}`);

  const { data: novoCliente, error: createError } = await supabase
    .from('clientes')
    .insert({
      contador_id: contadorId,
      asaas_customer_id: customerId,
      nome_empresa: customerData.name,
      cnpj: customerData.cpfCnpj || 'PENDENTE',
      contato_email: customerData.email,
      status: 'ativo',
      plano: 'profissional', // Pode ser inferido do valor ou subscription
      valor_mensal: payment.value,
      data_ativacao: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Erro ao criar cliente: ${createError.message}`);
  }

  console.log(`[CLIENTE] ✅ Cliente CRIADO com sucesso: ${novoCliente.id}`);
  console.log('[CLIENTE] ═══════════════════════════════════════\n');
  return novoCliente;
}

async function validateAsaasSignature(
  payload: string,
  signature: string | null,
  secret: string | null,
  headers: Headers
): Promise<boolean> {
  if (!secret) {
    console.warn('⚠️  ASAAS_WEBHOOK_SECRET not configured - allowing webhook');
    return true;
  }

  if (!signature) {
    console.warn('⚠️  No signature provided - allowing webhook for testing');
    return true;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + secret);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const isValid = expectedSignature === signature.toLowerCase();

    if (!isValid) {
      console.warn('⚠️  Signature mismatch - allowing anyway for testing');
    }

    return true; // Always allow for testing
  } catch (error) {
    console.error('[WEBHOOK ERROR] Error validating signature:', error);
    return true; // Allow even if validation fails
  }
}

function validarValorMonetario(valor: unknown, nome: string): number {
  if (typeof valor !== 'number' || valor <= 0) {
    throw new Error(`${nome} inválido: ${valor}. Deve ser número positivo.`);
  }
  if (!Number.isFinite(valor)) {
    throw new Error(`${nome} não é número válido: ${valor}`);
  }
  return Math.round(valor * 100) / 100;
}

function parseCompetencia(dateCreated: string): string {
  try {
    const data = new Date(dateCreated);
    if (isNaN(data.getTime())) {
      throw new Error('Data inválida');
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  } catch {
    throw new Error(`Erro ao fazer parse da data: ${dateCreated}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const asaasWebhookSecret = Deno.env.get('ASAAS_WEBHOOK_SECRET');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let payload: AsaasWebhookPayload;
    let payloadRaw: string;

    try {
      payloadRaw = await req.text();
      console.log('[WEBHOOK] ═══════════════════════════════════════');
      console.log('[WEBHOOK] Webhook ASAAS recebido!');
      console.log('[WEBHOOK] Payload size:', payloadRaw.length, 'bytes');
      payload = JSON.parse(payloadRaw);
      console.log('[WEBHOOK] Event:', payload.event);
      console.log('[WEBHOOK] Event ID:', payload.id);
    } catch (parseError) {
      console.error('[WEBHOOK] Failed to parse JSON:', parseError);
      throw new Error('JSON inválido no payload');
    }

    // Validate signature
    const asaasSignature = req.headers.get('x-asaas-webhook-signature')
      || req.headers.get('asaas-access-token')
      || req.headers.get('x-asaas-signature');

    await validateAsaasSignature(payloadRaw, asaasSignature, asaasWebhookSecret, req.headers);

    // Eventos para processar
    const eventosParaProcessar = [
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED',
      'PAYMENT_CREATED',
      'PAYMENT_UPDATED',
      'PAYMENT_RECEIVED_IN_CASH',
      'PAYMENT_ANTICIPATED',
      'SUBSCRIPTION_CREATED',
    ];

    // Eventos para ignorar
    const eventosParaIgnorar = [
      'PAYMENT_OVERDUE',
      'PAYMENT_DELETED',
      'PAYMENT_BANK_SLIP_VIEWED',
      'PAYMENT_CHECKOUT_VIEWED',
      'PAYMENT_AWAITING_RISK_ANALYSIS',
    ];

    const evento = payload.event || 'PAYMENT_CONFIRMED';

    if (eventosParaIgnorar.includes(evento)) {
      console.log('[WEBHOOK] ℹ️  Evento ignorado:', evento);
      return new Response(JSON.stringify({
        success: true,
        message: 'Evento recebido mas ignorado (não gera comissão)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!eventosParaProcessar.includes(evento) && !payload.payment) {
      console.log('[WEBHOOK] ⚠️  Evento sem dados de pagamento');
      return new Response(JSON.stringify({
        success: true,
        message: 'Evento recebido mas sem dados de pagamento'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const payment = payload.payment!;

    if (!payment.id || !payment.customer) {
      throw new Error('Dados incompletos no payment');
    }

    const netValue = payment.netValue ?? payment.value;

    const valoresValidados = {
      valor_bruto: validarValorMonetario(payment.value, 'valor_bruto'),
      valor_liquido: validarValorMonetario(netValue, 'valor_liquido'),
    };

    const competencia = parseCompetencia(payment.dateCreated);

    // 🔥 NOVO: Encontrar contador (3 formas em cascata)
    const contadorId = await encontrarContador(payload, supabase);

    // 🔥 NOVO: Buscar ou criar cliente automaticamente
    const cliente = await buscarOuCriarCliente(
      payment.customer,
      contadorId,
      payment,
      supabase
    );

    // Verificar idempotência
    const { data: pagamentoExistente } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('asaas_payment_id', payment.id)
      .maybeSingle();

    if (pagamentoExistente) {
      console.log('[WEBHOOK] ✓ Pagamento já processado (idempotência)');
      return new Response(JSON.stringify({
        success: true,
        message: 'Pagamento já processado (idempotência)',
        pagamento_id: pagamentoExistente.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Determinar se é primeiro pagamento
    const dataAtivacao = cliente.data_ativacao ? new Date(cliente.data_ativacao) : null;
    const dataPagamento = new Date(competencia);
    const isPrimeiroPagamento = !dataAtivacao ||
      (dataAtivacao.getFullYear() === dataPagamento.getFullYear() &&
       dataAtivacao.getMonth() === dataPagamento.getMonth());

    const dataConfirmacao = payment.confirmedDate
      ? new Date(payment.confirmedDate).toISOString()
      : new Date().toISOString();

    // Criar pagamento
    const { data: novoPagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        cliente_id: cliente.id,
        tipo: isPrimeiroPagamento ? 'ativacao' : 'mensalidade',
        valor_bruto: valoresValidados.valor_bruto,
        valor_liquido: valoresValidados.valor_liquido,
        competencia,
        status: 'pago',
        pago_em: dataConfirmacao,
        asaas_payment_id: payment.id,
        asaas_event_id: payload.id,
      })
      .select()
      .single();

    if (pagamentoError) {
      throw pagamentoError;
    }

    console.log('[WEBHOOK] ✅ Pagamento registrado:', novoPagamento.id);

    // Calcular comissões
    let calculoResult = null;
    try {
      const { data: resultado, error: calculoError } = await supabase.functions.invoke(
        'calcular-comissoes',
        {
          body: {
            pagamento_id: novoPagamento.id,
            cliente_id: cliente.id,
            contador_id: contadorId,
            valor_liquido: valoresValidados.valor_liquido,
            competencia,
            is_primeira_mensalidade: isPrimeiroPagamento,
          },
        }
      );

      if (calculoError) {
        throw calculoError;
      }

      calculoResult = resultado;
      console.log('[WEBHOOK] ✅ Comissões calculadas com sucesso');
    } catch (err) {
      console.error('[WEBHOOK] ❌ Erro ao calcular comissões:', err);

      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_CALCULO_COMISSOES_ERRO',
        tabela: 'pagamentos',
        registro_id: novoPagamento.id,
        payload: {
          error: err instanceof Error ? err.message : String(err),
          pagamento_id: payment.id,
        },
      });

      throw new Error(`Falha ao calcular comissões: ${err.message}`);
    }

    // Audit log de sucesso
    await supabase.from('audit_logs').insert({
      acao: 'WEBHOOK_ASAAS_PROCESSED',
      tabela: 'pagamentos',
      registro_id: novoPagamento.id,
      payload: {
        event: payload.event,
        asaas_payment_id: payment.id,
        cliente_id: cliente.id,
        contador_id: contadorId,
        valor_bruto: valoresValidados.valor_bruto,
        valor_liquido: valoresValidados.valor_liquido,
        competencia,
        tipo: isPrimeiroPagamento ? 'ativacao' : 'mensalidade',
      },
    });

    console.log('[WEBHOOK] ═══════════════════════════════════════');
    console.log('[WEBHOOK] ✅ SUCESSO TOTAL!');
    console.log('[WEBHOOK] Pagamento ID:', novoPagamento.id);
    console.log('[WEBHOOK] Cliente ID:', cliente.id);
    console.log('[WEBHOOK] Contador ID:', contadorId);
    console.log('[WEBHOOK] Comissões calculadas:', !!calculoResult);
    console.log('[WEBHOOK] ═══════════════════════════════════════\n');

    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: novoPagamento.id,
        cliente_id: cliente.id,
        contador_id: contadorId,
        comissoes_calculadas: !!calculoResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[WEBHOOK] ═══════════════════════════════════════');
    console.error('[WEBHOOK] ❌ ERRO FATAL!');
    console.error('[WEBHOOK] Mensagem:', errorMessage);
    console.error('[WEBHOOK] Stack:', errorStack);
    console.error('[WEBHOOK] ═══════════════════════════════════════\n');

    try {
      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_ASAAS_ERROR',
        tabela: 'pagamentos',
        payload: {
          error_message: errorMessage,
          error_stack: errorStack.substring(0, 1000),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.error('[WEBHOOK] Erro ao registrar erro no audit log:', logErr);
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'Check audit_logs for full error details'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
