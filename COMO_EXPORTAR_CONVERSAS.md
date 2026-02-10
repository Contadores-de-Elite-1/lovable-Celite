# 💬 Como Exportar Conversas do Cursor/Claude

**Guia prático para salvar todo o contexto das suas conversas com IA**

---

## 🎯 Por Que Exportar?

O histórico de conversas contém:
- ✅ Decisões técnicas tomadas
- ✅ Bugs resolvidos e soluções
- ✅ Explicações de arquitetura
- ✅ Contexto de mudanças importantes
- ✅ Aprendizados e insights

**= OURO para seu colaborador entender o projeto!**

---

## 📱 Método 1: Cursor (Chat Local)

### Passo a Passo

1. **Abra o Cursor**
2. **Vá para o painel de Chat** (Cmd+L ou Ctrl+L)
3. **Selecione a conversa** que quer exportar

4. **Copie a conversa:**
   - Mac: Cmd+A (selecionar tudo) → Cmd+C (copiar)
   - Windows/Linux: Ctrl+A → Ctrl+C

5. **Cole em um arquivo:**
   ```bash
   # Crie o arquivo
   touch HISTORICO_CURSOR_$(date +%Y%m%d).md
   
   # Abra no editor
   code HISTORICO_CURSOR_$(date +%Y%m%d).md
   # ou
   nano HISTORICO_CURSOR_$(date +%Y%m%d).md
   ```

6. **Cole o conteúdo** (Cmd+V ou Ctrl+V)

7. **Formate o arquivo:**

```markdown
# Histórico de Conversas - Cursor
**Data**: 10/02/2026
**Projeto**: Lovable-Celite
**IA**: Claude Sonnet 4.5

---

## Sessão 1: Setup do Projeto
**Data/Hora**: [TIMESTAMP]

### USER
Como faço setup deste projeto para colaborador?

### ASSISTANT
Olá! Sou Claude Sonnet 4.5...
[RESPOSTA COMPLETA]

---

## Sessão 2: [PRÓXIMO TÓPICO]
...
```

### Onde Ficam os Chats do Cursor?

Os chats podem estar em:

**Mac:**
```bash
~/Library/Application Support/Cursor/User/globalStorage/
```

**Windows:**
```bash
%APPDATA%\Cursor\User\globalStorage\
```

**Linux:**
```bash
~/.config/Cursor/User/globalStorage/
```

⚠️ **Nota**: Formato pode ser binário ou JSON, não é fácil de ler diretamente.

---

## 🌐 Método 2: Claude.ai (Web)

### Se Usou Claude.ai Diretamente

1. **Acesse:** https://claude.ai
2. **Faça login**
3. **Encontre a conversa** na sidebar
4. **Clique nos "..." (três pontos)** no topo da conversa
5. **Selecione "Share"** ou "Export" (se disponível)

### Ou Copie Manualmente:

1. **Scroll até o topo** da conversa
2. **Selecione todo o texto** (Cmd+A / Ctrl+A)
3. **Copie** (Cmd+C / Ctrl+C)
4. **Cole em um arquivo** `.md`

---

## 📝 Método 3: Screenshot e OCR (Última Opção)

Se não conseguir copiar texto:

1. **Tire screenshots** de toda a conversa
2. **Use OCR** (Optical Character Recognition):
   - Mac: Preview tem OCR nativo
   - Windows: OneNote ou Adobe Acrobat
   - Online: https://www.onlineocr.net/

3. **Combine tudo** em um único arquivo Markdown

---

## 🗂️ Organização Recomendada

Crie uma pasta para históricos:

```bash
mkdir -p historico-conversas

cd historico-conversas

# Crie arquivos por tópico
touch 01-setup-inicial.md
touch 02-correcao-webhook.md
touch 03-calculo-comissoes.md
touch 04-frontend-dashboard.md
touch 05-deployment.md
```

**Estrutura de cada arquivo:**

```markdown
# [TÓPICO] - Histórico de Conversa
**Data**: DD/MM/YYYY
**Duração**: [ESTIMATIVA]
**IA**: Claude Sonnet 4.5 via Cursor
**Status**: Resolvido/Em andamento/Bloqueado

---

## Contexto

Por que esta conversa foi iniciada:
[EXPLICAÇÃO]

---

## Problema/Objetivo

[DESCRIÇÃO DO PROBLEMA OU OBJETIVO]

---

## Conversa

### USER (HH:MM)
[Mensagem do usuário]

### ASSISTANT (HH:MM)
[Resposta da IA]

...

---

## Resultado

O que foi alcançado:
- [x] [ITEM 1]
- [x] [ITEM 2]

Arquivos modificados:
- `src/components/X.tsx`
- `supabase/functions/Y/index.ts`

Commits relacionados:
- abc123 - feat: implementa X
- def456 - fix: corrige Y

---

## Aprendizados

1. [APRENDIZADO 1]
2. [APRENDIZADO 2]

---

## Próximos Passos

- [ ] [PRÓXIMA AÇÃO 1]
- [ ] [PRÓXIMA AÇÃO 2]
```

