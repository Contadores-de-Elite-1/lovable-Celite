# PRD - App de Onboarding de Clientes
## Sistema de Captacao e Ativacao de Clientes - Top Class

**Versao**: 1.0  
**Data**: Novembro 2025  
**Responsavel**: DEV 1  
**Tempo estimado**: 3-4 semanas

---

## O QUE E ESTE APP?

E o aplicativo onde o **cliente** (indicado por um contador) se cadastra, escolhe um plano, envia documentos, assina o contrato e paga para usar o endereco comercial da Top Class.

**Objetivo**: Cliente consegue fazer TUDO sozinho, em 5-8 minutos, no celular.

---

## COMO FUNCIONA (PARA LEIGOS)

```
1. Contador envia link para cliente via WhatsApp
   Exemplo: https://onboarding.topclass.com/?ref=ABC123
   
2. Cliente clica no link (abre no celular)

3. Cliente escolhe plano (Pro/Premium/Top)

4. Cliente preenche dados (nome, CPF/CNPJ, email, telefone, endereco)

5. Cliente tira foto dos documentos (CNH, comprovante, etc)

6. Cliente ve o contrato e assina com o dedo na tela

7. Cliente paga com cartao de credito (Stripe)

8. Sistema calcula comissoes automaticamente para o contador

9. Top Class assina o contrato e envia para o cliente
```

**Tempo total**: 5-8 minutos

---

## AS 7 TELAS DO APP

### TELA 1: BEM-VINDO
**O que o cliente ve**:
- Logo da Top Class
- Foto do contador que indicou
- Texto: "Voce foi indicado por [Nome do Contador]"
- Explicacao rapida: "Em 5 passos voce usa nosso endereco e consegue seu Alvara"
- Botao grande: "COMECAR AGORA"
- Bolinha verde de WhatsApp no canto (para tirar duvidas)

**O que acontece por tras**:
- Sistema decodifica o link (ref=ABC123)
- Busca no banco: Qual contador enviou este link?
- Mostra nome e foto do contador

---

### TELA 2: ESCOLHA SEU PLANO
**O que o cliente ve**:
- 3 cards com os planos:
  - **Pro**: R$ 100/mes (endereco + correspondencias)
  - **Premium**: R$ 130/mes (tudo do Pro + sala de reunioes 2h/mes) ← DESTAQUE
  - **Top**: R$ 180/mes (tudo do Premium + sala 4h/mes + consultoria)
- Cliente toca no card que quer
- Botao: "CONTINUAR"

**O que acontece por tras**:
- Sistema salva: "Cliente escolheu Premium"
- Guarda essa informacao para usar depois no pagamento

---

### TELA 3: SEUS DADOS
**O que o cliente ve**:
- Formulario simples:
  - Voce e: [ ] Pessoa Fisica (CPF) [ ] Empresa (CNPJ)
  - Nome completo / Razao social: [______]
  - CPF/CNPJ: [___.___.___-__] ← Mascara automatica
  - Email: [______]
  - Telefone: [(__)_____-____]
  - CEP: [_____-___] ← Busca endereco automaticamente
  - Logradouro: [______] ← Preenchido automaticamente
  - Numero: [___]
  - Bairro: [______] ← Preenchido automaticamente
  - Cidade: [______] ← Preenchido automaticamente
- Botao: "CONTINUAR PARA DOCUMENTOS"

**O que acontece por tras**:
- Valida CPF/CNPJ em tempo real (mostra X vermelho se invalido)
- Quando cliente digita CEP, busca endereco na API ViaCEP
- Preenche logradouro, bairro, cidade automaticamente
- Cliente so precisa digitar o numero do imovel

**Para leigos**: Imagine preencher um formulario do Google Forms, mas mais rapido porque o app ja preenche metade dos campos sozinho.

---

### TELA 4: ENVIE SEUS DOCUMENTOS
**O que o cliente ve**:
- Explicacao: "Tire fotos claras dos documentos. Usaremos para fazer seu contrato."
- Cards de upload:
  1. **CNH ou RG** (frente e verso)
     - [ ] Tirar foto
     - [ ] Escolher da galeria
  2. **Comprovante de Residencia** (luz, agua, gas - ultimos 90 dias)
     - [ ] Tirar foto
     - [ ] Escolher da galeria
  3. **Contrato Social** (so se for empresa)
     - [ ] Tirar foto
     - [ ] Escolher da galeria
- Botao: "CONTINUAR PARA CONTRATO"

