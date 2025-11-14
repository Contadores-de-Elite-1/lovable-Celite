import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Email template types
interface EmailRequest {
  tipo: "approval_pending" | "approved" | "rejected" | "payment_processed";
  comissao_id: string;
  contador_id: string;
  destinatario: string;
  contador_nome: string;
  valor: number;
  tipo_comissao: string;
  competencia: string;
  motivo_rejeicao?: string;
}

// Email templates
function getTemplate(request: EmailRequest): { subject: string; html: string } {
  switch (request.tipo) {
    case "approval_pending":
      return {
        subject: "Comissão Aguardando Aprovação - Contadores de Elite",
        html: `
          <h2>Comissão Registrada e Aguardando Aprovação</h2>
          <p>Olá ${request.contador_nome},</p>
          <p>Sua comissão foi calculada e está aguardando aprovação.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Tipo:</strong> ${request.tipo_comissao}</p>
            <p><strong>Valor:</strong> R$ ${request.valor.toFixed(2)}</p>
            <p><strong>Competência:</strong> ${request.competencia}</p>
            <p><strong>Status:</strong> Calculada (Aguardando Aprovação)</p>
          </div>
          <p>Você será notificado assim que a comissão for aprovada ou se houver alguma dúvida.</p>
          <p>Atenciosamente,<br/>Equipe Contadores de Elite</p>
        `,
      };

    case "approved":
      return {
        subject: "Comissão Aprovada! ✅ - Contadores de Elite",
        html: `
          <h2>Comissão Aprovada com Sucesso</h2>
          <p>Ótimas notícias, ${request.contador_nome}!</p>
          <p>Sua comissão foi aprovada e será processada em breve.</p>
          <div style="background: #e8f5e9; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4caf50;">
            <p><strong>Tipo:</strong> ${request.tipo_comissao}</p>
            <p><strong>Valor:</strong> R$ ${request.valor.toFixed(2)}</p>
            <p><strong>Competência:</strong> ${request.competencia}</p>
            <p><strong>Status:</strong> ✅ Aprovada</p>
          </div>
          <p>O pagamento será processado conforme cronograma (acumulado até R$ 100,00).</p>
          <p>Obrigado por fazer parte da Contadores de Elite!</p>
        `,
      };

    case "rejected":
      return {
        subject: "Comissão Requer Revisão - Contadores de Elite",
        html: `
          <h2>Comissão Requer Revisão</h2>
          <p>Olá ${request.contador_nome},</p>
          <p>Sua comissão foi revisada e necessita de ajustes.</p>
          <div style="background: #fff3e0; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ff9800;">
            <p><strong>Tipo:</strong> ${request.tipo_comissao}</p>
            <p><strong>Valor:</strong> R$ ${request.valor.toFixed(2)}</p>
            <p><strong>Competência:</strong> ${request.competencia}</p>
            <p><strong>Motivo:</strong> ${request.motivo_rejeicao || "Revisar detalhes"}</p>
          </div>
          <p>Por favor, entre em contato com o suporte para discutir os detalhes.</p>
          <p>Equipe Contadores de Elite</p>
        `,
      };

    case "payment_processed":
      return {
        subject: "Pagamento de Comissão Processado - Contadores de Elite",
        html: `
          <h2>Pagamento Processado com Sucesso 💰</h2>
          <p>Olá ${request.contador_nome},</p>
          <p>Seu pagamento de comissão foi processado com sucesso!</p>
          <div style="background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196f3;">
            <p><strong>Valor Total:</strong> R$ ${request.valor.toFixed(2)}</p>
            <p><strong>Período:</strong> ${request.competencia}</p>
            <p><strong>Status:</strong> ✅ Pago</p>
          </div>
          <p>Verifique sua conta bancária nos próximos dias úteis.</p>
          <p>Obrigado pela sua dedicação!</p>
          <p>Equipe Contadores de Elite</p>
        `,
      };

    default:
      throw new Error(`Unknown email type: ${request.tipo}`);
  }
}

serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Parse request
    const request: EmailRequest = await req.json();

    // Validate required fields
    const requiredFields = [
      "tipo",
      "comissao_id",
      "contador_id",
      "destinatario",
      "contador_nome",
      "valor",
      "tipo_comissao",
      "competencia",
    ];

    for (const field of requiredFields) {
      if (!request[field as keyof EmailRequest]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Get email template
    const { subject, html } = getTemplate(request);

    // TODO: In production, integrate with email service (Resend, SendGrid, AWS SES, etc.)
    // For now, log and mark as sent in DB
    console.log("Email to send:", {
      to: request.destinatario,
      subject,
      comissao_id: request.comissao_id,
      tipo: request.tipo,
    });

    // Update approval_emails table to mark as sent
    // This will be called by the EdgeFunction's RLS-compliant user
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log email send attempt
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/approval_emails`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        comissao_id: request.comissao_id,
        contador_id: request.contador_id,
        tipo: request.tipo,
        destinatario: request.destinatario,
        status: "enviado",
        tentativas: 1,
      }),
    });

    if (!insertResponse.ok) {
      console.error("Failed to log email:", await insertResponse.text());
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email prepared for sending",
        email_type: request.tipo,
        destinatario: request.destinatario,
        comissao_id: request.comissao_id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-approval-email:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
