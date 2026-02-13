# 🌐 Como Acessar o App Local

## ✅ Status do Servidor

O servidor está **RODANDO** e **FUNCIONANDO** na porta 8080.

---

## 🔗 Links para Acessar

### **Opção 1: localhost (Recomendado)**
```
http://localhost:8080
```

### **Opção 2: 127.0.0.1**
```
http://127.0.0.1:8080
```

### **Opção 3: IP da Máquina (para acesso de outros dispositivos na mesma rede)**
```
http://SEU_IP_LOCAL:8080
```

---

## ❌ Se o Link Não Abrir

### **1. Verificar se o Servidor Está Rodando**

No terminal do Cursor, você deve ver algo como:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

**Se não aparecer:**
```bash
# Parar servidor (Ctrl+C) e iniciar novamente:
cd "/Users/PedroGuilherme/Cursor/celite-app-atual /lovable-Celite"
pnpm dev
```

---

### **2. Tentar Outro Navegador**

Às vezes o problema é específico do navegador:
- ✅ Chrome
- ✅ Firefox  
- ✅ Safari
- ✅ Edge

**Teste em modo anônimo:**
- Chrome: `Ctrl+Shift+N` (Windows) ou `Cmd+Shift+N` (Mac)
- Firefox: `Ctrl+Shift+P`

---

### **3. Verificar Firewall/Antivírus**

Alguns firewalls bloqueiam `localhost:8080`.

**Solução:**
- Adicionar exceção para `localhost:8080`
- Ou desabilitar temporariamente para testar

---

### **4. Verificar se Outra Aplicação Está Usando a Porta**

```bash
# Ver processos na porta 8080:
lsof -i:8080
```

Se houver conflito, você pode:
- Parar o processo conflitante
- Ou mudar a porta no `vite.config.ts`

---

### **5. Limpar Cache DNS do Sistema**

**Mac:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Windows:**
```bash
ipconfig /flushdns
```

---

### **6. Verificar Erros no Console do Navegador**

1. Abra o DevTools (`F12`)
2. Vá na aba "Console"
3. Veja se há erros em vermelho
4. Tente acessar `http://localhost:8080` novamente

---

### **7. Testar Conexão Manual**

Abra o terminal e execute:
```bash
curl http://localhost:8080
```

**Se retornar HTML:** ✅ Servidor funcionando (problema no navegador)
**Se retornar erro:** ❌ Problema no servidor

---

## 🔧 Solução Rápida (Passo a Passo)

1. **Verificar terminal do Cursor:**
   - Deve mostrar "Local: http://localhost:8080/"
   - Se não aparecer, o servidor não está rodando

2. **Tentar acessar:**
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`

3. **Se não abrir:**
   - Limpar cache do navegador (`Ctrl+Shift+Delete`)
   - Tentar outro navegador
   - Verificar firewall

4. **Se ainda não funcionar:**
   - Reiniciar o servidor:
     ```bash
     # Parar (Ctrl+C no terminal)
     # Iniciar novamente:
     pnpm dev
     ```

---

## 📱 Acessar de Outro Dispositivo (mesma rede)

1. **Descobrir seu IP local:**
   ```bash
   # Mac/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows:
   ipconfig
   ```

2. **Acessar de outro dispositivo:**
   ```
   http://SEU_IP:8080
   ```

3. **Se não funcionar, expor na rede:**
   - Editar `vite.config.ts`:
     ```typescript
     server: {
       host: "0.0.0.0", // Permite acesso de qualquer IP
       port: 8080,
     }
     ```

---

## ✅ Checklist de Diagnóstico

- [ ] Servidor está rodando? (ver terminal)
- [ ] Tentou `http://localhost:8080`?
- [ ] Tentou `http://127.0.0.1:8080`?
- [ ] Tentou outro navegador?
- [ ] Tentou modo anônimo?
- [ ] Verificou console do navegador (F12)?
- [ ] Verificou firewall/antivírus?
- [ ] Limpou cache do navegador?

---

**Última atualização**: 09/01/2026

