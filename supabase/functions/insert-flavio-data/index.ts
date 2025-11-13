import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Profiles
    const profiles = [
      { id: "550e8400-e29b-41d4-a716-446655440001", nome: "Flávio Augusto", email: "flavio@ex.com", cpf: "11111111111" },
      { id: "550e8400-e29b-41d4-a716-446655440002", nome: "Paulo Silva", email: "paulo@ex.com", cpf: "22222222222" },
      { id: "550e8400-e29b-41d4-a716-446655440003", nome: "Ana Costa", email: "ana@ex.com", cpf: "33333333333" },
      { id: "550e8400-e29b-41d4-a716-446655440004", nome: "Roberto Lima", email: "roberto@ex.com", cpf: "44444444444" }
    ];

    for (const profile of profiles) {
      await supabase.from("profiles").upsert(profile);
    }

    // 2. Contadores
    const contadores = [
      { id: "550e8400-e29b-41d4-a716-446655440011", user_id: "550e8400-e29b-41d4-a716-446655440001", nivel: "bronze", status: "ativo" },
      { id: "550e8400-e29b-41d4-a716-446655440012", user_id: "550e8400-e29b-41d4-a716-446655440002", nivel: "bronze", status: "ativo" },
      { id: "550e8400-e29b-41d4-a716-446655440013", user_id: "550e8400-e29b-41d4-a716-446655440003", nivel: "bronze", status: "ativo" },
      { id: "550e8400-e29b-41d4-a716-446655440014", user_id: "550e8400-e29b-41d4-a716-446655440004", nivel: "bronze", status: "ativo" }
    ];

    for (const contador of contadores) {
      await supabase.from("contadores").upsert(contador);
    }

    // 3. Clientes (20)
    const clientes = [];
    for (let i = 0; i < 20; i++) {
      clientes.push({
        id: `c0000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
        contador_id: "550e8400-e29b-41d4-a716-446655440011",
        nome_empresa: `Cliente ${String(i + 1).padStart(2, "0")}`,
        cnpj: String(i + 1).padStart(14, "0"),
        contato_nome: `Contato ${String(i + 1).padStart(2, "0")}`,
        contato_email: `c${i}@ex.com`,
        plano: i % 3 === 2 ? "premium" : "profissional",
        valor_mensal: 100 + (i * 5),
        status: "ativo",
        data_ativacao: `2025-01-${String(15 + (i % 15)).padStart(2, "0")}`
      });
    }

    await supabase.from("clientes").upsert(clientes);

    // 4. Bônus (7)
    const bonus = [
      { contador_id: "550e8400-e29b-41d4-a716-446655440011", tipo_bonus: "bonus_progressao", valor: 100, competencia: "2025-03-15", status: "calculada", descricao: "Prata" },
      { contador_id: "550e8400-e29b-41d4-a716-446655440011", tipo_bonus: "bonus_progressao", valor: 100, competencia: "2025-04-15", status: "calculada", descricao: "Ouro" },
      { contador_id: "550e8400-e29b-41d4-a716-446655440011", tipo_bonus: "bonus_volume", valor: 100, competencia: "2025-03-15", status: "calculada", descricao: "Volume 5" },
      { contador_id: "550e8400-e29b-41d4-a716-446655440011", tipo_bonus: "bonus_volume", valor: 100, competencia: "2025-04-15", status: "calculada", descricao: "Volume 10" },
      { contador_id: "550e8400-e29b-41d4-a716-446655440011", tipo_bonus: "bonus_volume", valor: 100, competencia: "2025-06-10", status: "calculada", descricao: "Volume 15" },
      { contador_id: "550e8400-e29b-41d4-a716-446655440011", tipo_bonus: "bonus_volume", valor: 100, competencia: "2025-09-15", status: "calculada", descricao: "Volume 20" },
      { contador_id: "550e8400-e29b-41d4-a716-446655440011", tipo_bonus: "bonus_ltv", valor: 1038.75, competencia: "2025-10-15", status: "calculada", descricao: "LTV 15+" }
    ];

    await supabase.from("bonus_historico").upsert(bonus);

    return new Response(JSON.stringify({ success: true, message: "Flávio inserted successfully" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500 });
  }
});
