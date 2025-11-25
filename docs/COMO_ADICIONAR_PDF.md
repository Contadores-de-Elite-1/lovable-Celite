# 📄 COMO ADICIONAR PDFs AO PROJETO

## 🎯 ONDE COLOCAR PDFs

Os PDFs podem ficar em diferentes pastas dependendo do uso:

### **Opção 1: Público (para download/cliente)**
```
/public/documents/nome-do-arquivo.pdf
```
✅ Ideal para: Documentos que clientes baixam, contratos, materiais educativos

---

### **Opção 2: Assets do App**
```
/src/assets/documents/nome-do-arquivo.pdf
```
✅ Ideal para: Documentos usados dentro do código (imports)

---

### **Opção 3: Docs (documentação)**
```
/docs/documents/nome-do-arquivo.pdf
```
✅ Ideal para: Documentação técnica, PRDs, especificações

---

## 📤 COMO ADICIONAR O PDF

### **OPÇÃO 1: Arrastar e Soltar** ⭐ MAIS FÁCIL

1. **Criar pasta (se não existir):**
   - Abrir pasta `public/` no Cursor
   - Criar pasta `documents/` (se não existir)

2. **Arrastar PDF:**
   - Arrastar o arquivo `.pdf` do seu computador
   - Soltar dentro de `public/documents/`

3. ✅ Pronto!

---

### **OPÇÃO 2: Via Finder (Mac)**

1. Abrir Finder
2. Navegar até:
   ```
   /Users/PedroGuilherme/Cursor/celite-app-atual /lovable-Celite/public/documents/
   ```
3. Copiar o PDF para essa pasta

---

### **OPÇÃO 3: Via Terminal**

```bash
# Criar pasta (se não existir)
mkdir -p public/documents

# Copiar PDF
cp /caminho/para/seu/arquivo.pdf public/documents/nome-arquivo.pdf

# Exemplo se estiver em Downloads:
cp ~/Downloads/documento.pdf public/documents/documento.pdf
```

---

## 🎯 CASOS DE USO COMUNS

### **1. Material Educativo (clientes baixam)**
```
/public/documents/material-educativo.pdf
```
```typescript
// No componente React:
<a href="/documents/material-educativo.pdf" download>
  Baixar Material
</a>
```

---

### **2. Contrato/Termos (visualizar no app)**
```
/public/documents/contrato.pdf
```
```typescript
// Abrir em nova aba:
window.open('/documents/contrato.pdf', '_blank');
```

---

### **3. Documentação Técnica (para devs)**
```
/docs/documents/prd-completo.pdf
```
✅ Apenas para referência, não acessível pelo app

---

## 📋 CHECKLIST

- [ ] Escolher pasta (public/documents, src/assets, ou docs)
- [ ] Criar pasta se não existir
- [ ] Copiar PDF para a pasta
- [ ] Verificar se aparece no Cursor
- [ ] Testar acesso (se for público)

---

## ✅ VERIFICAR SE FUNCIONOU

### **Via Terminal:**
```bash
ls -la public/documents/
# Deve mostrar seu PDF
```

### **Via Navegador (se público):**
```
http://localhost:8080/documents/nome-arquivo.pdf
```
Deve abrir o PDF!

---

## 🔗 COMO USAR NO CÓDIGO

### **1. Link de Download**
```typescript
<a 
  href="/documents/material.pdf" 
  download
  className="text-blue-600 hover:underline"
>
  📥 Baixar Material PDF
</a>
```

### **2. Abrir em Nova Aba**
```typescript
<button onClick={() => window.open('/documents/contrato.pdf', '_blank')}>
  Ver Contrato
</button>
```

### **3. Embed no HTML** (visualizar direto na página)
```typescript
<iframe 
  src="/documents/contrato.pdf"
  className="w-full h-screen"
  title="Contrato"
/>
```

---

## 📊 ESTRUTURA RECOMENDADA

```
public/
  documents/
    ├── material-educativo.pdf
    ├── contrato.pdf
    ├── termos-uso.pdf
    └── privacidade.pdf

src/
  assets/
    documents/
      ├── contrato-template.pdf
      └── logo-assets.pdf

docs/
  documents/
    ├── prd-completo.pdf
    └── especificacoes.pdf
```

---

## ⚠️ IMPORTANTE

- ✅ **Nomes sem espaços:** Use `-` ou `_` (ex: `material-educativo.pdf`)
- ✅ **Tamanho:** Se for muito grande (> 5MB), considerar compressão
- ✅ **Segurança:** PDFs em `public/` são acessíveis a todos
- ✅ **Privados:** Se precisar proteger, usar autenticação

---

## 🚀 DEPOIS DE ADICIONAR

1. **Verificar se aparece no Cursor**
2. **Testar no navegador:**
   ```
   http://localhost:8080/documents/seu-arquivo.pdf
   ```
3. **Integrar no código** (se necessário)

---

**Pronto para adicionar o PDF?** 🚀

Qual é o nome do PDF e para que ele será usado? (Isso me ajuda a sugerir a melhor pasta!)



