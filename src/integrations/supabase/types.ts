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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      advertencias: {
        Row: {
          colaborador_id: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          motivo: string
          responsavel: string
          tipo: Database["public"]["Enums"]["advertencia_tipo"]
          unidade: Database["public"]["Enums"]["unidade_tipo"]
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          motivo: string
          responsavel: string
          tipo: Database["public"]["Enums"]["advertencia_tipo"]
          unidade: Database["public"]["Enums"]["unidade_tipo"]
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          motivo?: string
          responsavel?: string
          tipo?: Database["public"]["Enums"]["advertencia_tipo"]
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "advertencias_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          aprovada_em: string | null
          aprovada_por: string | null
          audiencia: Json
          beneficio_esperado: string
          created_at: string
          descricao: string
          id: string
          meeting_id: string
          prazo_sugerido: string | null
          responsavel_sugerido: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          audiencia?: Json
          beneficio_esperado?: string
          created_at?: string
          descricao: string
          id?: string
          meeting_id: string
          prazo_sugerido?: string | null
          responsavel_sugerido?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          audiencia?: Json
          beneficio_esperado?: string
          created_at?: string
          descricao?: string
          id?: string
          meeting_id?: string
          prazo_sugerido?: string | null
          responsavel_sugerido?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "leadership_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          assignment_id: string | null
          created_at: string
          id: string
          marked_at: string
          marked_by: string
          observacao: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          team_member_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          marked_at?: string
          marked_by: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          team_member_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          marked_at?: string
          marked_by?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "shift_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      aviso_reads: {
        Row: {
          aviso_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          aviso_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          aviso_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviso_reads_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          criado_por: string | null
          id: string
          titulo: string
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
          urgente: boolean
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          criado_por?: string | null
          id?: string
          titulo: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          urgente?: boolean
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          titulo?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          urgente?: boolean
        }
        Relationships: []
      }
      checklist_completions: {
        Row: {
          completed_at: string | null
          created_at: string
          data: string
          id: string
          status: Database["public"]["Enums"]["checklist_status"]
          template_id: string
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data?: string
          id?: string
          status?: Database["public"]["Enums"]["checklist_status"]
          template_id: string
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data?: string
          id?: string
          status?: Database["public"]["Enums"]["checklist_status"]
          template_id?: string
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      checklist_item_responses: {
        Row: {
          completed_at: string | null
          completion_id: string
          created_at: string
          foto_url: string | null
          id: string
          item_id: string
          observacao: string | null
          resposta: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_id: string
          created_at?: string
          foto_url?: string | null
          id?: string
          item_id: string
          observacao?: string | null
          resposta?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_id?: string
          created_at?: string
          foto_url?: string | null
          id?: string
          item_id?: string
          observacao?: string | null
          resposta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_responses_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "checklist_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_responses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string
          descricao: string
          id: string
          obrigatorio: boolean
          ordem: number
          requires_photo: boolean
          template_id: string
          tipo_resposta: Database["public"]["Enums"]["checklist_response_type"]
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          obrigatorio?: boolean
          ordem: number
          requires_photo?: boolean
          template_id: string
          tipo_resposta?: Database["public"]["Enums"]["checklist_response_type"]
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          obrigatorio?: boolean
          ordem?: number
          requires_photo?: boolean
          template_id?: string
          tipo_resposta?: Database["public"]["Enums"]["checklist_response_type"]
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          period: Database["public"]["Enums"]["checklist_period"]
          role_target: Database["public"]["Enums"]["checklist_role_target"]
          unit_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          period: Database["public"]["Enums"]["checklist_period"]
          role_target: Database["public"]["Enums"]["checklist_role_target"]
          unit_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          period?: Database["public"]["Enums"]["checklist_period"]
          role_target?: Database["public"]["Enums"]["checklist_role_target"]
          unit_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          created_at: string
          id: string
          matricula: string
          nome: string
          setor: Database["public"]["Enums"]["setor_tipo"]
          status: Database["public"]["Enums"]["colaborador_status"]
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          updated_at: string
        }
        Insert: {
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          created_at?: string
          id?: string
          matricula: string
          nome: string
          setor: Database["public"]["Enums"]["setor_tipo"]
          status?: Database["public"]["Enums"]["colaborador_status"]
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          updated_at?: string
        }
        Update: {
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          created_at?: string
          id?: string
          matricula?: string
          nome?: string
          setor?: Database["public"]["Enums"]["setor_tipo"]
          status?: Database["public"]["Enums"]["colaborador_status"]
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
          updated_at?: string
        }
        Relationships: []
      }
      daily_huddle_reports: {
        Row: {
          author_user_id: string | null
          bo_dia: string
          id: string
          informativos: string
          meta_dia: number | null
          meta_status: string
          observacao: string
          report_date: string
          submitted_at: string
          unit_id: string
          updated_at: string
          venda_dia_anterior: number | null
        }
        Insert: {
          author_user_id?: string | null
          bo_dia?: string
          id?: string
          informativos?: string
          meta_dia?: number | null
          meta_status?: string
          observacao?: string
          report_date: string
          submitted_at?: string
          unit_id: string
          updated_at?: string
          venda_dia_anterior?: number | null
        }
        Update: {
          author_user_id?: string | null
          bo_dia?: string
          id?: string
          informativos?: string
          meta_dia?: number | null
          meta_status?: string
          observacao?: string
          report_date?: string
          submitted_at?: string
          unit_id?: string
          updated_at?: string
          venda_dia_anterior?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_huddle_reports_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_huddle_reports_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_huddle_reports_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      daily_mood: {
        Row: {
          id: string
          note: string | null
          recorded_at: string
          recorded_date: string | null
          score: number | null
          skipped: boolean
          unit_id: string
          user_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          recorded_at?: string
          recorded_date?: string | null
          score?: number | null
          skipped?: boolean
          unit_id: string
          user_id: string
        }
        Update: {
          id?: string
          note?: string | null
          recorded_at?: string
          recorded_date?: string | null
          score?: number | null
          skipped?: boolean
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_mood_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_mood_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      document_approvals: {
        Row: {
          aprovado_por: string | null
          created_at: string
          decidido_em: string | null
          document_id: string
          id: string
          motivo: string | null
          role_required: string
          status: string
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string
          decidido_em?: string | null
          document_id: string
          id?: string
          motivo?: string | null
          role_required: string
          status?: string
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string
          decidido_em?: string | null
          document_id?: string
          id?: string
          motivo?: string | null
          role_required?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          active: boolean
          approval_flow: Json
          categoria: string
          content_template: string
          created_at: string
          descricao: string
          id: string
          required_fields: Json
          titulo: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          approval_flow?: Json
          categoria?: string
          content_template: string
          created_at?: string
          descricao?: string
          id?: string
          required_fields?: Json
          titulo: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          approval_flow?: Json
          categoria?: string
          content_template?: string
          created_at?: string
          descricao?: string
          id?: string
          required_fields?: Json
          titulo?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          colaborador_id: string | null
          criado_em: string
          criado_por: string
          dados_jsonb: Json
          finalizado_em: string | null
          id: string
          motivo_rejeicao: string | null
          pdf_url: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          colaborador_id?: string | null
          criado_em?: string
          criado_por?: string
          dados_jsonb?: Json
          finalizado_em?: string | null
          id?: string
          motivo_rejeicao?: string | null
          pdf_url?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string | null
          criado_em?: string
          criado_por?: string
          dados_jsonb?: Json
          finalizado_em?: string | null
          id?: string
          motivo_rejeicao?: string | null
          pdf_url?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["type"]
          },
        ]
      }
      employee_of_month: {
        Row: {
          anunciado_em: string | null
          checklist_compliance_pct: number
          created_at: string
          id: string
          mes: string
          score_final: number
          team_member_id: string
          total_praises: number
          unit_id: string
        }
        Insert: {
          anunciado_em?: string | null
          checklist_compliance_pct?: number
          created_at?: string
          id?: string
          mes: string
          score_final?: number
          team_member_id: string
          total_praises?: number
          unit_id: string
        }
        Update: {
          anunciado_em?: string | null
          checklist_compliance_pct?: number
          created_at?: string
          id?: string
          mes?: string
          score_final?: number
          team_member_id?: string
          total_praises?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_of_month_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_month_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_month_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      encarregado_evaluations: {
        Row: {
          created_at: string
          criado_em: string
          encarregado_id: string
          gerente_id: string
          id: string
          mes: string
          nota_atendimento: number
          nota_atitude: number
          nota_geral: number
          nota_pontualidade: number
          nota_postura: number
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_em?: string
          encarregado_id: string
          gerente_id: string
          id?: string
          mes: string
          nota_atendimento: number
          nota_atitude: number
          nota_geral?: number
          nota_pontualidade: number
          nota_postura: number
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_em?: string
          encarregado_id?: string
          gerente_id?: string
          id?: string
          mes?: string
          nota_atendimento?: number
          nota_atitude?: number
          nota_geral?: number
          nota_pontualidade?: number
          nota_postura?: number
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encarregado_evaluations_encarregado_id_fkey"
            columns: ["encarregado_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      endomarketing: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          id: string
          tipo: Database["public"]["Enums"]["endomarketing_tipo"]
          titulo: string
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Insert: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo: Database["public"]["Enums"]["endomarketing_tipo"]
          titulo: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo?: Database["public"]["Enums"]["endomarketing_tipo"]
          titulo?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Relationships: []
      }
      galeria: {
        Row: {
          categoria: Database["public"]["Enums"]["galeria_categoria"]
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string
          publicado_por: string | null
          titulo: string
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["galeria_categoria"]
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url: string
          publicado_por?: string | null
          titulo: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["galeria_categoria"]
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string
          publicado_por?: string | null
          titulo?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Relationships: []
      }
      leadership_inspections: {
        Row: {
          created_at: string
          data: string
          fotos: string[]
          id: string
          inspector_id: string
          observacoes_gerais: string | null
          score_atendimento: number
          score_estoque: number
          score_limpeza: number
          score_organizacao: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: string
          fotos?: string[]
          id?: string
          inspector_id: string
          observacoes_gerais?: string | null
          score_atendimento?: number
          score_estoque?: number
          score_limpeza?: number
          score_organizacao?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          fotos?: string[]
          id?: string
          inspector_id?: string
          observacoes_gerais?: string | null
          score_atendimento?: number
          score_estoque?: number
          score_limpeza?: number
          score_organizacao?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_inspections_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_inspections_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      leadership_meetings: {
        Row: {
          agenda: Json
          created_at: string
          created_by: string | null
          decisions: string | null
          ended_at: string | null
          id: string
          is_monthly_in_person: boolean
          minutes: string | null
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          type: Database["public"]["Enums"]["meeting_type"]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          agenda?: Json
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          ended_at?: string | null
          id?: string
          is_monthly_in_person?: boolean
          minutes?: string | null
          scheduled_date?: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
          type: Database["public"]["Enums"]["meeting_type"]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          agenda?: Json
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          ended_at?: string | null
          id?: string
          is_monthly_in_person?: boolean
          minutes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          type?: Database["public"]["Enums"]["meeting_type"]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_meetings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_meetings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      leadership_occurrences: {
        Row: {
          atribuido_a: string | null
          comments_count: number
          created_at: string
          criado_em: string
          custo_estimado: number | null
          descricao: string
          foto_url: string | null
          fotos: string[]
          gravidade: Database["public"]["Enums"]["occurrence_severity"]
          id: string
          motivos: Json
          observacao: string | null
          prazo_desejado: string | null
          reportado_por: string
          resolvido_em: string | null
          setor: string | null
          status: Database["public"]["Enums"]["occurrence_status"]
          tipo: Database["public"]["Enums"]["occurrence_type"]
          titulo: string
          unit_id: string
          updated_at: string
          urgencia: Database["public"]["Enums"]["occurrence_severity"]
        }
        Insert: {
          atribuido_a?: string | null
          comments_count?: number
          created_at?: string
          criado_em?: string
          custo_estimado?: number | null
          descricao: string
          foto_url?: string | null
          fotos?: string[]
          gravidade?: Database["public"]["Enums"]["occurrence_severity"]
          id?: string
          motivos?: Json
          observacao?: string | null
          prazo_desejado?: string | null
          reportado_por: string
          resolvido_em?: string | null
          setor?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          tipo?: Database["public"]["Enums"]["occurrence_type"]
          titulo: string
          unit_id: string
          updated_at?: string
          urgencia?: Database["public"]["Enums"]["occurrence_severity"]
        }
        Update: {
          atribuido_a?: string | null
          comments_count?: number
          created_at?: string
          criado_em?: string
          custo_estimado?: number | null
          descricao?: string
          foto_url?: string | null
          fotos?: string[]
          gravidade?: Database["public"]["Enums"]["occurrence_severity"]
          id?: string
          motivos?: Json
          observacao?: string | null
          prazo_desejado?: string | null
          reportado_por?: string
          resolvido_em?: string | null
          setor?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          tipo?: Database["public"]["Enums"]["occurrence_type"]
          titulo?: string
          unit_id?: string
          updated_at?: string
          urgencia?: Database["public"]["Enums"]["occurrence_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "leadership_occurrences_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_occurrences_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      manager_substitutions: {
        Row: {
          created_at: string
          data: string
          id: string
          manager_user_id: string | null
          reason: string
          substitute_member_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          manager_user_id?: string | null
          reason?: string
          substitute_member_id: string
          unit_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          manager_user_id?: string | null
          reason?: string
          substitute_member_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_substitutions_substitute_member_id_fkey"
            columns: ["substitute_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_substitutions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_substitutions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      meeting_action_items: {
        Row: {
          created_at: string
          descricao: string
          id: string
          meeting_id: string
          minute_id: string | null
          prazo: string | null
          responsavel: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          meeting_id: string
          minute_id?: string | null
          prazo?: string | null
          responsavel?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          meeting_id?: string
          minute_id?: string | null
          prazo?: string | null
          responsavel?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "leadership_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_minute_id_fkey"
            columns: ["minute_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          meeting_id: string
          title: string
          type: Database["public"]["Enums"]["agenda_item_type"]
          unit_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          title: string
          type?: Database["public"]["Enums"]["agenda_item_type"]
          unit_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          title?: string
          type?: Database["public"]["Enums"]["agenda_item_type"]
          unit_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "leadership_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          auto_replaced_by: string | null
          created_at: string
          id: string
          joined_at: string | null
          meeting_id: string
          present: boolean
          role_label: string | null
          user_id: string
        }
        Insert: {
          auto_replaced_by?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          meeting_id: string
          present?: boolean
          role_label?: string | null
          user_id: string
        }
        Update: {
          auto_replaced_by?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          meeting_id?: string
          present?: boolean
          role_label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "leadership_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          action_items: Json
          attention_points: Json
          created_at: string
          decisions: Json
          error_message: string | null
          executive_summary: string | null
          id: string
          meeting_id: string
          processed_at: string | null
          processing_status: string
          recording_file_path: string | null
          recording_url: string | null
          sentiment: string | null
          titulo: string | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          action_items?: Json
          attention_points?: Json
          created_at?: string
          decisions?: Json
          error_message?: string | null
          executive_summary?: string | null
          id?: string
          meeting_id: string
          processed_at?: string | null
          processing_status?: string
          recording_file_path?: string | null
          recording_url?: string | null
          sentiment?: string | null
          titulo?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: Json
          attention_points?: Json
          created_at?: string
          decisions?: Json
          error_message?: string | null
          executive_summary?: string | null
          id?: string
          meeting_id?: string
          processed_at?: string | null
          processing_status?: string
          recording_file_path?: string | null
          recording_url?: string | null
          sentiment?: string | null
          titulo?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "leadership_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_pauta_suggestions: {
        Row: {
          description: string
          id: string
          included_in_meeting_id: string | null
          motivo_rejeicao: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_at: string
          suggested_by: string
          target_meeting_type: Database["public"]["Enums"]["meeting_type"]
          title: string
          unit_id: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          description: string
          id?: string
          included_in_meeting_id?: string | null
          motivo_rejeicao?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_at?: string
          suggested_by: string
          target_meeting_type: Database["public"]["Enums"]["meeting_type"]
          title: string
          unit_id?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          description?: string
          id?: string
          included_in_meeting_id?: string | null
          motivo_rejeicao?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_at?: string
          suggested_by?: string
          target_meeting_type?: Database["public"]["Enums"]["meeting_type"]
          title?: string
          unit_id?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_pauta_suggestions_included_in_meeting_id_fkey"
            columns: ["included_in_meeting_id"]
            isOneToOne: false
            referencedRelation: "leadership_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_pauta_suggestions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_pauta_suggestions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      noticias: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          importante: boolean
          titulo: string
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          importante?: boolean
          titulo: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          importante?: boolean
          titulo?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          body: string
          created_at: string
          id: string
          payload: Json
          recipient_user_id: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_event_type"]
          unit_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          payload?: Json
          recipient_user_id?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_event_type"]
          unit_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          payload?: Json
          recipient_user_id?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_event_type"]
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          general_announcements: boolean
          hr_messages: boolean
          id: string
          important_notices: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          general_announcements?: boolean
          hr_messages?: boolean
          id?: string
          important_notices?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          general_announcements?: boolean
          hr_messages?: boolean
          id?: string
          important_notices?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      occurrence_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          occurrence_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          occurrence_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          occurrence_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_comments_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "leadership_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_reason_modules: {
        Row: {
          reason_key: string
          training_module_id: string | null
          updated_at: string
        }
        Insert: {
          reason_key: string
          training_module_id?: string | null
          updated_at?: string
        }
        Update: {
          reason_key?: string
          training_module_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_reason_modules_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          setor: Database["public"]["Enums"]["setor_tipo"]
          status: Database["public"]["Enums"]["ocorrencia_status"]
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          id?: string
          setor: Database["public"]["Enums"]["setor_tipo"]
          status?: Database["public"]["Enums"]["ocorrencia_status"]
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          setor?: Database["public"]["Enums"]["setor_tipo"]
          status?: Database["public"]["Enums"]["ocorrencia_status"]
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
          updated_at?: string
        }
        Relationships: []
      }
      praise_applause: {
        Row: {
          created_at: string
          id: string
          praise_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          praise_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          praise_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "praise_applause_praise_id_fkey"
            columns: ["praise_id"]
            isOneToOne: false
            referencedRelation: "praises"
            referencedColumns: ["id"]
          },
        ]
      }
      praises: {
        Row: {
          autor_id: string
          categoria: Database["public"]["Enums"]["praise_category"]
          created_at: string
          criado_em: string
          destinatario_id: string
          id: string
          is_demo: boolean
          motivo: string
          publico: boolean
          unit_id: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          categoria?: Database["public"]["Enums"]["praise_category"]
          created_at?: string
          criado_em?: string
          destinatario_id: string
          id?: string
          is_demo?: boolean
          motivo: string
          publico?: boolean
          unit_id: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          categoria?: Database["public"]["Enums"]["praise_category"]
          created_at?: string
          criado_em?: string
          destinatario_id?: string
          id?: string
          is_demo?: boolean
          motivo?: string
          publico?: boolean
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "praises_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "praises_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "praises_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          cargo_titulo: string | null
          created_at: string
          data_admissao: string | null
          descricao: string | null
          email: string
          first_login_at: string | null
          foto_url: string | null
          gerencia: Database["public"]["Enums"]["gerencia_tipo"]
          id: string
          is_test: boolean
          lider_setor_id: string | null
          login_count: number
          must_change_password: boolean
          nome: string
          permission_units: string[]
          role: Database["public"]["Enums"]["cargo_tipo"] | null
          setor: Database["public"]["Enums"]["setor_tipo"] | null
          telefone: string | null
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          unit_id: string | null
          updated_at: string
          user_id: string
          username: string | null
          welcome_banner_dismissed: boolean
        }
        Insert: {
          ativo?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          cargo_titulo?: string | null
          created_at?: string
          data_admissao?: string | null
          descricao?: string | null
          email: string
          first_login_at?: string | null
          foto_url?: string | null
          gerencia?: Database["public"]["Enums"]["gerencia_tipo"]
          id?: string
          is_test?: boolean
          lider_setor_id?: string | null
          login_count?: number
          must_change_password?: boolean
          nome: string
          permission_units?: string[]
          role?: Database["public"]["Enums"]["cargo_tipo"] | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          telefone?: string | null
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          unit_id?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          welcome_banner_dismissed?: boolean
        }
        Update: {
          ativo?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          cargo_titulo?: string | null
          created_at?: string
          data_admissao?: string | null
          descricao?: string | null
          email?: string
          first_login_at?: string | null
          foto_url?: string | null
          gerencia?: Database["public"]["Enums"]["gerencia_tipo"]
          id?: string
          is_test?: boolean
          lider_setor_id?: string | null
          login_count?: number
          must_change_password?: boolean
          nome?: string
          permission_units?: string[]
          role?: Database["public"]["Enums"]["cargo_tipo"] | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          telefone?: string | null
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          welcome_banner_dismissed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_lider_setor_id_fkey"
            columns: ["lider_setor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      pulse_answers: {
        Row: {
          answer_text: string
          answered_at: string
          id: string
          question_id: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          answer_text: string
          answered_at?: string
          id?: string
          question_id: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string
          answered_at?: string
          id?: string
          question_id?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "pulse_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_pulse_aggregate"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "pulse_answers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_answers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      pulse_questions: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          question_text: string
          week_start_date: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          question_text: string
          week_start_date: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          question_text?: string
          week_start_date?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          id: string
          module_id: string
          options: Json
          ordem: number
          question_text: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          id?: string
          module_id: string
          options: Json
          ordem?: number
          question_text: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          id?: string
          module_id?: string
          options?: Json
          ordem?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          created_at: string
          criado_por: string | null
          data: string
          departamento: Database["public"]["Enums"]["setor_tipo"] | null
          descricao: string | null
          duracao_minutos: number
          horario: string
          id: string
          link: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["reuniao_status"]
          tipo: Database["public"]["Enums"]["reuniao_tipo"]
          titulo: string
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data: string
          departamento?: Database["public"]["Enums"]["setor_tipo"] | null
          descricao?: string | null
          duracao_minutos?: number
          horario: string
          id?: string
          link?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["reuniao_status"]
          tipo?: Database["public"]["Enums"]["reuniao_tipo"]
          titulo: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data?: string
          departamento?: Database["public"]["Enums"]["setor_tipo"] | null
          descricao?: string | null
          duracao_minutos?: number
          horario?: string
          id?: string
          link?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["reuniao_status"]
          tipo?: Database["public"]["Enums"]["reuniao_tipo"]
          titulo?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          updated_at?: string
        }
        Relationships: []
      }
      shift_assignments: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          observacao: string | null
          schedule_id: string
          sector: Database["public"]["Enums"]["team_sector"]
          shift_end: string
          shift_start: string
          team_member_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          observacao?: string | null
          schedule_id: string
          sector?: Database["public"]["Enums"]["team_sector"]
          shift_end: string
          shift_start: string
          team_member_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          observacao?: string | null
          schedule_id?: string
          sector?: Database["public"]["Enums"]["team_sector"]
          shift_end?: string
          shift_start?: string
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap_requests: {
        Row: {
          aprovado_por: string | null
          created_at: string
          criado_em: string
          id: string
          motivo: string
          original_assignment_id: string
          requester_id: string
          resolvido_em: string | null
          status: Database["public"]["Enums"]["swap_request_status"]
          target_assignment_id: string | null
          target_member_id: string | null
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string
          criado_em?: string
          id?: string
          motivo: string
          original_assignment_id: string
          requester_id: string
          resolvido_em?: string | null
          status?: Database["public"]["Enums"]["swap_request_status"]
          target_assignment_id?: string | null
          target_member_id?: string | null
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string
          criado_em?: string
          id?: string
          motivo?: string
          original_assignment_id?: string
          requester_id?: string
          resolvido_em?: string | null
          status?: Database["public"]["Enums"]["swap_request_status"]
          target_assignment_id?: string | null
          target_member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_original_assignment_id_fkey"
            columns: ["original_assignment_id"]
            isOneToOne: false
            referencedRelation: "shift_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_assignment_id_fkey"
            columns: ["target_assignment_id"]
            isOneToOne: false
            referencedRelation: "shift_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      suspensoes: {
        Row: {
          colaborador_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          motivo: string
          responsavel: string
          unidade: Database["public"]["Enums"]["unidade_tipo"]
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          motivo: string
          responsavel: string
          unidade: Database["public"]["Enums"]["unidade_tipo"]
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          motivo?: string
          responsavel?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "suspensoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          cargo: string
          created_at: string
          data_admissao: string | null
          descricao: string | null
          foto_url: string | null
          id: string
          idade: number | null
          is_demo: boolean
          is_test: boolean
          nome: string | null
          role: Database["public"]["Enums"]["team_member_role"]
          sector: Database["public"]["Enums"]["team_sector"]
          status: Database["public"]["Enums"]["team_member_status"]
          telefone: string | null
          unit_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cargo?: string
          created_at?: string
          data_admissao?: string | null
          descricao?: string | null
          foto_url?: string | null
          id?: string
          idade?: number | null
          is_demo?: boolean
          is_test?: boolean
          nome?: string | null
          role?: Database["public"]["Enums"]["team_member_role"]
          sector?: Database["public"]["Enums"]["team_sector"]
          status?: Database["public"]["Enums"]["team_member_status"]
          telefone?: string | null
          unit_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cargo?: string
          created_at?: string
          data_admissao?: string | null
          descricao?: string | null
          foto_url?: string | null
          id?: string
          idade?: number | null
          is_demo?: boolean
          is_test?: boolean
          nome?: string | null
          role?: Database["public"]["Enums"]["team_member_role"]
          sector?: Database["public"]["Enums"]["team_sector"]
          status?: Database["public"]["Enums"]["team_member_status"]
          telefone?: string | null
          unit_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      training_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          id: string
          module_id: string
          passed: boolean | null
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          attempted_at?: string
          id?: string
          module_id: string
          passed?: boolean | null
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          attempted_at?: string
          id?: string
          module_id?: string
          passed?: boolean | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_completions: {
        Row: {
          completed_at: string
          id: string
          module_id: string
          score: number
          unit_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          module_id: string
          score: number
          unit_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          module_id?: string
          score?: number
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["training_category"]
          created_at: string
          created_by: string | null
          description: string
          duration_seconds: number
          id: string
          ordem: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["training_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          duration_seconds?: number
          id?: string
          ordem?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["training_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          duration_seconds?: number
          id?: string
          ordem?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          active: boolean
          address: string | null
          code: string
          created_at: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          code: string
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["cargo_tipo"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["cargo_tipo"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["cargo_tipo"]
          user_id?: string
        }
        Relationships: []
      }
      visit_check_ins: {
        Row: {
          check_in_at: string
          check_out_at: string | null
          completion_id: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          observacao: string | null
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_at?: string
          check_out_at?: string | null
          completion_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_at?: string
          check_out_at?: string | null
          completion_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_check_ins_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "checklist_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_check_ins_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_check_ins_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          created_at: string
          created_by: string
          id: string
          status: Database["public"]["Enums"]["schedule_status"]
          unit_id: string
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          unit_id: string
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          unit_id?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
    }
    Views: {
      v_mood_aggregate: {
        Row: {
          avg_score: number | null
          day: string | null
          responses: number | null
          setor: string | null
          skips: number | null
          unit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_mood_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_mood_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      v_pulse_aggregate: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          question_id: string | null
          question_text: string | null
          unit_id: string | null
          week_start_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pulse_answers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_answers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      v_unit_checklist_progress: {
        Row: {
          data: string | null
          done_items: number | null
          pct: number | null
          total_items: number | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_review_document_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      can_view_climate: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_document: {
        Args: { _document_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_team_member: {
        Args: { _member_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_departamento: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["setor_tipo"]
      }
      get_user_unidade: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["unidade_tipo"]
      }
      get_user_unit_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["cargo_tipo"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_login_count: { Args: { _user_id: string }; Returns: number }
      is_central_adm_area: {
        Args: { _area: string; _user_id: string }
        Returns: boolean
      }
      is_leadership: { Args: { _user_id: string }; Returns: boolean }
      is_rh_admin: { Args: { _user_id: string }; Returns: boolean }
      is_unit_manager: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      profile_matches_occurrence_reason: {
        Args: { _motivos: Json; _unit_id: string; _user_id: string }
        Returns: boolean
      }
      submit_quiz: {
        Args: { _answers: Json; _module_id: string }
        Returns: Json
      }
      user_can_access_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      advertencia_tipo: "verbal" | "escrita"
      agenda_item_type:
        | "bo"
        | "informativo"
        | "venda"
        | "meta"
        | "performance"
        | "quebra"
        | "livre"
        | "convidado"
        | "decisao"
      attendance_status: "presente" | "falta" | "atraso"
      cargo_tipo:
        | "master"
        | "admin"
        | "supervisor"
        | "gerente"
        | "gerente_loja"
        | "gerente_adm"
        | "encarregado"
        | "fiscal"
        | "lider_setor"
        | "colaborador"
      checklist_period:
        | "abertura"
        | "durante"
        | "fechamento"
        | "producao_dia"
        | "operacao_cd"
        | "visita_supervisor"
      checklist_response_type: "sim_nao" | "texto" | "foto" | "escala"
      checklist_role_target: "gerente" | "encarregado"
      checklist_status: "pendente" | "parcial" | "completo"
      colaborador_status: "ativo" | "inativo" | "ferias" | "afastado"
      endomarketing_tipo: "aniversario" | "destaque" | "campanha" | "mensagem"
      galeria_categoria:
        | "equipe"
        | "eventos"
        | "campanhas"
        | "loja"
        | "destaques"
      gerencia_tipo:
        | "FINANCEIRO"
        | "RECURSOS_HUMANOS"
        | "DEPARTAMENTO_PESSOAL"
        | "MARKETING"
        | "TI"
        | "OPERACAO"
        | "CENTRAL_PRODUCAO"
        | "CD"
        | "MANUTENCAO"
      meeting_status: "agendada" | "em_andamento" | "encerrada" | "cancelada"
      meeting_type: "diaria" | "semanal" | "individual"
      notification_event_type:
        | "meeting_reminder"
        | "checklist_pending"
        | "checklist_closing"
        | "high_occurrence"
        | "weekly_report"
        | "meeting_minutes"
      occurrence_severity: "baixa" | "media" | "alta"
      occurrence_status: "aberto" | "em_tratamento" | "resolvido"
      occurrence_type:
        | "atendimento"
        | "quebra"
        | "manutencao"
        | "disciplina"
        | "outro"
      ocorrencia_status: "aberta" | "em_andamento" | "concluida"
      praise_category:
        | "atendimento"
        | "equipe"
        | "iniciativa"
        | "melhoria"
        | "outro"
      reuniao_status: "agendada" | "em_andamento" | "finalizada" | "cancelada"
      reuniao_tipo: "online" | "presencial" | "hibrida"
      schedule_status: "rascunho" | "publicada"
      setor_tipo:
        | "acougue"
        | "padaria"
        | "hortifruti"
        | "mercearia"
        | "frente_de_caixa"
        | "deposito"
      swap_request_status: "pendente" | "aprovada" | "rejeitada"
      team_member_role: "gerente" | "encarregado" | "colaborador"
      team_member_status: "ativo" | "ferias" | "afastado" | "desligado"
      team_sector:
        | "acougue"
        | "padaria"
        | "hortifruti"
        | "mercearia"
        | "frente_caixa"
        | "deposito"
        | "geral"
      training_category:
        | "atendimento"
        | "flv"
        | "padaria"
        | "acougue"
        | "seguranca_alimentar"
        | "codigo_etica"
        | "outros"
      unidade_tipo:
        | "CIDADE ALTA"
        | "GOIABEIRAS"
        | "JARDIM CUIABÁ"
        | "CPA"
        | "CENTRAL PRODUÇÃO"
        | "CD"
      unit_type: "loja" | "central"
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
      advertencia_tipo: ["verbal", "escrita"],
      agenda_item_type: [
        "bo",
        "informativo",
        "venda",
        "meta",
        "performance",
        "quebra",
        "livre",
        "convidado",
        "decisao",
      ],
      attendance_status: ["presente", "falta", "atraso"],
      cargo_tipo: [
        "master",
        "admin",
        "supervisor",
        "gerente",
        "gerente_loja",
        "gerente_adm",
        "encarregado",
        "fiscal",
        "lider_setor",
        "colaborador",
      ],
      checklist_period: [
        "abertura",
        "durante",
        "fechamento",
        "producao_dia",
        "operacao_cd",
        "visita_supervisor",
      ],
      checklist_response_type: ["sim_nao", "texto", "foto", "escala"],
      checklist_role_target: ["gerente", "encarregado"],
      checklist_status: ["pendente", "parcial", "completo"],
      colaborador_status: ["ativo", "inativo", "ferias", "afastado"],
      endomarketing_tipo: ["aniversario", "destaque", "campanha", "mensagem"],
      galeria_categoria: [
        "equipe",
        "eventos",
        "campanhas",
        "loja",
        "destaques",
      ],
      gerencia_tipo: [
        "FINANCEIRO",
        "RECURSOS_HUMANOS",
        "DEPARTAMENTO_PESSOAL",
        "MARKETING",
        "TI",
        "OPERACAO",
        "CENTRAL_PRODUCAO",
        "CD",
        "MANUTENCAO",
      ],
      meeting_status: ["agendada", "em_andamento", "encerrada", "cancelada"],
      meeting_type: ["diaria", "semanal", "individual"],
      notification_event_type: [
        "meeting_reminder",
        "checklist_pending",
        "checklist_closing",
        "high_occurrence",
        "weekly_report",
        "meeting_minutes",
      ],
      occurrence_severity: ["baixa", "media", "alta"],
      occurrence_status: ["aberto", "em_tratamento", "resolvido"],
      occurrence_type: [
        "atendimento",
        "quebra",
        "manutencao",
        "disciplina",
        "outro",
      ],
      ocorrencia_status: ["aberta", "em_andamento", "concluida"],
      praise_category: [
        "atendimento",
        "equipe",
        "iniciativa",
        "melhoria",
        "outro",
      ],
      reuniao_status: ["agendada", "em_andamento", "finalizada", "cancelada"],
      reuniao_tipo: ["online", "presencial", "hibrida"],
      schedule_status: ["rascunho", "publicada"],
      setor_tipo: [
        "acougue",
        "padaria",
        "hortifruti",
        "mercearia",
        "frente_de_caixa",
        "deposito",
      ],
      swap_request_status: ["pendente", "aprovada", "rejeitada"],
      team_member_role: ["gerente", "encarregado", "colaborador"],
      team_member_status: ["ativo", "ferias", "afastado", "desligado"],
      team_sector: [
        "acougue",
        "padaria",
        "hortifruti",
        "mercearia",
        "frente_caixa",
        "deposito",
        "geral",
      ],
      training_category: [
        "atendimento",
        "flv",
        "padaria",
        "acougue",
        "seguranca_alimentar",
        "codigo_etica",
        "outros",
      ],
      unidade_tipo: [
        "CIDADE ALTA",
        "GOIABEIRAS",
        "JARDIM CUIABÁ",
        "CPA",
        "CENTRAL PRODUÇÃO",
        "CD",
      ],
      unit_type: ["loja", "central"],
    },
  },
} as const