**O que acontece por tras**:
- Cliente toca em "Tirar foto" → Abre camera do celular
- Cliente tira foto → Sistema faz upload para Supabase Storage
- Sistema valida: Arquivo e muito grande? (max 10MB)
- Sistema valida: Arquivo e PDF ou imagem? (nao aceita .txt, .docx)
- Mostra ✓ verde quando upload terminou

**Para leigos**: Como enviar foto no WhatsApp, mas dentro do app.

---

### TELA 5: SEU CONTRATO
**O que o cliente ve**:
- Texto: "Este e o contrato que voce vai assinar. Leia com atencao."
- Preview do contrato PDF (mostra dentro do app, nao precisa baixar)
  - Contrato ja vem preenchido com nome, CPF, plano, valor
- Botao: "Baixar contrato para ler melhor" (opcional)
- Secao de assinatura:
  - Texto: "Assine com o dedo na area abaixo:"
  - Quadrado branco com borda tracejada
  - Cliente desenha assinatura com o dedo
  - Botao pequeno: "Limpar" (para refazer)
- Checkbox: [ ] "Li e aceito os termos do contrato"
- Botao: "CONTINUAR PARA PAGAMENTO" (so fica verde se checkbox marcado)

**O que acontece por tras**:
- Sistema gera contrato PDF automaticamente (biblioteca PDFKit)
- Preenche contrato com dados do cliente (nome, CPF, plano)
- Cliente desenha assinatura → Sistema converte para imagem PNG
- Salva assinatura no banco de dados

**Para leigos**: Como assinar um documento no tablet, mas no celular.

---

### TELA 6: PAGAMENTO
**O que o cliente ve**:
- Texto: "Falta pouco! Efetue o pagamento para ativar seu plano."
- Resumo:
  - Plano escolhido: Premium
  - Valor mensal: R$ 130,00
  - Primeira cobranca: Hoje
  - Proximas cobranças: Todo dia 19 do mes
- Botao: "PAGAR COM CARTAO" (abre Stripe Checkout)

**Cliente e redirecionado para tela do Stripe**:
- Formulario Stripe (seguro, ja validado):
  - Numero do cartao: [____ ____ ____ ____]
  - Validade: [__/__]
  - CVV: [___]
  - Nome no cartao: [______]
- Botao: "PAGAR R$ 130,00"

**O que acontece por tras**:
- Sistema chama Edge Function: "create-checkout-session"
- Edge Function cria sessao no Stripe com:
  - Valor: R$ 130 (plano Premium)
  - Cliente: email do cliente
  - Metadata: ID do contador (para calcular comissoes depois)
- Stripe processa pagamento
- Se aprovado: Cliente volta para Tela 7
- Se recusado: Mostra erro "Cartao recusado. Tente outro."

**Para leigos**: Como pagar na Amazon ou Netflix - formulario seguro do Stripe.

---

### TELA 7: SUCESSO!
**O que o cliente ve**:
- Icone grande de ✓ verde
- Texto: "Pagamento confirmado!"
- Texto: "Seu contrato sera assinado pela Top Class e enviado em ate 24 horas."
- Box com fundo cinza:
  - Protocolo: TC-2025-00123
- Botoes:
  - [ Ver Contrato (Preview) ]
  - [ Falar no WhatsApp ]
- Texto pequeno: "Voce recebera um email com todas as informacoes."

**O que acontece por tras**:
- Stripe envia webhook para nosso sistema
- Sistema cria registro do cliente no banco de dados
- Sistema cria registro do pagamento
- Sistema calcula as 17 bonificacoes para o contador
- Sistema envia email para admin@topclass.com: "Novo cliente pago - assine contrato"
- Sistema envia email para cliente: "Pagamento confirmado"

**Para leigos**: Como quando voce compra algo na internet e recebe "Pedido confirmado!".

---

## TECNOLOGIAS USADAS

### Frontend (o que o cliente ve)
- **React**: Biblioteca para criar interfaces (como o app do Instagram)
- **Vite**: Ferramenta que deixa o app rapido
- **TypeScript**: JavaScript com validacao de tipos (evita erros)
- **Tailwind CSS**: Estilizacao (cores, espacamentos, botoes)
- **Shadcn/UI**: Componentes prontos (botoes, formularios)
- **React Hook Form**: Gerencia formularios (valida CPF, email, etc)
- **Zod**: Valida dados em tempo real

### Backend (o que acontece por tras)
- **Supabase**: Banco de dados + servidor (como Firebase)
- **Edge Functions**: Funcoes que rodam no servidor (JavaScript/TypeScript)
- **PostgreSQL**: Banco de dados (guarda clientes, pagamentos, comissoes)
- **Supabase Storage**: Armazena arquivos (documentos, contratos)

