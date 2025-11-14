import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');

interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  errors?: Array<{ property: string; message: string }>;
}

interface AsaasSubscriptionResponse {
  id: string;
  customerId: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  status: string;
  errors?: Array<{ property: string; message: string }>;
}

interface AsaasPaymentResponse {
  id: string;
  customerId: string;
  value: number;
  status: string;
  dueDate: string;
  invoiceUrl: string;
  errors?: Array<{ property: string; message: string }>;
}

interface CreateCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  observation?: string;
}

interface CreateSubscriptionPayload {
  customerId: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_ACCOUNT';
  value: number;
  nextDueDate: string;
  description: string;
  cycle?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
}

interface CreatePaymentPayload {
  customerId: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_ACCOUNT';
  value: number;
  dueDate: string;
  description: string;
}

async function createAsaasCustomer(
  payload: CreateCustomerPayload
): Promise<AsaasCustomerResponse> {
  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      cpfCnpj: payload.cpfCnpj,
      phone: payload.phone || undefined,
      observation: payload.observation || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Asaas customer creation error:', error);
    throw new Error(JSON.stringify(error));
  }

  return response.json();
}

async function createAsaasSubscription(
  payload: CreateSubscriptionPayload
): Promise<AsaasSubscriptionResponse> {
  const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      customerId: payload.customerId,
      billingType: payload.billingType,
      value: payload.value,
      nextDueDate: payload.nextDueDate,
      description: payload.description,
      cycle: payload.cycle || 'MONTHLY',
      canBeEditedByCustomer: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Asaas subscription creation error:', error);
    throw new Error(JSON.stringify(error));
  }

  return response.json();
}

async function createAsaasPayment(
  payload: CreatePaymentPayload
): Promise<AsaasPaymentResponse> {
  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      customerId: payload.customerId,
      billingType: payload.billingType,
      value: payload.value,
      dueDate: payload.dueDate,
      description: payload.description,
      notificationEnabled: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Asaas payment creation error:', error);
    throw new Error(JSON.stringify(error));
  }

  return response.json();
}

async function getPaymentStatus(paymentId: string): Promise<unknown> {
  const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY!,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Asaas payment status fetch error:', error);
    throw new Error(JSON.stringify(error));
  }

  return response.json();
}

async function getCustomerPayments(customerId: string): Promise<unknown[]> {
  const response = await fetch(
    `${ASAAS_API_URL}/payments?customerId=${customerId}&limit=100`,
    {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'access_token': ASAAS_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Asaas payments list error:', error);
    throw new Error(JSON.stringify(error));
  }

  const result = await response.json();
  return result.data || [];
}

async function validateAsaasConfig(): Promise<{ valid: boolean; message: string }> {
  if (!ASAAS_API_KEY) {
    return {
      valid: false,
      message: 'ASAAS_API_KEY environment variable is not set',
    };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        message: 'Invalid Asaas API key',
      };
    }

    return {
      valid: true,
      message: 'Asaas configuration is valid',
    };
  } catch (error) {
    return {
      valid: false,
      message: `Asaas API connection failed: ${error.message}`,
    };
  }
}

serve(async (req) => {
  const { method, url } = req;

  if (method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const pathname = new URL(url).pathname;

    // Route: POST /functions/v1/asaas-client with action=create-customer
    if (pathname === '/functions/v1/asaas-client' && method === 'POST') {
      const body = await req.json();

      switch (body.action) {
        case 'create-customer': {
          const result = await createAsaasCustomer(body.payload);
          return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case 'create-subscription': {
          const result = await createAsaasSubscription(body.payload);
          return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case 'create-payment': {
          const result = await createAsaasPayment(body.payload);
          return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case 'get-payment-status': {
          const result = await getPaymentStatus(body.paymentId);
          return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case 'get-customer-payments': {
          const result = await getCustomerPayments(body.customerId);
          return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case 'validate-config': {
          const result = await validateAsaasConfig();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Unknown action', action: body.action }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
