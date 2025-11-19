# FLUXO DEV1 - App de Onboarding de Clientes
## Lovable-Celite: Sistema de Captacao e Ativacao de Clientes

**Versao**: 1.0  
**Data**: Novembro 2025  
**Responsavel**: DEV 1  
**Dependencias**: Portal dos Contadores (DEV 2)

---

## RESUMO EXECUTIVO

**O que este app faz?**
- Cliente clica em link enviado pelo contador
- Escolhe plano (Pro/Premium/Top)
- Preenche dados + Upload de documentos
- Assina contrato digitalmente
- Paga via Stripe Checkout
- Sistema calcula comissoes automaticamente
- Top Class assina contrato e envia para cliente

**Tempo estimado**: 3-4 semanas (MVP Robusto)

---

## ARQUITETURA TECNICA

### Stack
```
Frontend:
- React + Vite + TypeScript
- Tailwind CSS (mobile-first)
- Shadcn/UI (componentes)
- React Hook Form + Zod (validacao)
- Supabase Client (auth + storage)

Backend:
- Supabase Edge Functions (Deno + TypeScript)
- Supabase Storage (upload documentos)
- Stripe Checkout + Stripe Connect
- PostgreSQL (database)

Integrações:
- Stripe Checkout (pagamento)
- Stripe Connect (split de comissoes)
- Brevo (emails transacionais)
- ReceitaWS (validacao CNPJ)
- PDFKit (geracao de contratos)
```

---

## FLUXO COMPLETO EM 7 TELAS

### TELA 1: Landing Page de Indicacao
**URL**: `/onboarding?ref=ENCRYPTED_TOKEN`

**Componentes**:
```typescript
// src/pages/OnboardingLanding.tsx

interface OnboardingLandingProps {
  contadorNome: string;
  contadorFoto?: string;
}

// Layout mobile-first
<div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark">
  <header>
    <img src="/logo-topclass.svg" alt="Top Class" />
  </header>
  
  <main className="px-4 py-8">
    <div className="text-center text-white">
      <h1 className="text-3xl font-bold mb-4">
        Você foi indicado por {contadorNome}
      </h1>
      
      <p className="text-lg mb-8">
        Use o endereço comercial da Top Class e consiga seu Alvará de Funcionamento em poucos passos.
      </p>
      
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Como funciona:</h2>
        <ol className="text-left space-y-3">
          <li>1. Escolha seu plano</li>
          <li>2. Envie seus documentos</li>
          <li>3. Assine o contrato</li>
          <li>4. Realize o pagamento</li>
          <li>5. Receba o contrato assinado pela Top Class</li>
        </ol>
      </div>
      
      <button className="w-full bg-white text-primary font-bold py-4 rounded-lg">
        COMEÇAR AGORA
      </button>
    </div>
  </main>
  
  <WhatsAppButton />
</div>
```

**Backend necessario**:
```typescript
// supabase/functions/validate-referral-token/index.ts

interface ValidateTokenRequest {
  token: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  contador_id?: string;
  contador_nome?: string;
  contador_foto?: string;
}

// Logica:
// 1. Decodifica token (AES-256 encrypted)
// 2. Busca contador no banco
// 3. Valida se contador esta ativo
// 4. Retorna dados para exibicao
```

---

### TELA 2: Escolha de Plano
**URL**: `/onboarding/planos?ref=TOKEN`

**Componentes**:
```typescript
// src/pages/OnboardingPlanos.tsx

interface Plano {
  id: 'pro' | 'premium' | 'top';
  nome: string;
  preco: number;
  beneficios: string[];
  destaque?: boolean;
}

const planos: Plano[] = [
  {
    id: 'pro',
    nome: 'Pro',
    preco: 100,
    beneficios: [
      'Endereço comercial',
      'Recebimento de correspondências',
      'Suporte via WhatsApp'
    ]
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 130,
    beneficios: [
      'Tudo do Pro +',
      'Sala de reuniões 2h/mês',
      'Atendimento preferencial'
    ],
    destaque: true
  },
  {
    id: 'top',
    nome: 'Top',
    preco: 180,
    beneficios: [
      'Tudo do Premium +',
      'Sala de reuniões 4h/mês',
      'Consultoria estratégica'
    ]
  }
];

// Layout mobile-first com cards
<div className="grid grid-cols-1 gap-4 px-4 py-8">
  {planos.map(plano => (
    <PlanoCard
      key={plano.id}
      plano={plano}
      selected={selectedPlano === plano.id}
      onClick={() => setSelectedPlano(plano.id)}
    />
  ))}
  
  <button
    disabled={!selectedPlano}
    className="w-full bg-primary text-white py-4 rounded-lg"
  >
    CONTINUAR
  </button>
</div>
```