### Integracoes (servicos externos)
- **Stripe**: Processa pagamentos (cartao de credito)
- **ViaCEP**: Busca endereco por CEP (API gratuita)
- **ReceitaWS**: Valida CNPJ (API gratuita)
- **PDFKit**: Gera contratos em PDF
- **Brevo**: Envia emails (confirmacao de pagamento)

---

## BANCO DE DADOS

### Tabela: onboarding_temp (temporaria)
Guarda dados do cliente ANTES de pagar (caso ele desista no meio)

| Campo | Tipo | Explicacao |
|-------|------|------------|
| id | UUID | Identificador unico |
| ref_token | Texto | Token do link (ref=ABC123) |
| contador_id | UUID | Qual contador indicou |
| plano | Texto | pro / premium / top |
| dados_cliente | JSON | Nome, CPF, email, telefone, endereco |
| documentos | JSON | URLs dos arquivos enviados |
| assinatura_cliente | Texto | Imagem da assinatura (base64) |
| status | Texto | "aguardando_pagamento" |
| criado_em | Data/Hora | Quando comecou o cadastro |
| expira_em | Data/Hora | Apaga depois de 24h se nao pagar |

**Para leigos**: Como um carrinho de compras - se voce nao finalizar a compra em 24h, o sistema apaga.

---

### Tabela: clientes (definitiva)
Guarda dados do cliente DEPOIS de pagar (fica para sempre)

| Campo | Tipo | Explicacao |
|-------|------|------------|
| id | UUID | Identificador unico |
| contador_id | UUID | Qual contador indicou |
| nome | Texto | Nome completo / Razao social |
| email | Texto | Email do cliente |
| telefone | Texto | Telefone do cliente |
| cpf_cnpj | Texto | CPF ou CNPJ |
| tipo_pessoa | Texto | PF ou PJ |
| plano | Texto | pro / premium / top |
| status | Texto | ativo / inativo / cancelado |
| stripe_customer_id | Texto | ID do cliente no Stripe |
| stripe_subscription_id | Texto | ID da assinatura no Stripe |
| dados_completos | JSON | Endereco completo, etc |
| documentos | JSON | URLs dos documentos |
| assinatura_cliente | Texto | Imagem da assinatura |
| contrato_assinado_cliente_em | Data/Hora | Quando cliente assinou |
| contrato_assinado_topclass_em | Data/Hora | Quando Top Class assinou |
| contrato_final_url | Texto | URL do contrato assinado |
| criado_em | Data/Hora | Quando foi criado |

**Para leigos**: Como sua ficha cadastral na academia - fica guardada para sempre.

---

## EDGE FUNCTIONS (FUNCOES NO SERVIDOR)

### 1. validate-referral-token
**O que faz**: Valida se o link e valido e busca dados do contador

**Entrada**:
```json
{ "token": "ABC123" }
```

**Saida**:
```json
{
  "valid": true,
  "contador_id": "uuid-do-contador",
  "contador_nome": "Jose da Silva",
  "contador_foto": "https://..."
}
```

**Para leigos**: Quando cliente clica no link, esta funcao verifica "Este link e valido? Qual contador enviou?"

---

### 2. gerar-contrato-preview
**O que faz**: Gera o contrato em PDF com dados do cliente

**Entrada**:
```json
{
  "dados_cliente": {
    "nome": "Maria Santos",
    "cpf": "123.456.789-00",
    "email": "maria@email.com"
  },
  "plano": "premium"
}
```

**Saida**:
```json
{
  "preview_url": "https://storage.supabase.co/contratos/preview_123.pdf"
}
```

**Para leigos**: Como preencher um formulario do Word automaticamente e salvar em PDF.

---

### 3. create-checkout-session
**O que faz**: Cria sessao de pagamento no Stripe

**Entrada**:
```json
{
  "ref_token": "ABC123",
  "contador_id": "uuid-do-contador",
  "plano": "premium",
  "cliente_email": "maria@email.com"
}
```

**Saida**:
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Para leigos**: Cria a tela de pagamento do Stripe e devolve o link para o cliente abrir.

---

### 4. webhook-stripe-onboarding
**O que faz**: Recebe notificacao do Stripe quando pagamento e aprovado

