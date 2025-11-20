# 🎨 LOGOMARCA: CONTADORES DE ELITE

**Logo Principal:** Contadores de Elite  
**Tema:** Dourado + Azul Marinho  
**Estilo:** Clássico, Profissional, Elegante

---

## 📊 IDENTIDADE VISUAL

### **Cores Principais**
- **Ouro/Dourado:** `#D4AF37` (elementos principais)
- **Azul Marinho:** `#0C1A2A` (fundo)
- **Branco:** `#FFFFFF` (textos)

### **Elementos da Logo**
- ✅ Coroa no topo
- ✅ Coluna clássica (símbolo de solidez)
- ✅ Círculos concêntricos
- ✅ Texto "CONTADORES DE ELITE" em volta

---

## 🎯 ONDE INTEGRAR NO APP

### **1. Splash Screen / Loading** ⭐ CRÍTICO
- Exibir logo grande ao iniciar app
- Fundo azul marinho
- Logo dourada centralizada
- Duração: 2-3 segundos

### **2. Header/Navbar**
- Logo pequena no canto superior esquerdo
- Tamanho: 40-50px de altura
- Próximo ao "Contadores de Elite"

### **3. Sidebar**
- Logo média (70-80px)
- No topo da sidebar
- Acima do menu principal

### **4. Login/Auth**
- Logo grande centralizada
- Fundo com gradiente azul
- Abaixo: "Bem-vindo ao Contadores de Elite"

### **5. Telas Vazias / 404**
- Logo com mensagem
- "Página não encontrada"

### **6. Modais / Diálogos importantes**
- Logo pequena no header
- Reforça confiança/marca

---

## 📁 COMO ADICIONAR AO PROJETO

### **Passo 1: Salvar a imagem**

Salvar a logo em:
```
src/assets/logo/contadores-de-elite.png
```

ou 

```
public/images/logo.png
```

### **Passo 2: Usar em componentes React**

**Exemplo 1: Navbar**
```typescript
import { Link } from 'react-router-dom';

export function AppHeader() {
  return (
    <header className="bg-[#0C1A2A] border-b border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
        <img 
          src="/images/logo.png" 
          alt="Contadores de Elite" 
          className="h-12 w-auto"
        />
        <span className="ml-3 text-[#D4AF37] font-semibold text-lg">
          Contadores de Elite
        </span>
      </div>
    </header>
  );
}
```

**Exemplo 2: Splash Screen**
```typescript
export function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#0C1A2A] flex items-center justify-center z-50">
      <div className="text-center">
        <img 
          src="/images/logo.png" 
          alt="Contadores de Elite" 
          className="h-40 w-40 mx-auto animate-fade-in"
        />
        <p className="text-[#D4AF37] text-xl font-semibold mt-8">
          Contadores de Elite
        </p>
      </div>
    </div>
  );
}
```

---

## 🎨 VARIAÇÕES DA LOGO

### **Logo Completa** (usado em)
- Header principal
- Splash screen
- Login
- Documentação

### **Logo Símbolo Apenas** (usado em)
- Favicon (16x16, 32x32)
- Avatar do app
- Ícone da taskbar

### **Logo Horizontal** (usado em)
- Sidebar
- Cards
- Modais

### **Logo Vertical** (usado em)
- Splash screen
- 404 page
- Centro da tela

---

## 📐 DIMENSÕES RECOMENDADAS

| Uso | Largura | Altura | Proporção |
|-----|---------|--------|-----------|
| Favicon | 32px | 32px | 1:1 |
| Header | 40px | 40px | 1:1 |
| Splash | 200px | 200px | 1:1 |
| Sidebar | 80px | 80px | 1:1 |
| Card | 60px | 60px | 1:1 |

---

## 🎯 CSS TAILWIND PARA INTEGRAÇÃO

### **Fundo Azul Marinho**
```css
bg-[#0C1A2A]
```

### **Dourado/Ouro**
```css
text-[#D4AF37]
border-[#D4AF37]
```

### **Gradiente (Opcional)**
```css
bg-gradient-to-b from-[#0C1A2A] to-[#0F2847]
```

---

## 📋 CHECKLIST DE INTEGRAÇÃO

- [ ] Salvar imagem PNG da logo em `public/images/logo.png`
- [ ] Criar componente `<LogoBrand />` reutilizável
- [ ] Adicionar logo ao Header
- [ ] Adicionar logo ao Sidebar
- [ ] Criar Splash Screen com logo
- [ ] Atualizar página de Login
- [ ] Adicionar favicon
- [ ] Testar responsividade (mobile/desktop)
- [ ] Validar cores (azul + dourado)
- [ ] Deploy

---

## 🎨 PRÓXIMAS ETAPAS

1. **Hoje:** Salvar logo no projeto
2. **Amanhã:** Integrar em componentes principais
3. **Depois:** Animar (fade-in, scale) em certas telas

---

**Está pronto para adicionar a logo ao projeto?** 🚀

