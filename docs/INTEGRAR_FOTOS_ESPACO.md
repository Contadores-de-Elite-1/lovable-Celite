# 📸 COMO INTEGRAR FOTOS DO ESPAÇO TOP CLASS

## 🎯 OBJETIVO

Exibir fotos do espaço físico da Top Class durante o onboarding para que os clientes vejam as instalações antes de contratar.

---

## 📂 ONDE COLOCAR AS FOTOS

As fotos devem ficar em:
```
/public/images/espaco/
```

**Criar pasta:**
```bash
mkdir -p public/images/espaco
```

---

## 🖼️ EXTRAIR FOTOS DO PDF

### **OPÇÃO 1: Usando Adobe Acrobat** ⭐ RECOMENDADO
1. Abrir o PDF no Adobe Acrobat
2. Clicar em "Ferramentas" → "Editar PDF"
3. Selecionar as imagens
4. Clicar direito → "Salvar imagem como..."
5. Salvar em `public/images/espaco/` com nomes descritivos

**Nomes sugeridos:**
- `recepcao-1.jpg`
- `sala-reuniao-1.jpg`
- `sala-reuniao-2.jpg`
- `sala-executiva-1.jpg`
- `coworking-1.jpg`
- `espaco-comum-1.jpg`

---

### **OPÇÃO 2: Usando Preview (Mac)**
1. Abrir o PDF no Preview
2. Selecionar a página com a foto
3. Selecionar a imagem
4. Copiar (Cmd+C)
5. Colar em um novo documento
6. Exportar como JPG/PNG
7. Salvar em `public/images/espaco/`

---

### **OPÇÃO 3: Usando Ferramentas Online**
- https://www.ilovepdf.com/extract-images-from-pdf
- https://www.adobe.com/acrobat/online/pdf-to-jpg.html

1. Fazer upload do PDF
2. Selecionar "Extrair imagens"
3. Download das imagens
4. Salvar em `public/images/espaco/`

---

## 📝 CRIAR ARQUIVO DE DADOS DAS FOTOS

Após extrair as fotos, criar arquivo `src/data/fotosEspaco.ts`:

```typescript
// src/data/fotosEspaco.ts

export interface FotoEspaco {
  id: string;
  src: string;
  alt: string;
  descricao?: string;
}

export const fotosEspaco: FotoEspaco[] = [
  {
    id: 'recepcao-1',
    src: '/images/espaco/recepcao-1.jpg',
    alt: 'Recepção da Top Class Escritório Virtual',
    descricao: 'Recepção moderna e acolhedora para receber seus clientes',
  },
  {
    id: 'sala-reuniao-1',
    src: '/images/espaco/sala-reuniao-1.jpg',
    alt: 'Sala de reunião da Top Class',
    descricao: 'Sala climatizada com capacidade para até 12 pessoas',
  },
  {
    id: 'sala-executiva-1',
    src: '/images/espaco/sala-executiva-1.jpg',
    alt: 'Sala executiva da Top Class',
    descricao: 'Sala executiva para reuniões importantes',
  },
  {
    id: 'coworking-1',
    src: '/images/espaco/coworking-1.jpg',
    alt: 'Espaço de coworking da Top Class',
    descricao: 'Ambiente moderno e confortável para trabalhar',
  },
  // Adicionar mais fotos conforme disponíveis
];
```

---

## 🔗 INTEGRAR NA TELA DE PLANOS

Atualizar `src/onboarding/pages/PlanSelection.tsx`:

```typescript
import { GaleriaEspaco } from '@/components/GaleriaEspaco';
import { fotosEspaco } from '@/data/fotosEspaco';

export const PlanSelection: React.FC<PlanSelectionProps> = ({
  // ... props
}) => {
  // ... código existente

  return (
    <div className="space-y-6">
      {/* ... código existente dos planos */}

      {/* Galeria de fotos do espaço */}
      <div className="border-t pt-6">
        <GaleriaEspaco 
          fotos={fotosEspaco} 
          titulo="Conheça nosso espaço físico"
        />
      </div>

      {/* ... resto do código */}
    </div>
  );
};
```

---

## 🎨 ONDE EXIBIR AS FOTOS

### **1. Tela de Seleção de Planos** ⭐ RECOMENDADO
Exibir após os cards de planos, antes do botão "Continuar"

### **2. Tela de Boas-Vindas** (Opcional)
Adicionar seção "Conheça nosso espaço" antes dos benefícios

### **3. Modal/Dialog** (Opcional)
Botão "Ver fotos do espaço" que abre modal com galeria

---

## 📋 CHECKLIST

- [ ] Extrair todas as fotos do PDF
- [ ] Salvar em `public/images/espaco/` com nomes descritivos
- [ ] Criar arquivo `src/data/fotosEspaco.ts` com lista de fotos
- [ ] Importar `GaleriaEspaco` na tela desejada
- [ ] Adicionar componente `GaleriaEspaco` na tela
- [ ] Testar se fotos aparecem corretamente
- [ ] Verificar responsividade (mobile/desktop)
- [ ] Validar acessibilidade (alt text)

---

## 🖼️ EXEMPLO DE ESTRUTURA DE PASTAS

```
public/
  images/
    espaco/
      recepcao-1.jpg
      recepcao-2.jpg
      sala-reuniao-1.jpg
      sala-reuniao-2.jpg
      sala-executiva-1.jpg
      coworking-1.jpg
      coworking-2.jpg
      espaco-comum-1.jpg
```

---

## 📐 REQUISITOS DAS IMAGENS

- **Formato:** JPG ou PNG
- **Tamanho recomendado:** 1920x1080px (ou proporção 16:9)
- **Peso:** Máximo 500KB por imagem
- **Qualidade:** Alta, mas otimizada para web

**Otimizar imagens:**
- https://tinypng.com/
- https://squoosh.app/

---

## ✅ TESTAR

Após adicionar as fotos:

1. **Verificar se arquivos existem:**
   ```bash
   ls -la public/images/espaco/
   ```

2. **Testar no navegador:**
   ```
   http://localhost:8080/images/espaco/recepcao-1.jpg
   ```
   Deve mostrar a imagem!

3. **Testar componente:**
   - Abrir tela de seleção de planos
   - Ver se galeria aparece
   - Clicar para ver fotos em tela cheia
   - Testar navegação (anterior/próximo)

---

## 🚀 PRÓXIMOS PASSOS

1. **Hoje:** Extrair fotos do PDF
2. **Amanhã:** Criar arquivo de dados
3. **Depois:** Integrar na tela de planos

---

**Precisa de ajuda para extrair as fotos ou integrar no app?** 🚀