**Estado compartilhado**:
```typescript
// src/hooks/useOnboardingState.ts

interface OnboardingState {
  ref_token: string;
  contador_id: string;
  plano_selecionado: 'pro' | 'premium' | 'top';
  dados_cliente: ClienteData;
  documentos_uploaded: DocumentoData[];
  assinatura_base64: string;
  contrato_pdf_url?: string;
}

// Salvar no localStorage + Context API
```

---

### TELA 3: Dados do Cliente
**URL**: `/onboarding/dados?ref=TOKEN`

**Componentes**:
```typescript
// src/pages/OnboardingDados.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clienteSchema = z.object({
  tipo_pessoa: z.enum(['PF', 'PJ']),
  nome_completo: z.string().min(3, 'Nome muito curto'),
  cpf_cnpj: z.string().refine(validarCPFCNPJ, 'CPF/CNPJ invalido'),
  email: z.string().email('Email invalido'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone invalido'),
  cep: z.string().regex(/^\d{8}$/, 'CEP invalido'),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().optional(),
  bairro: z.string(),
  cidade: z.string(),
  estado: z.string().length(2)
});

type ClienteFormData = z.infer<typeof clienteSchema>;

// Formulario com validacao real-time
<form onSubmit={handleSubmit(onSubmit)}>
  <Input
    label="Tipo de Pessoa"
    type="select"
    options={[
      { value: 'PF', label: 'Pessoa Fisica (CPF)' },
      { value: 'PJ', label: 'Pessoa Juridica (CNPJ)' }
    ]}
    {...register('tipo_pessoa')}
    error={errors.tipo_pessoa?.message}
  />
  
  <Input
    label="Nome Completo / Razao Social"
    {...register('nome_completo')}
    error={errors.nome_completo?.message}
  />
  
  <Input
    label={tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
    mask={tipoPessoa === 'PF' ? '999.999.999-99' : '99.999.999/9999-99'}
    {...register('cpf_cnpj')}
    error={errors.cpf_cnpj?.message}
  />
  
  {/* ... demais campos */}
  
  <button type="submit" className="w-full bg-primary text-white py-4">
    CONTINUAR PARA DOCUMENTOS
  </button>
</form>
```

**Validacoes automaticas**:
```typescript
// src/lib/validators.ts

// Valida CPF usando algoritmo oficial
export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Algoritmo de validacao CPF (digito verificador)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  // Repete para segundo digito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

// Valida CNPJ chamando ReceitaWS API
export async function validarCNPJ(cnpj: string): Promise<{
  valid: boolean;
  razao_social?: string;
  situacao?: string;
}> {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return { valid: false };
  
  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleaned}`);
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      return { valid: false };
    }
    
    return {
      valid: true,
      razao_social: data.nome,
      situacao: data.situacao
    };
  } catch (error) {
    return { valid: false };
  }
}

// Busca endereco via CEP (ViaCEP API)
export async function buscarEnderecoPorCEP(cep: string): Promise<{
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
} | null> {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    const data = await response.json();
    
    if (data.erro) return null;
    
    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf
    };
  } catch (error) {
    return null;
  }
}
```

---

### TELA 4: Upload de Documentos
**URL**: `/onboarding/documentos?ref=TOKEN`

**Componentes**:
```typescript
// src/pages/OnboardingDocumentos.tsx

interface DocumentoNecessario {
  tipo: 'cnh_rg' | 'comprovante_residencia' | 'contrato_social';
  label: string;
  obrigatorio: boolean;
  condicao?: (tipoPessoa: 'PF' | 'PJ') => boolean;
}

