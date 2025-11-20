# PLANO EPICO - REVISAO COMPLETA DO CODIGO
## Conformidade com Diretrizes do Documento @Codigo

**Data**: Novembro 2025  
**Responsavel**: Claude Sonnet 4.5  
**Status**: Aguardando aprovacao

---

## DIRETRIZES DO DOCUMENTO @CODIGO

1. Conversa em portugues
2. Codigo em ingles (sem emojis)
3. Comentarios em portugues (simples, objetivos, diretos)
4. Zero erros tolerados (risco judicial)
5. Codigo preciso, completo, limpo, fluido

---

## ANALISE DO CODIGO ATUAL

### METRICAS GERAIS

**Frontend (`/src`)**:
- Total de arquivos: ~45 arquivos
- Console.log encontrados: 19 ocorrencias em 8 arquivos
- Emojis encontrados: 13 ocorrencias em 4 arquivos
- Comentarios em ingles: 1 ocorrencia (commission.ts)
- Comentarios em portugues: Maioria OK

**Backend (`/supabase/functions`)**:
- Total de Edge Functions: 9 funcoes
- Console.log encontrados: 110 ocorrencias em 8 arquivos
- Emojis encontrados: 37 ocorrencias em 3 arquivos
- Comentarios em portugues: Maioria OK
- Comentarios em ingles: Minoria

---

## DISCREPANCIAS IDENTIFICADAS

### CRITICAS (Risco de erro no sistema)

#### 1. Logs excessivos em producao
**Localizacao**: `supabase/functions/webhook-asaas/index.ts`
**Problema**: 45+ console.log no webhook principal
```typescript
// LINHA 16-28: Logs verbosos em producao
console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════');
console.log('[WEBHOOK DEBUG] Received webhook - analyzing...');
console.log(`[WEBHOOK DEBUG] Payload size: ${payload.length} bytes`);
```
**Impacto**: Performance degradada, logs poluidos, dificil debugar em producao
**Risco**: MEDIO (nao causa erro, mas dificulta manutencao)

---

#### 2. Validacao de assinatura desabilitada
**Localizacao**: `supabase/functions/webhook-asaas/index.ts` (linha 34-66)
```typescript
if (!secret) {
  console.warn('⚠️  ASAAS_WEBHOOK_SECRET not configured');
  return true; // PERMITINDO SEM SECRET!
}

if (!signature) {
  console.warn('[WEBHOOK DEBUG] Signature expected but not found!');
  return true; // PERMITINDO SEM ASSINATURA!
}

// E mesmo quando valida:
catch (error) {
  console.warn('⚠️  Allowing webhook despite validation error (development)');
  return true; // PERMITINDO MESMO COM ERRO!
}
```
**Impacto**: WEBHOOK INSEGURO - Qualquer pessoa pode enviar webhook falso
**Risco**: ALTO (risco de fraude, comissoes falsas)

---

#### 3. Emojis no codigo
**Localizacao**: Multiplos arquivos
```typescript
// supabase/functions/webhook-asaas/index.ts
console.warn('⚠️  ASAAS_WEBHOOK_SECRET not configured');
console.log(`  Match: ${expectedSignature === signature.toLowerCase() ? 'YES ✅' : 'NO ❌'}`);

// src/pages/Comissoes.tsx
// Emojis em comentarios
```
**Impacto**: Nao funcional, mas viola diretriz "sem emojis"
**Risco**: BAIXO (estetico, mas fora do padrao)

---

#### 4. Falta de tratamento de erro em funcoes criticas
**Localizacao**: `src/pages/Dashboard.tsx` (linha 32-37)
```typescript
const fetchData = async () => {
  const { data, error } = await supabase.from('comissoes').select('*')
  if (!error) setComissoes(data || [])
  setLoading(false)
}
```
**Problema**: Se houver erro, nao faz nada (silencioso)
**Impacto**: Usuario nao sabe que houve erro
**Risco**: MEDIO (UX ruim, mas nao quebra app)

---

#### 5. Comentarios em ingles
**Localizacao**: `src/lib/commission.ts` (linha 1)
```typescript
// Commission calculation utilities
```
**Problema**: Deve ser em portugues
**Impacto**: Viola diretriz
**Risco**: BAIXO (nao funcional)

---

### NAO-CRITICAS (Melhorias de qualidade)

#### 6. Console.log em producao (frontend)
**Localizacao**: 19 ocorrencias em 8 arquivos
**Problema**: Logs de debug em producao
**Impacto**: Performance, seguranca (pode vazar dados)
**Risco**: BAIXO-MEDIO

---

