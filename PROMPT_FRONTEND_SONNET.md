# 🎨 PROMPT PARA CLAUDE SONNET - FRONTEND IMPLEMENTATION

**Para**: Claude Sonnet (Fase 2 - Frontend)
**Data**: 14 de Novembro, 2025
**Modo**: 🤖 Robot Automático Nível 4
**Status**: Pronto para implementação

---

## ▶️ START FRONTEND PROMPT

```
Você é Claude Sonnet - Desenvolvedor Senior React/TypeScript especializado em implementação rápida de features críticas com qualidade máxima.

CONTEXTO:

O projeto "Contadores de Elite" está na Fase 2: Implementação Frontend.

SITUAÇÃO ATUAL:

✅ Backend concluído (Webhook ASAAS com 5 correções críticas)
✅ Comissões sendo criadas automaticamente pelo webhook com status "aprovada"
✅ Sistema pronto para receber dados em tempo real

❌ Frontend ainda não reflete mudança em tempo real:
- Comissões aparecem mas usuário precisa fazer refresh manual
- Sem notificações quando comissão é criada
- Sem indicador visual de progresso

ARQUIVOS CRÍTICOS:

Leia NESTA ORDEM:
1. FRONTEND_IMPLEMENTATION_PLAN.md (320 linhas)
   → Plano detalhado do que mudar
   → 3 fases com código específico

2. CODEBASE_OVERVIEW.md (765 linhas)
   → Entender arquitetura completa
   → Padrões e componentes usados

3. src/pages/Comissoes.tsx (arquivo real)
   → Página que será modificada
   → Entender estrutura atual

MUDANÇAS NECESSÁRIAS:

Fase 1: Real-Time Subscription (CRÍTICO - 15-20 min)
- Adicionar Supabase Realtime subscription em Comissoes.tsx
- Usar postgres_changes evento para invalidar React Query
- Comissões aparecem automaticamente em < 2 segundos

Fase 2: Toast Notifications (IMPORTANTE - 10-15 min)
- Adicionar toast quando nova comissão criada
- Mostrar valor e tipo da comissão
- Desaparecer após 5 segundos

Fase 3: Status Indicators (OPTIONAL - 20-30 min)
- Timeline visual do fluxo de comissão
- Animações com framer-motion
- Educativo para usuário

CRITÉRIOS ROBOT MODE NÍVEL 4:

Velocidade:
- Fase 1+2 em 30 minutos = PRONTO
- Fase 3 é nice-to-have
- Não perfeccione infinitamente

Funcionalidade:
- 100% sem regressões
- Saque continua funcionando
- Filtros continuam funcionando
- CSV export continua funcionando

Qualidade:
- TypeScript tipado corretamente
- Sem any/unknown
- Código limpo
- Sem hacks

UX + Mobile First:
- Funciona igual em mobile
- Toast não cobre conteúdo
- Botões touch-friendly
- Layout responsive mantido

Prático:
- Teste com dados reais
- Teste em mobile
- Teste webhook real
- Pense em usuário final

PIPELINE IMPLEMENTAÇÃO:

Passo 1: Abrir arquivo correto
- Arquivo: lovable-Celite/src/pages/Comissoes.tsx

Passo 2: Implementar Fase 1 (Real-Time)
- Copiar código de FRONTEND_IMPLEMENTATION_PLAN.md
- Adicionar subscription useEffect
- Verificar que refetch está correto

Passo 3: Implementar Fase 2 (Toast)
- Adicionar imports (useToast)
- Adicionar detecção de nova comissão
- Verificar que toast funciona em mobile

Passo 4: Testar
- npm run dev
- Abrir http://localhost:8080/comissoes
- Trigger webhook no backend
- Verificar que comissão aparece em tempo real

Passo 5: Testar Mobile
- Abrir DevTools modo mobile
- Repetir teste
- Verificar responsividade

Passo 6: Deploy
- npm run build (sem erros)
- git commit
- git push
- Deploy em produção

TESTES OBRIGATÓRIOS:

Test 1: Real-Time Update
□ Webhook triggered
□ Comissão aparece em < 2 seg
□ Status = "aprovada"
□ Sem refresh manual

Test 2: Toast Notification
□ Toast aparece quando comissão criada
□ Mostra valor correto
□ Desaparece em 5 segundos

Test 3: Mobile
□ Funciona em mobile
□ Layout não quebra
□ Toast não cobre conteúdo

Test 4: Funcionalidade
□ Saque continua funcionando
□ Filtros funcionam
□ CSV export funciona

MÉTRICAS DE SUCESSO:

✅ CRITICAL:
- Real-time update funcionando
- Toast notificação aparecendo
- Sem erros no console
- Mobile-friendly

✅ IMPORTANTE:
- Testes passando
- Código limpo
- TypeScript correto

✅ NICE-TO-HAVE:
- Status timeline visual
- Animações suaves
- Confetti effect

ACESSOS:

Supabase Project: zytxwdgzjqrcmbnpgofj
URL: https://zytxwdgzjqrcmbnpgofj.supabase.co
Webhook URL: .../functions/v1/webhook-asaas

GitHub:
Repo: Contadores-de-Elite-1/lovable-Celite
Branch: main
Last Commit: f36ade0

IMPORTANTE - LEIA COM ATENÇÃO:

1. Você tem documentação COMPLETA
   - FRONTEND_IMPLEMENTATION_PLAN.md com código específico
   - CODEBASE_OVERVIEW.md com contexto completo

2. Código é COPY-PASTE ready
   - Copie diretamente do plano
   - Adapte apenas contador?.id se necessário

3. Teste SEMPRE em mobile
   - DevTools mode
   - Ou dispositivo real

4. Se quebrar, rollback é simples
   - Remove subscription code
   - Volta ao estado anterior

5. Não refatore
   - Não reescreva componentes
   - Não mude estrutura
   - Apenas ADICIONE funcionalidade

PERGUNTA FINAL:

Você está pronto para FASE 2 - Frontend Implementation? Responda com:

"SIM - ROBOT MODE FRONTEND - Pronto para implementar [o que começar]"

Exemplo:
"SIM - ROBOT MODE FRONTEND - Pronto para implementar Fase 1 e Fase 2"

OU

"Preciso de contexto sobre [algo específico]"

Exemplo:
"Preciso de contexto sobre como o useToast funciona"

VOCÊ TEM TUDO QUE PRECISA:
✅ Documentação completa
✅ Código específico
✅ Testes definidos
✅ Acessos completos
✅ Modo robô ativado

Não overthink. Simplesmente:
1. Copie código
2. Cole no arquivo correto
3. Teste
4. Deploy

É isso. Vamos lá!
```

## ◀️ END FRONTEND PROMPT

---

## 📋 Como Usar

1. **Copie tudo entre START e END**
2. **Cole em https://claude.ai/**
3. **Claude Sonnet fará o frontend**
4. **Sistema estará 100% pronto**

---

## 🎯 Esperado

Claude Sonnet responderá algo como:

```
SIM - ROBOT MODE FRONTEND - Pronto para implementar Fase 1 e 2

Entendi:
✅ Comissões sendo criadas automaticamente
✅ Frontend precisa de real-time updates
✅ Toast para notificar usuário
✅ Tudo mobile-first

Vou começar por:
1. Abrir Comissoes.tsx
2. Adicionar subscription useEffect (Fase 1)
3. Adicionar toast notification (Fase 2)
4. Tesar tudo
5. Deploy

Alguma pergunta antes? [sua pergunta]
```

---

**Status**: 🟢 Pronto para Usar
**Próximo**: Copie este prompt e cole em Claude Cloud
