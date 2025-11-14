/**
 * Webhook Simulator for Asaas Payment Events
 * Used for local testing without making actual Asaas API calls
 */

import { supabase } from '@/integrations/supabase/client';

export interface MockWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    dateCreated: string;
    confirmedDate?: string;
    status: string;
    billingType: string;
    subscription?: string;
  };
}

export class WebhookSimulator {
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.webhookUrl =
      webhookUrl || `${supabaseUrl}/functions/v1/webhook-asaas`;
  }

  /**
   * Simulate a payment confirmation webhook
   */
  async simulatePaymentConfirmed(
    customerId: string,
    paymentValue: number,
    options?: {
      paymentId?: string;
      dateCreated?: string;
      billingType?: string;
    }
  ): Promise<unknown> {
    const now = new Date();
    const payload: MockWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: options?.paymentId || `mock_${Date.now()}`,
        customer: customerId,
        value: paymentValue,
        netValue: paymentValue * 0.97, // 3% fee simulation
        dateCreated: options?.dateCreated || now.toISOString(),
        confirmedDate: now.toISOString(),
        status: 'CONFIRMED',
        billingType: options?.billingType || 'CREDIT_CARD',
      },
    };

    return this.sendWebhook(payload);
  }

  /**
   * Simulate a payment received webhook
   */
  async simulatePaymentReceived(
    customerId: string,
    paymentValue: number,
    options?: {
      paymentId?: string;
      dateCreated?: string;
    }
  ): Promise<unknown> {
    const now = new Date();
    const payload: MockWebhookPayload = {
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: options?.paymentId || `mock_${Date.now()}`,
        customer: customerId,
        value: paymentValue,
        netValue: paymentValue * 0.97,
        dateCreated: options?.dateCreated || now.toISOString(),
        confirmedDate: now.toISOString(),
        status: 'RECEIVED',
        billingType: 'CREDIT_CARD',
      },
    };

    return this.sendWebhook(payload);
  }

  /**
   * Simulate a subscription created webhook
   */
  async simulateSubscriptionCreated(
    customerId: string,
    subscriptionValue: number,
    options?: {
      subscriptionId?: string;
      dateCreated?: string;
    }
  ): Promise<unknown> {
    const now = new Date();
    const payload: MockWebhookPayload = {
      event: 'SUBSCRIPTION_CREATED',
      payment: {
        id: options?.subscriptionId || `sub_${Date.now()}`,
        customer: customerId,
        value: subscriptionValue,
        netValue: subscriptionValue * 0.97,
        dateCreated: options?.dateCreated || now.toISOString(),
        status: 'ACTIVE',
        billingType: 'CREDIT_CARD',
      },
    };

    return this.sendWebhook(payload);
  }

  /**
   * Simulate a payment received in cash webhook
   */
  async simulatePaymentReceivedInCash(
    customerId: string,
    paymentValue: number,
    options?: {
      paymentId?: string;
      dateCreated?: string;
    }
  ): Promise<unknown> {
    const now = new Date();
    const payload: MockWebhookPayload = {
      event: 'PAYMENT_RECEIVED_IN_CASH',
      payment: {
        id: options?.paymentId || `cash_${Date.now()}`,
        customer: customerId,
        value: paymentValue,
        netValue: paymentValue, // No fee for cash
        dateCreated: options?.dateCreated || now.toISOString(),
        confirmedDate: now.toISOString(),
        status: 'RECEIVED',
        billingType: 'CASH',
      },
    };

    return this.sendWebhook(payload);
  }

  /**
   * Send webhook to the webhook-asaas function
   */
  private async sendWebhook(payload: MockWebhookPayload): Promise<unknown> {
    try {
      console.log('Sending mock webhook:', payload);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No signature for local testing
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `Webhook failed: ${result.error || response.statusText}`
        );
      }

      return {
        success: true,
        data: result,
        message: 'Webhook simulado com sucesso',
      };
    } catch (error) {
      console.error('Webhook simulation error:', error);
      throw error;
    }
  }

  /**
   * Simulate a complete payment flow for testing
   * 1. Create customer
   * 2. Send payment confirmed
   * 3. Send payment received
   */
  async simulateCompletePaymentFlow(
    customerId: string,
    paymentValue: number,
    options?: {
      delayBetweenEvents?: number;
    }
  ): Promise<unknown> {
    const delay = options?.delayBetweenEvents || 2000;

    try {
      console.log('Starting payment flow simulation...');

      // Step 1: Payment Confirmed
      console.log('Step 1: Sending PAYMENT_CONFIRMED');
      await this.simulatePaymentConfirmed(customerId, paymentValue);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Step 2: Payment Received
      console.log('Step 2: Sending PAYMENT_RECEIVED');
      await this.simulatePaymentReceived(customerId, paymentValue);

      return {
        success: true,
        message: 'Complete payment flow simulated successfully',
      };
    } catch (error) {
      console.error('Payment flow simulation error:', error);
      throw error;
    }
  }

  /**
   * Get test data fixtures
   */
  static getTestFixtures() {
    return {
      testCustomerId: 'cus_mock_test_123456',
      testPaymentAmounts: [
        99.99, // Below threshold
        150.0, // Standard
        1000.0, // Large
      ],
      testBillingTypes: ['CREDIT_CARD', 'PIX', 'BOLETO', 'DEBIT_ACCOUNT'],
    };
  }
}

export const webhookSimulator = new WebhookSimulator();
