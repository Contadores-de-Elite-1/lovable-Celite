# 🎨 PREPARAR IMAGENS DO ESPAÇO - GUIA DESIGN INSTAGRAMÁVEL

## 🎯 OBJETIVO

Preparar as fotos do PDF para exibição no app com design **instagramável**, **mobile-first** e **visualmente atraente**.

---

## 📐 ESPECIFICAÇÕES TÉCNICAS DAS IMAGENS

### **Tamanhos Recomendados:**

| Uso | Dimensões | Aspect Ratio | Peso Máximo |
|-----|-----------|--------------|-------------|
| **Foto Destaque** (grande) | 1920x1200px | 16:10 | 500KB |
| **Fotos Grid** (quadrado) | 1200x1200px | 1:1 | 300KB |
| **Modal Tela Cheia** | 1920x1080px | 16:9 | 500KB |

---

## 🖼️ COMO PREPARAR AS FOTOS

### **PASSO 1: Extrair do PDF**

**OPÇÃO 1: Adobe Acrobat**
1. Abrir PDF no Adobe Acrobat
2. Ferramentas → Editar PDF
3. Selecionar imagem
4. Clicar direito → "Salvar imagem como..."
5. Salvar em formato PNG (alta qualidade)

**OPÇÃO 2: Preview (Mac)**
1. Abrir PDF no Preview
2. Selecionar página com foto
3. Selecionar imagem
4. Copiar (Cmd+C)
5. Criar novo arquivo → Colar
6. Exportar como PNG/JPG

**OPÇÃO 3: Ferramenta Online**
- https://www.ilovepdf.com/extract-images-from-pdf
- Upload PDF → Extrair imagens → Download

---

### **PASSO 2: Otimizar e Recortar**

**Ferramentas Recomendadas:**
- **TinyPNG:** https://tinypng.com/ (compressão sem perda)
- **Squoosh:** https://squoosh.app/ (compressão + redimensionamento)
- **Canva:** https://canva.com (recortes e ajustes)
- **Photoshop/GIMP:** (ajustes profissionais)

---

### **PASSO 3: Edições Recomendadas**

#### **1. Recorte Inteligente**
- **Foto noturna:** Focar na entrada iluminada (remove céu vazio)
- **Foto diurna com sinal:** Centralizar prédio e sinalização
- **Foto diurna completa:** Mostrar fachada completa com contexto

#### **2. Ajustes de Cor**
- **Saturação:** +10% a +15% (cores mais vibrantes)
- **Contraste:** +5% a +10% (mais definição)
- **Brilho:** Ajustar para destacar elementos importantes
- **Temperatura:** Manter natural (não muito quente/fria)

#### **3. Filtros Sutis (Opcional)**
- **Clareza:** +5% a +10%
- **Sombras:** Ajustar para mostrar mais detalhes
- **Highlights:** Reduzir se muito claro

#### **4. Aspectos para Mobile**
- **Centralizar assunto principal** (prédio/sinal)
- **Remover elementos distratores** (carros, pessoas)
- **Manter proporção 16:10** para foto destaque
- **Manter proporção 1:1** para grid

---

### **PASSO 4: Nomes dos Arquivos**

Salvar com nomes descritivos:
```
public/images/espaco/
  ├── exterior-noturno.jpg
  ├── exterior-diurno-sinal.jpg
  └── exterior-diurno-completo.jpg
```

---

## 🎨 TÉCNICAS DE DESIGN APLICADAS

### **1. Layout Mobile-First**

**Mobile (< 768px):**
- Foto destaque grande no topo (16:10)
- Grid 2 colunas para outras fotos (1:1)
- Espaçamento generoso (gap: 12px)

**Desktop (≥ 768px):**
- Mesmo layout, mas com hover effects
- Modal fullscreen com navegação avançada

---

### **2. Elementos Visuais**