#### 7. Valores hard-coded
**Localizacao**: `src/pages/Dashboard.tsx` (linha 62)
```typescript
<h2 className="text-3xl font-bold text-white">R$ 12.450,00</h2>
```
**Problema**: Valor fixo, deveria vir do banco
**Impacto**: Dashboard mostra dados falsos
**Risco**: MEDIO (usuario ve informacao incorreta)

---

#### 8. Falta de TypeScript strict em alguns arquivos
**Localizacao**: Multiplos arquivos (ex: Dashboard.tsx linha 28)
```typescript
const [comissoes, setComissoes] = useState([])
// Deveria ser: useState<Comissao[]>([])
```
**Problema**: Type safety fraca
**Impacto**: Bugs em tempo de execucao
**Risco**: MEDIO

---

#### 9. Falta de tratamento de edge cases
**Localizacao**: `src/lib/commission.ts` (linha 40)
```typescript
const total = comissoes.reduce((acc, curr) => acc + curr.valor, 0)
```
**Problema**: Se curr.valor for null/undefined, NaN
**Impacto**: Calculo incorreto de comissoes
**Risco**: ALTO (risco judicial)

---

#### 10. Falta de documentacao de funcoes criticas
**Localizacao**: `supabase/functions/calcular-comissoes/index.ts`
**Problema**: Funcoes sem JSDoc explicando parametros/retorno
**Impacto**: Dificil manutencao
**Risco**: BAIXO (nao funcional)

---

## PLANO EPICO DE REVISAO

### EPICO 0: FUNDAMENTOS DO CODIGO (1-2 semanas)
**Objetivo**: Estabelecer base solida e segura

#### US0.1: Revisar fundamentos e reestruturar
**Prioridade**: CRITICA
**Estimativa**: 3 dias

**Tarefas**:
- [ ] Remover TODOS os emojis do codigo (37 backend + 13 frontend = 50 total)
- [ ] Traduzir comentarios em ingles para portugues
- [ ] Padronizar formato de comentarios (simples, objetivos, diretos)
- [ ] Revisar imports e exports (consistencia)
- [ ] Configurar ESLint com regras estritas

**Criterios de aceitacao**:
- Zero emojis no codigo
- 100% comentarios em portugues
- ESLint passa sem warnings

---

#### US0.2: Documentar mapa de codigo completo
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Criar `docs/MAPA_CODIGO.md` com:
  - Estrutura de diretorios
  - Fluxo de dados (frontend → backend)
  - Dependencias entre modulos
  - Pontos criticos (calculo de comissoes)
- [ ] Documentar cada Edge Function (proposito, input, output)
- [ ] Documentar cada pagina do frontend (rotas, componentes)
- [ ] Criar diagrama de arquitetura (ASCII ou Mermaid)

**Criterios de aceitacao**:
- Documento `MAPA_CODIGO.md` criado
- Todo desenvolvedor consegue entender estrutura em < 30 minutos

---

#### US0.3: Estabelecer guidelines de codigo
**Prioridade**: ALTA
**Estimativa**: 1 dia

**Tarefas**:
- [ ] Criar `docs/GUIDELINES_CODIGO.md` com:
  - Padrao de nomenclatura (camelCase, PascalCase)
  - Padrao de comentarios (portugues, formato)
  - Padrao de tratamento de erros
  - Padrao de logging (desenvolvimento vs producao)
  - Padrao de types TypeScript
- [ ] Configurar Prettier (formatacao automatica)
- [ ] Configurar EditorConfig

**Criterios de aceitacao**:
- Guidelines documentadas
- Prettier configurado
- Codigo formatado automaticamente

---

### EPICO 1: SEGURANCA E VALIDACAO (1-2 semanas)
**Objetivo**: Eliminar riscos de fraude e erros criticos

#### US1.1: Corrigir validacao de webhook ASAAS
**Prioridade**: CRITICA
**Estimativa**: 1 dia

**Tarefas**:
- [ ] Remover bypasses de validacao (return true em catch)
- [ ] Implementar validacao MD5 correta
- [ ] Adicionar logging estruturado (sem emojis)
- [ ] Testar com webhooks reais e falsos
- [ ] Documentar formato de assinatura esperado

**Arquivo**: `supabase/functions/webhook-asaas/index.ts`

**Codigo atual (INSEGURO)**:
```typescript
if (!secret) {
  console.warn('⚠️  ASAAS_WEBHOOK_SECRET not configured');
  return true; // PROBLEMA!
}
```

**Codigo corrigido (SEGURO)**:
```typescript
if (!secret) {
  console.error('[WEBHOOK] Secret nao configurado - rejeitando webhook');
  return false; // Rejeita se nao tiver secret
}

if (!signature) {
  console.error('[WEBHOOK] Assinatura ausente - rejeitando webhook');
  return false; // Rejeita se nao tiver assinatura
}

try {
  // Valida MD5
  const isValid = expectedSignature === signature.toLowerCase();
  if (!isValid) {
    console.error('[WEBHOOK] Assinatura invalida - rejeitando webhook');
  }
  return isValid;
} catch (error) {
  console.error('[WEBHOOK] Erro ao validar assinatura:', error);
  return false; // Rejeita em caso de erro
}
```

