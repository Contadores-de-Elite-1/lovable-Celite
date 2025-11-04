# 🔐 Configuração Completa - Reset de Senha

## ✅ O que já está implementado

1. ✅ Tela de login com link "Esqueceu a senha?" (visível apenas no modo login, não no cadastro)
2. ✅ Formulário de recuperação de senha
3. ✅ Página de redefinição de senha (`/auth/reset-password`)
4. ✅ Validações e feedback visual

---

## 🔧 Configuração no Supabase Dashboard

### 1️⃣ Configurar URL de Redirecionamento

Acesse: [URL Configuration](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/auth/url-configuration)

**Adicione as seguintes URLs:**

**Site URL:**
```
https://contadores-elite.lovable.app
```

**Redirect URLs (adicione todas):**
```
https://contadores-elite.lovable.app/auth/reset-password
https://contadores-elite.lovable.app/**
http://localhost:5173/auth/reset-password
http://localhost:5173/**
```

---

### 2️⃣ Personalizar Template de Email

Acesse: [Email Templates](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/auth/templates)

**Selecione: "Reset Password"**

**Cole o HTML abaixo:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha - Contadores de Elite</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f6f9fc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #7c3aed 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .crown-icon {
      font-size: 64px;
      margin-bottom: 20px;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    }
    .header h1 {
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      color: #525f7f;
      font-size: 16px;
      line-height: 26px;
      margin: 20px 0;
    }
    .button-container {
      text-align: center;
      padding: 30px 0;
    }
    .button {
      background: linear-gradient(135deg, #1a1a2e 0%, #7c3aed 100%);
      border-radius: 10px;
      color: #ffffff !important;
      font-size: 18px;
      font-weight: bold;
      text-decoration: none;
      padding: 16px 50px;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
    }
    .warning-box {
      background-color: #fff8e1;
      border-left: 4px solid #ffa726;
      padding: 20px 25px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .warning-title {
      color: #f57c00;
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
    }
    .warning-text {
      color: #525f7f;
      font-size: 14px;
      line-height: 22px;
      margin: 8px 0;
    }
    .divider {
      border: none;
      border-top: 2px solid #e6ebf1;
      margin: 30px 0;
    }
    .footer {
      background-color: #f6f9fc;
      padding: 30px 20px;
      text-align: center;
    }
    .footer p {
      color: #8898aa;
      font-size: 13px;
      line-height: 20px;
      margin: 8px 0;
    }
    .footer strong {
      color: #525f7f;
      font-size: 14px;
    }
    .security-note {
      background-color: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .security-note p {
      color: #2e7d32;
      font-size: 14px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="crown-icon">👑</div>
      <h1>Redefinição de Senha</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Olá,</p>
      
      <p>Recebemos uma solicitação para redefinir a senha da sua conta em <strong>Contadores de Elite</strong>.</p>
      
      <p>Se você não solicitou esta alteração, ignore este email com segurança. Nenhuma mudança será feita na sua conta.</p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">
          🔐 Redefinir Minha Senha
        </a>
      </div>

      <div class="security-note">
        <p>💡 <strong>Dica de segurança:</strong> Escolha uma senha forte com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.</p>
      </div>

      <hr class="divider">

      <!-- Warning Box -->
      <div class="warning-box">
        <p class="warning-title">⚠️ Informações Importantes</p>
        <p class="warning-text">• Este link é <strong>válido por 1 hora</strong></p>
        <p class="warning-text">• Ele só pode ser usado <strong>uma única vez</strong></p>
        <p class="warning-text">• Ao redefinir a senha, você será desconectado de todos os dispositivos</p>
        <p class="warning-text">• Se não foi você, <strong>proteja sua conta</strong> alterando a senha imediatamente</p>
      </div>

      <hr class="divider">

      <p style="color: #8898aa; font-size: 13px;">
        Se o botão acima não funcionar, copie e cole este link no seu navegador:
      </p>
      <p style="word-break: break-all; color: #7c3aed; font-size: 12px;">
        {{ .ConfirmationURL }}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Contadores de Elite</strong></p>
      <p>Powered by Top Class Escritório Virtual</p>
      <p style="margin-top: 20px;">
        Este é um email automático, por favor não responda.<br>
        Em caso de dúvidas, entre em contato com nosso suporte.
      </p>
    </div>
  </div>
</body>
</html>
```

---

### 3️⃣ Configurações Adicionais Recomendadas

**Em Authentication > Settings:**

✅ **Enable email confirmations** - DESABILITE para testes (habilite em produção)

✅ **Secure email change** - Habilitado (segurança)

✅ **Double confirm email changes** - Habilitado (segurança)

**Password Requirements:**
- Minimum length: **8 caracteres** (recomendado)
- Require special characters: **Sim** (opcional, mas recomendado)

---

## 📱 Como Usar (Fluxo do Usuário)

### Passo 1: Acessar "Esqueceu a senha?"
1. Na tela de login (`/auth`)
2. Certifique-se de estar no modo **LOGIN** (não em "Criar conta")
3. Clique em **"Esqueceu a senha?"** (ao lado do campo senha)

### Passo 2: Solicitar Recuperação
1. Digite seu email
2. Clique em "Enviar link de recuperação"
3. Aguarde confirmação (email enviado)

### Passo 3: Verificar Email
1. Abra seu email
2. Procure por "Redefinição de senha - Contadores de Elite"
3. Verifique também a pasta de **SPAM**
4. Clique no botão "Redefinir Minha Senha"

### Passo 4: Criar Nova Senha
1. Você será redirecionado para `/auth/reset-password`
2. Digite a nova senha (mínimo 6 caracteres)
3. Confirme a senha
4. Clique em "Redefinir senha"
5. Sucesso! Você será redirecionado para o login

---

## 🧪 Testando a Funcionalidade

### Teste Local:
1. Certifique-se de ter adicionado `http://localhost:5173/**` nas Redirect URLs
2. Crie uma conta de teste
3. Faça logout
4. Clique em "Esqueceu a senha?"
5. Use o email da conta teste
6. Verifique o email (pode demorar 1-2 minutos)

### Teste em Produção:
1. Publique o app
2. Adicione a URL de produção nas configurações
3. Repita o fluxo de teste

---

## 🔍 Troubleshooting

### ❌ Não recebo o email
- Verifique a pasta de spam
- Confirme que o email está correto no Supabase
- Verifique se as Redirect URLs estão configuradas
- Aguarde até 5 minutos (pode haver delay)

### ❌ Link expirado
- Links são válidos por apenas 1 hora
- Solicite um novo link de recuperação

### ❌ Erro ao redefinir
- Verifique se as senhas coincidem
- Certifique-se de que a senha tem no mínimo 6 caracteres
- Tente limpar o cache do navegador

### ❌ "Invalid redirect URL"
- Confirme que a URL está nas Redirect URLs do Supabase
- Certifique-se de incluir `**` no final da URL base
- Aguarde 1-2 minutos após salvar as configurações

---

## 📊 Métricas de Sucesso

Após configuração completa, você terá:

✅ Link "Esqueceu a senha?" visível no login
✅ Fluxo de recuperação funcional
✅ Email branded e profissional
✅ Validações de segurança implementadas
✅ UX otimizada com feedback visual
✅ Sistema pronto para produção

---

## 🎨 Personalizações Futuras

Você pode personalizar ainda mais:

1. **Cores do email** - Ajuste o gradient no header
2. **Logo** - Substitua 👑 por logo real
3. **Textos** - Adapte mensagens ao seu tom de marca
4. **Tempo de expiração** - Configure no Supabase (padrão: 1 hora)
5. **Requisitos de senha** - Ajuste complexity nas configurações

---

**Pronto! 🎉 O sistema de reset de senha está completo e pronto para uso.**