**Entrada** (vem do Stripe):
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "payment_status": "paid",
      "customer": "cus_...",
      "subscription": "sub_...",
      "metadata": {
        "ref_token": "ABC123",
        "contador_id": "uuid-do-contador",
        "plano": "premium"
      }
    }
  }
}
```

**O que acontece**:
1. Valida se notificacao e realmente do Stripe (seguranca)
2. Busca dados temporarios do cliente (tabela onboarding_temp)
3. Cria cliente definitivo (tabela clientes)
4. Cria registro do pagamento (tabela pagamentos)
5. **CRITICO**: Chama funcao que calcula as 17 bonificacoes
6. Envia email para Top Class assinar contrato
7. Envia email para cliente confirmando pagamento
8. Apaga dados temporarios

**Para leigos**: Como quando voce paga algo e a loja recebe notificacao "Cliente pagou! Pode entregar o produto".

---

## SEGURANCA

### 1. Links sao criptografados
```
Link original: contador_id=123&timestamp=2025-11-19
Link criptografado: ref=hG8j2KpQ9mN3xZ7wL4vR1sD6f
```
**Para leigos**: Impossivel alguem adivinhar ou hackear o link.

---

### 2. Documentos sao privados
- Cada cliente so ve seus proprios documentos
- Sistema usa RLS (Row Level Security) do Supabase
- Admin e Top Class podem ver todos os documentos

**Para leigos**: Como o Google Drive - voce so ve seus arquivos, nao os dos outros.

---

### 3. Validacao de assinatura Stripe
```typescript
// Sistema valida se webhook realmente veio do Stripe
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
// Se assinatura for falsa, rejeita
```
**Para leigos**: Como um selo de autenticidade - garante que notificacao e real.

---

### 4. Idempotencia (nao processa 2x)
```typescript
// Verifica se ja processou este pagamento
const { data: existing } = await supabase
  .from('pagamentos')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) {
  return { message: 'Ja processado' };
}
```
**Para leigos**: Se Stripe enviar notificacao 2x por engano, sistema ignora a segunda.

---

## CHECKLIST DE IMPLEMENTACAO (4 SEMANAS)

### Semana 1: Telas basicas
- [ ] Setup repositorio (Vite + React + TypeScript)
- [ ] Tela 1: Bem-vindo
- [ ] Tela 2: Escolha de plano
- [ ] Tela 3: Formulario de dados
- [ ] Edge Function: validate-referral-token
- [ ] Validacoes: CPF, CNPJ, email

### Semana 2: Upload e assinatura
- [ ] Configurar Supabase Storage
- [ ] Tela 4: Upload de documentos
- [ ] Tela 5: Preview contrato + Assinatura canvas
- [ ] Edge Function: gerar-contrato-preview
- [ ] Biblioteca PDFKit (geracao de PDF)

### Semana 3: Pagamento
- [ ] Criar conta Stripe (modo test)
- [ ] Criar produtos no Stripe (Pro/Premium/Top)
- [ ] Edge Function: create-checkout-session
- [ ] Tela 6: Pagamento (Stripe Checkout)
- [ ] Configurar webhook no Stripe Dashboard

### Semana 4: Finalizacao e testes
- [ ] Edge Function: webhook-stripe-onboarding
- [ ] Tela 7: Sucesso
- [ ] Integracao com Portal dos Contadores (calcular comissoes)
- [ ] Envio de emails (Brevo)
- [ ] Testes end-to-end
- [ ] Deploy (Vercel/Netlify)

---

## VARIAVEIS DE AMBIENTE

```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_FRONTEND_URL=http://localhost:8080

# Backend - Edge Functions (.env no Supabase)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET_ONBOARDING=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_TOP=price_xxx
ENCRYPTION_KEY=chave_256_bits
FRONTEND_URL=https://onboarding.topclass.com
```

---

## PROXIMOS PASSOS

1. Aprovar este PRD
2. DEV 1 comeca implementacao (Semana 1)
3. Criar conta Stripe (modo test)
4. Configurar Supabase Storage
5. Desenvolver telas 1-3 primeiro (base)

---

## DUVIDAS FREQUENTES

**P: Cliente precisa criar conta/senha?**
R: NAO. Cliente so preenche dados e paga. Sem login/senha.

**P: E se cliente desistir no meio?**
R: Dados ficam salvos por 24h na tabela temporaria. Se voltar no link, continua de onde parou.

**P: Cliente pode mudar de plano depois?**
R: SIM, mas isso e no Portal dos Contadores (outro app). Este app e so para cadastro inicial.

**P: E se pagamento for recusado?**
R: Stripe mostra mensagem "Cartao recusado". Cliente pode tentar outro cartao.

**P: Quanto tempo para Top Class assinar contrato?**
R: Ate 24 horas uteis. E manual (admin assina e envia para cliente).

---

**Documento criado para ser claro e objetivo. Pronto para implementacao!**