**Criterios de aceitacao**:
- Webhook falso e rejeitado (403 Forbidden)
- Webhook sem assinatura e rejeitado
- Webhook valido e aceito
- Logs claros (sem emojis)

---

#### US1.2: Adicionar validacao robusta de dados
**Prioridade**: CRITICA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Adicionar validacao Zod em todos os webhooks
- [ ] Validar valores monetarios (nao null, nao NaN, >= 0)
- [ ] Validar UUIDs (formato correto)
- [ ] Validar datas (formato ISO)
- [ ] Adicionar testes unitarios para validacoes

**Arquivos**:
- `supabase/functions/webhook-asaas/index.ts`
- `supabase/functions/calcular-comissoes/index.ts`
- `src/lib/commission.ts`

**Exemplo**:
```typescript
import { z } from 'zod';

const PagamentoSchema = z.object({
  valor: z.number().positive('Valor deve ser positivo'),
  cliente_id: z.string().uuid('Cliente ID invalido'),
  contador_id: z.string().uuid('Contador ID invalido'),
  competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida')
});

// Validar antes de usar
const validado = PagamentoSchema.parse(dadosRecebidos);
```

**Criterios de aceitacao**:
- Dados invalidos sao rejeitados com erro 400
- Erro tem mensagem clara em portugues
- Testes unitarios passam 100%

---

#### US1.3: Implementar logging estruturado
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Criar funcao `logger` com niveis (debug, info, warn, error)
- [ ] Separar logs de desenvolvimento vs producao
- [ ] Remover console.log verbosos (110 ocorrencias)
- [ ] Adicionar logs criticos apenas (ex: erro ao calcular comissao)
- [ ] Integrar com Sentry (erros criticos)

**Arquivo novo**: `supabase/functions/_shared/logger.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context
  };
  
  // Em desenvolvimento: mostra tudo
  if (isDevelopment) {
    console.log(JSON.stringify(logEntry));
    return;
  }
  
  // Em producao: so warn e error
  if (level === 'warn' || level === 'error') {
    console.log(JSON.stringify(logEntry));
    
    // Envia para Sentry se for erro critico
    if (level === 'error') {
      // Sentry.captureException(...)
    }
  }
}
```

**Criterios de aceitacao**:
- Em desenvolvimento: todos os logs aparecem
- Em producao: apenas warn/error aparecem
- Logs estruturados (JSON)
- Sem emojis

---

#### US1.4: Adicionar testes de seguranca
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Teste: Webhook com assinatura falsa (deve rejeitar)
- [ ] Teste: Webhook sem assinatura (deve rejeitar)
- [ ] Teste: Payload com SQL injection (deve sanitizar)
- [ ] Teste: Valor negativo (deve rejeitar)
- [ ] Teste: UUID invalido (deve rejeitar)

**Arquivo novo**: `supabase/functions/webhook-asaas/webhook-asaas.security.test.ts`

**Criterios de aceitacao**:
- Todos os testes de seguranca passam
- Cobertura de teste > 80%

---

### EPICO 2: CALCULO DE COMISSOES (2-3 semanas)
**Objetivo**: Garantir 100% de precisao (risco judicial)

#### US2.1: Revisar logica de calculo das 17 bonificacoes
**Prioridade**: CRITICA
**Estimativa**: 3 dias

**Tarefas**:
- [ ] Documentar TODAS as 17 bonificacoes com exemplos
- [ ] Validar formulas matematicas contra PRD
- [ ] Adicionar comentarios explicando cada bonificacao
- [ ] Adicionar logs criticos (ex: "Calculando bonus LTV para contador X")
- [ ] Revisar edge cases (ex: contador sem sponsor)

**Arquivo**: `supabase/functions/calcular-comissoes/index.ts`

**Exemplo de documentacao**:
```typescript
/**
 * Calcula bonus de ativacao (Bonificacao #1)
 * 
 * Regra: Contador recebe 100% do valor da primeira mensalidade
 * Exemplo: Cliente paga R$ 130 (plano Premium) -> Contador recebe R$ 130
 * 
 * @param valor_liquido Valor liquido recebido (apos taxas)
 * @param contador_id UUID do contador que indicou
 * @returns Objeto CommissionRecord com valor calculado
 */
function calcularBonusAtivacao(
  valor_liquido: number,
  contador_id: string
): CommissionRecord {
  // Validar entrada
  if (valor_liquido <= 0) {
    throw new Error('Valor liquido deve ser positivo');
  }
  
  return {
    contador_id,
    tipo: 'ativacao',
    valor: valor_liquido,
    percentual: 1.0,
    observacao: 'Bonus de ativacao - 100% da primeira mensalidade'
  };
}
```

