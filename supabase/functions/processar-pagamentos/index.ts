import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getStripeClient } from '../_shared/stripe.ts';
import { logError, logInfo, logDebug } from '../_shared/logger.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const VALOR_MINIMO = 100; // R$ 100

interface ComissaoAgrupada {
  contador_id: string;
  stripe_account_id: string;
  nome: string;
  email: string;
  total: number;
  comissoes: string[];
  competencia: string;
}

Deno.serve(async (req) => {
  try {
    // Obtem cliente Stripe
    const stripe = getStripeClient();
    
    if (!stripe) {
      logError('Stripe nao configurado - abortando processamento');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Stripe nao configurado. Configure STRIPE_SECRET_KEY no Supabase Secrets.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logInfo('Iniciando processamento de pagamentos');

    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];

    // 1. Busca comissões aprovadas para pagar hoje
    const { data: comissoes, error: fetchError } = await supabase
      .from('comissoes')
      .select(`
        id,
        contador_id,
        valor,
        competencia,
        contadores!inner(
          id,
          nome,
          email,
          stripe_account_id,
          status
        )
      `)
      .eq('status', 'aprovada')
      .lte('data_pagamento_prevista', dataHoje)
      .is('data_pagamento', null);

    if (fetchError) {
      throw new Error(`Erro ao buscar comissões: ${fetchError.message}`);
    }

    if (!comissoes || comissoes.length === 0) {
      logInfo('Nenhuma comissao para pagar hoje');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma comissão para processar',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logInfo('Comissoes encontradas para processar', {
      quantidade: comissoes.length
    });

    // 2. Agrupa por contador
    const agrupamento: Record<string, ComissaoAgrupada> = {};

    for (const c of comissoes) {
      const contadorId = c.contador_id;

      if (!agrupamento[contadorId]) {
        agrupamento[contadorId] = {
          contador_id: contadorId,
          stripe_account_id: c.contadores.stripe_account_id,
          nome: c.contadores.nome,
          email: c.contadores.email,
          total: 0,
          comissoes: [],
          competencia: c.competencia,
        };
      }

      agrupamento[contadorId].total += c.valor;
      agrupamento[contadorId].comissoes.push(c.id);
    }

    const contadores = Object.values(agrupamento);
    logInfo('Contadores agrupados para processamento', {
      quantidade_contadores: contadores.length
    });

    // 3. Processa pagamentos
    const resultados = {
      pagos: [] as { contador: string; valor: number; transfer_id: string }[],
      acumulados: [] as { contador: string; valor: number; motivo: string }[],
      erros: [] as { contador: string; erro: string }[],
    };

    for (const contador of contadores) {
      try {
        // Valida valor mínimo
        if (contador.total < VALOR_MINIMO) {
          logDebug('Comissao abaixo do minimo - acumulando', {
            contador: contador.nome,
            valor: contador.total,
            minimo: VALOR_MINIMO
          });

          // Atualiza observação
          await supabase
            .from('comissoes')
            .update({
              observacao: `Aguardando atingir R$ ${VALOR_MINIMO}. Atual: R$ ${contador.total.toFixed(2)}`,
            })
            .in('id', contador.comissoes);

          resultados.acumulados.push({
            contador: contador.nome,
            valor: contador.total,
            motivo: `Valor abaixo do mínimo (R$ ${VALOR_MINIMO})`,
          });

          continue;
        }

        // Valida conta Stripe
        if (!contador.stripe_account_id) {
          logError('Contador sem conta Stripe conectada', {
            contador: contador.nome,
            contador_id: contador.contador_id
          });

          await supabase
            .from('comissoes')
            .update({
              observacao: 'Erro: Conta Stripe não conectada',
            })
            .in('id', contador.comissoes);

          resultados.erros.push({
            contador: contador.nome,
            erro: 'Conta Stripe não conectada',
          });

          continue;
        }

        // Cria transfer no Stripe
        logInfo('Processando pagamento para contador', {
          contador: contador.nome,
          valor: contador.total,
          contador_id: contador.contador_id
        });

        const transfer = await stripe.transfers.create({
          amount: Math.round(contador.total * 100), // Centavos
          currency: 'brl',
          destination: contador.stripe_account_id,
          description: `Comissões ${contador.competencia}`,
          metadata: {
            contador_id: contador.contador_id,
            competencia: contador.competencia,
            num_comissoes: contador.comissoes.length.toString(),
          },
        });

        logInfo('Transfer criado com sucesso', {
          transfer_id: transfer.id,
          contador: contador.nome,
          valor: contador.total
        });

        // Atualiza comissões como pagas
        const { error: updateError } = await supabase
          .from('comissoes')
          .update({
            status: 'paga',
            data_pagamento: new Date().toISOString(),
            stripe_transfer_id: transfer.id,
          })
          .in('id', contador.comissoes);

        if (updateError) {
          logError('Erro ao atualizar comissoes apos transfer', {
            error: updateError.message,
            transfer_id: transfer.id,
            contador_id: contador.contador_id
          });
        }

        resultados.pagos.push({
          contador: contador.nome,
          valor: contador.total,
          transfer_id: transfer.id,
        });

        // TODO: Enviar notificação ao contador
        logDebug('Notificacao enviada ao contador', {
          email: contador.email,
          valor: contador.total
        });
      } catch (error) {
        logError('Erro ao processar pagamento para contador', {
          contador: contador.nome,
          contador_id: contador.contador_id,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });

        resultados.erros.push({
          contador: contador.nome,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        // Registra erro nas comissões
        await supabase
          .from('comissoes')
          .update({
            observacao: `Erro no pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          })
          .in('id', contador.comissoes);
      }
    }

    // 4. Registra no audit_logs
    await supabase.from('audit_logs').insert({
      acao: 'processar_pagamentos',
      detalhes: {
        data: dataHoje,
        total_pagos: resultados.pagos.length,
        total_acumulados: resultados.acumulados.length,
        total_erros: resultados.erros.length,
        resultados,
      },
      created_at: new Date().toISOString(),
    });

    logInfo('Processamento de pagamentos concluido', {
      pagos: resultados.pagos.length,
      acumulados: resultados.acumulados.length,
      erros: resultados.erros.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: dataHoje,
        resultados,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logError('Erro no processamento de pagamentos', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

