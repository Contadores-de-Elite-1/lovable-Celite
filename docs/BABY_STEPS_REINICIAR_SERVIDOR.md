# 🚀 BABY STEPS: Como Reiniciar o Servidor

## PASSO 1: PARAR o Servidor Atual

1. **Olhe para o terminal** (onde está escrito "pnpm preview")

2. **Aperte essas 2 teclas ao mesmo tempo:**
   - `Ctrl` + `C`
   - (No Mac pode ser `Cmd` + `C`)

3. **Você vai ver algo assim:**
   ```
   ^C
   PedroGuilherme@MacBook-Air lovable-Celite %
   ```
   - Isso significa que o servidor PAROU ✅

---

## PASSO 2: INICIAR o Servidor de Desenvolvimento

1. **No mesmo terminal, digite:**
   ```
   pnpm dev
   ```

2. **Aperte ENTER**

3. **Aguarde aparecer algo assim:**
   ```
   → Local: http://localhost:8080/
   → Network: http://192.168.100.226:8080/
   ```

4. **PRONTO!** ✅ O servidor está rodando novamente

---

## ⚠️ IMPORTANTE

- **SEMPRE** pare o servidor antes de iniciar outro
- Use `Ctrl + C` para parar
- Use `pnpm dev` para iniciar em desenvolvimento
- A porta será **8080** (não 4176)

---

## 🆘 Se Der Erro

**Erro: "Porta já está em uso"**
- Aperte `Ctrl + C` várias vezes
- Espere 5 segundos
- Tente `pnpm dev` de novo

