# GUIDELINES DE CODIGO - Lovable-Celite
## Padroes e Boas Praticas

**Versao**: 1.0  
**Data**: Novembro 2025  
**Conformidade**: Documento @Codigo

---

## PRINCIPIOS FUNDAMENTAIS

1. **Codigo em ingles** (variaveis, funcoes, classes)
2. **Comentarios em portugues** (simples, objetivos, diretos)
3. **Zero emojis** no codigo
4. **Precisao e completude** (codigo limpo e fluido)
5. **Zero erros tolerados** (risco judicial se comissoes falharem)

---

## NOMENCLATURA

### Arquivos

```typescript
// CORRETO
Dashboard.tsx           // Componentes React: PascalCase
useAuth.tsx            // Hooks: camelCase com prefixo 'use'
commission.ts          // Utils: camelCase
auditoria.ts           // Types: camelCase

// INCORRETO
dashboard.tsx          // Minusculo
UseAuth.tsx            // PascalCase em hook
Commission.ts          // PascalCase em util
```

### Variaveis e Funcoes

```typescript
// CORRETO
const contadorId = 'uuid';                    // camelCase
const ASAAS_API_KEY = 'xxx';                  // SCREAMING_SNAKE_CASE (constantes)
function calculateTotalCommissions() {}       // camelCase
interface CommissionInput {}                  // PascalCase (interfaces)
type AccountantLevel = 'bronze' | 'silver';   // PascalCase (types)

// INCORRETO
const ContadorID = 'uuid';                    // PascalCase
const asaas_api_key = 'xxx';                  // snake_case
function CalculateTotalCommissions() {}       // PascalCase
interface commissionInput {}                  // camelCase
```

### Database

```sql
-- CORRETO
CREATE TABLE comissoes ();              -- snake_case
ALTER TABLE rede_contadores ADD COLUMN contador_id UUID;  -- snake_case
CREATE TYPE tipo_plano AS ENUM ('pro', 'premium', 'top');  -- snake_case

-- INCORRETO
CREATE TABLE Comissoes ();              -- PascalCase
ALTER TABLE RedeContadores ADD COLUMN contadorId UUID;  -- camelCase
CREATE TYPE TipoPlano AS ENUM ();       -- PascalCase
```

---

## COMENTARIOS

### Formato

```typescript
// CORRETO
// Calcula o valor total de comissoes do contador
const total = calculateTotalCommissions(comissoes);

// Busca dados do contador no banco de dados
const contador = await supabase.from('contadores').select('*');

/**
 * Valida se o valor monetario e positivo e finito
 * 
 * @param valor Valor a ser validado
 * @param nome Nome do campo (para mensagem de erro)
 * @returns Valor arredondado com 2 casas decimais
 */
function validarValorMonetario(valor: number, nome: string): number {
  if (valor <= 0) {
    throw new Error(`${nome} deve ser positivo`);
  }
  return Math.round(valor * 100) / 100;
}

// INCORRETO
// Calculate total commissions                    // Em ingles
const total = calculateTotalCommissions(comissoes);

// 🎯 Busca dados do contador                    // Com emoji
const contador = await supabase.from('contadores').select('*');

// Função que valida valor                        // JSDoc incompleto
function validarValorMonetario(valor, nome) {}
```

### Quando comentar

```typescript
// COMENTE: Logica complexa
// Calcula override recursivo percorrendo a arvore de sponsors
// ate encontrar o primeiro sponsor ativo em cada nivel
function calculateOverrideRecursive(sponsorId: string, nivel: number) {
  // ...
}

// COMENTE: Regras de negocio nao obvias
// IMPORTANTE: Bonus de ativacao so e pago na primeira mensalidade
// Mensalidades recorrentes usam percentual por nivel (15-20%)
if (is_primeira_mensalidade) {
  comissao.valor = valor_liquido; // 100%
} else {
  comissao.valor = valor_liquido * nivel.percentual; // 15-20%
}

// NAO COMENTE: Codigo auto-explicativo
const total = comissoes.reduce((sum, c) => sum + c.valor, 0);  // Obvio

// COMENTE: Workarounds temporarios
// TODO: Remover esse workaround apos migrar para Stripe
// ASAAS nao retorna netValue em alguns casos, usando value como fallback
const valorLiquido = payment.netValue || payment.value;
```

---

## TYPESCRIPT

### Tipos Explicitos

