#!/usr/bin/env node

/**
 * Simular webhook manualmente para testar se a função funciona
 */

const WEBHOOK_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';
const ASAAS_WEBHOOK_SECRET = 'seu_secret_aqui'; // Você precisa pegar do Supabase secrets

console.log('🧪 TEST: Manual webhook simulation\n');
console.log('URL:', WEBHOOK_URL);
console.log();

// Simular payload de pagamento confirmado
const payload = {
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: 'pay_cozh725751dz79p6',
    customer: 'cus_000007222114',
    value: 299.90,
    netValue: 254.915, // valor após taxa
    dateCreated: new Date().toISOString(),
    confirmedDate: new Date().toISOString(),
    status: 'CONFIRMED',
    billingType: 'BOLETO'
  }
};

const payloadStr = JSON.stringify(payload);

console.log('📤 Enviando webhook manual...\n');
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log();

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-asaas-webhook-signature': 'test-signature' // Para teste
    },
    body: payloadStr
  });

  const result = await response.json();

  console.log('Response Status:', response.status);
  console.log('Response Body:', JSON.stringify(result, null, 2));
  console.log();

  if (response.status === 200) {
    console.log('✅ Webhook recebido com sucesso!');
  } else {
    console.log('⚠️ Webhook retornou erro:', response.status);
  }
} catch (error) {
  console.error('❌ Erro ao enviar webhook:', error.message);
}
