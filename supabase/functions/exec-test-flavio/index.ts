import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  // Validar que é POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Inserir Contador
    const { error: contadorError } = await supabase
      .from("contadores")
      .upsert({
        id: "550e8400-e29b-41d4-a716-446655440001",
        nome: "Flávio Augusto",
        email: "flavio@augustocontabilidade.com",
        asaas_customer_id: "cust_flavio_001",
        data_ativacao: "2025-01-01",
      });

    if (contadorError) throw contadorError;

    // Inserir 20 clientes
    const clientes = [
      { id: "cli_flavio_001", nome: "Tech Solutions", valor: 100, plano: "Pro" },
      { id: "cli_flavio_002", nome: "Consultoria XYZ", valor: 130, plano: "Premium" },
      { id: "cli_flavio_003", nome: "Auditoria ABC", valor: 180, plano: "Top" },
      { id: "cli_flavio_004", nome: "Fiscal Consultoria", valor: 100, plano: "Pro" },
      { id: "cli_flavio_005", nome: "Contabilidade Plus", valor: 130, plano: "Premium" },
      { id: "cli_flavio_006", nome: "Assessoria Fiscal", valor: 100, plano: "Top" },
      { id: "cli_flavio_007", nome: "Tributação", valor: 130, plano: "Premium" },
      { id: "cli_flavio_008", nome: "Pericia Contábil", valor: 180, plano: "Top" },
      { id: "cli_flavio_009", nome: "Auditores Associados", valor: 100, plano: "Pro" },
      { id: "cli_flavio_010", nome: "Controladoria ABC", valor: 130, plano: "Premium" },
      { id: "cli_flavio_011", nome: "Gestão Empresarial", valor: 180, plano: "Top" },
      { id: "cli_flavio_012", nome: "Imposto de Renda", valor: 100, plano: "Pro" },
      { id: "cli_flavio_013", nome: "Consultoria Contábil", valor: 130, plano: "Premium" },
      { id: "cli_flavio_014", nome: "Análise Fiscal", valor: 150, plano: "Top" },
      { id: "cli_flavio_015", nome: "Planejamento Tributário", valor: 100, plano: "Pro" },
      { id: "cli_flavio_016", nome: "Controladoria Financeira", valor: 130, plano: "Premium" },
      { id: "cli_flavio_017", nome: "Serviços Contábeis", valor: 180, plano: "Top" },
      { id: "cli_flavio_018", nome: "Assessoria Tributária", valor: 100, plano: "Pro" },
      { id: "cli_flavio_019", nome: "Análise de Custos", valor: 130, plano: "Premium" },
      { id: "cli_flavio_020", nome: "Estruturação Tributária", valor: 180, plano: "Top" },
    ];

    const clientesFormatted = clientes.map((c, i) => ({
      id: c.id,
      contador_id: "550e8400-e29b-41d4-a716-446655440001",
      nome: c.nome,
      asaas_customer_id: `asaas_${String(i + 1).padStart(3, "0")}`,
      plano: c.plano,
      data_ativacao: new Date(2025, 0, 15 + Math.floor(i / 5) * 5).toISOString().split("T")[0],
      valor_mensalidade: c.valor,
      status: "ativo",
    }));

    const { error: clientesError } = await supabase
      .from("clientes")
      .upsert(clientesFormatted, { onConflict: "id" });

    if (clientesError) throw clientesError;

    // Inserir Bônus
    const bonus = [
      { tipo: "bonus_progressao", valor: 100, data: "2025-03-15", marco: 5, obs: "Prata (5)" },
      { tipo: "bonus_progressao", valor: 100, data: "2025-04-15", marco: 10, obs: "Ouro (10)" },
      { tipo: "bonus_volume", valor: 100, data: "2025-03-15", marco: 5, obs: "Volume 5" },
      { tipo: "bonus_volume", valor: 100, data: "2025-04-15", marco: 10, obs: "Volume 10" },
      { tipo: "bonus_volume", valor: 100, data: "2025-06-10", marco: 15, obs: "Volume 15" },
      { tipo: "bonus_volume", valor: 100, data: "2025-09-15", marco: 20, obs: "Volume 20" },
      { tipo: "bonus_ltv", valor: 1038.75, data: "2025-10-15", marco: 15, obs: "LTV 15+ limit 50%" },
    ];

    const bonusFormatted = bonus.map((b) => ({
      contador_id: "550e8400-e29b-41d4-a716-446655440001",
      tipo_bonus: b.tipo,
      valor: b.valor,
      competencia: b.data,
      status: "pendente",
      observacao: b.obs,
      marco_atingido: b.marco,
    }));

    const { error: bonusError } = await supabase
      .from("bonus_historico")
      .insert(bonusFormatted);

    if (bonusError) throw bonusError;

    // Inserir Comissões
    const { error: comissaoError } = await supabase
      .from("comissoes")
      .insert([
        {
          contador_id: "550e8400-e29b-41d4-a716-446655440001",
          tipo: "ativacao",
          valor: 8098,
          percentual: 1.0,
          competencia: "2025-01-15",
          status: "calculada",
          observacao: "20 ativações",
        },
        {
          contador_id: "550e8400-e29b-41d4-a716-446655440001",
          tipo: "recorrente",
          valor: 1469,
          percentual: 0.15,
          competencia: "2025-02-15",
          status: "calculada",
          observacao: "Comissão recorrente",
        },
      ]);

    if (comissaoError) throw comissaoError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Flávio test data inserted successfully",
        totals: {
          clientes: 20,
          comissoes: 9567,
          bonus: 1638.75,
          total: 10405.75,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
