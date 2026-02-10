# 📧 Template de Email para Enviar ao Colaborador

**Copie, personalize e envie!**

---

## Email 1: Boas-Vindas + Acesso

```
Assunto: 🚀 Bem-vindo ao Lovable-Celite!

Olá [NOME DO COLABORADOR],

Seja muito bem-vindo ao projeto Lovable-Celite! 

Estou muito animado para trabalharmos juntos neste sistema de comissões MLM para contadores. 🎉

═══════════════════════════════════════════════════

📦 ACESSO AO REPOSITÓRIO

GitHub: https://github.com/[ORG]/lovable-celite
(Você já foi adicionado como colaborador)

═══════════════════════════════════════════════════

🚀 COMECE POR AQUI (ORDEM):

1. START_HERE_COLABORADOR.md (5 min)
   → Setup super rápido + checklist

2. INICIO_RAPIDO_COLABORADORES.md (10 min)
   → Comandos essenciais + workflow

3. SETUP_PARA_COLABORADORES.md (30 min)
   → Guia completo de configuração

4. FRAMEWORK_LOVABLE_CELITE.md (20 min)
   → Visão geral do projeto

═══════════════════════════════════════════════════

🔑 CREDENCIAIS

Enviarei separadamente via:
[ ] 1Password (pasta compartilhada)
[ ] Arquivo criptografado (senha via WhatsApp)

Você precisará de:
- Supabase (URL + Keys)
- Stripe (opcional para desenvolvimento)

═══════════════════════════════════════════════════

📞 REUNIÃO DE ALINHAMENTO

Vamos agendar uma call de 1-2 horas para:
- Walkthrough do projeto
- Tirar dúvidas
- Pair programming (primeira task juntos)

Quando você está disponível esta semana?
[Link Calendly] ou me mande 2-3 opções de horários.

═══════════════════════════════════════════════════

💬 COMUNICAÇÃO

📱 WhatsApp: [SEU NÚMERO] (dúvidas rápidas)
💼 Slack/Discord: [SEU @] (discussões técnicas)
📧 Email: [SEU EMAIL] (assuntos formais)

Respondo em < 2 horas durante o horário comercial.

═══════════════════════════════════════════════════

✅ PRIMEIROS PASSOS (Hoje/Amanhã):

1. Acesse o repositório no GitHub
2. Leia START_HERE_COLABORADOR.md
3. Configure o ambiente (Codespaces ou local)
4. Me avise quando estiver rodando!

═══════════════════════════════════════════════════

Qualquer dúvida, estou à disposição! Não hesite em perguntar.

Vamos fazer um produto incrível juntos! 🚀

Abraço,
[SEU NOME]

---

P.S.: Preparei um handover MUITO completo. Você vai ter todo o contexto, conversas, decisões técnicas, tudo documentado. Garanto que vai ser tranquilo! 😄
```

---

## Email 2: Credenciais (Separado!)

**⚠️ IMPORTANTE: Envie as credenciais em email SEPARADO!**

```
Assunto: 🔑 Lovable-Celite - Credenciais de Acesso

Olá [NOME],

Segue acesso às credenciais do projeto.

═══════════════════════════════════════════════════

🔐 MÉTODO DE COMPARTILHAMENTO

[ OPÇÃO A - 1Password ]
Pasta compartilhada: "Lovable-Celite - Credenciais"
Link: [LINK DO 1PASSWORD]
Você receberá um email do 1Password para aceitar.

[ OPÇÃO B - Arquivo Criptografado ]
Arquivo em anexo: CREDENCIAIS.txt.gpg
Senha: Enviarei via WhatsApp em mensagem separada
Para descriptografar: gpg -d CREDENCIAIS.txt.gpg > .env.local

═══════════════════════════════════════════════════

📋 CREDENCIAIS INCLUÍDAS

✅ Supabase (URL + anon_key + service_role_key)
✅ Stripe (public + secret keys) - Ambiente TEST
✅ ASAAS (API key) - Opcional
✅ GitHub (access token) - Se necessário

═══════════════════════════════════════════════════

🔒 SEGURANÇA

- NUNCA compartilhe estas credenciais com terceiros
- NUNCA commite o arquivo .env.local no Git
- Use apenas as keys de TEST no desenvolvimento
- Keys de PRODUÇÃO ficam comigo (por enquanto)

═══════════════════════════════════════════════════

📍 ONDE USAR

Após clonar o repositório:

1. Crie o arquivo .env.local na raiz
2. Copie as credenciais para este arquivo
3. Salve e inicie o servidor: pnpm dev
4. Deve funcionar! ✅

Exemplo de .env.local:

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-key-aqui
VITE_STRIPE_PUBLIC_KEY=pk_test_sua-key
...

═══════════════════════════════════════════════════

Qualquer problema para acessar, me avise!

Abraço,
[SEU NOME]
```

---

## Email 3: Depois da Reunião de Alinhamento

