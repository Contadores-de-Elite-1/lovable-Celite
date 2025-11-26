# Guia Baby Steps: Testar Correção do Erro 400

## ✅ O Que Foi Corrigido

Corrigi o erro 400 na página de Relatórios e também atualizei a página de Comissões para usar os nomes corretos das colunas do banco de dados.

---

## 📋 Baby Steps para Testar

### PASSO 1: Parar o Servidor Dev (se estiver rodando)

**Onde:** No terminal onde está rodando `pnpm dev`  
**Como:** Aperte `Ctrl + C`  
**Resultado esperado:** O servidor para e você volta ao prompt do terminal

---

### PASSO 2: Fazer Build de Produção

**Comando:**
```bash
pnpm build
```

**Onde:** No terminal, na pasta raiz do projeto  
**Tempo esperado:** ~10-15 segundos  
**Resultado esperado:** Você verá uma lista de arquivos sendo compilados e o tamanho final do bundle

---

### PASSO 3: Iniciar Servidor de Produção

**Comando:**
```bash
pnpm preview
```

**Onde:** No mesmo terminal  
**Resultado esperado:** Você verá uma mensagem tipo:
```
  ➜  Local:   http://localhost:4173/
```

---

### PASSO 4: Testar a Página de Relatórios

**Ação:**
1. Abra o navegador
2. Vá para: `http://localhost:4173/relatorios`
3. Observe o console do navegador (F12 → aba Console)

**✅ Teste PASSOU se:**
- A página carrega em ~5-15 segundos
- NÃO aparece erro 400 no console
- Os dados aparecem na tela (ou mensagem de "nenhum dado" se não houver registros)

**❌ Teste FALHOU se:**
- Erro 400 aparece no console
- Página fica carregando infinitamente
- Aparece erro de "Failed to load resource"

---

### PASSO 5: Testar a Página de Comissões

**Ação:**
1. No mesmo navegador
2. Vá para: `http://localhost:4173/comissoes`
3. Observe o console do navegador

**✅ Teste PASSOU se:**
- A página carrega em ~5-15 segundos
- Comissões aparecem com os campos corretos
- Filtros funcionam (Status, Tipo, Data)

**❌ Teste FALHOU se:**
- Erro 400 no console
- Campos aparecem como "undefined" ou "N/A"
- Filtros não funcionam

---

### PASSO 6: Testar Filtros

**Ação na página de Comissões:**
1. Clique no filtro "Status"
2. Selecione "Aprovada"
3. Verifique se filtra corretamente

**Ação na página de Relatórios:**
1. Se houver filtros de data, teste-os
2. Verifique se os gráficos carregam

---

## 📸 Me Envie

Para confirmar que funcionou, me envie:

1. **Screenshot do Console** (F12 → Console) da página Relatórios
2. **Screenshot da página Relatórios** carregada (com dados ou mensagem de "nenhum dado")
3. **Tempo de carregamento** que aparece na aba Network (F12 → Network → linha no topo)

---

## 🆘 Se Der Erro

**Se ainda aparecer erro 400:**
- Copie a URL completa que está dando erro (aparece no console em vermelho)
- Copie a mensagem de erro completa
- Me envie para eu analisar

**Se a página não carregar:**
- Verifique se o servidor `pnpm preview` está rodando
- Verifique se a porta 4173 está acessível
- Tente fechar e abrir o navegador novamente

---

## ⚡ Lembre-se

- **Dev mode** (porta 8080): Lento, 4-7 minutos
- **Production mode** (porta 4173): Rápido, 15-20 segundos

Por isso testamos sempre em **production mode** após fazer mudanças!