✅ **Bordas Arredondadas:** `rounded-2xl` (16px) para modernidade  
✅ **Sombras Suaves:** `shadow-xl` para profundidade  
✅ **Overlays Gradientes:** `bg-gradient-to-t` para legibilidade  
✅ **Badges Dourados:** Cor #D4AF37 para destacar  
✅ **Animações Suaves:** `framer-motion` para interatividade  
✅ **Backdrop Blur:** `backdrop-blur-md` para efeito glass  

---

### **3. Hierarquia Visual**

1. **Foto Destaque** → Maior, no topo, com badge
2. **Grid 2x2** → Fotos menores, mas visíveis
3. **Modal** → Fullscreen com navegação completa

---

### **4. Elementos "Instagramáveis"**

✅ **Rounded Corners** grandes (16-20px)  
✅ **Gradients** sutis nos overlays  
✅ **Badges** com ícones e cores vibrantes  
✅ **Hover Effects** que destacam interatividade  
✅ **Modal Dark** estilo stories do Instagram  
✅ **Contador** flutuante estilo feed  
✅ **Miniaturas** horizontais scrolláveis  

---

## 📱 RESPONSIVIDADE MOBILE-FIRST

### **Breakpoints:**
- **Mobile:** < 640px (1 coluna destaque + 2 colunas grid)
- **Tablet:** 640px - 1024px (mesmo layout otimizado)
- **Desktop:** > 1024px (hover effects + navegação avançada)

### **Touch Interactions:**
- **Tap** na foto → Abre modal
- **Swipe** esquerda/direita → Navega fotos (mobile)
- **Pinch to zoom** → Se implementado no futuro

---

## ✅ CHECKLIST DE PREPARAÇÃO

### **Antes de Adicionar:**
- [ ] Extrair todas as fotos do PDF
- [ ] Recortar para focar no prédio/entrada
- [ ] Redimensionar para dimensões recomendadas
- [ ] Otimizar peso (< 500KB por foto)
- [ ] Ajustar cores (saturação +10%, contraste +5%)
- [ ] Renomear arquivos descritivamente
- [ ] Salvar em `public/images/espaco/`

### **Após Adicionar:**
- [ ] Atualizar `fotosEspaco.ts` com nomes corretos
- [ ] Testar no mobile (verificar layout)
- [ ] Testar no desktop (verificar hover)
- [ ] Validar velocidade de carregamento
- [ ] Verificar acessibilidade (alt text)
- [ ] Testar modal (navegação, close)

---

## 🎨 EXEMPLO DE RECORTES

### **Foto Noturna:**
```
┌─────────────────────────┐
│     (céu vazio)         │ ← Remover
├─────────────────────────┤
│                         │
│   [PRÉDIO ILUMINADO]    │ ← Focar aqui
│                         │
│   [ENTRADA + SINAL]     │ ← Elementos principais
│                         │
└─────────────────────────┘
```

### **Foto Diurna:**
```
┌─────────────────────────┐
│   [SINAL + ENTRADA]     │ ← Elemento principal
├─────────────────────────┤
│                         │
│   [FACHADA COMPLETA]    │ ← Mostrar contexto
│                         │
│   [ESTACIONAMENTO]      │ ← Manter um pouco
└─────────────────────────┘
```

---

## 🚀 RESULTADO FINAL ESPERADO

### **Mobile:**
- Foto grande no topo (ocupando ~80% da largura)
- Grid 2x2 abaixo (fotos quadradas)
- Botão "Ver todas" destacado
- Swipe para navegar no modal

### **Desktop:**
- Layout similar, mas com:
- Hover effects (zoom, overlay)
- Navegação por setas no modal
- Miniaturas mais visíveis
- Efeitos de transição suaves

---

## 💡 DICAS FINAIS

1. **Compressão:** Usar TinyPNG para reduzir peso sem perder qualidade
2. **Aspect Ratio:** Manter consistência (16:10 destaque, 1:1 grid)
3. **Cores:** Ajustar para destacar elementos importantes
4. **Foco:** Sempre centralizar o prédio/sinalização
5. **Teste:** Verificar em dispositivo real (não só DevTools)

---

**Pronto para adicionar as fotos?** 🚀

Depois de preparar as imagens, elas aparecerão automaticamente na galeria com este design profissional e instagramável!

