# 📁 COMO ADICIONAR A LOGO AO PROJETO

## 🎯 ONDE COLOCAR A LOGO

A logo deve ficar em:
```
/public/images/logo.png
```

---

## 📂 CRIAR PASTA (SE NÃO EXISTIR)

### **Opção 1: Via Terminal**
```bash
mkdir -p public/images
```

### **Opção 2: Via Cursor (Interface)**
1. Clicar direito na pasta `public`
2. "New Folder" → `images`
3. Ou criar manualmente: `public/images/`

---

## 📤 COMO ADICIONAR O ARQUIVO

### **OPÇÃO 1: Arrastar e Soltar** ⭐ MAIS FÁCIL
1. Abrir o Cursor/IDE
2. Navegar até a pasta `public/images/`
3. Arrastar o arquivo `logo.png` do seu computador
4. Soltar dentro da pasta `public/images/`
5. ✅ Pronto!

---

### **OPÇÃO 2: Copiar/Colar**
1. Copiar o arquivo `logo.png` do seu computador (Ctrl+C / Cmd+C)
2. No Cursor, navegar até `public/images/`
3. Clicar direito → "Paste" (Ctrl+V / Cmd+V)
4. ✅ Pronto!

---

### **OPÇÃO 3: Via Terminal**
```bash
# Navegar até a pasta do projeto (se já não estiver)
cd "/Users/PedroGuilherme/Cursor/celite-app-atual /lovable-Celite"

# Copiar arquivo de onde estiver no seu computador
cp /caminho/para/seu/logo.png public/images/logo.png

# Exemplo se estiver na Área de Trabalho:
cp ~/Desktop/logo.png public/images/logo.png

# Exemplo se estiver em Downloads:
cp ~/Downloads/logo.png public/images/logo.png
```

---

### **OPÇÃO 4: Via Finder (Mac)**
1. Abrir Finder
2. Navegar até: `/Users/PedroGuilherme/Cursor/celite-app-atual /lovable-Celite/public/images/`
3. Copiar `logo.png` para essa pasta
4. ✅ Pronto!

---

## ✅ VERIFICAR SE FUNCIONOU

Após adicionar o arquivo, verificar:

### **Via Terminal:**
```bash
ls -la public/images/
# Deve mostrar: logo.png
```

### **Via Cursor:**
1. Abrir pasta `public/images/`
2. Ver se `logo.png` aparece lá

---

## 🎨 REQUISITOS DO ARQUIVO

### **Formato:**
- ✅ PNG (com transparência - ideal)
- ✅ SVG (também funciona)
- ✅ JPG (se não tiver transparência)

### **Tamanho Recomendado:**
- ✅ Mínimo: 256x256px
- ✅ Ideal: 512x512px
- ✅ Máximo: 1024x1024px (para não pesar muito)

### **Nome do Arquivo:**
- ✅ `logo.png` (exatamente assim)
- ❌ `Logo.png` (não funciona)
- ❌ `logo-1.png` (precisa ser exatamente `logo.png`)

---

## 🚀 DEPOIS DE ADICIONAR

Após adicionar a logo:

1. **Testar no navegador:**
   ```
   http://localhost:8080/images/logo.png
   ```
   Deve aparecer a logo!

2. **Usar nos componentes:**
   ```typescript
   <img src="/images/logo.png" alt="Contadores de Elite" />
   ```

3. **Verificar no app:**
   - Restart servidor: `pnpm dev`
   - Ver se aparece nos componentes

---

## 📋 CHECKLIST

- [ ] Pasta `public/images/` criada
- [ ] Arquivo `logo.png` copiado para `public/images/`
- [ ] Arquivo aparece no Cursor
- [ ] Acessível via `http://localhost:8080/images/logo.png`
- [ ] Usando nos componentes `<Logo />`

---

## ❓ PROBLEMAS COMUNS

### **"Arquivo não aparece"**
- Verificar se pasta `public/images/` existe
- Verificar nome exato: `logo.png` (minúsculas)
- Verificar extensão: `.png` (não `.PNG`)

### **"Erro ao carregar imagem"**
- Verificar caminho: `/images/logo.png` (começa com `/`)
- Restart servidor: `pnpm dev`
- Limpar cache do navegador

### **"Imagem muito grande"**
- Redimensionar antes de adicionar
- Usar ferramenta online (ex: TinyPNG)

---

**Pronto para adicionar a logo?** 🚀

Me avisa quando adicionar e eu integro nos componentes!