const documentosNecessarios: DocumentoNecessario[] = [
  {
    tipo: 'cnh_rg',
    label: 'CNH ou RG (frente e verso)',
    obrigatorio: true
  },
  {
    tipo: 'comprovante_residencia',
    label: 'Comprovante de Residencia (ultimos 90 dias)',
    obrigatorio: true
  },
  {
    tipo: 'contrato_social',
    label: 'Contrato Social da Empresa',
    obrigatorio: true,
    condicao: (tipo) => tipo === 'PJ'
  }
];

// Upload direto para Supabase Storage
async function handleUpload(file: File, tipo: string) {
  // Validacoes
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande (max 10MB)');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo nao permitido (apenas JPG, PNG, PDF)');
  }
  
  // Gera nome unico
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const fileName = `${tipo}_${timestamp}_${randomSuffix}.${file.name.split('.').pop()}`;
  
  // Upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from('documentos-clientes')
    .upload(`${onboardingState.ref_token}/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Obtem URL publica assinada (valida por 7 dias)
  const { data: urlData } = await supabase.storage
    .from('documentos-clientes')
    .createSignedUrl(data.path, 7 * 24 * 60 * 60);
  
  return {
    tipo,
    fileName: file.name,
    storagePath: data.path,
    signedUrl: urlData.signedUrl,
    uploadedAt: new Date().toISOString()
  };
}

// Layout mobile-first
<div className="space-y-6 px-4 py-8">
  {documentosNecessarios
    .filter(doc => !doc.condicao || doc.condicao(tipoPessoa))
    .map(doc => (
      <DocumentoUploadCard
        key={doc.tipo}
        documento={doc}
        onUpload={(file) => handleUpload(file, doc.tipo)}
        uploaded={documentosUploadedState[doc.tipo]}
      />
    ))
  }
  
  <button
    disabled={!todosDocumentosEnviados}
    className="w-full bg-primary text-white py-4 rounded-lg"
  >
    CONTINUAR PARA CONTRATO
  </button>
</div>
```

**Backend: RLS Policies**:
```sql
-- supabase/migrations/20251119001000_storage_documentos_clientes.sql

-- Politica: Cliente pode fazer upload dos proprios documentos
CREATE POLICY "Cliente pode fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-clientes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'ref_token'
);

-- Politica: Cliente pode ler seus proprios documentos
CREATE POLICY "Cliente pode ler proprios documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-clientes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'ref_token'
);

-- Politica: Admin e Top Class podem ler TODOS os documentos
CREATE POLICY "Admin pode ler todos documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-clientes' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

### TELA 5: Visualizacao e Assinatura do Contrato
**URL**: `/onboarding/contrato?ref=TOKEN`

**Componentes**:
```typescript
// src/pages/OnboardingContrato.tsx

// 1. Gera preview do contrato (antes de assinar)
async function gerarPreviewContrato(): Promise<string> {
  const response = await fetch('/api/gerar-contrato-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref_token: onboardingState.ref_token,
      dados_cliente: onboardingState.dados_cliente,
      plano: onboardingState.plano_selecionado
    })
  });
  
  const { preview_url } = await response.json();
  return preview_url;
}

// 2. Canvas para assinatura digital
<div className="space-y-6 px-4 py-8">
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-xl font-bold mb-4">Seu Contrato</h2>
    
    <iframe
      src={contratoPreviewUrl}
      className="w-full h-96 border rounded"
      title="Preview do Contrato"
    />
    
    <a
      href={contratoPreviewUrl}
      download="contrato-preview.pdf"
      className="text-primary underline"
    >
      Baixar contrato para leitura
    </a>
  </div>
  
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h3 className="text-lg font-semibold mb-4">Assine abaixo:</h3>
    
    <SignatureCanvas
      ref={signatureCanvasRef}
      canvasProps={{
        className: 'w-full h-40 border-2 border-dashed border-gray-300 rounded',
        style: { touchAction: 'none' }
      }}
      onEnd={handleSignatureEnd}
    />
    
    <button
      onClick={() => signatureCanvasRef.current?.clear()}
      className="mt-2 text-sm text-gray-600 underline"
    >
      Limpar assinatura
    </button>
  </div>
  
  <label className="flex items-start space-x-3">
    <input
      type="checkbox"
      checked={termsAccepted}
      onChange={(e) => setTermsAccepted(e.target.checked)}
      className="mt-1"
    />
    <span className="text-sm text-gray-700">
      Li e aceito os termos do contrato de cessao de uso de endereco comercial.
      Estou ciente de que o pagamento sera processado apos a assinatura.
    </span>
  </label>
  
  <button
    disabled={!signatureValid || !termsAccepted}
    onClick={handleContinuarParaPagamento}
    className="w-full bg-primary text-white py-4 rounded-lg"
  >
    CONTINUAR PARA PAGAMENTO
  </button>