```typescript
// CORRETO
const [comissoes, setComissoes] = useState<Comissao[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

async function buscarComissoes(contadorId: string): Promise<Comissao[]> {
  const { data, error } = await supabase
    .from('comissoes')
    .select('*')
    .eq('contador_id', contadorId);
  
  if (error) throw error;
  return data as Comissao[];
}

// INCORRETO
const [comissoes, setComissoes] = useState([]);  // Tipo any
const [loading, setLoading] = useState(false);   // Inferido, mas explicito e melhor

async function buscarComissoes(contadorId) {  // Parametro any
  // ...
  return data;  // Retorno any
}
```

### Interfaces vs Types

```typescript
// Use INTERFACE para objetos e props de componentes
interface CommissionInput {
  valor: number;
  tipo_comissao: string;
  status_comissao: string;
}

interface DashboardProps {
  userId: string;
  onLogout: () => void;
}

// Use TYPE para unions, intersections e tipos primitivos
type AccountantLevel = 'bronze' | 'silver' | 'gold' | 'diamond';
type CommissionStatus = 'calculada' | 'aprovada' | 'paga' | 'cancelada';

type WithTimestamps = {
  criado_em: string;
  atualizado_em: string;
};

type CommissionWithTimestamps = CommissionInput & WithTimestamps;
```

### Evite `any`

```typescript
// INCORRETO
function processar(dados: any) {
  return dados.valor * 2;  // Nao sabe se 'valor' existe
}

// CORRETO
interface DadosProcessamento {
  valor: number;
  tipo: string;
}

function processar(dados: DadosProcessamento) {
  return dados.valor * 2;  // TypeScript valida
}

// Se realmente nao souber o tipo, use 'unknown'
function processar(dados: unknown) {
  if (typeof dados === 'object' && dados !== null && 'valor' in dados) {
    return (dados as DadosProcessamento).valor * 2;
  }
  throw new Error('Dados invalidos');
}
```

---

## TRATAMENTO DE ERROS

### Try/Catch Obrigatorio

```typescript
// CORRETO
async function buscarComissoes() {
  try {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('comissoes')
      .select('*');
    
    if (error) {
      throw new Error(`Erro ao buscar comissoes: ${error.message}`);
    }
    
    setComissoes(data || []);
    
  } catch (err) {
    console.error('[Dashboard] Erro:', err);
    setError('Nao foi possivel carregar suas comissoes.');
    
    // Exibe toast
    toast({
      variant: 'destructive',
      title: 'Erro',
      description: 'Tente novamente em instantes.'
    });
    
  } finally {
    setLoading(false);
  }
}

// INCORRETO
async function buscarComissoes() {
  const { data, error } = await supabase.from('comissoes').select('*');
  if (!error) setComissoes(data || []);  // E se houver erro? Silencioso!
  setLoading(false);
}
```

### Validacao de Entrada

```typescript
// CORRETO
function calcularComissao(valor: number, percentual: number): number {
  // Validar entrada ANTES de processar
  if (typeof valor !== 'number' || valor <= 0) {
    throw new Error('Valor deve ser numero positivo');
  }
  
  if (typeof percentual !== 'number' || percentual < 0 || percentual > 1) {
    throw new Error('Percentual deve estar entre 0 e 1');
  }
  
  return Math.round(valor * percentual * 100) / 100;
}

// INCORRETO
function calcularComissao(valor, percentual) {
  return valor * percentual;  // E se valor for null? NaN!
}
```

---

## LOGGING

### Desenvolvimento vs Producao

```typescript
// CORRETO
const isDevelopment = import.meta.env.DEV;

function log(message: string, data?: unknown) {
  if (isDevelopment) {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
  }
}

// Usar em desenvolvimento
log('Comissoes carregadas', { total: comissoes.length });

// Erros SEMPRE logados (dev e prod)
function logError(message: string, error: Error) {
  console.error(`[ERROR] ${message}`, {
    error: error.message,
    stack: error.stack
  });
  
  // Em producao, envia para Sentry
  if (!isDevelopment) {
    // Sentry.captureException(error);
  }
}

// INCORRETO
console.log('Debug info');  // Direto, sem controle
console.log('✅ Sucesso');  // Com emoji
```

### Formato de Logs

```typescript
// CORRETO - Logs estruturados
console.log('[WEBHOOK] Recebido', {
  event: 'payment.created',
  payment_id: 'uuid',
  valor: 130.00,
  timestamp: new Date().toISOString()
});

// INCORRETO - Logs bagunçados
console.log('webhook recebido payment created uuid 130');
console.log('═══════════════════════════════════════');  // Decoracao
console.log('⚠️ Alerta');  // Emoji
```

