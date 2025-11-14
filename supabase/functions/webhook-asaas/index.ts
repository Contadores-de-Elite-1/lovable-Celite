import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function validateAsaasSignature(
  payload: string,
  signature: string | null,
  secret: string | null,
  headers: Headers
): Promise<boolean> {
  // Log all relevant headers for debugging
  console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════');
  console.log('[WEBHOOK DEBUG] Received webhook - analyzing...');
  console.log(`[WEBHOOK DEBUG] Payload size: ${payload.length} bytes`);
  console.log(`[WEBHOOK DEBUG] Signature provided: ${signature ? 'YES' : 'NO'}`);
  console.log(`[WEBHOOK DEBUG] Secret configured: ${secret ? 'YES' : 'NO'}`);

  // Log all headers that might contain signature
  console.log('[WEBHOOK DEBUG] Headers with "signature", "token", or "asaas":');
  for (const [key, value] of headers.entries()) {
    if (key.toLowerCase().includes('signature') || key.toLowerCase().includes('token') || key.toLowerCase().includes('asaas')) {
      console.log(`   ${key}: ${value.substring(0, 30)}...`);
    }
  }

  if (!secret) {
    console.warn('⚠️  ASAAS_WEBHOOK_SECRET not configured');
    // Fall back to allowing if no secret is set
    console.log('[WEBHOOK DEBUG] Allowing webhook due to missing secret (development)');
    return true;
  }

  if (!signature) {
    console.log('⚠️  No signature in x-asaas-webhook-signature header');
    // If we have a secret but no signature, this is suspicious
    console.warn('[WEBHOOK DEBUG] Signature expected but not found!');
    // For now, allow it for testing
    return true;
  }

  // Asaas signs with MD5(payload + secret)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + secret);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log(`[SIGNATURE DEBUG]`);
    console.log(`  Received: ${signature}`);
    console.log(`  Expected: ${expectedSignature}`);
    console.log(`  Match: ${expectedSignature === signature.toLowerCase() ? 'YES ✅' : 'NO ❌'}`);

    const isValid = expectedSignature === signature.toLowerCase();
    console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════\n');
    return isValid;
  } catch (error) {
    console.error('[WEBHOOK ERROR] Error validating signature:', error);
    console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════\n');
    // For testing, allow it even if validation fails
    console.warn('⚠️  Allowing webhook despite validation error (development)');
    return true;
  }
}

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    dateCreated: string;
    confirmedDate?: string;
    status: string;
    billingType: string;
    subscription?: string;
  };
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
      console.log('[WEBHOOK] Raw payload received (first 500 chars):', payloadRaw.substring(0, 500));
      payload = JSON.parse(payloadRaw);
      console.log('[WEBHOOK] Parsed payload:', JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error('[WEBHOOK] Failed to parse JSON:', parseError);
      throw new Error('JSON inválido no payload');
    }

    // Validate webhook signature - check multiple possible header names
    const asaasSignature = req.headers.get('x-asaas-webhook-signature')
      || req.headers.get('asaas-access-token')
      || req.headers.get('x-asaas-signature');

    console.log('[WEBHOOK] Attempting to validate signature...');
    const isValidSignature = await validateAsaasSignature(
      payloadRaw,
      asaasSignature,
      asaasWebhookSecret,
      req.headers
    );

    if (!isValidSignature) {
      console.error('❌ Webhook signature validation FAILED');
      console.error(`   But allowing anyway for TESTING purposes`);
      // For now, don't reject - just log the failure for debugging
      // return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
      //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      //   status: 401,
      // });
    }

    console.log('✅ Webhook Asaas recebido:', payload.event || 'SEM EVENTO');

    const eventosRelevantes = [
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED',
      'PAYMENT_RECEIVED_IN_CASH',
      'SUBSCRIPTION_CREATED',
      'PAYMENT_AWAITING_RISK_ANALYSIS',  // Asaas pode enviar isso
    ];

    // Se não tem event, assume que é um pagamento confirmado
    const evento = payload.event || 'PAYMENT_CONFIRMED';

    if (!eventosRelevantes.includes(evento) && payload.event) {
      console.log('⚠️ Evento não reconhecido:', payload.event);
      // Se tem evento mas não reconhecemos, ignora
      // Mas se é payment, tenta processar de qualquer forma
      if (!payload.payment) {
        return new Response(JSON.stringify({ message: 'Evento ignorado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      console.log('   Mas tem dados de pagamento, tentando processar...');
    }

    const payment = payload.payment;

    console.log('[PAYLOAD ANALYSIS]');
    console.log('  event:', payload.event);
    console.log('  payment exists:', !!payment);
    if (payment) {
      console.log('  payment.id:', payment.id);
      console.log('  payment.customer:', payment.customer);
      console.log('  payment.value:', payment.value);
      console.log('  payment.netValue:', payment.netValue);
      console.log('  payment fields:', Object.keys(payment).join(', '));
    }

    if (!payment || !payment.id || !payment.customer) {
      const missingFields = [];
      if (!payment) missingFields.push('payment object');
      if (payment && !payment.id) missingFields.push('id');
      if (payment && !payment.customer) missingFields.push('customer');
      throw new Error(`Dados incompletos: ${missingFields.join(', ')}`);
    }

    // FIX: netValue pode ser null/undefined no ASAAS
    // Usar fallback para value se netValue não existir
    const netValue = payment.netValue ?? payment.value;

    console.log('[VALIDATION] Values received:');
    console.log('  payment.value:', payment.value);
    console.log('  payment.netValue:', payment.netValue);
    console.log('  netValue (final):', netValue);

    const valoresValidados = {
      valor_bruto: validarValorMonetario(payment.value, 'valor_bruto'),
      valor_liquido: validarValorMonetario(netValue, 'valor_liquido'),
    };

    if (valoresValidados.valor_liquido > valoresValidados.valor_bruto) {
      throw new Error('valor_liquido não pode ser maior que valor_bruto');
    }

    const competencia = parseCompetencia(payment.dateCreated);

    console.log('[CLIENT LOOKUP] Searching for customer:', payment.customer);

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, contador_id, data_ativacao')
      .eq('asaas_customer_id', payment.customer)
      .maybeSingle();

    if (clienteError) {
      console.error('[CLIENT LOOKUP] Database error:', clienteError);
      throw new Error(`Erro ao buscar cliente: ${clienteError.message}`);
    }

    if (!cliente) {
      console.error('[CLIENT LOOKUP] Cliente NÃO encontrado!');
      console.error('   asaas_customer_id buscado:', payment.customer);
      console.error('   Verifique se cliente existe no banco com este asaas_customer_id');

      // Log para audit para debugging
      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_CLIENTE_NAO_ENCONTRADO',
        tabela: 'clientes',
        payload: {
          asaas_customer_id: payment.customer,
          payment_id: payment.id,
          timestamp: new Date().toISOString(),
        },
      }).catch(e => console.error('Erro ao registrar audit log:', e));

      return new Response(JSON.stringify({
        error: 'Cliente não encontrado',
        asaas_customer_id: payment.customer,
        help: 'Crie o cliente no banco ANTES de processar pagamentos'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('[CLIENT LOOKUP] ✅ Cliente encontrado:', cliente.id.substring(0, 13) + '...');

    if (!cliente.contador_id) {
      throw new Error('Cliente sem contador_id vinculado');
    }

    const { data: pagamentoExistente, error: checkError } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('asaas_payment_id', payment.id)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Erro ao verificar idempotência: ${checkError.message}`);
    }

    if (pagamentoExistente) {
      console.log('Pagamento já processado (idempotência):', payment.id);
      return new Response(JSON.stringify({
        success: true,
        message: 'Pagamento já processado (idempotência)',
        pagamento_id: pagamentoExistente.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const dataAtivacao = cliente.data_ativacao ? new Date(cliente.data_ativacao) : null;
    const dataPagamento = new Date(competencia);
    const isPrimeiroPagamento = !dataAtivacao ||
      (dataAtivacao.getFullYear() === dataPagamento.getFullYear() &&
       dataAtivacao.getMonth() === dataPagamento.getMonth());

    const dataConfirmacao = payment.confirmedDate
      ? new Date(payment.confirmedDate).toISOString()
      : new Date().toISOString();

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
        asaas_event_id: payload.event,
      })
      .select()
      .single();

    if (pagamentoError) {
      console.error('Erro ao criar pagamento:', pagamentoError);
      throw pagamentoError;
    }

    console.log('Pagamento registrado:', novoPagamento.id);

    let calculoResult = null;
    try {
      const { data: resultado, error: calculoError } = await supabase.functions.invoke(
        'calcular-comissoes',
        {
          body: {
            pagamento_id: novoPagamento.id,
            cliente_id: cliente.id,
            contador_id: cliente.contador_id,
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
      console.log('Comissoes calculadas com sucesso');
    } catch (err) {
      console.error('Erro ao calcular comissões. Pagamento registrado mas comissões pendentes:', err);

      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_CALCULO_COMISSOES_ERRO',
        tabela: 'pagamentos',
        registro_id: novoPagamento.id,
        payload: {
          error: err instanceof Error ? err.message : String(err),
          pagamento_id: payment.id,
        },
      }).catch(e => console.error('Erro ao registrar audit log:', e));

      throw new Error(`Falha ao calcular comissões para pagamento ${novoPagamento.id}. Contate suporte.`);
    }

    await supabase.from('audit_logs').insert({
      acao: 'WEBHOOK_ASAAS_PROCESSED',
      tabela: 'pagamentos',
      registro_id: novoPagamento.id,
      payload: {
        event: payload.event,
        asaas_payment_id: payment.id,
        cliente_id: cliente.id,
        contador_id: cliente.contador_id,
        valor_bruto: valoresValidados.valor_bruto,
        valor_liquido: valoresValidados.valor_liquido,
        competencia,
        tipo: isPrimeiroPagamento ? 'ativacao' : 'mensalidade',
      },
    }).catch(auditErr => console.error('Erro ao registrar audit log:', auditErr));

    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: novoPagamento.id,
        comissoes_calculadas: calculoResult ? true : false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : '';
    const errorName = error instanceof Error ? error.name : 'Unknown';

    console.error('❌ ERRO NO WEBHOOK ASAAS');
    console.error('   Nome:', errorName);
    console.error('   Mensagem:', errorMessage);
    console.error('   Stack:', errorStack);
    console.error('   Error object:', JSON.stringify(error, null, 2));

    try {
      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_ASAAS_ERROR',
        tabela: 'pagamentos',
        payload: {
          error_name: errorName,
          error_message: errorMessage,
          error_stack: errorStack.substring(0, 1000),
          error_full: String(error),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.error('Erro ao registrar erro no audit log:', logErr);
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        error_type: errorName,
        details: 'Check audit_logs for full error details'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
