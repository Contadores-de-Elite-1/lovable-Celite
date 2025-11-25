# 🚀 Sistema Universal de Referral e Comissões Multinível

## Visão Geral

Sistema completo de rastreamento de indicações que funciona **em qualquer página** do site/app, permitindo que contadores compartilhem um único link para indicar tanto **clientes** quanto **outros contadores**.

---

## 🎯 Como Funciona

### 1. **Token Único do Contador**

Cada contador possui um token único (campo `link_rastreavel`). Exemplo: `ABC123`

### 2. **Uso Universal**

O token pode ser adicionado a **QUALQUER URL** do site:

```
✅ Landing page:     https://seusite.com/?ref=ABC123
✅ Cadastro direto:  https://seusite.com/auth?ref=ABC123
✅ Onboarding:       https://seusite.com/onboarding/demo?ref=ABC123
✅ Qualquer página:  https://seusite.com/dashboard?ref=ABC123
```

### 3. **Rastreamento Automático**

Quando alguém acessa **QUALQUER** URL com `?ref=TOKEN`:
- ✅ Sistema captura o token automaticamente
- ✅ Salva em `localStorage` (persistente)
- ✅ Salva em cookie (30 dias de validade)
- ✅ Token persiste ao navegar entre páginas

### 4. **Conversão Automática**

Quando a pessoa se cadastra:
- **Como CLIENTE**: Contador indicador recebe 15% das mensalidades
- **Como CONTADOR**: Contador indicador vira "sponsor" e recebe 5% de tudo que o novo contador vender (override)

---

## 💰 Sistema de Comissões

### Estrutura de Pagamento

```
Cliente paga R$ 130,00/mês
  ↓
Stripe desconta 3,79% = R$ 4,93
  ↓
Valor disponível: R$ 125,07
  ↓
├─ Contador Direto (15%): R$ 18,76
├─ Sponsor/Override (5%): R$ 6,25
└─ Lovable-Celite: R$ 100,06
```

### Comissões Multinível

#### **Nível 1: Comissão Direta**
- Percentual: **15%**
- Calculado sobre: Valor após taxas do Stripe
- Quem recebe: Contador que indicou o cliente
- Tipo: `direta`

#### **Nível 2: Override**
- Percentual: **5%**
- Calculado sobre: Valor após taxas do Stripe
- Quem recebe: Sponsor (contador que indicou o contador)
- Tipo: `override`

### Exemplo Prático

```
Pedro (PEDRO123) → indica → Maria (se cadastra como contadora)
Maria → indica → Cliente ABC (paga R$ 130/mês)

Resultado mensal:
  Cliente paga:     R$ 130,00
  Após Stripe:      R$ 125,07
  Maria recebe:     R$ 18,76 (15% direta)
  Pedro recebe:     R$ 6,25  (5% override)
  Lovable lucra:    R$ 100,06
```

---

## 🔧 Implementação Técnica

### 1. **Hook de Rastreamento**

```typescript
import { useReferralTracking } from '@/hooks/useReferralTracking';

// Ativa automaticamente em todas as páginas
<ReferralTracker />
```

### 2. **Banco de Dados**

#### Tabela `contadores`
```sql
CREATE TABLE contadores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  link_rastreavel TEXT, -- Token único (ABC123)
  sponsor_id UUID REFERENCES contadores(id), -- Quem indicou este contador
  ...
);
```

#### Tabela `comissoes`
```sql
CREATE TABLE comissoes (
  id UUID PRIMARY KEY,
  contador_id UUID REFERENCES contadores(id),
  cliente_id UUID REFERENCES clientes(id),
  tipo_comissao TEXT, -- 'direta' ou 'override'
  valor DECIMAL,
  status_comissao TEXT,
  competencia DATE,
  ...
);
```

#### Tabela `referral_tracking` (Analytics)
```sql
CREATE TABLE referral_tracking (
  id UUID PRIMARY KEY,
  referral_token TEXT, -- Token usado
  visited_at TIMESTAMP,
  converted BOOLEAN,
  converted_type TEXT, -- 'cliente' ou 'contador'
  ...
);
```

### 3. **Funções SQL**

#### Buscar Contador pelo Token
```sql
SELECT * FROM get_contador_by_referral_token('ABC123');
```

#### Calcular Comissões com Override
```sql
SELECT * FROM calcular_comissoes_com_override(
  cliente_id := 'uuid-do-cliente',
  valor_mensalidade := 130.00
);

-- Retorna:
-- contador_id | tipo_comissao | percentual | valor
-- ------------|---------------|------------|-------
-- uuid-maria  | direta        | 0.15       | 18.76
-- uuid-pedro  | override      | 0.05       | 6.25
```

---

## 🧪 Como Testar

### Teste 1: Indicação de Cliente

1. **Obter token do contador**
   ```sql
   SELECT link_rastreavel FROM contadores WHERE user_id = auth.uid();
   -- Exemplo: ABC123
   ```

2. **Compartilhar link com token**
   ```
   https://seusite.com/auth?ref=ABC123
   ```

3. **Cliente se cadastra**
   - Cliente clica no link
   - Faz cadastro normal
   - Sistema automaticamente vincula ao contador ABC123

