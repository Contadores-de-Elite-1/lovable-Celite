#!/usr/bin/env node

/**
 * Test webhook after deployment to cloud
 * This tests if the fixed webhook function is working
 */

const WEBHOOK_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';

console.log('🚀 Testing deployed webhook function\n');
console.log('═══════════════════════════════════════════════════════\n');

// Simular payload de pagamento confirmado
const payload = {
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: 'pay_cozh725751dz79p6',
    customer: 'cus_000007222114',
    value: 299.90,
    netValue: 254.915,
    dateCreated: new Date().toISOString(),
    confirmedDate: new Date().toISOString(),
    status: 'CONFIRMED',
    billingType: 'BOLETO'
  }
};

const payloadStr = JSON.stringify(payload);

console.log('📤 Enviando webhook para função deployada...\n');
console.log('URL:', WEBHOOK_URL);
console.log('Event:', payload.event);
console.log('Payment ID:', payload.payment.id);
console.log('Value:', payload.payment.value);
console.log();

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Sem signature - deixar a função decidir
    },
    body: payloadStr
  });

  const result = await response.json();

  console.log('📥 Response recebido:\n');
  console.log(`Status: ${response.status}`);
  console.log(`Body:`, JSON.stringify(result, null, 2));
  console.log();

  if (response.status === 200) {
    console.log('✅ WEBHOOK FUNCIONANDO!');
    console.log('   A função webhook foi deployada com sucesso!');
    console.log('   Agora você pode simular pagamento no Asaas.');
  } else if (response.status === 401) {
    console.log('⚠️  Assinatura inválida (esperado se sem secret)');
    console.log('   Mas a função respondeu, então está deployada.');
  } else if (response.status === 404) {
    console.log('❌ Pagamento não encontrado (cliente/pagamento não existe)');
    console.log('   Isso é esperado - use o E2E test completo primeiro.');
  } else {
    console.log(`⚠️  Resposta inesperada: ${response.status}`);
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📋 PRÓXIMOS PASSOS:\n');
  console.log('1. Ir para Asaas Sandbox: https://sandbox.asaas.com/login');
  console.log('2. Navegar: Cobranças → Localizar');
  console.log('3. Buscar: pay_cozh725751dz79p6');
  console.log('4. Clicar: "Simular Pagamento"');
  console.log('5. Webhook será enviado para função na cloud!');
  console.log();
  console.log('🔍 Para verificar resultado:');
  console.log('   node test-cloud-verify-results.mjs');
  console.log();

} catch (error) {
  console.error('❌ Erro ao enviar webhook:', error.message);
  console.log();
  console.log('Possíveis causas:');
  console.log('- URL da função está incorreta');
  console.log('- Função não está deployada');
  console.log('- Problema de rede');
}
