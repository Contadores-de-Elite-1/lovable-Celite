import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const ASAAS_CUSTOMER_ID = 'cus_000007222099';

    console.log(`[CREATE-TEST-CLIENT] Verificando cliente ${ASAAS_CUSTOMER_ID}...`);

    // 1. Verificar se cliente já existe
    const { data: clienteExistente, error: erroConsulta } = await supabase
      .from('clientes')
      .select('id, contador_id, nome_empresa, asaas_customer_id, status, plano, valor_mensal')
      .eq('asaas_customer_id', ASAAS_CUSTOMER_ID)
      .maybeSingle();

    if (erroConsulta) {
      console.error('[CREATE-TEST-CLIENT] Erro ao consultar cliente:', erroConsulta);
      throw erroConsulta;
    }

    if (clienteExistente) {
      console.log('[CREATE-TEST-CLIENT] Cliente JÁ EXISTE:', clienteExistente);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cliente já existe',
          cliente: clienteExistente,
          created: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log('[CREATE-TEST-CLIENT] Cliente não existe. Criando...');

    // 2. Buscar contador ativo
    let { data: contadores, error: erroContador } = await supabase
      .from('contadores')
      .select('id, user_id, nivel, status')
      .eq('status', 'ativo')
      .limit(1);

    if (erroContador) {
      console.error('[CREATE-TEST-CLIENT] Erro ao buscar contador:', erroContador);
      throw erroContador;
    }

    let contador;

    if (!contadores || contadores.length === 0) {
      console.log('[CREATE-TEST-CLIENT] Nenhum contador ativo. Criando...');

      // Buscar primeiro usuário
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

      if (userError || !users || users.length === 0) {
        throw new Error('Nenhum usuário encontrado no sistema');
      }

      const user = users[0];
      console.log(`[CREATE-TEST-CLIENT] Usando usuário: ${user.email || user.id}`);

      // Criar contador
      const { data: novoContador, error: criarError } = await supabase
        .from('contadores')
        .insert({
          user_id: user.id,
          nivel: 'bronze',
          status: 'ativo',
          xp: 0,
          clientes_ativos: 0
        })
        .select()
        .single();

      if (criarError) {
        console.error('[CREATE-TEST-CLIENT] Erro ao criar contador:', criarError);
        throw criarError;
      }

      contador = novoContador;
      console.log(`[CREATE-TEST-CLIENT] Contador criado: ${contador.id}`);
    } else {
      contador = contadores[0];
      console.log(`[CREATE-TEST-CLIENT] Contador encontrado: ${contador.id}`);
    }

    // 3. Criar cliente
    console.log('[CREATE-TEST-CLIENT] Criando cliente no banco...');

    const { data: novoCliente, error: clienteError } = await supabase
      .from('clientes')
      .insert({
        contador_id: contador.id,
        nome_empresa: 'Cliente Teste Webhook ASAAS',
        cnpj: '00000000000000',
        contato_email: 'teste@webhook-asaas.com',
        contato_telefone: '11999999999',
        status: 'ativo',
        plano: 'profissional',
        valor_mensal: 199.90,
        asaas_customer_id: ASAAS_CUSTOMER_ID,
        data_ativacao: new Date().toISOString()
      })
      .select()
      .single();

    if (clienteError) {
      console.error('[CREATE-TEST-CLIENT] Erro ao criar cliente:', clienteError);
      throw clienteError;
    }

    console.log('[CREATE-TEST-CLIENT] Cliente criado com sucesso:', novoCliente);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cliente criado com sucesso',
        cliente: novoCliente,
        contador: { id: contador.id, nivel: contador.nivel },
        created: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );

  } catch (error) {
    console.error('[CREATE-TEST-CLIENT] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
