import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculoInput {
  pagamento_id: string;
  cliente_id: string;
  contador_id: string;
  valor_liquido: number;
  competencia: string;
  is_primeira_mensalidade: boolean;
}

interface NivelContador {
  nivel: 'bronze' | 'prata' | 'ouro' | 'diamante';
  comissao_direta: number;
  override: number;
}

function getNivelContador(clientesAtivos: number): NivelContador {
  if (clientesAtivos >= 15) return { nivel: 'diamante', comissao_direta: 0.20, override: 0.20 };
  if (clientesAtivos >= 10) return { nivel: 'ouro', comissao_direta: 0.20, override: 0.20 };
  if (clientesAtivos >= 5) return { nivel: 'prata', comissao_direta: 0.175, override: 0.175 };
  return { nivel: 'bronze', comissao_direta: 0.15, override: 0.15 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const input: CalculoInput = await req.json();
    console.log('🔢 Iniciando cálculo de comissões:', input);

    const comissoesCriadas: string[] = [];
    const bonusCriados: string[] = [];

    // 1. BUSCAR DADOS DO CONTADOR
    const { data: contador } = await supabase
      .from('contadores')
      .select('id, clientes_ativos, nivel, user_id')
      .eq('id', input.contador_id)
      .single();

    if (!contador) {
      throw new Error('Contador não encontrado');
    }

    const nivelAtual = getNivelContador(contador.clientes_ativos);

    // 2. COMISSÃO DIRETA
    let valorComissaoDireta = 0;
    let tipoComissao = '';
    let percentualAplicado = 0;

    if (input.is_primeira_mensalidade) {
      // 100% da primeira mensalidade
      valorComissaoDireta = input.valor_liquido;
      tipoComissao = 'ativacao';
      percentualAplicado = 1.0;
    } else {
      // Comissão recorrente conforme nível
      valorComissaoDireta = input.valor_liquido * nivelAtual.comissao_direta;
      tipoComissao = 'recorrente';
      percentualAplicado = nivelAtual.comissao_direta;
    }

    const { data: comissaoDireta, error: erroComissaoDireta } = await supabase
      .from('comissoes')
      .insert({
        contador_id: input.contador_id,
        cliente_id: input.cliente_id,
        pagamento_id: input.pagamento_id,
        tipo: tipoComissao,
        valor: valorComissaoDireta,
        percentual: percentualAplicado,
        competencia: input.competencia,
        status: 'calculada',
        observacao: `Comissão ${tipoComissao} - Nível: ${nivelAtual.nivel}`,
        origem_cliente_id: input.cliente_id,
      })
      .select()
      .single();

    if (erroComissaoDireta) {
      console.error('❌ Erro ao criar comissão direta:', erroComissaoDireta);
      throw erroComissaoDireta;
    }

    comissoesCriadas.push(comissaoDireta.id);

    // Log de cálculo
    await supabase.from('comissoes_calculo_log').insert({
      comissao_id: comissaoDireta.id,
      regra_aplicada: input.is_primeira_mensalidade ? 'ATIVACAO_100%' : `RECORRENTE_${nivelAtual.nivel.toUpperCase()}`,
      valores_intermediarios: {
        valor_liquido: input.valor_liquido,
        percentual: percentualAplicado,
        nivel: nivelAtual.nivel,
        clientes_ativos: contador.clientes_ativos,
      },
      resultado_final: valorComissaoDireta,
    });

    console.log('✅ Comissão direta criada:', valorComissaoDireta);

    // 3. OVERRIDE (se contador tem sponsor)
    const { data: rede } = await supabase
      .from('rede_contadores')
      .select('sponsor_id, nivel_rede')
      .eq('child_id', input.contador_id)
      .single();

    if (rede?.sponsor_id) {
      const { data: sponsor } = await supabase
        .from('contadores')
        .select('id, clientes_ativos, nivel')
        .eq('id', rede.sponsor_id)
        .single();

      if (sponsor) {
        const nivelSponsor = getNivelContador(sponsor.clientes_ativos);
        let valorOverride = 0;
        let percentualOverride = 0;

        if (input.is_primeira_mensalidade) {
          // Override = mesmo % do sponsor sobre primeira mensalidade
          valorOverride = input.valor_liquido * nivelSponsor.override;
          percentualOverride = nivelSponsor.override;
        } else {
          // Override recorrente = 5% fixo (MMN)
          valorOverride = input.valor_liquido * 0.05;
          percentualOverride = 0.05;
        }

        const { data: comissaoOverride } = await supabase
          .from('comissoes')
          .insert({
            contador_id: rede.sponsor_id,
            cliente_id: input.cliente_id,
            pagamento_id: input.pagamento_id,
            tipo: 'override',
            valor: valorOverride,
            percentual: percentualOverride,
            competencia: input.competencia,
            status: 'calculada',
            observacao: input.is_primeira_mensalidade 
              ? `Override 1ª mensalidade - Nível sponsor: ${nivelSponsor.nivel}`
              : 'Override recorrente 5% (MMN)',
            nivel_sponsor: nivelSponsor.nivel,
            origem_cliente_id: input.cliente_id,
          })
          .select()
          .single();

        if (comissaoOverride) {
          comissoesCriadas.push(comissaoOverride.id);
          console.log('✅ Override criado:', valorOverride);
        }
      }
    }

    // 4. BÔNUS DE PROGRESSÃO (5, 10, 15 clientes)
    const marcos = [
      { quantidade: 5, tipo: 'bonus_progressao', nome: 'Bônus Prata', valor: 100 },
      { quantidade: 10, tipo: 'bonus_progressao', nome: 'Bônus Ouro', valor: 100 },
      { quantidade: 15, tipo: 'bonus_progressao', nome: 'Bônus Diamante', valor: 100 },
    ];

    for (const marco of marcos) {
      if (contador.clientes_ativos === marco.quantidade) {
        // Verificar se já recebeu este bônus
        const { data: bonusExistente } = await supabase
          .from('bonus_historico')
          .select('id')
          .eq('contador_id', input.contador_id)
          .eq('tipo_bonus', marco.tipo)
          .eq('marco_atingido', marco.quantidade)
          .single();

        if (!bonusExistente) {
          const { data: bonus } = await supabase
            .from('bonus_historico')
            .insert({
              contador_id: input.contador_id,
              tipo_bonus: marco.tipo,
              marco_atingido: marco.quantidade,
              valor: marco.valor,
              competencia: input.competencia,
              status: 'pendente',
              observacao: marco.nome,
            })
            .select()
            .single();

          if (bonus) {
            bonusCriados.push(bonus.id);
            console.log(`✅ ${marco.nome} desbloqueado: R$ ${marco.valor}`);

            // Criar comissão para o bônus
            await supabase.from('comissoes').insert({
              contador_id: input.contador_id,
              tipo: marco.tipo,
              valor: marco.valor,
              competencia: input.competencia,
              status: 'calculada',
              observacao: marco.nome,
            });
          }
        }
      }
    }

    // 5. BÔNUS VOLUME (a cada 5 clientes APÓS 15 - Diamante)
    if (contador.clientes_ativos >= 20 && contador.clientes_ativos % 5 === 0) {
      const { data: bonusVolumeExistente } = await supabase
        .from('bonus_historico')
        .select('id')
        .eq('contador_id', input.contador_id)
        .eq('tipo_bonus', 'bonus_volume')
        .eq('marco_atingido', contador.clientes_ativos)
        .single();

      if (!bonusVolumeExistente) {
        const { data: bonusVolume } = await supabase
          .from('bonus_historico')
          .insert({
            contador_id: input.contador_id,
            tipo_bonus: 'bonus_volume',
            marco_atingido: contador.clientes_ativos,
            valor: 100,
            competencia: input.competencia,
            status: 'pendente',
            observacao: `Bônus Volume - ${contador.clientes_ativos} clientes`,
          })
          .select()
          .single();

        if (bonusVolume) {
          bonusCriados.push(bonusVolume.id);
          console.log(`✅ Bônus Volume desbloqueado: R$ 100 (${contador.clientes_ativos} clientes)`);

          await supabase.from('comissoes').insert({
            contador_id: input.contador_id,
            tipo: 'bonus_volume',
            valor: 100,
            competencia: input.competencia,
            status: 'calculada',
            observacao: `Bônus Volume - ${contador.clientes_ativos} clientes`,
          });
        }
      }
    }

    // 6. BÔNUS CONTADOR (R$50 quando downline ativa primeiro cliente)
    if (input.is_primeira_mensalidade && rede?.sponsor_id) {
      // Verificar se é o primeiro cliente do contador
      const { count } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('contador_id', input.contador_id)
        .eq('status', 'ativo');

      if (count === 1) {
        const { data: bonusContador } = await supabase
          .from('bonus_historico')
          .insert({
            contador_id: rede.sponsor_id,
            tipo_bonus: 'bonus_contador',
            valor: 50,
            competencia: input.competencia,
            status: 'pendente',
            observacao: `Bônus Indicação Contador - ${input.contador_id} ativou 1º cliente`,
          })
          .select()
          .single();

        if (bonusContador) {
          bonusCriados.push(bonusContador.id);
          console.log('✅ Bônus Contador desbloqueado: R$ 50');

          await supabase.from('comissoes').insert({
            contador_id: rede.sponsor_id,
            tipo: 'bonus_contador',
            valor: 50,
            competencia: input.competencia,
            status: 'calculada',
            observacao: 'Bônus Indicação Contador R$50',
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        comissoes_criadas: comissoesCriadas.length,
        bonus_criados: bonusCriados.length,
        comissoes: comissoesCriadas,
        bonus: bonusCriados,
        nivel_contador: nivelAtual.nivel,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao calcular comissões:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
