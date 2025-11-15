/**
 * Health Check Edge Function
 * Returns status of all services
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceStatus;
    stripe: ServiceStatus;
    functions: ServiceStatus;
  };
  version: string;
}

interface ServiceStatus {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: await checkDatabase(),
        stripe: await checkStripe(),
        functions: await checkFunctions(),
      },
      version: '1.0.0',
    };

    // Determine overall status
    const services = Object.values(health.services);
    if (services.some((s) => s.status === 'down')) {
      health.status = services.filter((s) => s.status === 'down').length > 1 ? 'unhealthy' : 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(health), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Health] Error:', error);

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

/**
 * Check database connection
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase.from('profiles').select('count').limit(1);

    if (error) throw error;

    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
    };
  }
}

/**
 * Check Stripe connectivity
 */
async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Simple API call to check connectivity
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Stripe API returned ${response.status}`);
    }

    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
    };
  }
}

/**
 * Check edge functions
 */
async function checkFunctions(): Promise<ServiceStatus> {
  // For now, always return up if we're running
  return {
    status: 'up',
    responseTime: 0,
  };
}
