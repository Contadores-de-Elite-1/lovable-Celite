/**
 * Email Configuration (Resend)
 * Transactional emails for production
 */

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Supabase Edge Function
 * (Edge function calls Resend API with secret key)
 */
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(template),
      }
    );

    if (!response.ok) {
      throw new Error(`Email failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[Email] Sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Email Templates
 */

export const EmailTemplates = {
  /**
   * Welcome email for new users
   */
  welcome(email: string, name: string): EmailTemplate {
    return {
      to: email,
      subject: 'Bem-vindo aos Contadores de Elite! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bem-vindo, ${name}!</h1>
          <p>Obrigado por se juntar aos Contadores de Elite.</p>
          <p>Você agora tem acesso a:</p>
          <ul>
            <li>✅ Sistema de comissões multinível</li>
            <li>✅ Dashboard completo</li>
            <li>✅ Rede de indicações</li>
            <li>✅ Materiais educacionais</li>
          </ul>
          <p>
            <a href="https://contadores-elite.com/dashboard"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Dashboard
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Se tiver dúvidas, responda este email.
          </p>
        </div>
      `,
      text: `Bem-vindo, ${name}! Obrigado por se juntar aos Contadores de Elite. Acesse seu dashboard: https://contadores-elite.com/dashboard`,
    };
  },

  /**
   * Commission payment notification
   */
  commissionPaid(email: string, name: string, amount: number): EmailTemplate {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

    return {
      to: email,
      subject: `Comissão paga: ${formatted} 💰`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Comissão Paga! 💰</h1>
          <p>Olá ${name},</p>
          <p>Sua comissão de <strong>${formatted}</strong> foi processada e paga.</p>
          <p>
            <a href="https://contadores-elite.com/comissoes"
               style="background: #10b981; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Detalhes
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Continue crescendo sua rede!
          </p>
        </div>
      `,
      text: `Olá ${name}, sua comissão de ${formatted} foi paga! Veja os detalhes em: https://contadores-elite.com/comissoes`,
    };
  },

  /**
   * New client notification
   */
  newClient(email: string, name: string, clientName: string): EmailTemplate {
    return {
      to: email,
      subject: `Novo cliente: ${clientName} 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Novo Cliente!</h1>
          <p>Olá ${name},</p>
          <p>Você acaba de receber um novo cliente: <strong>${clientName}</strong></p>
          <p>
            <a href="https://contadores-elite.com/dashboard"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Dashboard
            </a>
          </p>
        </div>
      `,
      text: `Olá ${name}, você tem um novo cliente: ${clientName}. Acesse: https://contadores-elite.com/dashboard`,
    };
  },

  /**
   * Level up notification
   */
  levelUp(email: string, name: string, newLevel: string): EmailTemplate {
    return {
      to: email,
      subject: `Parabéns! Você subiu para ${newLevel.toUpperCase()} 🏆`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">Parabéns, ${name}! 🏆</h1>
          <p>Você acaba de alcançar o nível <strong style="text-transform: uppercase;">${newLevel}</strong>!</p>
          <p>Novos benefícios desbloqueados:</p>
          <ul>
            <li>✅ Comissões maiores</li>
            <li>✅ Bônus exclusivos</li>
            <li>✅ Suporte prioritário</li>
          </ul>
          <p>
            <a href="https://contadores-elite.com/dashboard"
               style="background: #f59e0b; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Benefícios
            </a>
          </p>
        </div>
      `,
      text: `Parabéns ${name}! Você alcançou o nível ${newLevel}! Veja seus novos benefícios: https://contadores-elite.com/dashboard`,
    };
  },

  /**
   * Password reset
   */
  passwordReset(email: string, resetLink: string): EmailTemplate {
    return {
      to: email,
      subject: 'Redefinir sua senha - Contadores de Elite',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Redefinir Senha</h1>
          <p>Você solicitou redefinir sua senha.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <p>
            <a href="${resetLink}"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Redefinir Senha
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Se você não solicitou isso, ignore este email.
            <br>Este link expira em 1 hora.
          </p>
        </div>
      `,
      text: `Redefinir senha: ${resetLink} (expira em 1 hora)`,
    };
  },
};

export default {
  sendEmail,
  EmailTemplates,
};
