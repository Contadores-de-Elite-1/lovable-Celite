# Deploy Frontend - Vercel/Netlify

Guia completo para deploy do frontend em produção.

---

## 🎯 Overview

Frontend otimizado:
- ✅ Bundle: 242 KB (64% menor)
- ✅ Code splitting: 50+ chunks
- ✅ PWA support
- ✅ SEO: 30+ meta tags
- ✅ Performance: Web Vitals tracking
- ✅ Error boundary
- ✅ Environment validation

---

## 📋 Pré-requisitos

```bash
# 1. Build local funciona
npm run build

# 2. Preview local funciona
npm run preview

# 3. Supabase configurado
# Ver DEPLOY-SUPABASE.md
```

---

## 🚀 Opção 1: Deploy Vercel (Recomendado)

### Por que Vercel?
- ✅ Zero-config para Vite
- ✅ CDN global automático
- ✅ HTTPS grátis
- ✅ Preview deployments
- ✅ Analytics incluído

### Deploy via Dashboard (Mais Fácil)

**1. Acesse https://vercel.com**

**2. Import Project:**
- Click "Add New..." → "Project"
- Import do GitHub
- Selecione repositório `lovable-Celite`

**3. Configure Project:**

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**4. Environment Variables:**

Add estas variáveis:

```
VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Onde obter:**
```bash
# Supabase Dashboard → Settings → API
# Ou via CLI:
supabase status
```

**5. Deploy:**
- Click "Deploy"
- Aguarde build (~2 minutos)
- ✅ App live!

**URL gerada:**
```
https://seu-projeto.vercel.app
```

### Deploy via CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# 5. Deploy production
vercel --prod
```

### Configuração Avançada (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🌐 Opção 2: Deploy Netlify

### Por que Netlify?
- ✅ Forms integrados
- ✅ Serverless functions (se precisar)
- ✅ Split testing
- ✅ Deploy previews

### Deploy via Dashboard

**1. Acesse https://app.netlify.com**

**2. Import Project:**
- "Add new site" → "Import an existing project"
- Connect GitHub
- Selecione repositório

**3. Build Settings:**

```
Build command: npm run build
Publish directory: dist
```

**4. Environment Variables:**

```
VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**5. Deploy:**
- Click "Deploy site"
- ✅ Live!

### Deploy via CLI

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Init project
netlify init

# 4. Deploy
netlify deploy --prod --dir=dist
```

### Configuração (netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 🔧 Opção 3: Deploy Manual

### Para qualquer servidor (Apache, Nginx, etc)

**1. Build:**

```bash
npm run build
```

**2. Upload:**

```bash
# Via SCP
scp -r dist/* usuario@servidor:/var/www/html/

# Via SFTP
sftp usuario@servidor
put -r dist/* /var/www/html/
```

**3. Configure Servidor:**

### Nginx

```nginx
server {
    listen 80;
    server_name contadoresdeelite.com;

    root /var/www/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Apache (.htaccess)

```apache
# SPA fallback
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>

# Security headers
Header set X-Frame-Options "DENY"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"

# Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

---

## 🔍 Verificação Pós-Deploy

### 1. Performance

```bash
# Lighthouse CI
npm install -g lighthouse
lighthouse https://seu-dominio.com --view

# Web Vitals
# Abrir console do navegador:
JSON.parse(localStorage.getItem('performance_metrics'))
```

### 2. Funcionalidade

**Checklist:**
- [ ] Página inicial carrega
- [ ] Login funciona
- [ ] Dashboard carrega (após login)
- [ ] Checkout Stripe funciona
- [ ] Confirmação de pagamento funciona
- [ ] Imagens carregam
- [ ] PWA installable
- [ ] Mobile responsivo

### 3. Segurança

**Headers verificados:**
```bash
curl -I https://seu-dominio.com

# Deve ter:
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### 4. SEO

```bash
# Meta tags
curl https://seu-dominio.com | grep '<meta'

# Robots.txt
curl https://seu-dominio.com/robots.txt

# Sitemap (se tiver)
curl https://seu-dominio.com/sitemap.xml
```

---

## 🔄 Deploy Contínuo

### Vercel (Automático)

Vercel deploya automaticamente:
- ✅ Push para `main` → Deploy produção
- ✅ Push para outras branches → Preview deploy
- ✅ Pull requests → Preview deploy

### Netlify (Automático)

Netlify também deploya automaticamente:
- ✅ Push para branch configurada → Deploy
- ✅ Pull requests → Deploy preview

### GitHub Actions (Manual)

```.github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install
      run: npm install

    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

    - name: Deploy to Vercel
      run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🐛 Troubleshooting

### Build falha

**Erro:** "VITE_SUPABASE_URL is not defined"

```bash
# Verificar env vars
vercel env ls

# Adicionar
vercel env add VITE_SUPABASE_URL production
```

### 404 em rotas

**SPA routing não configurado**

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Assets não carregam

**Caminho relativo vs absoluto**

```typescript
// Vite config - ensure base is /
export default defineConfig({
  base: '/',
})
```

---

## 📊 Monitoramento

### Vercel Analytics

```javascript
// Já configurado automaticamente
// Ver: https://vercel.com/docs/analytics
```

### Google Analytics

```html
<!-- Em index.html (antes de </head>) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Custom Analytics

```javascript
// Já implementado em src/lib/analytics.ts
// Eventos trackados automaticamente
```

---

## 📝 Checklist Final

Deploy Frontend completo:

- [ ] Build funciona localmente
- [ ] Environment variables configuradas
- [ ] Deploy realizado (Vercel/Netlify)
- [ ] HTTPS funcionando
- [ ] Custom domain configurado (opcional)
- [ ] SPAs redirects configurados
- [ ] Security headers ativos
- [ ] Cache headers configurados
- [ ] Performance > 90 (Lighthouse)
- [ ] PWA installable
- [ ] Mobile responsivo
- [ ] Todas páginas carregam
- [ ] Checkout Stripe funciona
- [ ] Analytics configurado

---

## 🚀 Quick Commands

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist

# Build local
npm run build

# Preview local
npm run preview
```

---

## 📚 Recursos

- **Vercel**: https://vercel.com/docs
- **Netlify**: https://docs.netlify.com
- **Vite Deploy**: https://vitejs.dev/guide/static-deploy.html
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

**Deploy Frontend completo! ✅**

App live em produção! 🎉
