# Como Acessar Produção

**Data:** 26 de Novembro de 2025

---

## 🎯 OPÇÃO 1: Preview Local de Produção (RECOMENDADO)

**Use quando:** Quer testar como o app vai funcionar em produção, mas localmente.

### Passos:

1. **Fazer build de produção:**
```bash
cd "/Users/PedroGuilherme/Cursor/celite-app-atual /lovable-Celite"
pnpm build
```

2. **Rodar preview (produção local):**
```bash
pnpm preview
```

3. **Acessar:**
- URL: `http://localhost:4173` (porta padrão do Vite preview)
- Ou: `http://localhost:4173` (verifique a porta no terminal)

### Diferenças:
- ✅ Código minificado (como em produção)
- ✅ Mais rápido
- ✅ Sem hot reload
- ✅ Bundle otimizado

---

## 🚀 OPÇÃO 2: Produção Real (Deploy)

**Use quando:** Quer acessar o app que está realmente em produção.

### Se o app está no Lovable:
1. Acesse: https://lovable.dev (ou URL específica do seu projeto)
2. Faça login com sua conta Lovable
3. O app estará disponível na URL fornecida pelo Lovable

### Se o app está em outro lugar:
- **Vercel:** URL será algo como `seu-app.vercel.app`
- **Netlify:** URL será algo como `seu-app.netlify.app`
- **Outro:** Verifique a documentação do seu deploy

---

## 🔄 Comparação Rápida

| Aspecto | Dev (`pnpm dev`) | Preview (`pnpm preview`) | Produção Real |
|---------|------------------|--------------------------|---------------|
| **URL** | `localhost:8080` | `localhost:4173` | URL pública |
| **Velocidade** | Lento (hot reload) | Rápido | Rápido |
| **Código** | Não minificado | Minificado | Minificado |
| **Erros** | Detalhados | Ocultos | Ocultos |
| **Performance** | Baixa (dev tools) | Alta | Alta |

---

## ⚡ Comandos Rápidos

```bash
# PARAR dev server (se estiver rodando)
Ctrl + C no terminal

# Build de produção
pnpm build

# Preview local
pnpm preview

# Voltar para dev
pnpm dev
```

---

## 🎯 Qual Usar Agora?

**Para testar suas correções:**
→ Use **OPÇÃO 1** (Preview Local)
→ É a forma mais rápida de ver como ficará em produção
→ Sem precisar fazer deploy

**Para mostrar para alguém ou usar de verdade:**
→ Use **OPÇÃO 2** (Produção Real)
→ Precisa fazer deploy primeiro (via Lovable ou outra plataforma)