**Criterios de aceitacao**:
- Cada bonificacao tem JSDoc completo
- Exemplos numericos em comentarios
- Edge cases tratados
- Logs criticos adicionados

---

#### US2.2: Adicionar testes unitarios para cada bonificacao
**Prioridade**: CRITICA
**Estimativa**: 4 dias

**Tarefas**:
- [ ] Teste: Bonus ativacao (100% primeira mensalidade)
- [ ] Teste: Comissao recorrente (15-20% por nivel)
- [ ] Teste: Override (3-5% por nivel)
- [ ] Teste: Bonus progressao (ao atingir marco)
- [ ] Teste: Bonus volume (volumetria mensal)
- [ ] Teste: Bonus LTV (faixas 6/12/18 meses)
- [ ] Teste: Bonus indicacao contador
- [ ] Teste: Bonus diamante leads
- [ ] ... (todas as 17 bonificacoes)

**Arquivo novo**: `supabase/functions/calcular-comissoes/calcular-comissoes.test.ts`

**Exemplo**:
```typescript
import { describe, it, expect } from 'vitest';

describe('Calculo de Comissoes - 17 Bonificacoes', () => {
  describe('Bonificacao #1: Ativacao', () => {
    it('deve calcular 100% da primeira mensalidade', () => {
      const input = {
        valor_liquido: 130, // Plano Premium
        is_primeira_mensalidade: true,
        contador_id: 'uuid-teste'
      };
      
      const resultado = calcularBonusAtivacao(input);
      
      expect(resultado.valor).toBe(130);
      expect(resultado.percentual).toBe(1.0);
      expect(resultado.tipo).toBe('ativacao');
    });
    
    it('deve rejeitar valor negativo', () => {
      const input = {
        valor_liquido: -10,
        is_primeira_mensalidade: true,
        contador_id: 'uuid-teste'
      };
      
      expect(() => calcularBonusAtivacao(input)).toThrow('Valor liquido deve ser positivo');
    });
  });
  
  describe('Bonificacao #2-5: Recorrente por nivel', () => {
    it('deve calcular 15% para Bronze', () => {
      const input = {
        valor_liquido: 130,
        is_primeira_mensalidade: false,
        nivel: 'bronze'
      };
      
      const resultado = calcularComissaoRecorrente(input);
      
      expect(resultado.valor).toBe(19.5); // 15% de 130
      expect(resultado.percentual).toBe(0.15);
    });
    
    it('deve calcular 20% para Diamante', () => {
      const input = {
        valor_liquido: 130,
        is_primeira_mensalidade: false,
        nivel: 'diamante'
      };
      
      const resultado = calcularComissaoRecorrente(input);
      
      expect(resultado.valor).toBe(26); // 20% de 130
      expect(resultado.percentual).toBe(0.20);
    });
  });
  
  // ... testes para todas as 17 bonificacoes
});
```

**Criterios de aceitacao**:
- Teste para cada uma das 17 bonificacoes
- Testes cobrem casos normais + edge cases
- Cobertura de codigo > 90%
- Todos os testes passam

---

#### US2.3: Implementar reconciliacao diaria
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Criar CRON job que roda todo dia as 6h AM
- [ ] Verificar: Todos os pagamentos geraram comissoes?
- [ ] Verificar: Valores batem com o esperado?
- [ ] Enviar alerta se houver divergencia
- [ ] Gerar relatorio diario (CSV ou JSON)

**Arquivo novo**: `supabase/functions/reconciliar-comissoes-diarias/index.ts`

```typescript
// Funcao que roda todo dia as 6h AM
export async function reconciliarComissoesDiarias() {
  // 1. Buscar TODOS os pagamentos de ontem
  const pagamentos = await buscarPagamentosOntem();
  
  // 2. Para cada pagamento, verificar comissoes
  const divergencias = [];
  
  for (const pag of pagamentos) {
    const comissoes = await buscarComissoes(pag.id);
    
    // Verifica se gerou comissoes
    if (comissoes.length === 0) {
      divergencias.push({
        tipo: 'PAGAMENTO_SEM_COMISSAO',
        pagamento_id: pag.id,
        valor: pag.valor
      });
    }
    
    // Verifica se valor bate
    const valorEsperado = calcularValorEsperado(pag);
    const valorReal = comissoes.reduce((sum, c) => sum + c.valor, 0);
    
    if (Math.abs(valorEsperado - valorReal) > 0.01) {
      divergencias.push({
        tipo: 'VALOR_DIVERGENTE',
        pagamento_id: pag.id,
        valor_esperado: valorEsperado,
        valor_real: valorReal
      });
    }
  }
  
  // 3. Se houver divergencias, envia alerta
  if (divergencias.length > 0) {
    await enviarAlertaCritico({
      assunto: `${divergencias.length} divergencias encontradas na reconciliacao`,
      divergencias: divergencias
    });
  }
  
  // 4. Gera relatorio
  return {
    data: new Date().toISOString(),
    total_pagamentos: pagamentos.length,
    total_divergencias: divergencias.length,
    divergencias: divergencias
  };
}
```

