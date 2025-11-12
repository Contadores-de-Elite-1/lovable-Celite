import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

// Cabeçalhos CORS básicos
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Entrada esperada da função
interface CalculationInput {
  pagamento_id: string;
  cliente_id: string;
  contador_id: string;
  valor_liquido: number;
  competencia: string; // formato "YYYY-MM-DD"
  is_primeira_mensalidade: boolean;
}

// Nível do contador (regra de negócio)
interface AccountantLevel {
  nivel: "bronze" | "prata" | "ouro" | "diamante";
  comissao_direta: number;
  override_primeira: number; // mesmo % da comissão direta do sponsor
}

// Objeto de comissão que será enviado para o RPC (jsonb[])
interface CommissionRecord {
  contador_id: string;
  cliente_id: string;
  pagamento_id: string;
  tipo:
    | "ativacao"
    | "recorrente"
    | "override"
    | "bonus_progressao"
    | "bonus_volume"
    | "bonus_contador";
  valor: number;
  percentual: number;
  competencia: string;
  status: string;
  observacao: string;
  nivel_sponsor?: string | null;
  origem_cliente_id?: string | null;
}

// Objeto de bônus que será enviado para o RPC (jsonb[])
interface BonusRecord {
  contador_id: string;
  tipo_bonus: string;
  marco_atingido?: number | null;
  valor: number;
  competencia: string;
  status: string;
  observacao: string;
}

// Objeto de log que será enviado para o RPC (jsonb[])
interface LogRecord {
  regra_aplicada: string;
  valores_intermediarios: Record<string, unknown>;
  resultado_final: number;
}

/**
 * Calcula o nível do contador com base na quantidade de clientes ativos.
 * Regra MMN fornecida.
 */
function getAccountantLevel(activeClients: number): AccountantLevel {
  if (activeClients >= 15) {
    return {
      nivel: "diamante",
      comissao_direta: 0.2,
      override_primeira: 0.2,
    };
  }

  if (activeClients >= 10) {
    return {
      nivel: "ouro",
      comissao_direta: 0.2,
      override_primeira: 0.2,
    };
  }

  if (activeClients >= 5) {
    return {
      nivel: "prata",
      comissao_direta: 0.175,
      override_primeira: 0.175,
    };
  }

  return {
    nivel: "bronze",
    comissao_direta: 0.15,
    override_primeira: 0.15,
  };
}

/**
 * Calcula a comissão direta do contador.
 */
function calculateDirectCommission(
  input: CalculationInput,
  level: AccountantLevel,
): CommissionRecord {
  if (input.is_primeira_mensalidade) {
    // Primeira mensalidade: 100% da comissão
    return {
      contador_id: input.contador_id,
      cliente_id: input.cliente_id,
      pagamento_id: input.pagamento_id,
      tipo: "ativacao",
      valor: input.valor_liquido,
      percentual: 1.0,
      competencia: input.competencia,
      status: "calculada",
      observacao: `Comissão ativação - Nível: ${level.nivel}`,
      origem_cliente_id: input.cliente_id,
    };
  }

  // Recorrente: percentual por nível
  const value = input.valor_liquido * level.comissao_direta;

  return {
    contador_id: input.contador_id,
    cliente_id: input.cliente_id,
    pagamento_id: input.pagamento_id,
    tipo: "recorrente",
    valor: value,
    percentual: level.comissao_direta,
    competencia: input.competencia,
    status: "calculada",
    observacao: `Comissão recorrente - Nível: ${level.nivel}`,
    origem_cliente_id: input.cliente_id,
  };
}

/**
 * Calcula override do sponsor.
 */
function calculateOverride(
  input: CalculationInput,
  sponsorId: string,
  sponsorLevel: AccountantLevel,
): CommissionRecord {
  let percentual: number;
  let value: number;
  let note: string;

  if (input.is_primeira_mensalidade) {
    // Primeira mensalidade: mesmo % da comissão direta do sponsor
    percentual = sponsorLevel.override_primeira;
    value = input.valor_liquido * percentual;
    note = `Override 1ª mensalidade - Nível sponsor: ${sponsorLevel.nivel}`;
  } else {
    // Recorrente: 3% / 4% / 5% de acordo com o nível do sponsor
    if (sponsorLevel.nivel === "bronze") {
      percentual = 0.03;
    } else if (sponsorLevel.nivel === "prata") {
      percentual = 0.04;
    } else {
      percentual = 0.05; // ouro ou diamante
    }
    value = input.valor_liquido * percentual;
    note = "Override recorrente MMN";
  }

  return {
    contador_id: sponsorId,
    cliente_id: input.cliente_id,
    pagamento_id: input.pagamento_id,
    tipo: "override",
    valor: value,
    percentual,
    competencia: input.competencia,
    status: "calculada",
    observacao: note,
    nivel_sponsor: sponsorLevel.nivel,
    origem_cliente_id: input.cliente_id,
  };
}

