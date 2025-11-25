# 🎨 COMO USAR A LOGO ATUALIZADA DA TOP CLASS

## 📁 ONDE COLOCAR A LOGO

A logo deve ficar em:
```
public/images/logo-topclass.png
```

**OU qualquer um destes nomes:**
- `public/images/logo-topclass.png` ⭐ **PREFERIDO**
- `public/images/logo.png`
- `public/images/topclass-logo.png`

---

## ✅ VERIFICAR QUAL LOGO USAR

O componente `Logo.tsx` tenta carregar nesta ordem:
1. `/images/logo-topclass.png` (preferido)
2. `/images/logo.png`
3. `/images/espaco/Logo TopClass.png` (fallback)

---

## 📝 RENOMEAR SUA LOGO

Se sua logo atualizada tem outro nome, renomeie para:

```bash
# No terminal:
cd public/images
mv "nome-atual-da-sua-logo.png" logo-topclass.png

# OU se estiver em outra pasta:
cp "pasta/nome-atual.png" public/images/logo-topclass.png
```

---

## 🎯 FORMATO RECOMENDADO

- **Formato:** PNG (com transparência) ou JPG
- **Tamanho:** 512×512px (quadrado) ou proporcional
- **Peso:** Máximo 200KB
- **Fundo:** Transparente (se PNG) ou branco

---

## 📋 CHECKLIST

- [ ] Logo atualizada em `public/images/`
- [ ] Nomeado como `logo-topclass.png` (ou `logo.png`)
- [ ] Formato PNG ou JPG
- [ ] Tamanho razoável (< 200KB)
- [ ] Testar no app para verificar se aparece

---

## 🚀 TESTAR

Após adicionar/renomear a logo:

1. **Restart servidor:**
   ```bash
   pnpm dev
   ```

2. **Verificar no navegador:**
   ```
   http://localhost:8080/images/logo-topclass.png
   ```
   Deve mostrar a logo!

3. **Testar no app:**
   - Sidebar deve mostrar logo
   - Header deve mostrar logo
   - Onboarding deve mostrar logo

---

## 💡 QUAL ARQUIVO É A LOGO ATUALIZADA?

Vejo que há vários arquivos em `public/images/`:
- `Logo TopClass.png` (em espaco/)
- `Logo redonda .jpeg` (em espaco/)
- `topclass..png` (em espaco/)
- `WhatsApp Image 2025-11-19 at 13.43.55.jpeg`
- `WhatsApp Image 2025-11-19 at 13.43.56 (1).jpeg`
- `WhatsApp Image 2025-11-19 at 13.43.56.jpeg`

**Qual desses é a logo atualizada?** Ou está em outro lugar?

Me diga o nome exato do arquivo e eu renomeio para `logo-topclass.png` automaticamente! 🚀



