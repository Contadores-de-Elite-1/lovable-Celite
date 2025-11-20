// Inline logger para evitar import de _shared
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogContext {
  [key: string]: unknown;
}
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}
const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development' || 
                      Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;
function log(level: LogLevel, message: string, context?: LogContext): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context })
  };
  if (isDevelopment) {
    console.log(JSON.stringify(logEntry));
    return;
  }
  if (level === 'warn' || level === 'error') {
    console.log(JSON.stringify(logEntry));
  }
}
function logDebug(message: string, context?: LogContext): void {
  log('debug', message, context);
}
function logInfo(message: string, context?: LogContext): void {
  log('info', message, context);
}
function logError(message: string, context?: LogContext): void {
  log('error', message, context);
}

// Inline Stripe client
import Stripe from 'https://esm.sh/stripe@14.21.0';
let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe | null {
  if (stripeClient) {
    return stripeClient;
  }
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secretKey) {
    logError('STRIPE_SECRET_KEY nao configurado');
    return null;
  }
  if (!secretKey.startsWith('sk_')) {
    logError('STRIPE_SECRET_KEY em formato invalido');
    return null;
  }
  try {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
    return stripeClient;
  } catch (error) {
    logError('Erro ao criar cliente Stripe', {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return null;
  }
}

// Main
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const VALOR_MINIMO = 100;

interface ComissaoAgrupada {
  contador_id: string;
  stripe_account_id: string;
  nome: string;
  email: string;
  total: number;
  comissoes: string[];
  competencia: string;
}

/**
 * Edge Function de TESTE: Processar Pagamentos Manualmente
 * 
 * Use esta fun\u00e7\u00e3o para testar o processamento de saques sem aguardar dia 25.
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const stripe = getStripeClient();
    
    if (!stripe) {
      logError('Stripe nao configurado - abortando teste');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Stripe nao configurado. Configure STRIPE_SECRET_KEY no Supabase Secrets.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logInfo('TESTE: Iniciando processamento manual de pagamentos');

    let contadorIdFiltro: string | null = null;
    try {
      const body = await req.json();
      if (body.contador_id) {
        contadorIdFiltro = body.contador_id;
      }
    } catch {
      // Body vazio é OK
    }

    // 1. Busca comissões aprovadas
    let query = supabase
      .from('comissoes')
      .select(`
        id,
        contador_id,
        valor,
        competencia
      `)
      .eq('status', 'aprovada')
      .is('data_pagamento', null);

    if (contadorIdFiltro) {
      query = query.eq('contador_id', contadorIdFiltro);
    }

    const { data: comissoes, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar comissões: ${fetchError.message}`);
    }

    if (!comissoes || comissoes.length === 0) {
      logInfo('TESTE: Nenhuma comissão aprovada para processar');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma comissão aprovada para processar',
          debug: { comissoes_encontradas: 0 }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logInfo('TESTE: Comissões encontradas', {
      quantidade: comissoes.length
    });

    // 2. Busca stripe_account_id de cada contador
    const contadorIds = [...new Set(comissoes.map(c => c.contador_id))];
    const { data: contadoresData } = await supabase
      .from('contadores')
      .select('id, stripe_account_id, user_id')
      .in('id', contadorIds);
    
    const contadoresMap = new Map(contadoresData?.map(c => [c.id, c]) || []);

    // 3. Agrupa por contador
    const agrupamento: Record<string, ComissaoAgrupada> = {};

    for (const c of comissoes) {
      const contadorId = c.contador_id;
      const contadorInfo = contadoresMap.get(contadorId);

      if (!agrupamento[contadorId]) {
        agrupamento[contadorId] = {
          contador_id: contadorId,
          stripe_account_id: contadorInfo?.stripe_account_id || '',
          nome: `Contador ${contadorId.substring(0, 8)}`,
          email: '',
          total: 0,
          comissoes: [],
          competencia: c.competencia,
        };
      }

      agrupamento[contadorId].total += c.valor;
      agrupamento[contadorId].comissoes.push(c.id);
    }

    const contadores = Object.values(agrupamento);
    logInfo('TESTE: Contadores agrupados', {
      quantidade_contadores: contadores.length
    });

    // 4. Processa pagamentos
    const resultados = {
      pagos: [] as { contador: string; valor: number; transfer_id: string }[],
      acumulados: [] as { contador: string; valor: number; motivo: string }[],
      erros: [] as { contador: string; erro: string }[],
    };

    for (const contador of contadores) {
      try {
        // Valida valor mínimo
        if (contador.total < VALOR_MINIMO) {
          logInfo('TESTE: Comissao abaixo do minimo - acumulando', {
            contador: contador.nome,
            valor: contador.total,
            minimo: VALOR_MINIMO
          });

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
          logError('TESTE: Contador sem conta Stripe conectada', {
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
        logInfo('TESTE: Processando transfer para contador', {
          contador: contador.nome,
          valor: contador.total,
          contador_id: contador.contador_id
        });

        const transfer = await stripe.transfers.create({
          amount: Math.round(contador.total * 100),
          currency: 'brl',
          destination: contador.stripe_account_id,
          description: `Comissões ${contador.competencia} (TESTE)`,
          metadata: {
            contador_id: contador.contador_id,
            competencia: contador.competencia,
            num_comissoes: contador.comissoes.length.toString(),
            test_mode: 'true',
          },
        });

        logInfo('TESTE: Transfer criado com sucesso', {
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
          logError('TESTE: Erro ao atualizar comissões após transfer', {
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

        logInfo('TESTE: Comissoes marcadas como pagas', {
          contador: contador.nome,
          quantidade: contador.comissoes.length
        });

      } catch (error) {
        logError('TESTE: Erro ao processar transfer', {
          contador: contador.nome,
          contador_id: contador.contador_id,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });

        resultados.erros.push({
          contador: contador.nome,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        await supabase
          .from('comissoes')
          .update({
            observacao: `Erro no pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          })
          .in('id', contador.comissoes);
      }
    }

    // 5. Registra no audit_logs
    await supabase.from('audit_logs').insert({
      acao: 'test_processar_pagamentos',
      detalhes: {
        filtro_contador_id: contadorIdFiltro,
        total_pagos: resultados.pagos.length,
        total_acumulados: resultados.acumulados.length,
        total_erros: resultados.erros.length,
        resultados,
      },
      created_at: new Date().toISOString(),
    });

    logInfo('TESTE: Processamento concluído', {
      pagos: resultados.pagos.length,
      acumulados: resultados.acumulados.length,
      erros: resultados.erros.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        test_mode: true,
        message: 'Teste de processamento de pagamentos concluído',
        resultados,
        debug: {
          total_comissoes_processadas: comissoes.length,
          total_contadores_processados: contadores.length,
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError('TESTE: Erro no processamento', {
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