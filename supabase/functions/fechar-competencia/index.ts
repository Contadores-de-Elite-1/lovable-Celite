import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface Comissao {
  id: string;
  contador_id: string;
  cliente_id: string;
  tipo: string;
  valor: number;
  competencia: string;
  status: string;
}

Deno.serve(async (req) => {
  try {
    console.log('🔒 Iniciando fechamento de competência...');

    // Pega o mês anterior (competência a fechar)
    const hoje = new Date();
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const competencia = mesAnterior.toISOString().slice(0, 7); // Ex: "2025-01"

    console.log(`📅 Fechando competência: ${competencia}`);

    // 1. Busca todas as comissões calculadas da competência
    const { data: comissoes, error: fetchError } = await supabase
      .from('comissoes')
      .select(`
        *,
        clientes!inner(id, status),
        contadores!inner(id, status)
      `)
      .eq('competencia', competencia)
      .eq('status', 'calculada');

    if (fetchError) {
      throw new Error(`Erro ao buscar comissões: ${fetchError.message}`);
    }

    if (!comissoes || comissoes.length === 0) {
      console.log('ℹ️ Nenhuma comissão para fechar nesta competência');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma comissão para processar',
          competencia,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 ${comissoes.length} comissões encontradas`);

    // 2. Valida cada comissão
    const comissoesValidas: string[] = [];
    const comissoesInvalidas: { id: string; motivo: string }[] = [];

    for (const comissao of comissoes) {
      let valida = true;
      let motivo = '';

      // Valida se cliente está ativo
      if (!comissao.clientes || comissao.clientes.status !== 'ativo') {
        valida = false;
        motivo = 'Cliente inativo';
      }

      // Valida se contador está ativo
      if (!comissao.contadores || comissao.contadores.status !== 'ativo') {
        valida = false;
        motivo = 'Contador inativo';
      }

      // TODO: Adicionar validação de chargeback
      // TODO: Adicionar validação de cancelamento

      if (valida) {
        comissoesValidas.push(comissao.id);
      } else {
        comissoesInvalidas.push({ id: comissao.id, motivo });
      }
    }

    console.log(`✅ Comissões válidas: ${comissoesValidas.length}`);
    console.log(`❌ Comissões inválidas: ${comissoesInvalidas.length}`);

    // 3. Aprova comissões válidas
    if (comissoesValidas.length > 0) {
      const dataPagamentoPrevista = new Date(
        mesAnterior.getFullYear(),
        mesAnterior.getMonth() + 1,
        25
      ).toISOString();

      const { error: updateError } = await supabase
        .from('comissoes')
        .update({
          status: 'aprovada',
          data_aprovacao: new Date().toISOString(),
          data_pagamento_prevista: dataPagamentoPrevista,
        })
        .in('id', comissoesValidas);

      if (updateError) {
        throw new Error(`Erro ao aprovar comissões: ${updateError.message}`);
      }

      console.log(`✅ ${comissoesValidas.length} comissões aprovadas`);
    }

    // 4. Cancela comissões inválidas
    if (comissoesInvalidas.length > 0) {
      const ids = comissoesInvalidas.map((c) => c.id);

      const { error: cancelError } = await supabase
        .from('comissoes')
        .update({
          status: 'cancelada',
          observacao: comissoesInvalidas[0].motivo, // Simplificado
        })
        .in('id', ids);

      if (cancelError) {
        console.error('Erro ao cancelar comissões:', cancelError);
      }
    }

    // 5. Calcula totais por contador
    const { data: totaisPorContador } = await supabase
      .from('comissoes')
      .select('contador_id, valor, contadores(nome, email)')
      .eq('competencia', competencia)
      .eq('status', 'aprovada');

    const resumo: Record<string, { nome: string; total: number; count: number }> = {};

    totaisPorContador?.forEach((c) => {
      if (!resumo[c.contador_id]) {
        resumo[c.contador_id] = {
          nome: c.contadores?.nome || 'Desconhecido',
          total: 0,
          count: 0,
        };
      }
      resumo[c.contador_id].total += c.valor;
      resumo[c.contador_id].count += 1;
    });

    // 6. Envia notificações (TODO: implementar)
    console.log('📧 Enviando notificações aos contadores...');
    
    // TODO: Integrar com Brevo para enviar emails
    // TODO: Integrar com Firebase para push notifications

    // 7. Registra no audit_logs
    await supabase.from('audit_logs').insert({
      acao: 'fechar_competencia',
      detalhes: {
        competencia,
        aprovadas: comissoesValidas.length,
        canceladas: comissoesInvalidas.length,
        resumo,
      },
      created_at: new Date().toISOString(),
    });

    console.log('✅ Fechamento de competência concluído!');

    return new Response(
      JSON.stringify({
        success: true,
        competencia,
        aprovadas: comissoesValidas.length,
        canceladas: comissoesInvalidas.length,
        resumo,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro no fechamento de competência:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

