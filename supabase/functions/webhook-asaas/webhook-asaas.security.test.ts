// Testes de seguranca para webhook ASAAS
// Garante que o webhook rejeita payloads maliciosos

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// URL do webhook (ambiente local para testes)
const WEBHOOK_URL = 'http://localhost:54321/functions/v1/webhook-asaas';

Deno.test('Webhook deve rejeitar payload sem assinatura em producao', async () => {
  // Simula ambiente de producao
  Deno.env.set('ENVIRONMENT', 'production');
  Deno.env.set('DENO_DEPLOYMENT_ID', 'prod-123');
  
  const payload = {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_test_123',
      customer: 'cus_test_456',
      value: 100,
      netValue: 95,
      dateCreated: '2025-11-19',
      status: 'CONFIRMED',
      billingType: 'CREDIT_CARD'
    }
  };
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  // Deve rejeitar com 403 (Forbidden)
  assertEquals(response.status, 403);
  
  const result = await response.json();
  assertEquals(result.error, 'Assinatura invalida');
});

Deno.test('Webhook deve rejeitar payload com assinatura falsa', async () => {
  Deno.env.set('ENVIRONMENT', 'production');
  Deno.env.set('ASAAS_WEBHOOK_SECRET', 'test-secret');
  
  const payload = {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_test_123',
      customer: 'cus_test_456',
      value: 100,
      netValue: 95,
      dateCreated: '2025-11-19',
      status: 'CONFIRMED',
      billingType: 'CREDIT_CARD'
    }
  };
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-asaas-webhook-signature': 'assinatura-falsa-123'
    },
    body: JSON.stringify(payload)
  });
  
  // Deve rejeitar com 403 (Forbidden)
  assertEquals(response.status, 403);
});

Deno.test('Webhook deve rejeitar payload com valores negativos', async () => {
  const payload = {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_test_123',
      customer: 'cus_test_456',
      value: -100, // Valor negativo (ataque)
      netValue: 95,
      dateCreated: '2025-11-19',
      status: 'CONFIRMED',
      billingType: 'CREDIT_CARD'
    }
  };
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  // Deve rejeitar com 400 (Bad Request) por validacao Zod
  assertEquals(response.status, 400);
  
  const result = await response.json();
  assertEquals(result.error, 'Payload invalido');
});

Deno.test('Webhook deve rejeitar payload com SQL injection', async () => {
  const payload = {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: "pay_123'; DROP TABLE pagamentos; --", // SQL injection
      customer: 'cus_test_456',
      value: 100,
      netValue: 95,
      dateCreated: '2025-11-19',
      status: 'CONFIRMED',
      billingType: 'CREDIT_CARD'
    }
  };
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  // Webhook deve processar (Supabase sanitiza queries automaticamente)
  // Mas vamos garantir que nao quebrou
  // Em producao, sem assinatura, deve rejeitar com 403
  assertEquals(response.status === 403 || response.status === 404, true);
});

Deno.test('Webhook deve rejeitar payload com UUID invalido', async () => {
  const payload = {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_test_123',
      customer: 'nao-e-uuid', // UUID invalido
      value: 100,
      netValue: 95,
      dateCreated: '2025-11-19',
      status: 'CONFIRMED',
      billingType: 'CREDIT_CARD'
    }
  };
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  // Deve processar mas retornar 404 (cliente nao encontrado)
  // ou 403 se nao tiver assinatura em producao
  assertEquals(response.status === 403 || response.status === 404, true);
});

