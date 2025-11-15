// 🔍 VALIDATE STRIPE ENV - Diagnóstico de variáveis de ambiente
// Esta edge function valida se todas as env vars necessárias estão configuradas
// Data: 15 de novembro de 2025

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ValidationResult {
  variable: string;
  configured: boolean;
  valid: boolean;
  message: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  console.log('[VALIDATE-STRIPE-ENV] Starting validation...');

  const results: ValidationResult[] = [];

  // 1. Validate STRIPE_SECRET_KEY
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  results.push({
    variable: 'STRIPE_SECRET_KEY',
    configured: !!stripeSecretKey,
    valid: !!(stripeSecretKey && (stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('sk_live_'))),
    message: !stripeSecretKey
      ? '❌ Not configured'
      : stripeSecretKey.startsWith('sk_test_')
      ? '✅ Configured (TEST mode)'
      : stripeSecretKey.startsWith('sk_live_')
      ? '✅ Configured (LIVE mode)'
      : '⚠️ Invalid format (should start with sk_test_ or sk_live_)',
  });

  // 2. Validate STRIPE_WEBHOOK_SECRET
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  results.push({
    variable: 'STRIPE_WEBHOOK_SECRET',
    configured: !!webhookSecret,
    valid: !!(webhookSecret && webhookSecret.startsWith('whsec_')),
    message: !webhookSecret
      ? '❌ Not configured'
      : webhookSecret.startsWith('whsec_')
      ? '✅ Configured'
      : '⚠️ Invalid format (should start with whsec_)',
  });

  // 3. Validate STRIPE_PRICE_ID
  const priceId = Deno.env.get('STRIPE_PRICE_ID');
  results.push({
    variable: 'STRIPE_PRICE_ID',
    configured: !!priceId,
    valid: !!(priceId && priceId.startsWith('price_')),
    message: !priceId
      ? '❌ Not configured'
      : priceId.startsWith('price_')
      ? '✅ Configured'
      : '⚠️ Invalid format (should start with price_)',
  });

  // 4. Validate SUPABASE_URL (should be auto-configured)
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  results.push({
    variable: 'SUPABASE_URL',
    configured: !!supabaseUrl,
    valid: !!(supabaseUrl && supabaseUrl.includes('supabase.co')),
    message: !supabaseUrl
      ? '❌ Not configured (this is auto-configured by Supabase)'
      : '✅ Auto-configured by Supabase',
  });

  // 5. Validate SUPABASE_SERVICE_ROLE_KEY (should be auto-configured)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  results.push({
    variable: 'SUPABASE_SERVICE_ROLE_KEY',
    configured: !!serviceRoleKey,
    valid: !!serviceRoleKey,
    message: !serviceRoleKey
      ? '❌ Not configured (this is auto-configured by Supabase)'
      : '✅ Auto-configured by Supabase',
  });

  // Calculate overall status
  const allConfigured = results.every((r) => r.configured);
  const allValid = results.every((r) => r.valid);

  const status = allConfigured && allValid ? 'READY' : allConfigured ? 'INVALID' : 'INCOMPLETE';

  // Test Stripe connection (if key is valid)
  let stripeConnectionTest = null;
  if (results[0].valid && stripeSecretKey) {
    try {
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      });

      if (response.ok) {
        stripeConnectionTest = {
          success: true,
          message: '✅ Successfully connected to Stripe API',
        };
      } else {
        const error = await response.text();
        stripeConnectionTest = {
          success: false,
          message: `❌ Failed to connect to Stripe API: ${error}`,
        };
      }
    } catch (error) {
      stripeConnectionTest = {
        success: false,
        message: `❌ Error connecting to Stripe: ${error.message}`,
      };
    }
  }

  // Build response
  const response = {
    status,
    summary: {
      total: results.length,
      configured: results.filter((r) => r.configured).length,
      valid: results.filter((r) => r.valid).length,
      ready: allConfigured && allValid,
    },
    results,
    stripeConnection: stripeConnectionTest,
    recommendations:
      status === 'READY'
        ? ['✅ All environment variables are configured correctly!', '🚀 You can now use Stripe in production']
        : status === 'INVALID'
        ? [
            '⚠️ Some environment variables have invalid formats',
            'Check the results above and fix the invalid variables',
            'Visit: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions',
          ]
        : [
            '❌ Some required environment variables are missing',
            'Configure the missing variables in Supabase dashboard:',
            'https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions',
            '',
            'Required variables:',
            '- STRIPE_SECRET_KEY (from https://dashboard.stripe.com/apikeys)',
            '- STRIPE_WEBHOOK_SECRET (from https://dashboard.stripe.com/webhooks)',
            '- STRIPE_PRICE_ID (from https://dashboard.stripe.com/products)',
          ],
    nextSteps:
      status === 'READY'
        ? [
            '1. Create a product in Stripe dashboard',
            '2. Configure webhook endpoint in Stripe',
            '3. Test checkout flow',
            '4. Verify commission calculation',
          ]
        : [
            '1. Configure missing/invalid environment variables',
            '2. Run this validation again',
            '3. Test Stripe connection',
          ],
    timestamp: new Date().toISOString(),
  };

  console.log('[VALIDATE-STRIPE-ENV] Validation complete:', status);

  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
