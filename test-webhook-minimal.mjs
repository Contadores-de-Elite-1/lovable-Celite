#!/usr/bin/env node

/**
 * Minimal webhook test - just check if function accepts it
 */

const WEBHOOK_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';

console.log('🚀 Minimal webhook test\n');

const payload = {
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: 'test-payment-' + Date.now(),
    customer: 'cus-test',
    value: 100,
    netValue: 90,
    dateCreated: new Date().toISOString(),
    confirmedDate: new Date().toISOString(),
    status: 'CONFIRMED',
    billingType: 'BOLETO'
  }
};

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  console.log(`Status: ${response.status}`);
  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));

  if (response.status >= 200 && response.status < 300) {
    console.log('\n✅ Webhook accepted (2xx response)');
  } else if (response.status === 401) {
    console.log('\n⚠️  Signature validation failed');
  } else if (response.status === 404) {
    console.log('\n⚠️  Customer or payment not found (expected for test data)');
  } else if (response.status === 500) {
    console.log('\n❌ Server error');
    console.log('Check: Did payment get created before?');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
}