**Criterios de aceitacao**:
- CRON job roda todo dia as 6h AM
- Detecta pagamentos sem comissoes
- Detecta valores divergentes
- Envia alerta se houver problema

---

#### US2.4: Adicionar auditoria completa
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Logar TODOS os calculos de comissao em `audit_logs`
- [ ] Incluir valores intermediarios (input, output, formula)
- [ ] Permitir reprocessamento de comissoes (se houver erro)
- [ ] Dashboard de auditoria (admin visualizar logs)

**Arquivo**: `supabase/functions/calcular-comissoes/index.ts` (adicionar logs)

```typescript
// Apos calcular comissao
await supabase.from('audit_logs').insert({
  action: 'COMISSAO_CALCULADA',
  user_id: contador_id,
  resource_type: 'comissoes',
  resource_id: comissao.id,
  details: {
    tipo_bonificacao: 'ativacao',
    valor_entrada: 130,
    percentual_aplicado: 1.0,
    valor_saida: 130,
    formula: 'valor_liquido * 1.0',
    nivel_contador: 'bronze',
    is_primeira_mensalidade: true
  }
});
```

**Criterios de aceitacao**:
- Todo calculo e logado em audit_logs
- Logs incluem valores intermediarios
- Dashboard de auditoria funcional

---

### EPICO 3: FRONTEND - UX E TRATAMENTO DE ERROS (1-2 semanas)
**Objetivo**: Melhorar experiencia do usuario e robustez

#### US3.1: Adicionar tratamento de erros em todas as paginas
**Prioridade**: ALTA
**Estimativa**: 3 dias

**Tarefas**:
- [ ] Adicionar try/catch em todos os fetchData
- [ ] Exibir toast de erro quando fetch falha
- [ ] Adicionar loading states
- [ ] Adicionar empty states (ex: "Nenhuma comissao encontrada")
- [ ] Adicionar retry automatico (3 tentativas)

**Arquivos**:
- `src/pages/Dashboard.tsx`
- `src/pages/Comissoes.tsx`
- `src/pages/Rede.tsx`
- `src/pages/Saques.tsx`
- ... (todas as paginas)

**Exemplo (Dashboard.tsx)**:

**Codigo atual (SEM tratamento)**:
```typescript
const fetchData = async () => {
  const { data, error } = await supabase.from('comissoes').select('*')
  if (!error) setComissoes(data || [])
  setLoading(false)
}
```

**Codigo corrigido (COM tratamento)**:
```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('comissoes')
      .select('*')
      .order('criado_em', { ascending: false });
    
    if (error) {
      throw new Error(`Erro ao buscar comissoes: ${error.message}`);
    }
    
    setComissoes(data || []);
    
  } catch (err) {
    console.error('[Dashboard] Erro ao buscar dados:', err);
    setError('Nao foi possivel carregar suas comissoes. Tente novamente.');
    
    // Exibe toast de erro
    toast({
      variant: 'destructive',
      title: 'Erro ao carregar dados',
      description: 'Nao foi possivel buscar suas comissoes. Tente novamente em instantes.'
    });
    
  } finally {
    setLoading(false);
  }
};

// Retry automatico (3 tentativas)
const fetchDataWithRetry = async (tentativas = 3) => {
  for (let i = 0; i < tentativas; i++) {
    try {
      await fetchData();
      return; // Sucesso, sai do loop
    } catch (err) {
      if (i === tentativas - 1) throw err; // Ultima tentativa falhou
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Aguarda 1s, 2s, 3s
    }
  }
};
```

**Criterios de aceitacao**:
- Todas as paginas tem try/catch
- Usuario ve mensagem de erro clara (em portugues)
- Loading states funcionam
- Retry automatico funciona

---

#### US3.2: Substituir valores hard-coded por dados reais
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Dashboard: Buscar saldo real do contador
- [ ] Dashboard: Buscar total de clientes ativos
- [ ] Dashboard: Buscar comissoes do mes
- [ ] Dashboard: Calcular taxa de crescimento
- [ ] Remover TODOS os valores hard-coded (R$ 12.450,00, 148 clientes, etc)

