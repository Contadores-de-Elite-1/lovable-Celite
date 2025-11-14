#!/usr/bin/env node

/**
 * Test webhook with proper Asaas signature
 * Asaas signs: MD5(payload + secret)
 */

import crypto from 'crypto';

const WEBHOOK_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';

// This is the actual secret from Supabase - we need to know what Asaas expects
// For now, we'll test with common formats

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

console.log('🧪 Testing webhook with proper signature\n');
console.log('Payload:', payloadStr);
console.log();

// Common test secrets - try to figure out which one Asaas uses
const possibleSecrets = [
  'asaas-webhook-secret', // lowercase
  'ASAAS_WEBHOOK_SECRET', // env var name
  'seu_secret_aqui', // placeholder
  'test-secret',
  'webhook-secret'
];

console.log('Trying different secret formats:\n');

for (const secret of possibleSecrets) {
  const hash = crypto.createHash('md5');
  hash.update(payloadStr + secret);
  const signature = hash.digest('hex');
  
  console.log(`Secret: "${secret}"`);
  console.log(`Signature: ${signature}`);
  console.log();
}

console.log('═══════════════════════════════════════════════════════');
console.log('INFO: The actual secret is stored in Supabase secrets');
console.log('Asaas will compute: MD5(payload + secret_from_asaas_webhook_config)');
console.log('We need to find what Asaas is sending as the actual signature.');
console.log('═══════════════════════════════════════════════════════');
