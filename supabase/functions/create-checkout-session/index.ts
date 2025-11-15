/**
 * CREATE CHECKOUT SESSION - Stripe
 *
 * Cria uma sessão de checkout do Stripe para o contador assinar
 * Retorna URL para redirecionar o usuário
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCheckoutRequest {
  contador_id: string;
  price_id?: string;
  success_url: string;
  cancel_url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Initialize Stripe
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    console.log('[CREATE_CHECKOUT] Starting checkout session creation');

    // Parse request body
    const body: CreateCheckoutRequest = await req.json();
    const { contador_id, success_url, cancel_url } = body;

    // Get default price_id from env if not provided
    const price_id = body.price_id || Deno.env.get('STRIPE_PRICE_ID');

    if (!contador_id) {
      throw new Error('contador_id is required');
    }

    if (!price_id) {
      throw new Error('price_id is required (set STRIPE_PRICE_ID env var)');
    }

    console.log(`[CREATE_CHECKOUT] Contador ID: ${contador_id}`);
    console.log(`[CREATE_CHECKOUT] Price ID: ${price_id}`);

    // Get contador data from database
    const { data: contador, error: contadorError } = await supabase
      .from('contadores')
      .select('*, profiles!inner(email, nome)')
      .eq('id', contador_id)
      .single();

    if (contadorError || !contador) {
      throw new Error(`Contador not found: ${contadorError?.message}`);
    }

    console.log(`[CREATE_CHECKOUT] Contador: ${contador.profiles.nome}`);

    // Check if contador already has a Stripe customer
    const { data: existingClient } = await supabase
      .from('clientes')
      .select('stripe_customer_id')
      .eq('contador_id', contador_id)
      .not('stripe_customer_id', 'is', null)
      .maybeSingle();

    let customerId = existingClient?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log('[CREATE_CHECKOUT] Creating new Stripe customer');

      const customer = await stripe.customers.create({
        email: contador.profiles.email,
        name: contador.profiles.nome,
        metadata: {
          contador_id: contador.id,
          supabase_user_id: contador.user_id,
        },
      });

      customerId = customer.id;
      console.log(`[CREATE_CHECKOUT] Customer created: ${customerId}`);
    } else {
      console.log(`[CREATE_CHECKOUT] Using existing customer: ${customerId}`);
    }

    // Create checkout session
    console.log('[CREATE_CHECKOUT] Creating checkout session');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        contador_id: contador.id,
        supabase_user_id: contador.user_id,
      },
      subscription_data: {
        metadata: {
          contador_id: contador.id,
          supabase_user_id: contador.user_id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log(`[CREATE_CHECKOUT] Session created: ${session.id}`);
    console.log(`[CREATE_CHECKOUT] Checkout URL: ${session.url}`);

    // Log checkout creation
    await supabase.from('audit_logs').insert({
      acao: 'STRIPE_CHECKOUT_CREATED',
      tabela: 'contadores',
      registro_id: contador.id,
      payload: {
        session_id: session.id,
        customer_id: customerId,
        price_id: price_id,
        url: session.url,
        timestamp: new Date().toISOString(),
      },
    });

    // Return session details
    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        url: session.url,
        customer_id: customerId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[CREATE_CHECKOUT] ERROR:', errorMessage);
    console.error('[CREATE_CHECKOUT] Stack:', errorStack);

    // Log error
    try {
      await supabase.from('audit_logs').insert({
        acao: 'STRIPE_CHECKOUT_ERROR',
        tabela: 'contadores',
        payload: {
          error: errorMessage,
          stack: errorStack.substring(0, 500),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.error('[CREATE_CHECKOUT] Audit log error:', auditError);
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