4. **Verificar vínculo**
   ```sql
   SELECT * FROM clientes WHERE contador_id = (
     SELECT id FROM contadores WHERE link_rastreavel = 'ABC123'
   );
   ```

### Teste 2: Indicação de Contador (Rede)

1. **Contador A compartilha link**
   ```
   https://seusite.com/auth?ref=PEDRO123
   ```

2. **Contador B se cadastra**
   - Clica no link de Pedro
   - Faz cadastro como contador
   - Sistema salva `sponsor_id = id_de_pedro`

3. **Verificar rede**
   ```sql
   SELECT 
     c.id,
     u.raw_user_meta_data->>'nome' AS nome,
     c.sponsor_id,
     us.raw_user_meta_data->>'nome' AS sponsor_nome
   FROM contadores c
   LEFT JOIN contadores cs ON cs.id = c.sponsor_id
   LEFT JOIN auth.users u ON u.id = c.user_id
   LEFT JOIN auth.users us ON us.id = cs.user_id;
   ```

4. **Contador B vende para Cliente X**
   - Cliente paga R$ 130
   - Sistema gera 2 comissões:
     * Contador B: R$ 18,76 (direta)
     * Contador A (Pedro): R$ 6,25 (override)

5. **Verificar comissões**
   ```sql
   SELECT * FROM v_comissoes_hierarquia
   WHERE cliente_id = 'id-do-cliente-x';
   ```

### Teste 3: Analytics de Link

```sql
-- Ver hits do link
SELECT * FROM referral_tracking 
WHERE referral_token = 'ABC123'
ORDER BY visited_at DESC;

-- Ver conversões
SELECT 
  referral_token,
  COUNT(*) AS total_hits,
  COUNT(*) FILTER (WHERE converted = true) AS conversoes,
  COUNT(*) FILTER (WHERE converted_type = 'cliente') AS clientes,
  COUNT(*) FILTER (WHERE converted_type = 'contador') AS contadores
FROM referral_tracking
GROUP BY referral_token;
```

---

## 📊 Views e Relatórios

### Dashboard de Rede
```sql
SELECT * FROM v_dashboard_rede
WHERE contador_id = 'seu-contador-id';

-- Retorna:
-- total_indicados (contadores que você indicou)
-- clientes_ativos (seus clientes diretos)
-- comissoes_diretas_mes (15% dos seus clientes)
-- comissoes_override_mes (5% dos clientes dos seus indicados)
```

### Hierarquia de Rede
```sql
SELECT * FROM v_rede_contadores
ORDER BY created_at DESC;

-- Mostra toda a árvore de contadores com sponsors
```

---

## 🎨 Uso em Materiais de Marketing

O sistema é perfeito para materiais de marketing porque o token funciona em **QUALQUER lugar**:

### Links Personalizados
```
Instagram Bio: link.me/seulink?ref=ABC123
WhatsApp: "Confira: meusite.com/?ref=ABC123"
Email: <a href="https://site.com/auth?ref=ABC123">Cadastre-se</a>
```

### QR Codes
```
Gere QR Code apontando para:
https://seusite.com/?ref=ABC123
```

### Landing Pages
```html
<!-- Botão em landing page -->
<a href="https://seusite.com/auth?ref=ABC123" class="btn">
  Começar Agora
</a>
```

### Redes Sociais
```
Facebook Ads: site.com/promo?ref=ABC123&utm_source=facebook
Google Ads: site.com/oferta?ref=ABC123&utm_source=google
```

---

## 🔐 Segurança

- ✅ Token armazenado com segurança (localStorage + cookie)
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Validação de token antes de vincular
- ✅ Apenas contadores ativos podem ser sponsors
- ✅ Comissões calculadas em função SECURITY DEFINER

---

## 📝 Próximos Passos

1. **Analytics Avançado**
   - Dashboard visual de conversões
   - Funil de vendas por link
   - Taxa de conversão por canal

2. **Notificações**
   - Notificar quando alguém usa seu link
   - Notificar quando indicado faz primeira venda
   - Notificar quando recebe override

3. **Gamificação**
   - Ranking de melhores indicadores
   - Badges por marcos (10 indicados, 50 clientes, etc)
   - Bônus especiais para top performers

---

## 🆘 Troubleshooting

### Token não está sendo capturado
```javascript
// Verificar console do navegador
console.log('[Referral] Token capturado:', localStorage.getItem('referral_token'));
```

### Sponsor não está sendo vinculado
```sql
-- Verificar se contador tem link rastreável
SELECT * FROM contadores WHERE link_rastreavel = 'SEU_TOKEN';

-- Verificar se sponsor_id foi salvo
SELECT c.id, c.sponsor_id, cs.link_rastreavel
FROM contadores c
LEFT JOIN contadores cs ON cs.id = c.sponsor_id
WHERE c.user_id = auth.uid();
```

### Comissões não estão sendo geradas
```sql
-- Testar função manualmente
SELECT * FROM calcular_comissoes_com_override(
  'id-do-cliente',
  130.00
);
```

---

**Sistema implementado em**: 2025-11-20  
**Versão**: 1.0  
**Desenvolvido por**: Claude Sonnet 4.5 + Pedro Guilherme (ADMIN MASTER BLASTER)



