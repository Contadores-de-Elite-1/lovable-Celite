-- Adicionar RLS policies faltantes e corrigir funções
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contadores can view own rede" ON rede_contadores FOR SELECT
  USING (sponsor_id = get_contador_id(auth.uid()) OR child_id = get_contador_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contadores can view own pagamentos" ON pagamentos FOR SELECT
  USING (cliente_id IN (SELECT id FROM clientes WHERE contador_id = get_contador_id(auth.uid())) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contadores can view own conquistas" ON contador_conquistas FOR SELECT
  USING (contador_id = get_contador_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contadores can view own event participations" ON evento_participantes FOR SELECT
  USING (contador_id = get_contador_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages webhooks" ON webhook_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Corrigir funções com search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;