</div>
```

**Backend: Geracao de PDF**:
```typescript
// supabase/functions/gerar-contrato-preview/index.ts

import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

interface GerarContratoRequest {
  ref_token: string;
  dados_cliente: ClienteData;
  plano: 'pro' | 'premium' | 'top';
}

async function gerarContratoPDF(req: GerarContratoRequest): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });
  
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  
  // Cabecalho
  doc.fontSize(18).font('Helvetica-Bold').text('CONTRATO DE CESSAO DE USO', { align: 'center' });
  doc.fontSize(14).text('ENDERECO COMERCIAL', { align: 'center' });
  doc.moveDown(2);
  
  // Partes
  doc.fontSize(12).font('Helvetica-Bold').text('CEDENTE:');
  doc.fontSize(10).font('Helvetica').text('TOP CLASS CONTABILIDADE LTDA');
  doc.text('CNPJ: 12.345.678/0001-90');
  doc.text('Endereco: Rua Exemplo, 123 - Sao Paulo/SP');
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica-Bold').text('CESSIONARIO:');
  doc.fontSize(10).font('Helvetica').text(`Nome/Razao Social: ${req.dados_cliente.nome_completo}`);
  doc.text(`CPF/CNPJ: ${req.dados_cliente.cpf_cnpj}`);
  doc.text(`Email: ${req.dados_cliente.email}`);
  doc.text(`Telefone: ${req.dados_cliente.telefone}`);
  doc.moveDown();
  
  // Clausulas
  doc.fontSize(12).font('Helvetica-Bold').text('CLAUSULA 1 - DO OBJETO');
  doc.fontSize(10).font('Helvetica').text(
    'O presente contrato tem por objeto a cessao de uso do endereco comercial ' +
    'da CEDENTE ao CESSIONARIO, para fins de registro empresarial e obtencao ' +
    'de Alvara de Funcionamento.'
  );
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica-Bold').text('CLAUSULA 2 - DO VALOR E FORMA DE PAGAMENTO');
  const planoValores = { pro: 100, premium: 130, top: 180 };
  doc.fontSize(10).font('Helvetica').text(
    `O CESSIONARIO pagara mensalmente o valor de R$ ${planoValores[req.plano]},00 ` +
    `referente ao plano ${req.plano.toUpperCase()}, atraves de cobranca automatica ` +
    `via cartao de credito.`
  );
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica-Bold').text('CLAUSULA 3 - DA VIGENCIA');
  doc.fontSize(10).font('Helvetica').text(
    'Este contrato tem prazo indeterminado, podendo ser rescindido por qualquer ' +
    'das partes mediante aviso previo de 30 dias.'
  );
  doc.moveDown();
  
  // Espaco para assinaturas
  doc.moveDown(4);
  doc.fontSize(10).text('_'.repeat(50), 50, doc.y, { align: 'left' });
  doc.text('TOP CLASS CONTABILIDADE LTDA', 50, doc.y + 5);
  doc.text('CEDENTE', 50, doc.y + 5);
  
  doc.text('_'.repeat(50), 300, doc.y - 35, { align: 'left' });
  doc.text(req.dados_cliente.nome_completo, 300, doc.y + 5);
  doc.text('CESSIONARIO', 300, doc.y + 5);
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
  });
}