---

## REACT COMPONENTS

### Estrutura Padrao

```typescript
// CORRETO
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface DashboardProps {
  userId: string;
}

interface Comissao {
  id: string;
  valor: number;
  tipo: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  // Estados
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Effects
  useEffect(() => {
    buscarComissoes();
  }, [userId]);
  
  // Funcoes
  async function buscarComissoes() {
    try {
      setLoading(true);
      // ...
    } catch (err) {
      // ...
    } finally {
      setLoading(false);
    }
  }
  
  // Render
  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* ... */}
    </div>
  );
}
```

### Hooks Customizados

```typescript
// CORRETO
export function useComissoes(contadorId: string) {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('comissoes')
          .select('*')
          .eq('contador_id', contadorId);
        
        if (error) throw error;
        setComissoes(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    fetch();
  }, [contadorId]);
  
  return { comissoes, loading, error };
}

// Uso
function Dashboard() {
  const { comissoes, loading, error } = useComissoes(userId);
  // ...
}
```

---

## SUPABASE

### Queries Otimizadas

```typescript
// CORRETO - Select especifico
const { data } = await supabase
  .from('comissoes')
  .select('id, valor, tipo, status, criado_em')  // Apenas colunas necessarias
  .eq('contador_id', contadorId)
  .order('criado_em', { ascending: false })
  .limit(100);  // Limita resultados

// INCORRETO - Select tudo
const { data } = await supabase
  .from('comissoes')
  .select('*');  // Busca TODAS as comissoes de TODOS os contadores!
```

### RLS Policies

```sql
-- CORRETO - Policy restritiva
CREATE POLICY "Contador ve apenas suas comissoes"
ON comissoes FOR SELECT
TO authenticated
USING (
  contador_id = auth.uid()
);

-- INCORRETO - Policy permissiva
CREATE POLICY "Todos veem tudo"
ON comissoes FOR SELECT
TO authenticated
USING (true);  -- INSEGURO!
```

---

## EDGE FUNCTIONS (DENO)

### Estrutura Padrao

```typescript
// CORRETO
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface RequestPayload {
  pagamento_id: string;
  valor: number;
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Validar metodo
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse body
    const payload: RequestPayload = await req.json();
    
    // Validar payload
    if (!payload.pagamento_id || !payload.valor) {
      return new Response(
        JSON.stringify({ error: 'Campo obrigatorio ausente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Processar
    const resultado = await processar(payload);
    
    // Retornar sucesso
    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[ERRO]', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## TESTES

### Nomenclatura

```typescript
// CORRETO
describe('commission.ts', () => {
  describe('calculateTotalCommissions', () => {
    it('deve retornar 0 para array vazio', () => {
      expect(calculateTotalCommissions([])).toBe(0);
    });
    
    it('deve somar valores corretamente', () => {
      const comissoes = [
        { valor: 100, tipo: 'ativacao', status: 'paga', competencia: '2025-11' },
        { valor: 50, tipo: 'recorrente', status: 'paga', competencia: '2025-11' }
      ];
      expect(calculateTotalCommissions(comissoes)).toBe(150);
    });
    
    it('deve rejeitar valor negativo', () => {
      const comissoes = [
        { valor: -10, tipo: 'ativacao', status: 'paga', competencia: '2025-11' }
      ];
      expect(() => calculateTotalCommissions(comissoes)).toThrow();
    });
  });
});

// INCORRETO
describe('tests', () => {  // Nome generico
  it('works', () => {  // Descricao vaga
    expect(true).toBe(true);
  });
});
```

---

## FORMATACAO (PRETTIER)

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

---

## ESLINT

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off"
  }
}
```

---

## CHECKLIST PRE-COMMIT

Antes de fazer commit, verifique:

- [ ] Codigo em ingles
- [ ] Comentarios em portugues
- [ ] Zero emojis
- [ ] Try/catch em funcoes async
- [ ] Tipos TypeScript explicitos
- [ ] Testes passando (`npm run test`)
- [ ] Lint passando (`npm run lint`)
- [ ] Formatado (`npm run format`)
- [ ] Sem console.log (exceto error/warn)
- [ ] Documentacao atualizada (se necessario)

---

**Ultima atualizacao**: Novembro 2025  
**Conformidade**: 100% com documento @Codigo