**Arquivo**: `src/pages/Dashboard.tsx`

**Codigo atual (HARD-CODED)**:
```typescript
<h2 className="text-3xl font-bold text-white">R$ 12.450,00</h2>
<h3 className="text-xl font-semibold text-[#0C1A2A]">148</h3>
```

**Codigo corrigido (REAL)**:
```typescript
// Buscar dados reais
const { data: saldo } = await supabase
  .rpc('calcular_saldo_disponivel', { contador_id: user.id });

const { data: clientes } = await supabase
  .from('clientes')
  .select('id')
  .eq('contador_id', user.id)
  .eq('status', 'ativo');

// Exibir dados reais
<h2 className="text-3xl font-bold text-white">
  {formatCurrency(saldo || 0)}
</h2>
<h3 className="text-xl font-semibold text-[#0C1A2A]">
  {clientes?.length || 0}
</h3>
```

**Criterios de aceitacao**:
- Zero valores hard-coded
- Todos os dados vem do banco
- Formatacao correta (moeda, numeros)

---

#### US3.3: Adicionar TypeScript strict em todo o frontend
**Prioridade**: MEDIA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Habilitar `strict: true` no tsconfig.json
- [ ] Adicionar tipos explicitvos em todos os useState
- [ ] Adicionar tipos em todas as funcoes
- [ ] Corrigir erros de type checking
- [ ] Adicionar interfaces para dados do Supabase

**Exemplo**:

**Codigo atual (SEM tipos)**:
```typescript
const [comissoes, setComissoes] = useState([]);
const [loading, setLoading] = useState(true);
```

**Codigo corrigido (COM tipos)**:
```typescript
interface Comissao {
  id: string;
  valor: number;
  tipo_comissao: string;
  status_comissao: string;
  competencia: string;
  criado_em: string;
}

const [comissoes, setComissoes] = useState<Comissao[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
```

**Criterios de aceitacao**:
- `strict: true` habilitado
- Zero erros de TypeScript
- Todas as variaveis tem tipos explicitos

---

#### US3.4: Remover console.log do frontend
**Prioridade**: MEDIA
**Estimativa**: 1 dia

**Tarefas**:
- [ ] Remover 19 console.log encontrados
- [ ] Substituir por logger estruturado (se necessario)
- [ ] Configurar ESLint para proibir console.log

**Arquivos**:
- `src/pages/Relatorios.tsx`
- `src/pages/Pagamentos.tsx`
- `src/pages/NotFound.tsx`
- `src/pages/Comissoes.tsx`
- `src/lib/webhook-simulator.ts`
- `src/lib/asaas-client.ts`
- `src/hooks/useAuthSecurityStatus.ts`
- `src/components/PaymentHistory.tsx`

**Criterios de aceitacao**:
- Zero console.log no frontend
- ESLint bloqueia novos console.log

---

### EPICO 4: BACKEND - LIMPEZA E OTIMIZACAO (1 semana)
**Objetivo**: Codigo limpo, performatico e manutenivel

#### US4.1: Remover logs excessivos das Edge Functions
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Remover 110 console.log encontrados
- [ ] Manter apenas logs criticos (error, warn)
- [ ] Substituir por logger estruturado
- [ ] Configurar Deno.lint para proibir console.log

**Arquivos**:
- `supabase/functions/webhook-asaas/index.ts` (45 logs)
- `supabase/functions/verificar-bonus-ltv/index.ts` (29 logs)
- `supabase/functions/send-approval-email/index.ts` (4 logs)
- `supabase/functions/processar-pagamento-comissoes/index.ts` (12 logs)
- `supabase/functions/exec-test-flavio/index.ts` (1 log)
- `supabase/functions/calcular-comissoes/index.ts` (7 logs)
- `supabase/functions/asaas-client/index.ts` (6 logs)
- `supabase/functions/aprovar-comissoes/index.ts` (6 logs)

**Exemplo (webhook-asaas)**:

**Codigo atual (VERBOSO)**:
```typescript
console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════');
console.log('[WEBHOOK DEBUG] Received webhook - analyzing...');
console.log(`[WEBHOOK DEBUG] Payload size: ${payload.length} bytes`);
console.log(`[WEBHOOK DEBUG] Signature provided: ${signature ? 'YES' : 'NO'}`);
// ... 40+ linhas de console.log
```

**Codigo corrigido (LIMPO)**:
```typescript
import { log } from '../_shared/logger.ts';

// Em desenvolvimento: mostra logs detalhados
log('debug', 'Webhook recebido', {
  payload_size: payload.length,
  has_signature: !!signature
});

// Em producao: so mostra se houver erro
if (!signatureValid) {
  log('error', 'Webhook rejeitado - assinatura invalida', {
    received_signature: signature,
    expected_signature: expectedSignature
  });
}
```