// Handler da Edge Function
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  const body: GerarContratoRequest = await req.json();
  
  // Gera PDF
  const pdfBuffer = await gerarContratoPDF(body);
  
  // Faz upload para Supabase Storage (bucket: contratos-preview)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const fileName = `preview_${body.ref_token}_${Date.now()}.pdf`;
  const { data, error } = await supabase.storage
    .from('contratos-preview')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      cacheControl: '3600'
    });
  
  if (error) throw error;
  
  // Gera URL assinada (valida por 1 hora)
  const { data: urlData } = await supabase.storage
    .from('contratos-preview')
    .createSignedUrl(data.path, 3600);
  
  return new Response(
    JSON.stringify({ preview_url: urlData.signedUrl }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

---

### TELA 6: Pagamento Stripe
**URL**: `/onboarding/pagamento?ref=TOKEN`

**Fluxo Stripe Checkout**:
```typescript
// src/pages/OnboardingPagamento.tsx

async function iniciarCheckoutStripe() {
  // Salva assinatura no banco (antes do pagamento)
  const assinaturaBase64 = signatureCanvasRef.current?.toDataURL();
  
  await supabase.from('onboarding_temp').insert({
    ref_token: onboardingState.ref_token,
    contador_id: onboardingState.contador_id,
    plano: onboardingState.plano_selecionado,
    dados_cliente: onboardingState.dados_cliente,
    documentos: onboardingState.documentos_uploaded,
    assinatura_cliente: assinaturaBase64,
    status: 'aguardando_pagamento'
  });
  
  // Chama Edge Function para criar Stripe Checkout Session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref_token: onboardingState.ref_token,
      contador_id: onboardingState.contador_id,
      plano: onboardingState.plano_selecionado,
      cliente_email: onboardingState.dados_cliente.email,
      cliente_nome: onboardingState.dados_cliente.nome_completo
    })
  });
  
  const { checkout_url } = await response.json();
  
  // Redireciona para Stripe Checkout
  window.location.href = checkout_url;
}
```

**Backend: Stripe Checkout Session**:
```typescript
// supabase/functions/create-checkout-session/index.ts

import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia'
});

interface CreateCheckoutRequest {
  ref_token: string;
  contador_id: string;
  plano: 'pro' | 'premium' | 'top';
  cliente_email: string;
  cliente_nome: string;
}

Deno.serve(async (req) => {
  const body: CreateCheckoutRequest = await req.json();
  
  // Busca Stripe Connect Account ID do contador
  const { data: contador } = await supabase
    .from('contadores')
    .select('stripe_connect_account_id')
    .eq('id', body.contador_id)
    .single();
  
  if (!contador?.stripe_connect_account_id) {
    throw new Error('Contador nao possui conta Stripe Connect');
  }
  
  // Define Price ID baseado no plano
  const priceIds = {
    pro: Deno.env.get('STRIPE_PRICE_PRO')!,
    premium: Deno.env.get('STRIPE_PRICE_PREMIUM')!,
    top: Deno.env.get('STRIPE_PRICE_TOP')!
  };
  
  // Calcula comissao (sera transferida automaticamente via Stripe Connect)
  const planoValores = { pro: 100, premium: 130, top: 180 };
  const valorPlano = planoValores[body.plano];
  
  // Comissao de ativacao: 100% do 1o mes
  const comissaoAtivacao = valorPlano;
  
  // Comissao recorrente: 15-20% (depende do nivel, mas no checkout usamos 15% inicial)
  const comissaoRecorrente = Math.round(valorPlano * 0.15);
  
  // Cria Checkout Session com Stripe Connect (split automatico)
  const session = await stripe.checkout.sessions.create({
    customer_email: body.cliente_email,
    line_items: [
      {
        price: priceIds[body.plano],
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${Deno.env.get('FRONTEND_URL')}/onboarding/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('FRONTEND_URL')}/onboarding/pagamento?ref=${body.ref_token}`,
    metadata: {
      ref_token: body.ref_token,
      contador_id: body.contador_id,
      plano: body.plano
    },
    subscription_data: {
      metadata: {
        contador_id: body.contador_id,
        plano: body.plano
      },
      // IMPORTANTE: Define transferencia automatica para contador via Stripe Connect
      application_fee_percent: 15, // Top Class fica com 85%, contador recebe 15% recorrente
      transfer_data: {
        destination: contador.stripe_connect_account_id
      }
    },
    payment_intent_data: {
      // No primeiro pagamento, transfere 100% para o contador (ativacao)
      transfer_data: {
        destination: contador.stripe_connect_account_id,
        amount: comissaoAtivacao * 100 // Stripe usa centavos
      }
    }
  });
  
  return new Response(
    JSON.stringify({ checkout_url: session.url }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

---

### TELA 7: Sucesso e Aguardando Assinatura Top Class
**URL**: `/onboarding/sucesso?session_id=SESSION_ID`

**Componentes**:
```typescript
// src/pages/OnboardingSucesso.tsx

async function verificarStatusPagamento(sessionId: string) {
  const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
  const { status, contrato_url, protocolo } = await response.json();
  
  return { status, contrato_url, protocolo };
}

<div className="min-h-screen bg-gradient-to-b from-green-500 to-green-700 flex items-center justify-center px-4">
  <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
    <div className="text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Pagamento Confirmado!
      </h1>
      
      <p className="text-gray-600 mb-6">
        Seu contrato sera assinado pela Top Class e enviado em ate 24 horas.
      </p>
      
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 mb-2">Protocolo:</p>
        <p className="text-xl font-mono font-bold text-gray-900">{protocolo}</p>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={() => window.open(contratoUrl, '_blank')}
          className="w-full bg-primary text-white py-3 rounded-lg"
        >
          Ver Contrato (Preview)
        </button>
        
        <button
          onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
          className="w-full bg-green-500 text-white py-3 rounded-lg flex items-center justify-center"
        >
          <WhatsAppIcon className="w-5 h-5 mr-2" />
          Falar no WhatsApp
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-6">
        Voce recebera um email com todas as informacoes.
      </p>
    </div>
  </div>
</div>
```

---

## WEBHOOK STRIPE: PROCESSAMENTO DE PAGAMENTO

```typescript
// supabase/functions/webhook-stripe-onboarding/index.ts

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia'
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  // Valida assinatura do webhook Stripe
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET_ONBOARDING')!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook signature invalid', { status: 400 });
  }
  
  // Processa evento
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const { ref_token, contador_id, plano } = session.metadata!;
    
    // Busca dados temporarios do onboarding
    const { data: onboardingData } = await supabase
      .from('onboarding_temp')
      .select('*')
      .eq('ref_token', ref_token)
      .single();
    
    if (!onboardingData) {
      throw new Error(`Onboarding data not found for ref_token: ${ref_token}`);
    }
    
    // Cria registro do cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .insert({
        contador_id: contador_id,
        nome: onboardingData.dados_cliente.nome_completo,
        email: onboardingData.dados_cliente.email,
        telefone: onboardingData.dados_cliente.telefone,
        cpf_cnpj: onboardingData.dados_cliente.cpf_cnpj,
        tipo_pessoa: onboardingData.dados_cliente.tipo_pessoa,
        plano: plano,
        status: 'ativo',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        dados_completos: onboardingData.dados_cliente,
        documentos: onboardingData.documentos,
        assinatura_cliente: onboardingData.assinatura_cliente,
        contrato_assinado_cliente_em: new Date().toISOString()
      })
      .select()
      .single();
    
    if (clienteError) throw clienteError;
    
    // Cria registro do pagamento
    const planoValores = { pro: 100, premium: 130, top: 180 };
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        cliente_id: cliente.id,
        contador_id: contador_id,
        valor: planoValores[plano],
        plano: plano,
        status: 'aprovado',
        stripe_payment_intent_id: session.payment_intent,
        stripe_subscription_id: session.subscription,
        tipo_pagamento: 'ativacao',
        pago_em: new Date().toISOString()
      })
      .select()
      .single();
    
    if (pagamentoError) throw pagamentoError;
    
    // CRITICO: Chama funcao de calculo de comissoes
    const { data: comissoes, error: comissoesError } = await supabase
      .rpc('executar_calculo_comissoes', {
        p_pagamento_id: pagamento.id
      });
    
    if (comissoesError) {
      console.error('ERRO CRITICO ao calcular comissoes:', comissoesError);
      
      // Envia alerta para admin
      await fetch(Deno.env.get('WEBHOOK_ALERTA_CRITICO')!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'ERRO_CALCULO_COMISSOES',
          pagamento_id: pagamento.id,
          cliente_id: cliente.id,
          error: comissoesError.message
        })
      });
    }
    
    // Gera contrato final com assinatura do cliente
    const contratoFinalUrl = await gerarContratoFinalComAssinatura(cliente.id);
    
    // Envia email para Top Class assinar
    await enviarEmailAssinaturaTopClass({
      cliente_nome: cliente.nome,
      cliente_email: cliente.email,
      contrato_url: contratoFinalUrl,
      protocolo: cliente.id
    });
    
    // Envia email de confirmacao para cliente
    await enviarEmailConfirmacaoCliente({
      cliente_nome: cliente.nome,
      cliente_email: cliente.email,
      protocolo: cliente.id
    });
    
    // Remove dados temporarios
    await supabase
      .from('onboarding_temp')
      .delete()
      .eq('ref_token', ref_token);
    
    // Log de auditoria
    await supabase.from('audit_logs').insert({
      action: 'CLIENTE_ATIVADO',
      user_id: contador_id,
      resource_type: 'clientes',
      resource_id: cliente.id,
      details: {
        plano: plano,
        valor: planoValores[plano],
        stripe_session_id: session.id,
        comissoes_calculadas: comissoes?.length || 0
      }
    });
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## INTEGRACAO COM PORTAL DOS CONTADORES (DEV 2)

### Pontos de contato entre os 2 apps:

```typescript
// 1. Contador gera link de indicacao
// Arquivo: src/pages/Dashboard.tsx (Portal dos Contadores)

async function gerarLinkIndicacao() {
  const response = await fetch('/api/gerar-link-indicacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contador_id: user.id
    })
  });
  
  const { link, token } = await response.json();
  
  // link = "https://onboarding.topclass.com/?ref=ENCRYPTED_TOKEN"
  return link;
}

