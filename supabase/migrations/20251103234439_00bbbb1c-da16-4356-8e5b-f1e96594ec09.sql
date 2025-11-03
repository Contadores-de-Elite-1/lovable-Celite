-- Tipos de dados padronizados
CREATE TYPE nivel_contador AS ENUM ('bronze', 'prata', 'ouro', 'diamante');
CREATE TYPE status_contador AS ENUM ('ativo', 'inativo', 'tier_1', 'tier_2', 'tier_3');
CREATE TYPE tipo_plano AS ENUM ('basico', 'profissional', 'premium', 'enterprise');
CREATE TYPE status_cliente AS ENUM ('lead', 'ativo', 'cancelado', 'inadimplente');
CREATE TYPE tipo_indicacao AS ENUM ('cliente', 'contador');
CREATE TYPE status_indicacao AS ENUM ('clique', 'cadastro', 'convertido', 'expirado');
CREATE TYPE tipo_pagamento AS ENUM ('ativacao', 'recorrente');
CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'cancelado', 'estornado');
CREATE TYPE tipo_comissao AS ENUM ('ativacao', 'recorrente', 'override', 'bonus_progressao', 'bonus_ltv', 'bonus_rede', 'lead_diamante');
CREATE TYPE status_comissao AS ENUM ('calculada', 'aprovada', 'paga', 'cancelada');
CREATE TYPE app_role AS ENUM ('admin', 'contador', 'suporte');

-- Perfis de usuários
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT UNIQUE,
  data_nascimento DATE,
  foto_url TEXT,
  aceite_termos BOOLEAN DEFAULT false,
  aceite_notificacoes BOOLEAN DEFAULT false,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sistema de roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Contadores
CREATE TABLE contadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nivel nivel_contador DEFAULT 'bronze',
  status status_contador DEFAULT 'ativo',
  crc TEXT,
  chave_pix TEXT,
  data_ingresso DATE DEFAULT CURRENT_DATE,
  ultima_ativacao DATE,
  clientes_ativos INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID REFERENCES contadores(id) ON DELETE RESTRICT NOT NULL,
  indicacao_id UUID,
  nome_empresa TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  contato_nome TEXT,
  contato_email TEXT,
  contato_telefone TEXT,
  plano tipo_plano NOT NULL,
  valor_mensal NUMERIC(10,2) NOT NULL,
  status status_cliente DEFAULT 'lead',
  data_ativacao DATE,
  data_cancelamento DATE,
  asaas_customer_id TEXT UNIQUE,
  asaas_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rede de contadores
CREATE TABLE rede_contadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  nivel_rede INTEGER DEFAULT 1 CHECK (nivel_rede BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sponsor_id, child_id),
  CHECK (sponsor_id != child_id)
);

-- Sistema de convites
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_indicacao NOT NULL,
  emissor_id UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  flow TEXT CHECK (flow IN ('lp', 'checkout')),
  metadata JSONB,
  usado_por UUID REFERENCES auth.users(id),
  usado_em TIMESTAMPTZ,
  expira_em TIMESTAMPTZ NOT NULL,
  status status_indicacao DEFAULT 'clique',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indicações
CREATE TABLE indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES invites(id) ON DELETE SET NULL,
  contador_id UUID REFERENCES contadores(id) ON DELETE RESTRICT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  contador_indicado_id UUID REFERENCES contadores(id) ON DELETE CASCADE,
  origem TEXT,
  ip_address INET,
  user_agent TEXT,
  convertido_em TIMESTAMPTZ,
  status status_indicacao DEFAULT 'clique',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (cliente_id IS NOT NULL AND contador_indicado_id IS NULL) OR
    (cliente_id IS NULL AND contador_indicado_id IS NOT NULL)
  )
);

-- Pagamentos
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT NOT NULL,
  tipo tipo_pagamento NOT NULL,
  competencia DATE NOT NULL,
  valor_bruto NUMERIC(10,2) NOT NULL,
  cashback NUMERIC(10,2) DEFAULT 0,
  valor_liquido NUMERIC(10,2) NOT NULL,
  status status_pagamento DEFAULT 'pendente',
  asaas_payment_id TEXT UNIQUE,
  asaas_event_id TEXT UNIQUE,
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comissões
CREATE TABLE comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID REFERENCES contadores(id) ON DELETE RESTRICT NOT NULL,
  tipo tipo_comissao NOT NULL,
  pagamento_id UUID REFERENCES pagamentos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  percentual NUMERIC(5,2),
  competencia DATE NOT NULL,
  status status_comissao DEFAULT 'calculada',
  observacao TEXT,
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conquistas
CREATE TABLE conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  tipo TEXT,
  requisito_xp INTEGER,
  requisito_clientes INTEGER,
  icone_url TEXT,
  valor_bonus NUMERIC(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conquistas dos contadores
CREATE TABLE contador_conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  conquista_id UUID REFERENCES conquistas(id) ON DELETE CASCADE NOT NULL,
  desbloqueado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contador_id, conquista_id)
);