**Criterios de aceitacao**:
- Reducao de 110 logs para < 20 logs (apenas criticos)
- Logs estruturados (JSON)
- Sem emojis

---

#### US4.2: Documentar todas as Edge Functions
**Prioridade**: MEDIA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Adicionar JSDoc em cada Edge Function
- [ ] Documentar parametros de entrada (schema Zod)
- [ ] Documentar retorno (success/error)
- [ ] Adicionar exemplos de uso
- [ ] Documentar erros possiveis

**Exemplo (calcular-comissoes)**:
```typescript
/**
 * Edge Function: Calcular Comissoes
 * 
 * Responsavel por calcular as 17 bonificacoes do programa MLM/MMN.
 * 
 * Input (POST /calcular-comissoes):
 * {
 *   "pagamento_id": "uuid",
 *   "cliente_id": "uuid",
 *   "contador_id": "uuid",
 *   "valor_liquido": 130.00,
 *   "competencia": "2025-11-19",
 *   "is_primeira_mensalidade": true
 * }
 * 
 * Output (sucesso):
 * {
 *   "success": true,
 *   "comissoes_criadas": 5,
 *   "valor_total": 195.50
 * }
 * 
 * Output (erro):
 * {
 *   "error": "Pagamento ja foi processado anteriormente",
 *   "code": "IDEMPOTENCY_VIOLATION"
 * }
 * 
 * Erros possiveis:
 * - 400: Payload invalido
 * - 400: Campo obrigatorio ausente
 * - 400: Tipo de dado incorreto
 * - 409: Comissoes ja foram calculadas (idempotencia)
 * - 500: Erro ao inserir no banco
 * 
 * Exemplo de uso:
 * ```bash
 * curl -X POST https://xxx.supabase.co/functions/v1/calcular-comissoes \
 *   -H "Authorization: Bearer xxx" \
 *   -d '{"pagamento_id": "uuid", ...}'
 * ```
 */
Deno.serve(async (req) => {
  // ...
});
```

**Criterios de aceitacao**:
- Todas as Edge Functions documentadas
- Exemplos de uso incluidos
- Erros possiveis listados

---

#### US4.3: Otimizar queries do Supabase
**Prioridade**: MEDIA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Adicionar indices em colunas filtradas frequentemente
- [ ] Otimizar queries com joins desnecessarios
- [ ] Usar select() especifico (nao `*`)
- [ ] Adicionar limit em queries que podem retornar muitos dados
- [ ] Usar RPC functions para operacoes complexas

**Exemplo**:

**Codigo atual (LENTO)**:
```typescript
// Busca TODAS as colunas de TODAS as comissoes
const { data } = await supabase.from('comissoes').select('*');
```

**Codigo corrigido (RAPIDO)**:
```typescript
// Busca apenas colunas necessarias, com limite e ordem
const { data } = await supabase
  .from('comissoes')
  .select('id, valor, tipo_comissao, status_comissao, criado_em')
  .eq('contador_id', contadorId)
  .order('criado_em', { ascending: false })
  .limit(100);
```

**Criterios de aceitacao**:
- Queries retornam em < 500ms
- Indices criados em colunas criticas
- Select especifico (nao `*`)

---

#### US4.4: Adicionar rate limiting
**Prioridade**: MEDIA
**Estimativa**: 1 dia

**Tarefas**:
- [ ] Adicionar rate limiting em webhooks (max 100 req/min)
- [ ] Adicionar rate limiting em Edge Functions publicas
- [ ] Retornar 429 Too Many Requests se exceder limite
- [ ] Documentar limites

**Arquivo novo**: `supabase/functions/_shared/rate-limiter.ts`

```typescript
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(ip: string, maxRequests: number = 100): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  
  // Primeiro request ou janela expirou (1 minuto)
  if (!entry || now - entry.timestamp > 60000) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  // Incrementa contador
  entry.count++;
  
  // Excedeu limite?
  if (entry.count > maxRequests) {
    return false; // Rate limit excedido
  }
  
  return true;
}
```

**Criterios de aceitacao**:
- Rate limiting funciona
- Retorna 429 se exceder
- Logs de rate limiting

---

### EPICO 5: TESTES E QUALIDADE (1-2 semanas)
**Objetivo**: Cobertura de testes > 80%, zero bugs criticos

#### US5.1: Configurar ambiente de testes
**Prioridade**: ALTA
**Estimativa**: 1 dia

**Tarefas**:
- [ ] Configurar Vitest (frontend)
- [ ] Configurar Deno Test (backend)
- [ ] Configurar coverage reporter
- [ ] Criar scripts npm para rodar testes
- [ ] Documentar como rodar testes