// 2. Backend gera token criptografado
// Arquivo: supabase/functions/gerar-link-indicacao/index.ts

async function gerarTokenReferral(contadorId: string): Promise<string> {
  // Payload: { contador_id, timestamp, random_nonce }
  const payload = {
    contador_id: contadorId,
    timestamp: Date.now(),
    nonce: crypto.randomUUID()
  };
  
  const payloadStr = JSON.stringify(payload);
  
  // Criptografa com AES-256
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(Deno.env.get('ENCRYPTION_KEY')!),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(payloadStr)
  );
  
  // Retorna: base64(iv + encrypted)
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// 3. App Onboarding decodifica token
// Arquivo: supabase/functions/validate-referral-token/index.ts

async function decodificarTokenReferral(token: string): Promise<{
  contador_id: string;
  timestamp: number;
}> {
  // Decodifica base64
  const combined = Uint8Array.from(atob(token), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // Descriptografa com AES-256
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(Deno.env.get('ENCRYPTION_KEY')!),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  const payloadStr = new TextDecoder().decode(decrypted);
  const payload = JSON.parse(payloadStr);
  
  // Valida timestamp (token expira em 7 dias)
  const agora = Date.now();
  const diff = agora - payload.timestamp;
  const seteDias = 7 * 24 * 60 * 60 * 1000;
  
  if (diff > seteDias) {
    throw new Error('Token expirado');
  }
  
  return {
    contador_id: payload.contador_id,
    timestamp: payload.timestamp
  };
}
```

---

## BANCO DE DADOS: NOVAS TABELAS

```sql
-- supabase/migrations/20251119002000_create_onboarding_tables.sql

-- Tabela temporaria para armazenar dados do onboarding antes do pagamento
CREATE TABLE onboarding_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_token TEXT NOT NULL UNIQUE,
  contador_id UUID NOT NULL REFERENCES contadores(id) ON DELETE CASCADE,
  plano tipo_plano NOT NULL,
  dados_cliente JSONB NOT NULL,
  documentos JSONB,
  assinatura_cliente TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Indice para buscar por token
CREATE INDEX idx_onboarding_temp_ref_token ON onboarding_temp(ref_token);

-- Indice para buscar por contador
CREATE INDEX idx_onboarding_temp_contador_id ON onboarding_temp(contador_id);

-- CRON Job: Limpar registros expirados
-- (Configurar no Supabase Dashboard: cron.schedule)
CREATE OR REPLACE FUNCTION limpar_onboarding_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM onboarding_temp
  WHERE expira_em < now();
END;
$$;

-- Adiciona campos no clientes para armazenar dados completos
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS dados_completos JSONB,
ADD COLUMN IF NOT EXISTS documentos JSONB,
ADD COLUMN IF NOT EXISTS assinatura_cliente TEXT,
ADD COLUMN IF NOT EXISTS contrato_assinado_cliente_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contrato_assinado_topclass_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contrato_final_url TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Indice para buscar por Stripe Customer ID
CREATE INDEX idx_clientes_stripe_customer_id ON clientes(stripe_customer_id);

-- Indice para buscar por Stripe Subscription ID
CREATE INDEX idx_clientes_stripe_subscription_id ON clientes(stripe_subscription_id);

-- RLS: Cliente pode ver apenas seus proprios dados
CREATE POLICY "Cliente pode ver proprios dados"
ON clientes FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = clientes.email
  )
);