/**
 * Calcula bônus de progressão (5, 10, 15 clientes ativos).
 */
function calculateProgressBonus(
  accountantId: string,
  activeClients: number,
  competencia: string,
): BonusRecord[] {
  const milestones = [
    { qty: 5, name: "Bônus Prata" },
    { qty: 10, name: "Bônus Ouro" },
    { qty: 15, name: "Bônus Diamante" },
  ];

  return milestones
    .filter((m) => activeClients === m.qty)
    .map((m) => ({
      contador_id: accountantId,
      tipo_bonus: "bonus_progressao",
      marco_atingido: m.qty,
      valor: 100,
      competencia,
      status: "pendente",
      observacao: m.name,
    }));
}

/**
 * Calcula bônus de volume (a cada 5 clientes após 15).
 */
function calculateVolumeBonus(
  accountantId: string,
  activeClients: number,
  competencia: string,
): BonusRecord | null {
  if (activeClients >= 20 && activeClients % 5 === 0) {
    return {
      contador_id: accountantId,
      tipo_bonus: "bonus_volume",
      marco_atingido: activeClients,
      valor: 100,
      competencia,
      status: "pendente",
      observacao: `Bônus Volume - ${activeClients} clientes`,
    };
  }

  return null;
}

/**
 * Calcula bônus de indicação de contador (R$50 quando downline ativa 1º cliente).
 */
function calculateAccountantReferralBonus(
  sponsorId: string,
  childId: string,
  competencia: string,
): BonusRecord {
  return {
    contador_id: sponsorId,
    tipo_bonus: "bonus_contador",
    valor: 50,
    competencia,
    status: "pendente",
    observacao: `Bônus Indicação Contador - ${childId} ativou 1º cliente`,
  };
}