---

## 🔍 Método 4: Usar Git Commits como Contexto

Se você commitou bem, os commits já contam a história!

```bash
# Ver histórico detalhado
git log --oneline --decorate --graph --all > HISTORICO_GIT.txt

# Ver commits com mensagens completas
git log --pretty=format:"%h - %an, %ar : %s" > HISTORICO_COMMITS.txt

# Ver diff de cada commit
git log -p > HISTORICO_COMPLETO.txt

# Ver apenas commits de hoje
git log --since="today" --pretty=format:"%h %s"

# Ver commits por autor
git log --author="SEU_NOME" --pretty=format:"%h %s"
```

---

## 📦 Template: Documento de Contexto Completo

Crie um arquivo consolidado:

```bash
touch CONTEXTO_COMPLETO.md
```

**Conteúdo:**

```markdown
# Contexto Completo - Lovable-Celite

**Período**: [DATA INÍCIO] até [DATA FIM]
**Autor**: [SEU NOME]
**Para**: [COLABORADOR]
**Projeto**: Sistema de Comissões MLM

---

## Índice

1. [Timeline do Projeto](#timeline-do-projeto)
2. [Decisões Técnicas](#decisões-técnicas)
3. [Problemas Resolvidos](#problemas-resolvidos)
4. [Código Importante](#código-importante)
5. [Conversas Relevantes](#conversas-relevantes)
6. [Próximos Passos](#próximos-passos)

---

## Timeline do Projeto

### Semana 1: Setup Inicial
**Data**: [DATAS]

**O que foi feito:**
- [x] Setup Vite + React + TypeScript
- [x] Integração Supabase
- [x] Estrutura de pastas
- [x] Componentes base (Shadcn/UI)

**Conversas:**
- Ver: `historico-conversas/01-setup-inicial.md`

**Commits:**
- abc123 - Initial commit
- def456 - Add Supabase integration

---

### Semana 2: Backend (Edge Functions)
**Data**: [DATAS]

**O que foi feito:**
- [x] Edge Function: webhook-asaas
- [x] Edge Function: calcular-comissoes
- [x] Migrations do banco

**Conversas:**
- Ver: `historico-conversas/02-backend-functions.md`

**Commits:**
- ghi789 - Add webhook-asaas function
- jkl012 - Add calcular-comissoes function

---

## Decisões Técnicas

### 1. Stack: Por que Supabase?

**Data**: [DATA]
**Participantes**: [VOCÊ], Claude Sonnet 4.5

**Contexto:**
Precisávamos de:
- Backend escalável
- Auth nativo
- PostgreSQL (queries complexas)
- Real-time (futuro)
- Edge Functions (webhooks)

**Opções consideradas:**
1. Firebase (descartado - Firestore limitado)
2. Supabase (escolhido)
3. AWS Amplify (complexo demais)

**Decisão:**
Supabase por:
- PostgreSQL completo
- RLS nativo (Row Level Security)
- Edge Functions (Deno)
- Open source
- Ótima DX

**Impacto:**
- Queries SQL complexas possíveis
- Segurança via RLS policies
- Webhooks via Edge Functions
- Custo menor que Firebase

---

### 2. Cálculo de Comissão: Valor Líquido

**Data**: [DATA]
**CRÍTICO**: Mudança nas regras de negócio

**Contexto:**
Cliente definiu que comissão deve ser calculada sobre valor APÓS taxas do Stripe.

**Antes:**
```typescript
// Comissão sobre valor bruto
const comissao = valorBruto * 0.15; // 15% de R$130 = R$19,50
```

**Depois:**
```typescript
// Comissão sobre valor líquido (após Stripe)
const valorLiquido = valorBruto - taxaStripe;
const comissao = valorLiquido * 0.15; // 15% de R$125,93 = R$18,89
```

**Arquivos afetados:**
- `src/components/Calculadora.tsx`
- `supabase/functions/calcular-comissoes/index.ts`
- Testes unitários

**Status:** Implementado ✅

---

## Problemas Resolvidos

### Problema 1: Webhook ASAAS não processava

**Data**: [DATA]
**Severidade**: CRÍTICA 🔴

**Sintoma:**
Pagamentos confirmados no ASAAS, mas comissões não eram calculadas.

**Investigação:**
1. Checamos logs: Edge Function retornava 401
2. Verificamos signature: estava incorreta
3. Debugamos código de validação

**Causa raiz:**
```typescript
// ERRADO
const signature = req.headers.get('asaas-signature');
const isValid = signature === expectedSignature; // Comparação direta

// CORRETO
const signature = req.headers.get('asaas-access-token');
const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
);
```

**Solução:**
- Corrigir validação de signature
- Usar `crypto.timingSafeEqual()` para evitar timing attacks
- Adicionar logs detalhados

**Commit:** abc123 - fix: corrige validação webhook ASAAS

**Conversa completa:**
Ver: `historico-conversas/correcao-webhook-asaas.md`

---

## Código Importante

### Calculadora de Comissões

**Arquivo:** `src/components/Calculadora.tsx`

**O que faz:**
Calcula comissões em tempo real baseado em:
- Valor do plano
- Nível do contador (Bronze/Prata/Ouro/Diamante)
- Posição na rede (direto, indireto 1, 2, 3)

**Lógica chave:**
```typescript
// Valor líquido após Stripe (4,18% de taxa)
const valorLiquido = valorBruto * 0.9582;