**Arquivos novos**:
- `vitest.config.ts`
- `package.json` (adicionar scripts)
- `docs/GUIA_TESTES.md`

**Criterios de aceitacao**:
- `npm run test` roda todos os testes
- `npm run test:coverage` gera relatorio
- Documentacao clara

---

#### US5.2: Criar testes unitarios para funcoes criticas
**Prioridade**: CRITICA
**Estimativa**: 4 dias

**Tarefas**:
- [ ] Testes para `src/lib/commission.ts` (100% coverage)
- [ ] Testes para `src/lib/filters.ts` (100% coverage)
- [ ] Testes para `calcular-comissoes` Edge Function (90% coverage)
- [ ] Testes para `webhook-asaas` Edge Function (80% coverage)

**Criterios de aceitacao**:
- Cobertura > 80% em funcoes criticas
- Todos os testes passam
- Edge cases cobertos

---

#### US5.3: Criar testes end-to-end
**Prioridade**: ALTA
**Estimativa**: 3 dias

**Tarefas**:
- [ ] Teste E2E: Cliente paga → Webhook → Comissoes calculadas
- [ ] Teste E2E: Contador indica cliente → Cliente se cadastra → Comissao gerada
- [ ] Teste E2E: Contador solicita saque → Admin aprova → Pagamento enviado

**Arquivo**: `tests/e2e/comissoes-journey.test.ts`

**Criterios de aceitacao**:
- Fluxo completo funciona sem erros
- Testes rodam em ambiente de staging
- Documentacao de como rodar

---

#### US5.4: Implementar monitoramento continuo
**Prioridade**: ALTA
**Estimativa**: 2 dias

**Tarefas**:
- [ ] Integrar Sentry (erros em producao)
- [ ] Configurar alertas criticos (ex: webhook falhou)
- [ ] Dashboard de metricas (uptime, latencia, erros)
- [ ] CRON job de health check (testa sistema a cada hora)

**Criterios de aceitacao**:
- Sentry captura erros automaticamente
- Alertas enviados para Slack/Email
- Dashboard funcional

---

## RESUMO DO PLANO EPICO

| Epico | Objetivo | Estimativa | Prioridade |
|-------|----------|------------|------------|
| **0. Fundamentos** | Base solida e segura | 1-2 semanas | CRITICA |
| **1. Seguranca** | Eliminar riscos de fraude | 1-2 semanas | CRITICA |
| **2. Comissoes** | Precisao 100% (risco judicial) | 2-3 semanas | CRITICA |
| **3. Frontend** | UX e tratamento de erros | 1-2 semanas | ALTA |
| **4. Backend** | Limpeza e otimizacao | 1 semana | ALTA |
| **5. Testes** | Qualidade e confiabilidade | 1-2 semanas | ALTA |

**TOTAL ESTIMADO**: 7-12 semanas (2-3 meses)

---

## METRICAS DE SUCESSO

Ao final do plano epico, o codigo devera ter:

- ✅ **Zero emojis** (50 removidos)
- ✅ **Zero comentarios em ingles** (traduzidos para portugues)
- ✅ **Logs estruturados** (110 console.log → 20 logs criticos)
- ✅ **Validacao robusta** (webhook seguro, Zod em tudo)
- ✅ **Testes completos** (cobertura > 80%)
- ✅ **Documentacao completa** (MAPA_CODIGO, GUIDELINES, JSDoc)
- ✅ **Monitoramento** (Sentry, alertas criticos, reconciliacao diaria)
- ✅ **TypeScript strict** (zero erros de type checking)
- ✅ **Performance** (queries < 500ms, rate limiting)
- ✅ **Zero valores hard-coded** (dados reais do banco)

---

## PROXIMOS PASSOS

1. **Revisar e aprovar este plano epico**
2. **Priorizar epicos** (qual comecar primeiro?)
3. **Alocar time** (quem trabalha em cada epico?)
4. **Definir sprints** (2 semanas por sprint)
5. **Comecar implementacao** (Epico 0 → Epico 1 → ...)

---

## OBSERVACOES IMPORTANTES

### CRITICO: Ambiente de desenvolvimento separado
- Todo o trabalho de revisao DEVE ser feito em branch separada
- NUNCA alterar codigo em producao diretamente
- Testes DEVEM passar antes de merge para main

### CRITICO: Comissoes nao podem parar
- Durante revisao, sistema de comissoes DEVE continuar funcionando
- Planejar migracoes sem downtime
- Testar exaustivamente antes de deploy

### CRITICO: Comunicacao com stakeholders
- Informar usuarios sobre manutencoes
- Documentar mudancas visiveis (UX)
- Treinar equipe em novas funcionalidades

---

**Aguardando aprovacao para iniciar implementacao!**

