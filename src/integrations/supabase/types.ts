export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assistente_logs: {
        Row: {
          contador_id: string | null
          created_at: string | null
          id: string
          mensagem_usuario: string
          resposta_assistente: string | null
        }
        Insert: {
          contador_id?: string | null
          created_at?: string | null
          id?: string
          mensagem_usuario: string
          resposta_assistente?: string | null
        }
        Update: {
          contador_id?: string | null
          created_at?: string | null
          id?: string
          mensagem_usuario?: string
          resposta_assistente?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistente_logs_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string
          created_at: string | null
          id: string
          ip_address: unknown
          payload: Json | null
          registro_id: string | null
          tabela: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          payload?: Json | null
          registro_id?: string | null
          tabela?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          payload?: Json | null
          registro_id?: string | null
          tabela?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      click_logs: {
        Row: {
          contador_id: string
          created_at: string | null
          id: string
          ip: unknown
          link_id: string
          user_agent: string | null
        }
        Insert: {
          contador_id: string
          created_at?: string | null
          id?: string
          ip?: unknown
          link_id: string
          user_agent?: string | null
        }
        Update: {
          contador_id?: string
          created_at?: string | null
          id?: string
          ip?: unknown
          link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "click_logs_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "click_logs_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "click_logs_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "vw_links_desempenho"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          cnpj: string
          contador_id: string
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          data_ativacao: string | null
          data_cancelamento: string | null
          id: string
          indicacao_id: string | null
          nome_empresa: string
          plano: Database["public"]["Enums"]["tipo_plano"]
          status: Database["public"]["Enums"]["status_cliente"] | null
          updated_at: string | null
          valor_mensal: number
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          cnpj: string
          contador_id: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          data_ativacao?: string | null
          data_cancelamento?: string | null
          id?: string
          indicacao_id?: string | null
          nome_empresa: string
          plano: Database["public"]["Enums"]["tipo_plano"]
          status?: Database["public"]["Enums"]["status_cliente"] | null
          updated_at?: string | null
          valor_mensal: number
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          cnpj?: string
          contador_id?: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          data_ativacao?: string | null
          data_cancelamento?: string | null
          id?: string
          indicacao_id?: string | null
          nome_empresa?: string
          plano?: Database["public"]["Enums"]["tipo_plano"]
          status?: Database["public"]["Enums"]["status_cliente"] | null
          updated_at?: string | null
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "clientes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          cliente_id: string | null
          competencia: string
          contador_id: string
          created_at: string | null
          id: string
          observacao: string | null
          pagamento_id: string | null
          pago_em: string | null
          percentual: number | null
          status: Database["public"]["Enums"]["status_comissao"] | null
          tipo: Database["public"]["Enums"]["tipo_comissao"]
          updated_at: string | null
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          competencia: string
          contador_id: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          pagamento_id?: string | null
          pago_em?: string | null
          percentual?: number | null
          status?: Database["public"]["Enums"]["status_comissao"] | null
          tipo: Database["public"]["Enums"]["tipo_comissao"]
          updated_at?: string | null
          valor: number
        }
        Update: {
          cliente_id?: string | null
          competencia?: string
          contador_id?: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          pagamento_id?: string | null
          pago_em?: string | null
          percentual?: number | null
          status?: Database["public"]["Enums"]["status_comissao"] | null
          tipo?: Database["public"]["Enums"]["tipo_comissao"]
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_status_historico: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          comissao_id: string
          id: string
          ip_address: unknown
          motivo: string
          status_anterior: string | null
          status_novo: string
          user_agent: string | null
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          comissao_id: string
          id?: string
          ip_address?: unknown
          motivo: string
          status_anterior?: string | null
          status_novo: string
          user_agent?: string | null
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          comissao_id?: string
          id?: string
          ip_address?: unknown
          motivo?: string
          status_anterior?: string | null
          status_novo?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_status_historico_comissao_id_fkey"
            columns: ["comissao_id"]
            isOneToOne: false
            referencedRelation: "comissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conquistas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          icone_url: string | null
          id: string
          nome: string
          requisito_clientes: number | null
          requisito_xp: number | null
          tipo: string | null
          valor_bonus: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone_url?: string | null
          id?: string
          nome: string
          requisito_clientes?: number | null
          requisito_xp?: number | null
          tipo?: string | null
          valor_bonus?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone_url?: string | null
          id?: string
          nome?: string
          requisito_clientes?: number | null
          requisito_xp?: number | null
          tipo?: string | null
          valor_bonus?: number | null
        }
        Relationships: []
      }
      contador_conquistas: {
        Row: {
          conquista_id: string
          contador_id: string
          desbloqueado_em: string | null
          id: string
        }
        Insert: {
          conquista_id: string
          contador_id: string
          desbloqueado_em?: string | null
          id?: string
        }
        Update: {
          conquista_id?: string
          contador_id?: string
          desbloqueado_em?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contador_conquistas_conquista_id_fkey"
            columns: ["conquista_id"]
            isOneToOne: false
            referencedRelation: "conquistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contador_conquistas_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      contadores: {
        Row: {
          chave_pix: string | null
          clientes_ativos: number | null
          crc: string | null
          created_at: string | null
          data_ingresso: string | null
          id: string
          nivel: Database["public"]["Enums"]["nivel_contador"] | null
          status: Database["public"]["Enums"]["status_contador"] | null
          ultima_ativacao: string | null
          updated_at: string | null
          user_id: string
          xp: number | null
        }
        Insert: {
          chave_pix?: string | null
          clientes_ativos?: number | null
          crc?: string | null
          created_at?: string | null
          data_ingresso?: string | null
          id?: string
          nivel?: Database["public"]["Enums"]["nivel_contador"] | null
          status?: Database["public"]["Enums"]["status_contador"] | null
          ultima_ativacao?: string | null
          updated_at?: string | null
          user_id: string
          xp?: number | null
        }
        Update: {
          chave_pix?: string | null
          clientes_ativos?: number | null
          crc?: string | null
          created_at?: string | null
          data_ingresso?: string | null
          id?: string
          nivel?: Database["public"]["Enums"]["nivel_contador"] | null
          status?: Database["public"]["Enums"]["status_contador"] | null
          ultima_ativacao?: string | null
          updated_at?: string | null
          user_id?: string
          xp?: number | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          ativo: boolean
          created_at: string | null
          duracao: number | null
          id: string
          nivel: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          duracao?: number | null
          id?: string
          nivel?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          duracao?: number | null
          id?: string
          nivel?: string | null
          titulo?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          certificado_url: string | null
          contador_id: string
          course_id: string
          created_at: string | null
          id: string
          progresso: number
          status: string
        }
        Insert: {
          certificado_url?: string | null
          contador_id: string
          course_id: string
          created_at?: string | null
          id?: string
          progresso?: number
          status?: string
        }
        Update: {
          certificado_url?: string | null
          contador_id?: string
          course_id?: string
          created_at?: string | null
          id?: string
          progresso?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_participantes: {
        Row: {
          check_in_em: string | null
          contador_id: string
          evento_id: string
          id: string
          xp_ganho: number | null
        }
        Insert: {
          check_in_em?: string | null
          contador_id: string
          evento_id: string
          id?: string
          xp_ganho?: number | null
        }
        Update: {
          check_in_em?: string | null
          contador_id?: string
          evento_id?: string
          id?: string
          xp_ganho?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_participantes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_participantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_evento: string
          descricao: string | null
          id: string
          local: string | null
          nivel_minimo: Database["public"]["Enums"]["nivel_contador"] | null
          qr_code_check_in: string | null
          titulo: string
          vagas: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_evento: string
          descricao?: string | null
          id?: string
          local?: string | null
          nivel_minimo?: Database["public"]["Enums"]["nivel_contador"] | null
          qr_code_check_in?: string | null
          titulo: string
          vagas?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_evento?: string
          descricao?: string | null
          id?: string
          local?: string | null
          nivel_minimo?: Database["public"]["Enums"]["nivel_contador"] | null
          qr_code_check_in?: string | null
          titulo?: string
          vagas?: number | null
        }
        Relationships: []
      }
      indicacoes: {
        Row: {
          cliente_id: string | null
          contador_id: string
          contador_indicado_id: string | null
          convertido_em: string | null
          created_at: string | null
          id: string
          invite_id: string | null
          ip_address: unknown
          origem: string | null
          status: Database["public"]["Enums"]["status_indicacao"] | null
          user_agent: string | null
        }
        Insert: {
          cliente_id?: string | null
          contador_id: string
          contador_indicado_id?: string | null
          convertido_em?: string | null
          created_at?: string | null
          id?: string
          invite_id?: string | null
          ip_address?: unknown
          origem?: string | null
          status?: Database["public"]["Enums"]["status_indicacao"] | null
          user_agent?: string | null
        }
        Update: {
          cliente_id?: string | null
          contador_id?: string
          contador_indicado_id?: string | null
          convertido_em?: string | null
          created_at?: string | null
          id?: string
          invite_id?: string | null
          ip_address?: unknown
          origem?: string | null
          status?: Database["public"]["Enums"]["status_indicacao"] | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_contador_indicado_id_fkey"
            columns: ["contador_indicado_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string | null
          emissor_id: string
          expira_em: string
          flow: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["status_indicacao"] | null
          tipo: Database["public"]["Enums"]["tipo_indicacao"]
          token: string
          usado_em: string | null
          usado_por: string | null
        }
        Insert: {
          created_at?: string | null
          emissor_id: string
          expira_em: string
          flow?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["status_indicacao"] | null
          tipo: Database["public"]["Enums"]["tipo_indicacao"]
          token: string
          usado_em?: string | null
          usado_por?: string | null
        }
        Update: {
          created_at?: string | null
          emissor_id?: string
          expira_em?: string
          flow?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["status_indicacao"] | null
          tipo?: Database["public"]["Enums"]["tipo_indicacao"]
          token?: string
          usado_em?: string | null
          usado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_requests: {
        Row: {
          created_at: string | null
          dados_exportados: Json | null
          id: string
          processado_em: string | null
          status: string | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dados_exportados?: Json | null
          id?: string
          processado_em?: string | null
          status?: string | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dados_exportados?: Json | null
          id?: string
          processado_em?: string | null
          status?: string | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          canal: Database["public"]["Enums"]["link_channel"]
          cliques: number
          contador_id: string
          conversoes: number
          created_at: string | null
          id: string
          target_url: string | null
          tipo: Database["public"]["Enums"]["link_type"]
          token: string
        }
        Insert: {
          canal?: Database["public"]["Enums"]["link_channel"]
          cliques?: number
          contador_id: string
          conversoes?: number
          created_at?: string | null
          id?: string
          target_url?: string | null
          tipo: Database["public"]["Enums"]["link_type"]
          token: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["link_channel"]
          cliques?: number
          contador_id?: string
          conversoes?: number
          created_at?: string | null
          id?: string
          target_url?: string | null
          tipo?: Database["public"]["Enums"]["link_type"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          categoria: string | null
          created_at: string | null
          downloads: number
          id: string
          owner_id: string | null
          publico: boolean
          tags: string[] | null
          tipo: Database["public"]["Enums"]["material_tipo"]
          titulo: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          downloads?: number
          id?: string
          owner_id?: string | null
          publico?: boolean
          tags?: string[] | null
          tipo: Database["public"]["Enums"]["material_tipo"]
          titulo: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          downloads?: number
          id?: string
          owner_id?: string | null
          publico?: boolean
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["material_tipo"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          contador_id: string
          created_at: string | null
          id: string
          lida: boolean | null
          lida_em: string | null
          mensagem: string
          payload: Json | null
          tipo: string
          titulo: string
        }
        Insert: {
          contador_id: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          mensagem: string
          payload?: Json | null
          tipo: string
          titulo: string
        }
        Update: {
          contador_id?: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          mensagem?: string
          payload?: Json | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          asaas_event_id: string | null
          asaas_payment_id: string | null
          cashback: number | null
          cliente_id: string
          competencia: string
          created_at: string | null
          id: string
          pago_em: string | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          tipo: Database["public"]["Enums"]["tipo_pagamento"]
          updated_at: string | null
          valor_bruto: number
          valor_liquido: number
        }
        Insert: {
          asaas_event_id?: string | null
          asaas_payment_id?: string | null
          cashback?: number | null
          cliente_id: string
          competencia: string
          created_at?: string | null
          id?: string
          pago_em?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          tipo: Database["public"]["Enums"]["tipo_pagamento"]
          updated_at?: string | null
          valor_bruto: number
          valor_liquido: number
        }
        Update: {
          asaas_event_id?: string | null
          asaas_payment_id?: string | null
          cashback?: number | null
          cliente_id?: string
          competencia?: string
          created_at?: string | null
          id?: string
          pago_em?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          tipo?: Database["public"]["Enums"]["tipo_pagamento"]
          updated_at?: string | null
          valor_bruto?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aceite_notificacoes: boolean | null
          aceite_termos: boolean | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string
          fcm_token: string | null
          foto_url: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          aceite_notificacoes?: boolean | null
          aceite_termos?: boolean | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email: string
          fcm_token?: string | null
          foto_url?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          aceite_notificacoes?: boolean | null
          aceite_termos?: boolean | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string
          fcm_token?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reconciliacoes: {
        Row: {
          competencia: string
          created_at: string | null
          diferenca: number | null
          id: string
          observacoes: string | null
          payload_asaas: Json | null
          reconciliado_em: string | null
          reconciliado_por: string | null
          status: string | null
          total_asaas: number
          total_banco: number
        }
        Insert: {
          competencia: string
          created_at?: string | null
          diferenca?: number | null
          id?: string
          observacoes?: string | null
          payload_asaas?: Json | null
          reconciliado_em?: string | null
          reconciliado_por?: string | null
          status?: string | null
          total_asaas: number
          total_banco: number
        }
        Update: {
          competencia?: string
          created_at?: string | null
          diferenca?: number | null
          id?: string
          observacoes?: string | null
          payload_asaas?: Json | null
          reconciliado_em?: string | null
          reconciliado_por?: string | null
          status?: string | null
          total_asaas?: number
          total_banco?: number
        }
        Relationships: []
      }
      rede_contadores: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          nivel_rede: number | null
          sponsor_id: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          nivel_rede?: number | null
          sponsor_id: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          nivel_rede?: number | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rede_contadores_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rede_contadores_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacoes: {
        Row: {
          clientes_mes: number
          clientes_por_contador: number
          contador_id: string
          contadores_mes: number
          created_at: string | null
          id: string
          resultado_conservador: number
          resultado_otimista: number
          resultado_realista: number
          valor_mensalidade: number
        }
        Insert: {
          clientes_mes?: number
          clientes_por_contador?: number
          contador_id: string
          contadores_mes?: number
          created_at?: string | null
          id?: string
          resultado_conservador?: number
          resultado_otimista?: number
          resultado_realista?: number
          valor_mensalidade?: number
        }
        Update: {
          clientes_mes?: number
          clientes_por_contador?: number
          contador_id?: string
          contadores_mes?: number
          created_at?: string | null
          id?: string
          resultado_conservador?: number
          resultado_otimista?: number
          resultado_realista?: number
          valor_mensalidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          erro: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processado: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          erro?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processado?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          erro?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processado?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      cursos_edu: {
        Row: {
          certificado_url: string | null
          contador_id: string | null
          duracao: number | null
          id: string | null
          nivel: string | null
          progresso: number | null
          status: string | null
          titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_links_desempenho: {
        Row: {
          canal: Database["public"]["Enums"]["link_channel"] | null
          cliques: number | null
          contador_id: string | null
          conversoes: number | null
          created_at: string | null
          id: string | null
          taxa: number | null
          tipo: Database["public"]["Enums"]["link_type"] | null
          token: string | null
        }
        Insert: {
          canal?: Database["public"]["Enums"]["link_channel"] | null
          cliques?: number | null
          contador_id?: string | null
          conversoes?: number | null
          created_at?: string | null
          id?: string | null
          taxa?: never
          tipo?: Database["public"]["Enums"]["link_type"] | null
          token?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["link_channel"] | null
          cliques?: number | null
          contador_id?: string | null
          conversoes?: number | null
          created_at?: string | null
          id?: string | null
          taxa?: never
          tipo?: Database["public"]["Enums"]["link_type"] | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrypt_sensitive: { Args: { encrypted: string }; Returns: string }
      encrypt_sensitive: { Args: { data: string }; Returns: string }
      get_contador_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_clique: {
        Args: { p_token: string }
        Returns: {
          contador_id: string
          link_id: string
          redirect: string
          tipo: Database["public"]["Enums"]["link_type"]
        }[]
      }
      sanitize_audit_payload: { Args: { raw_payload: Json }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "contador" | "suporte"
      cliente_status: "lead" | "ativo" | "inativo" | "cancelado"
      commission_status:
        | "calculada"
        | "aprovada"
        | "paga"
        | "estornada"
        | "cancelada"
      commission_type: "direta" | "indireta_n1" | "indireta_n2" | "bonus"
      link_channel: "whatsapp" | "email" | "linkedin" | "outros"
      link_type: "cliente" | "contador"
      material_tipo: "pdf" | "xlsx" | "pptx" | "mp4" | "docx"
      nivel_contador: "bronze" | "prata" | "ouro" | "diamante"
      payment_status:
        | "pending"
        | "confirmed"
        | "failed"
        | "refunded"
        | "chargeback"
      payment_type: "ativacao" | "recorrente"
      status_cliente: "lead" | "ativo" | "cancelado" | "inadimplente"
      status_comissao: "calculada" | "aprovada" | "paga" | "cancelada"
      status_contador: "ativo" | "inativo" | "tier_1" | "tier_2" | "tier_3"
      status_indicacao: "clique" | "cadastro" | "convertido" | "expirado"
      status_pagamento: "pendente" | "pago" | "cancelado" | "estornado"
      tipo_comissao:
        | "ativacao"
        | "recorrente"
        | "override"
        | "bonus_progressao"
        | "bonus_ltv"
        | "bonus_rede"
        | "lead_diamante"
      tipo_indicacao: "cliente" | "contador"
      tipo_pagamento: "ativacao" | "recorrente"
      tipo_plano: "basico" | "profissional" | "premium" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "contador", "suporte"],
      cliente_status: ["lead", "ativo", "inativo", "cancelado"],
      commission_status: [
        "calculada",
        "aprovada",
        "paga",
        "estornada",
        "cancelada",
      ],
      commission_type: ["direta", "indireta_n1", "indireta_n2", "bonus"],
      link_channel: ["whatsapp", "email", "linkedin", "outros"],
      link_type: ["cliente", "contador"],
      material_tipo: ["pdf", "xlsx", "pptx", "mp4", "docx"],
      nivel_contador: ["bronze", "prata", "ouro", "diamante"],
      payment_status: [
        "pending",
        "confirmed",
        "failed",
        "refunded",
        "chargeback",
      ],
      payment_type: ["ativacao", "recorrente"],
      status_cliente: ["lead", "ativo", "cancelado", "inadimplente"],
      status_comissao: ["calculada", "aprovada", "paga", "cancelada"],
      status_contador: ["ativo", "inativo", "tier_1", "tier_2", "tier_3"],
      status_indicacao: ["clique", "cadastro", "convertido", "expirado"],
      status_pagamento: ["pendente", "pago", "cancelado", "estornado"],
      tipo_comissao: [
        "ativacao",
        "recorrente",
        "override",
        "bonus_progressao",
        "bonus_ltv",
        "bonus_rede",
        "lead_diamante",
      ],
      tipo_indicacao: ["cliente", "contador"],
      tipo_pagamento: ["ativacao", "recorrente"],
      tipo_plano: ["basico", "profissional", "premium", "enterprise"],
    },
  },
} as const
