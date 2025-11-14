import { supabase } from '@/integrations/supabase/client';

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface AsaasSubscription {
  id: string;
  customerId: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_ACCOUNT';
  value: number;
  nextDueDate: string;
  status: string;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
}

export interface AsaasPayment {
  id: string;
  customerId: string;
  value: number;
  status: string;
  dueDate: string;
  invoiceUrl?: string;
  billingType: string;
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  observation?: string;
}

export interface CreateSubscriptionPayload {
  customerId: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_ACCOUNT';
  value: number;
  nextDueDate: string;
  description: string;
  cycle?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
}

export interface CreatePaymentPayload {
  customerId: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_ACCOUNT';
  value: number;
  dueDate: string;
  description: string;
}

class AsaasClient {
  private functionUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.functionUrl = `${supabaseUrl}/functions/v1/asaas-client`;
  }

  private async callFunction<T>(action: string, payload?: unknown): Promise<T> {
    try {
      const { data, error } = await supabase.functions.invoke('asaas-client', {
        body: {
          action,
          ...(payload && { payload }),
          paymentId: action === 'get-payment-status' ? payload : undefined,
          customerId: action === 'get-customer-payments' ? payload : undefined,
        },
      });

      if (error) {
        throw new Error(`Asaas client error: ${JSON.stringify(error)}`);
      }

      if (!data.success && data.error) {
        throw new Error(`Asaas API error: ${data.error}`);
      }

      return data.data || data;
    } catch (error) {
      console.error(`Asaas client error (${action}):`, error);
      throw error;
    }
  }

  async createCustomer(payload: CreateCustomerPayload): Promise<AsaasCustomer> {
    return this.callFunction<AsaasCustomer>('create-customer', payload);
  }

  async createSubscription(
    payload: CreateSubscriptionPayload
  ): Promise<AsaasSubscription> {
    return this.callFunction<AsaasSubscription>('create-subscription', payload);
  }

  async createPayment(payload: CreatePaymentPayload): Promise<AsaasPayment> {
    return this.callFunction<AsaasPayment>('create-payment', payload);
  }

  async getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
    return this.callFunction<AsaasPayment>('get-payment-status', paymentId);
  }

  async getCustomerPayments(customerId: string): Promise<AsaasPayment[]> {
    return this.callFunction<AsaasPayment[]>(
      'get-customer-payments',
      customerId
    );
  }

  async validateConfig(): Promise<{ valid: boolean; message: string }> {
    return this.callFunction<{ valid: boolean; message: string }>(
      'validate-config'
    );
  }
}

export const asaasClient = new AsaasClient();