-- RLS: Contador pode ver clientes que ele indicou
CREATE POLICY "Contador pode ver clientes indicados"
ON clientes FOR SELECT
TO authenticated
USING (
  contador_id = auth.uid()
);
```

---

## CHECKLIST DE IMPLEMENTACAO (DEV 1)

### Semana 1: Setup + Telas 1-3
- [ ] Criar repositorio Git separado ou branch `app-onboarding`
- [ ] Setup Vite + React + TypeScript + Tailwind CSS
- [ ] Instalar dependencias: `react-hook-form`, `zod`, `react-signature-canvas`, `@supabase/supabase-js`
- [ ] Configurar Supabase Client
- [ ] Criar migrations: `onboarding_temp`, `clientes` (campos extras)
- [ ] Edge Function: `validate-referral-token`
- [ ] Edge Function: `gerar-link-indicacao` (DEV 2 implementa)
- [ ] Tela 1: Landing Page
- [ ] Tela 2: Escolha de Plano
- [ ] Tela 3: Dados do Cliente (formulario + validacoes)

### Semana 2: Telas 4-5 + Upload
- [ ] Configurar Supabase Storage: bucket `documentos-clientes`
- [ ] RLS policies para upload seguro
- [ ] Tela 4: Upload de Documentos
- [ ] Edge Function: `gerar-contrato-preview` (PDFKit)
- [ ] Configurar Supabase Storage: bucket `contratos-preview`
- [ ] Tela 5: Visualizacao + Assinatura Canvas

### Semana 3: Stripe + Webhook
- [ ] Criar conta Stripe (modo test)
- [ ] Configurar Stripe Connect (para contadores)
- [ ] Criar Products + Prices no Stripe (Pro/Premium/Top)
- [ ] Edge Function: `create-checkout-session`
- [ ] Edge Function: `webhook-stripe-onboarding`
- [ ] Configurar Webhook no Stripe Dashboard
- [ ] Tela 6: Pagamento Stripe
- [ ] Tela 7: Sucesso

### Semana 4: Testes + Deploy
- [ ] Teste end-to-end: Link → Pagamento → Comissoes calculadas
- [ ] Validar integracao com Portal dos Contadores (DEV 2)
- [ ] Configurar dominio: `onboarding.topclass.com`
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Deploy Edge Functions (Supabase)
- [ ] Configurar variaveis de ambiente (producao)
- [ ] Teste com contador real (modo test Stripe)

---

## VARIAVEIS DE AMBIENTE

```bash
# .env (App Onboarding)

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Stripe (Public Key)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Frontend URL
VITE_FRONTEND_URL=http://localhost:8080

# API Base URL
VITE_API_BASE_URL=https://xxx.supabase.co/functions/v1
```

```bash
# Edge Functions .env (Supabase)

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET_ONBOARDING=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_TOP=price_xxx

# Encryption
ENCRYPTION_KEY=sua_chave_256_bits_aqui

# Frontend URL
FRONTEND_URL=https://onboarding.topclass.com

# Webhook Alerta Critico
WEBHOOK_ALERTA_CRITICO=https://hooks.slack.com/services/xxx
```

---

## PROXIMOS PASSOS

1. **Aprovar este fluxo** ou sugerir modificacoes
2. **DEV 1** implementa este fluxo (App Onboarding)
3. **DEV 2** implementa migracao ASAAS → Stripe no Portal
4. **Integracao entre os 2 apps** (Semana 4)

---

## DUVIDAS? PONTOS DE ATENCAO?

Alguma parte do fluxo nao ficou clara ou voce gostaria de modificar algo antes de eu criar o PRD completo?