// Comissão por nível
const percentuais = {
  bronze: 0.10,   // 10%
  prata: 0.125,   // 12,5%
  ouro: 0.15,     // 15%
  diamante: 0.175 // 17,5%
};

const comissao = valorLiquido * percentuais[nivel];
```

**Por que é importante:**
- Core do negócio
- Usada em várias telas
- Base para projeções e simulador

---

### Edge Function: calcular-comissoes

**Arquivo:** `supabase/functions/calcular-comissoes/index.ts`

**O que faz:**
Processa um pagamento e calcula comissões para toda a rede (até 7 níveis).

**Flow:**
1. Recebe evento de pagamento (webhook)
2. Busca contador que vendeu
3. Percorre upline (7 níveis)
4. Calcula comissão de cada
5. Insere na tabela `comissoes`
6. Atualiza saldos

**Decisões técnicas:**
- Usa transaction para garantir consistência
- Idempotência via `payment_id` único
- Logs estruturados para debug

---

## Conversas Relevantes

### Setup do Projeto

**Data**: [DATA]
**Arquivo**: `historico-conversas/01-setup-inicial.md`

**Resumo:**
Configuração inicial do projeto, escolha de stack, estrutura de pastas.

**Decisões:**
- Vite ao invés de CRA (mais rápido)
- pnpm ao invés de npm (mais eficiente)
- Shadcn/UI para componentes

---

### Correção do Webhook

**Data**: [DATA]
**Arquivo**: `historico-conversas/02-correcao-webhook.md`

**Resumo:**
Debug e correção do webhook ASAAS que não processava pagamentos.

**Aprendizados:**
- Sempre validar signature de webhooks
- Usar `crypto.timingSafeEqual()` para comparações seguras
- Logs detalhados são essenciais

---

## Próximos Passos

### Prioridade Alta 🔴

1. **Upload de Comprovante de Residência**
   - Adicionar ao onboarding (etapa 4.3)
   - Storage no Supabase
   - Validação de formato (PDF/JPG/PNG)

2. **Ajustar Calculadora**
   - Usar valor líquido (pós-Stripe)
   - Atualizar todos os cálculos
   - Adicionar testes

3. **Logo do Contador no Onboarding**
   - Cada etapa exibe logo do contador
   - Buscar de `contadores.logo_url`
   - Fallback para logo genérica

### Prioridade Média 🟡

- Implementar simulador de crescimento
- Dashboard de comissões
- Sistema de níveis (gamificação)

### Prioridade Baixa 🟢

- Push notifications
- Ranking de contadores
- App mobile

---

## Arquivos de Referência

- **Setup**: `SETUP_PARA_COLABORADORES.md`
- **Início Rápido**: `INICIO_RAPIDO_COLABORADORES.md`
- **Framework**: `FRAMEWORK_LOVABLE_CELITE.md`
- **Regras de Negócio**: `docs/17 bonificacoes_Regras do programa`
- **Persona**: `docs/AVATAR`

---

## Contato

**Qualquer dúvida:**
- Email: [SEU EMAIL]
- WhatsApp: [SEU WHATSAPP]
- GitHub: @[SEU USUARIO]

**Disponibilidade:**
- [DIAS] das [HORÁRIOS]
- Respondo em < 2h

---

**Criado em**: [DATA]
**Por**: [SEU NOME]
**Para**: [COLABORADOR]

**Boa sorte! 🚀**
```

---

## ✅ Checklist de Exportação

### Conversas
- [ ] Histórico do Cursor exportado
- [ ] Conversas do Claude.ai salvas
- [ ] Organizado por tópicos
- [ ] Formatado em Markdown

### Contexto
- [ ] Decisões técnicas documentadas
- [ ] Problemas resolvidos listados
- [ ] Aprendizados registrados
- [ ] Código importante explicado

### Git
- [ ] Histórico de commits exportado
- [ ] Commits bem descritos
- [ ] Branches documentadas

### Arquivos
- [ ] `CONTEXTO_COMPLETO.md` criado
- [ ] `historico-conversas/` pasta criada
- [ ] Arquivos organizados
- [ ] Fácil de navegar

---

## 💡 Dicas

1. **Exporte frequentemente** - Não deixe acumular
2. **Use nomes descritivos** - `historico-conversas/02-correcao-webhook.md`
3. **Inclua data** - Facilita timeline
4. **Seja detalhado** - Mais contexto = melhor
5. **Formate bem** - Markdown limpo é mais fácil de ler

---

**Criado por:** Claude Sonnet 4.5  
**Data:** Fevereiro 2026  
**Objetivo:** Exportar contexto completo das conversas

**Preserve o conhecimento! 🧠**