-- Eventos
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento TIMESTAMPTZ NOT NULL,
  local TEXT,
  vagas INTEGER,
  nivel_minimo nivel_contador,
  qr_code_check_in TEXT UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participantes de eventos
CREATE TABLE evento_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  contador_id UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  check_in_em TIMESTAMPTZ,
  xp_ganho INTEGER DEFAULT 0,
  UNIQUE(evento_id, contador_id)
);

-- Logs de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  tabela TEXT,
  registro_id UUID,
  payload JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Logs de webhook
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT false,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Solicitações LGPD
CREATE TABLE lgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  tipo TEXT CHECK (tipo IN ('acesso', 'correcao', 'exclusao', 'portabilidade')),
  status TEXT DEFAULT 'pendente',
  dados_exportados JSONB,
  processado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de performance
CREATE INDEX idx_contadores_user_id ON contadores(user_id);
CREATE INDEX idx_contadores_status ON contadores(status) WHERE status = 'ativo';
CREATE INDEX idx_clientes_contador_id ON clientes(contador_id);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_rede_sponsor ON rede_contadores(sponsor_id);
CREATE INDEX idx_rede_child ON rede_contadores(child_id);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_emissor ON invites(emissor_id);
CREATE INDEX idx_indicacoes_contador ON indicacoes(contador_id);
CREATE INDEX idx_indicacoes_cliente ON indicacoes(cliente_id);
CREATE INDEX idx_pagamentos_cliente ON pagamentos(cliente_id);
CREATE INDEX idx_pagamentos_competencia ON pagamentos(competencia);
CREATE INDEX idx_pagamentos_asaas_event ON pagamentos(asaas_event_id);
CREATE INDEX idx_comissoes_contador ON comissoes(contador_id);
CREATE INDEX idx_comissoes_competencia ON comissoes(competencia);
CREATE INDEX idx_comissoes_status ON comissoes(status);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_webhook_logs_event ON webhook_logs(event_id);

-- Trigger: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contadores_updated_at BEFORE UPDATE ON contadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comissoes_updated_at BEFORE UPDATE ON comissoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Criar profile automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Atualizar clientes ativos
CREATE OR REPLACE FUNCTION atualizar_clientes_ativos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'ativo' THEN
    UPDATE contadores
    SET clientes_ativos = clientes_ativos + 1,
        ultima_ativacao = CURRENT_DATE
    WHERE id = NEW.contador_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'ativo' AND NEW.status = 'ativo' THEN
      UPDATE contadores SET clientes_ativos = clientes_ativos + 1 WHERE id = NEW.contador_id;
    ELSIF OLD.status = 'ativo' AND NEW.status != 'ativo' THEN
      UPDATE contadores SET clientes_ativos = clientes_ativos - 1 WHERE id = NEW.contador_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'ativo' THEN
    UPDATE contadores SET clientes_ativos = clientes_ativos - 1 WHERE id = OLD.contador_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_clientes_ativos
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION atualizar_clientes_ativos();

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rede_contadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contador_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_requests ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: verificar role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função auxiliar: obter contador_id
CREATE OR REPLACE FUNCTION get_contador_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.contadores WHERE user_id = _user_id LIMIT 1
$$;

-- Policies: Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies: Contadores
CREATE POLICY "Contadores can view own data" ON contadores FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage contadores" ON contadores FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Policies: Clientes
CREATE POLICY "Contadores can view own clients" ON clientes FOR SELECT
  USING (contador_id = get_contador_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contadores can insert own clients" ON clientes FOR INSERT
  WITH CHECK (contador_id = get_contador_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all clients" ON clientes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Policies: Indicações
CREATE POLICY "Contadores view own indicacoes" ON indicacoes FOR SELECT
  USING (contador_id = get_contador_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Policies: Comissões
CREATE POLICY "Contadores view own comissoes" ON comissoes FOR SELECT
  USING (contador_id = get_contador_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Policies: Invites
CREATE POLICY "Anyone can validate invites" ON invites FOR SELECT USING (true);

-- Policies: Conquistas
CREATE POLICY "Anyone can view conquistas" ON conquistas FOR SELECT USING (ativo = true);

-- Policies: Eventos
CREATE POLICY "Anyone can view active eventos" ON eventos FOR SELECT USING (ativo = true);

-- Policies: Audit Logs
CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Policies: LGPD Requests
CREATE POLICY "Users manage own LGPD requests" ON lgpd_requests FOR ALL
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Dados iniciais: Conquistas
INSERT INTO conquistas (nome, descricao, tipo, requisito_clientes, icone_url, valor_bonus) VALUES
('Primeiro Cliente', 'Indicou e ativou seu primeiro cliente', 'badge', 1, '/badges/primeiro.svg', NULL),
('Bronze Master', 'Alcançou nível Bronze', 'nivel', 0, '/badges/bronze.svg', NULL),
('10 Ativos', 'Mantém 10 clientes ativos simultâneos', 'badge', 10, '/badges/10-ativos.svg', 100),
('Construtor de Rede', 'Indicou 5 contadores ativos', 'badge', 0, '/badges/rede.svg', 250);