```
Assunto: ✅ Resumo da Reunião + Próximos Passos

Olá [NOME],

Ótima reunião hoje! Foi muito bom conversar e ver que você já está entendendo o projeto.

═══════════════════════════════════════════════════

📝 RESUMO DO QUE CONVERSAMOS

- Stack técnica (Vite + React + Supabase + Stripe)
- Arquitetura do sistema de comissões
- Fluxo de webhook → cálculo → pagamento
- Estrutura do código (src/, supabase/)
- Prioridades atuais

═══════════════════════════════════════════════════

🎯 PRÓXIMOS PASSOS PARA VOCÊ

1️⃣ ESTA SEMANA:
   - [ ] Terminar setup do ambiente
   - [ ] Explorar o código (src/, supabase/)
   - [ ] Rodar os testes: pnpm test
   - [ ] Escolher primeira task (ver GitHub Issues)

2️⃣ PRIMEIRA TASK:
   Sugestão: [DESCRIÇÃO DA TASK]
   
   Por quê esta? É pequena, bem definida, e vai te fazer
   entender [PARTE DO SISTEMA].
   
   Link da Issue: [LINK]

3️⃣ WORKFLOW:
   git checkout -b feature/sua-task
   # Desenvolve
   git commit -m "feat: sua feature"
   git push origin feature/sua-task
   # Abre PR
   # Eu reviso em < 24h

═══════════════════════════════════════════════════

📅 DAILY SYNC

Vamos fazer um check-in diário de 15 min?
Horário sugerido: [HORÁRIO]
Via: [Zoom/Meet/Slack call]

Podemos ajustar se não funcionar para você.

═══════════════════════════════════════════════════

📚 LEITURAS RECOMENDADAS (quando tiver tempo)

- docs/17 bonificacoes_Regras do programa (regras de negócio)
- docs/AVATAR (persona do cliente - importante para UX)
- CONTEXTO_COMPLETO.md (quando eu criar com histórico)

═══════════════════════════════════════════════════

🤝 COMO TRABALHAR JUNTOS

- Dúvidas rápidas: WhatsApp
- Discussões técnicas: GitHub Issues
- Code review: GitHub PRs (< 24h)
- Pair programming: Quando necessário (é só pedir!)
- Daily: 15 min por dia

═══════════════════════════════════════════════════

💡 LEMBRE-SE

- Pergunte sempre que tiver dúvida (sério!)
- Documente o que aprender
- Teste antes de committar
- Commits pequenos e frequentes
- Se travar, me chama!

═══════════════════════════════════════════════════

Ansioso para ver suas primeiras contribuições! 🚀

Qualquer coisa, estou aqui.

Abraço,
[SEU NOME]
```

---

## Email 4: Check-in Semanal (Template)

```
Assunto: 📊 Check-in Semanal - [DATA]

Olá [NOME],

Como foi a semana? Vamos alinhar! 

═══════════════════════════════════════════════════

✅ O QUE VOCÊ FEZ

- [LISTAR REALIZAÇÕES]
- [TAREFAS COMPLETADAS]
- [PRs ABERTOS/MERGEADOS]

═══════════════════════════════════════════════════

🎯 PRÓXIMA SEMANA

Sugestão de foco:
- [ ] [TAREFA 1]
- [ ] [TAREFA 2]
- [ ] [TAREFA 3]

═══════════════════════════════════════════════════

🚧 BLOQUEIOS / DÚVIDAS

[LISTAR SE HOUVER]

Como posso ajudar?

═══════════════════════════════════════════════════

📅 REUNIÃO

Vamos manter nossa call semanal?
[DIA] às [HORÁRIO] via [LINK]

Agenda:
- Revisar progresso
- Tirar dúvidas
- Planejar próxima semana

═══════════════════════════════════════════════════

Continue assim! 🚀

Abraço,
[SEU NOME]
```

---

## WhatsApp Messages (Templates Rápidos)

### Boas-vindas
```
Olá [NOME]! 👋

Te adicionei no projeto Lovable-Celite no GitHub.

Acabei de enviar um email com tudo que você precisa para começar.

Dá uma olhada quando puder e me avisa se tiver qualquer dúvida!

Bem-vindo ao time! 🚀
```

### Senha da criptografia
```
🔑 Senha do arquivo CREDENCIAIS.txt.gpg:

[SUA_SENHA_FORTE_AQUI]

Guarde em local seguro e delete esta mensagem depois! 🔒
```

### Lembrete amigável
```
E aí, [NOME]! Tudo certo?

Conseguiu configurar o ambiente?

Se tiver travado em alguma coisa, é só me dar um toque!

Estou aqui para ajudar! 😄
```

### Após PR
```
Olá! Vi seu PR #[NÚMERO] 👀

Vou revisar hoje ainda e te dou feedback!

Obrigado pela contribuição! 🚀
```

---

## Dicas de Comunicação

### ✅ Boas Práticas

1. **Seja claro e direto** - Mas sempre amigável
2. **Estruture bem** - Use listas, seções, emojis
3. **Dê contexto** - Explique o "por quê"
4. **Seja disponível** - Responda rápido (< 2h)
5. **Celebre conquistas** - Reconheça o trabalho

### ❌ Evite

1. Emails longos demais sem estrutura
2. Jargão técnico sem explicação
3. Assumir conhecimento prévio
4. Demorar muito para responder
5. Ser impaciente com dúvidas

---

## Checklist de Comunicação

### Primeiro Contato
- [ ] Email de boas-vindas enviado
- [ ] Credenciais compartilhadas (seguramente!)
- [ ] WhatsApp de boas-vindas
- [ ] Reunião agendada

### Durante Onboarding
- [ ] Daily check-ins (15 min)
- [ ] Resposta rápida a dúvidas
- [ ] Feedback em PRs (< 24h)
- [ ] Pair programming disponível

### Após Onboarding
- [ ] Check-in semanal
- [ ] Code reviews regulares
- [ ] Comunicação assíncrona (Issues, PRs)
- [ ] Disponibilidade para dúvidas

---

**Criado por:** Claude Sonnet 4.5  
**Data:** Fevereiro 2026  
**Para:** Facilitar comunicação com novo colaborador

---

> 💡 **Dica**: Salve estes templates em um arquivo `.txt` para usar sempre que precisar!