// Função principal no Deno
Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. VALIDAÇÃO DE PAYLOAD (400 se inválido)
    let input: CalculationInput;
    try {
      input = await req.json();
    } catch (e) {
      console.warn("Payload JSON inválido:", e instanceof Error ? e.message : String(e));
      return new Response(
        JSON.stringify({
          error: "Payload inválido: esperado JSON válido",
          details: "O corpo da requisição não é JSON válido"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 2. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS (400 se faltarem)
    const requiredFields = ["pagamento_id", "cliente_id", "contador_id", "competencia", "valor_liquido"];
    const missingFields = requiredFields.filter(
      (field) => !input[field as keyof CalculationInput]
    );

    if (missingFields.length > 0) {
      console.warn("Campos obrigatórios faltando:", missingFields);
      return new Response(
        JSON.stringify({
          error: "Campos obrigatórios faltando",
          missing_fields: missingFields,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 3. VALIDAÇÃO DE TIPOS (400 se tipos inválidos)
    if (typeof input.valor_liquido !== "number" || input.valor_liquido <= 0) {
      console.warn("valor_liquido inválido:", input.valor_liquido);
      return new Response(
        JSON.stringify({
          error: "Validação falhou",
          details: "valor_liquido deve ser um número positivo",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.competencia)) {
      console.warn("competencia em formato inválido:", input.competencia);
      return new Response(
        JSON.stringify({
          error: "Validação falhou",
          details: 'competencia deve estar em formato YYYY-MM-DD',
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 4. VERIFICAÇÃO DE IDEMPOTÊNCIA
    const { data: existingCommissions, error: checkError } = await supabase
      .from("comissoes")
      .select("id, pagamento_id, contador_id, tipo")
      .eq("pagamento_id", input.pagamento_id)
      .limit(3);

    if (checkError) {
      console.error("Erro ao verificar comissões existentes (erro BD):", checkError);
      // Erro de BD é 500
      return new Response(
        JSON.stringify({
          error: "Falha ao verificar comissões existentes",
          code: checkError.code,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    if (existingCommissions && existingCommissions.length > 0) {
      // Já calculado antes, devolve sucesso idempotente (200, não 201)
      console.info(`Comissões já existem para pagamento ${input.pagamento_id}:`, {
        count: existingCommissions.length,
        records: existingCommissions,
      });
      return new Response(
        JSON.stringify({
          success: true,
          message: "Comissões já calculadas para este pagamento",
          idempotent: true,
          existing_records: existingCommissions.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Busca dados do contador
    const { data: accountant, error: accountantError } = await supabase
      .from("contadores")
      .select("id, clientes_ativos")
      .eq("id", input.contador_id)
      .single();

    if (accountantError || !accountant) {
      throw new Error("Contador não encontrado");
    }

    const level = getAccountantLevel(accountant.clientes_ativos);

    const commissions: CommissionRecord[] = [];
    const bonuses: BonusRecord[] = [];
    const logs: LogRecord[] = [];

    // 1) Comissão direta
    const directCommission = calculateDirectCommission(input, level);
    commissions.push(directCommission);

    logs.push({
      regra_aplicada: input.is_primeira_mensalidade
        ? "ATIVACAO_100"
        : `RECORRENTE_${level.nivel.toUpperCase()}`,
      valores_intermediarios: {
        valor_liquido: input.valor_liquido,
        percentual: directCommission.percentual,
        nivel: level.nivel,
        clientes_ativos: accountant.clientes_ativos,
      },
      resultado_final: directCommission.valor,
    });

    // 2) Override para sponsor (se existir)
    const { data: network } = await supabase
      .from("rede_contadores")
      .select("sponsor_id")
      .eq("child_id", input.contador_id)
      .single();

    if (network?.sponsor_id) {
      const { data: sponsor } = await supabase
        .from("contadores")
        .select("id, clientes_ativos")
        .eq("id", network.sponsor_id)
        .single();

      if (sponsor) {
        const sponsorLevel = getAccountantLevel(sponsor.clientes_ativos);
        const overrideCommission = calculateOverride(
          input,
          sponsor.id,
          sponsorLevel,
        );
        commissions.push(overrideCommission);
      }
    }

    // 3) Bônus de progressão
    const progressBonuses = calculateProgressBonus(
      input.contador_id,
      accountant.clientes_ativos,
      input.competencia,
    );
    bonuses.push(...progressBonuses);

    // 4) Bônus de volume
    const volumeBonus = calculateVolumeBonus(
      input.contador_id,
      accountant.clientes_ativos,
      input.competencia,
    );
    if (volumeBonus) {
      bonuses.push(volumeBonus);
    }

    // 5) Bônus contador (se for 1º cliente do contador)
    if (input.is_primeira_mensalidade && network?.sponsor_id) {
      const { count } = await supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("contador_id", input.contador_id)
        .eq("status", "ativo");

      if (count === 1) {
        const referralBonus = calculateAccountantReferralBonus(
          network.sponsor_id,
          input.contador_id,
          input.competencia,
        );
        bonuses.push(referralBonus);
      }
    }

    // 5. CHAMADA AO RPC TRANSACIONAL
    console.info("Chamando RPC executar_calculo_comissoes com payload:", {
      pagamento_id: input.pagamento_id,
      contador_id: input.contador_id,
      cliente_id: input.cliente_id,
      num_comissoes: commissions.length,
      num_bonus: bonuses.length,
      num_logs: logs.length,
    });

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "executar_calculo_comissoes",
      {
        p_pagamento_id: input.pagamento_id,
        p_cliente_id: input.cliente_id,
        p_contador_id: input.contador_id,
        p_competencia: input.competencia,
        p_comissoes: commissions,
        p_bonus: bonuses,
        p_logs: logs,
      },
    );

    if (rpcError) {
      console.error("Erro na transação RPC executar_calculo_comissoes:", {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
      });

      // Retorna 500 para erro de BD/RPC
      return new Response(
        JSON.stringify({
          error: "Falha ao salvar comissões e bônus",
          code: rpcError.code,
          // Não expor detalhes internos em produção
          ...(Deno.env.get("ENVIRONMENT") === "development" && {
            details: rpcError.message,
          }),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.info("RPC executada com sucesso:", rpcResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comissões e bônus calculados com sucesso",
        result: rpcResult,
        summary: {
          comissoes_criadas: commissions.length,
          bonus_criados: bonuses.length,
          logs_criados: logs.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      },
    );
  } catch (error) {
    // Erro genérico não previsto (500)
    console.error("Erro inesperado ao calcular comissões:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        // Não expor mensagem em produção
        ...(Deno.env.get("ENVIRONMENT") === "development" && {
          details: message,
        }),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});