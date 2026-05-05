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
      achievements: {
        Row: {
          active: boolean
          category: string
          code: string
          created_at: string
          criteria_metric: string
          criteria_target: number | null
          criteria_type: string
          description: string
          icon: string | null
          id: string
          name: string
          ordem: number
          role_filter: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          created_at?: string
          criteria_metric: string
          criteria_target?: number | null
          criteria_type: string
          description: string
          icon?: string | null
          id?: string
          name: string
          ordem?: number
          role_filter?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          created_at?: string
          criteria_metric?: string
          criteria_target?: number | null
          criteria_type?: string
          description?: string
          icon?: string | null
          id?: string
          name?: string
          ordem?: number
          role_filter?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
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
      app_secrets: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
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
      aviso_comments: {
        Row: {
          aviso_id: string
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          parent_comment_id: string | null
          user_id: string
        }
        Insert: {
          aviso_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          user_id: string
        }
        Update: {
          aviso_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviso_comments_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aviso_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "aviso_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      aviso_reactions: {
        Row: {
          aviso_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          aviso_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          aviso_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviso_reactions_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
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
      birthday_messages: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message_text: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message_text?: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message_text?: string
          to_user_id?: string
        }
        Relationships: []
      }
      bulk_import_log: {
        Row: {
          details: Json | null
          failed: number | null
          file_name: string | null
          id: string
          performed_at: string
          performed_by: string | null
          successful: number | null
          total_rows: number | null
          updated: number | null
        }
        Insert: {
          details?: Json | null
          failed?: number | null
          file_name?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          successful?: number | null
          total_rows?: number | null
          updated?: number | null
        }
        Update: {
          details?: Json | null
          failed?: number | null
          file_name?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          successful?: number | null
          total_rows?: number | null
          updated?: number | null
        }
        Relationships: []
      }
      chat_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target_message_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_message_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_message_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          last_message_at: string
          last_message_preview: string | null
          name: string | null
          setor: string | null
          type: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_message_at?: string
          last_message_preview?: string | null
          name?: string | null
          setor?: string | null
          type: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_message_at?: string
          last_message_preview?: string | null
          name?: string | null
          setor?: string | null
          type?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "chat_conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reason: string | null
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reason?: string | null
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reason?: string | null
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          author_user_id: string | null
          content: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          forwarded_from_message_id: string | null
          id: string
          media_duration_sec: number | null
          media_type: string | null
          media_url: string | null
          pinned: boolean
          reply_to_message_id: string | null
        }
        Insert: {
          author_user_id?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          media_duration_sec?: number | null
          media_type?: string | null
          media_url?: string | null
          pinned?: boolean
          reply_to_message_id?: string | null
        }
        Update: {
          author_user_id?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          media_duration_sec?: number | null
          media_type?: string | null
          media_url?: string | null
          pinned?: boolean
          reply_to_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          archived: boolean
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          muted: boolean
          role: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          role?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "checklist_completions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["template_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
          {
            foreignKeyName: "checklist_item_responses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["item_id"]
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
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["template_id"]
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
      churn_risk_signals: {
        Row: {
          calculated_at: string
          created_at: string
          gerente_notified_at: string | null
          id: string
          recommended_action: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          rh_escalated_at: string | null
          risk_score: number
          signals: Json
          status: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          gerente_notified_at?: string | null
          id?: string
          recommended_action?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rh_escalated_at?: string | null
          risk_score: number
          signals?: Json
          status?: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          gerente_notified_at?: string | null
          id?: string
          recommended_action?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rh_escalated_at?: string | null
          risk_score?: number
          signals?: Json
          status?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_risk_signals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_risk_signals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "churn_risk_signals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
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
      coverage_invites: {
        Row: {
          created_at: string
          id: string
          invitee_user_id: string
          request_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_user_id: string
          request_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_user_id?: string
          request_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_invites_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_invites_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "coverage_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_requests: {
        Row: {
          accepted_by_user_id: string | null
          created_at: string
          id: string
          message: string | null
          reminded_at: string | null
          requester_gerente_id: string
          requester_unit_id: string
          setor: string | null
          status: string
          target_date: string
          target_shift_end: string
          target_shift_start: string
          updated_at: string
          urgency: string
        }
        Insert: {
          accepted_by_user_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          reminded_at?: string | null
          requester_gerente_id: string
          requester_unit_id: string
          setor?: string | null
          status?: string
          target_date: string
          target_shift_end: string
          target_shift_start: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          accepted_by_user_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          reminded_at?: string | null
          requester_gerente_id?: string
          requester_unit_id?: string
          setor?: string | null
          status?: string
          target_date?: string
          target_shift_end?: string
          target_shift_start?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_requests_accepted_by_user_id_fkey"
            columns: ["accepted_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_requests_requester_gerente_id_fkey"
            columns: ["requester_gerente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_requests_requester_unit_id_fkey"
            columns: ["requester_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_requests_requester_unit_id_fkey"
            columns: ["requester_unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "coverage_requests_requester_unit_id_fkey"
            columns: ["requester_unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      culture_pill_likes: {
        Row: {
          id: string
          liked_at: string
          pill_id: string
          user_id: string
        }
        Insert: {
          id?: string
          liked_at?: string
          pill_id: string
          user_id: string
        }
        Update: {
          id?: string
          liked_at?: string
          pill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_pill_likes_pill_id_fkey"
            columns: ["pill_id"]
            isOneToOne: false
            referencedRelation: "culture_pills"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_pills: {
        Row: {
          active: boolean
          content: string
          created_at: string
          created_by: string | null
          display_date: string
          id: string
          image_url: string | null
          link_url: string | null
          title: string
          updated_at: string
          value_id: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          created_by?: string | null
          display_date: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          title: string
          updated_at?: string
          value_id: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          created_by?: string | null
          display_date?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
          value_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_pills_value_id_fkey"
            columns: ["value_id"]
            isOneToOne: false
            referencedRelation: "culture_values"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_values: {
        Row: {
          active: boolean
          code: string
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          ordem: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      curio_messages: {
        Row: {
          active: boolean
          code: string
          context: string
          created_at: string
          id: string
          message: string
          priority: number
          role_target: string[] | null
          tone: string
        }
        Insert: {
          active?: boolean
          code: string
          context: string
          created_at?: string
          id?: string
          message: string
          priority?: number
          role_target?: string[] | null
          tone?: string
        }
        Update: {
          active?: boolean
          code?: string
          context?: string
          created_at?: string
          id?: string
          message?: string
          priority?: number
          role_target?: string[] | null
          tone?: string
        }
        Relationships: []
      }
      curio_stories: {
        Row: {
          author_user_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          published_at: string | null
          status: string
          title: string
          updated_at: string
          value_id: string | null
        }
        Insert: {
          author_user_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
          value_id?: string | null
        }
        Update: {
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          value_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curio_stories_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_stories_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_stories_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_stories_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_stories_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_stories_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_stories_value_id_fkey"
            columns: ["value_id"]
            isOneToOne: false
            referencedRelation: "culture_values"
            referencedColumns: ["id"]
          },
        ]
      }
      curio_story_likes: {
        Row: {
          id: string
          liked_at: string
          story_id: string
          user_id: string
        }
        Insert: {
          id?: string
          liked_at?: string
          story_id: string
          user_id: string
        }
        Update: {
          id?: string
          liked_at?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curio_story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "curio_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curio_story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curio_story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
      }
      curiozinho_briefings: {
        Row: {
          alerts: Json
          briefing_date: string
          content_markdown: string
          created_at: string
          data_snapshot: Json | null
          helpful: boolean | null
          id: string
          opened_at: string | null
          suggestions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts?: Json
          briefing_date: string
          content_markdown: string
          created_at?: string
          data_snapshot?: Json | null
          helpful?: boolean | null
          id?: string
          opened_at?: string | null
          suggestions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts?: Json
          briefing_date?: string
          content_markdown?: string
          created_at?: string
          data_snapshot?: Json | null
          helpful?: boolean | null
          id?: string
          opened_at?: string | null
          suggestions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curiozinho_briefings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curiozinho_briefings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curiozinho_briefings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customer_complaints: {
        Row: {
          action_taken: string | null
          category: string
          created_at: string
          customer_contact: string | null
          description: string
          id: string
          registered_by_user_id: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          setor: string | null
          severity: string
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          category: string
          created_at?: string
          customer_contact?: string | null
          description: string
          id?: string
          registered_by_user_id?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          setor?: string | null
          severity: string
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          category?: string
          created_at?: string
          customer_contact?: string | null
          description?: string
          id?: string
          registered_by_user_id?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          setor?: string | null
          severity?: string
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_complaints_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_complaints_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_complaints_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_complaints_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "customer_complaints_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      daily_huddle_reports: {
        Row: {
          agenda_used: boolean
          author_user_id: string | null
          bo_dia: string
          final_agenda: string | null
          id: string
          informativos: string
          meta_dia: number | null
          meta_status: string
          observacao: string
          report_date: string
          submitted_at: string
          suggested_agenda: Json | null
          unit_id: string
          updated_at: string
          venda_dia_anterior: number | null
        }
        Insert: {
          agenda_used?: boolean
          author_user_id?: string | null
          bo_dia?: string
          final_agenda?: string | null
          id?: string
          informativos?: string
          meta_dia?: number | null
          meta_status?: string
          observacao?: string
          report_date: string
          submitted_at?: string
          suggested_agenda?: Json | null
          unit_id: string
          updated_at?: string
          venda_dia_anterior?: number | null
        }
        Update: {
          agenda_used?: boolean
          author_user_id?: string | null
          bo_dia?: string
          final_agenda?: string | null
          id?: string
          informativos?: string
          meta_dia?: number | null
          meta_status?: string
          observacao?: string
          report_date?: string
          submitted_at?: string
          suggested_agenda?: Json | null
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
            foreignKeyName: "daily_huddle_reports_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_huddle_reports_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      day_starts: {
        Row: {
          id: string
          snapshot: Json | null
          started_at: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          snapshot?: Json | null
          started_at?: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          snapshot?: Json | null
          started_at?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_starts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_starts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "day_starts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "day_starts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "day_starts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "day_starts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      encarregado_scores: {
        Row: {
          calculated_at: string
          components: Json
          encarregado_user_id: string
          id: string
          month: number
          score: number
          unit_id: string | null
          year: number
        }
        Insert: {
          calculated_at?: string
          components?: Json
          encarregado_user_id: string
          id?: string
          month: number
          score?: number
          unit_id?: string | null
          year: number
        }
        Update: {
          calculated_at?: string
          components?: Json
          encarregado_user_id?: string
          id?: string
          month?: number
          score?: number
          unit_id?: string | null
          year?: number
        }
        Relationships: []
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
      frases_do_dia: {
        Row: {
          active: boolean
          autor: string | null
          created_at: string
          dia_semana: number | null
          frase: string
          id: string
        }
        Insert: {
          active?: boolean
          autor?: string | null
          created_at?: string
          dia_semana?: number | null
          frase: string
          id?: string
        }
        Update: {
          active?: boolean
          autor?: string | null
          created_at?: string
          dia_semana?: number | null
          frase?: string
          id?: string
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
      leadership_answer_comments: {
        Row: {
          answer_id: string
          author_user_id: string
          comment_text: string
          created_at: string
          id: string
        }
        Insert: {
          answer_id: string
          author_user_id: string
          comment_text: string
          created_at?: string
          id?: string
        }
        Update: {
          answer_id?: string
          author_user_id?: string
          comment_text?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_answer_comments_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "leadership_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_answers: {
        Row: {
          answer_text: string
          edited_at: string | null
          id: string
          question_id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          answer_text: string
          edited_at?: string | null
          id?: string
          question_id: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          answer_text?: string
          edited_at?: string | null
          id?: string
          question_id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "leadership_questions"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      leadership_questions: {
        Row: {
          active: boolean
          context_note: string | null
          created_at: string
          created_by: string | null
          deadline_date: string
          id: string
          question_text: string
          target_roles: string[]
          week_start_date: string
        }
        Insert: {
          active?: boolean
          context_note?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date: string
          id?: string
          question_text: string
          target_roles?: string[]
          week_start_date: string
        }
        Update: {
          active?: boolean
          context_note?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string
          id?: string
          question_text?: string
          target_roles?: string[]
          week_start_date?: string
        }
        Relationships: []
      }
      manager_feedback_cycles: {
        Row: {
          closes_at: string
          created_at: string
          id: string
          opened_at: string
          quarter: number
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          closes_at: string
          created_at?: string
          id?: string
          opened_at?: string
          quarter: number
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          closes_at?: string
          created_at?: string
          id?: string
          opened_at?: string
          quarter?: number
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      manager_feedback_questions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          ordem: number
          question_text: string
          scale_max: number
          scale_min: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          ordem?: number
          question_text: string
          scale_max?: number
          scale_min?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          ordem?: number
          question_text?: string
          scale_max?: number
          scale_min?: number
        }
        Relationships: []
      }
      manager_feedback_responses: {
        Row: {
          comment: string | null
          created_at: string
          cycle_id: string
          id: string
          manager_user_id: string
          question_id: string
          respondent_hash: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          manager_user_id: string
          question_id: string
          respondent_hash: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          manager_user_id?: string
          question_id?: string
          respondent_hash?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "manager_feedback_responses_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "manager_feedback_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_feedback_responses_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_feedback_responses_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_feedback_responses_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_feedback_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "manager_feedback_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_score_dimensions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          metric_query_name: string
          name: string
          ordem: number
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          metric_query_name: string
          name: string
          ordem?: number
          updated_at?: string
          weight: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          metric_query_name?: string
          name?: string
          ordem?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      manager_scores_monthly: {
        Row: {
          calculated_at: string
          dimension_breakdown: Json
          final_score: number
          id: string
          month: number
          notes: string | null
          unit_id: string | null
          user_id: string
          year: number
        }
        Insert: {
          calculated_at?: string
          dimension_breakdown?: Json
          final_score: number
          id?: string
          month: number
          notes?: string | null
          unit_id?: string | null
          user_id: string
          year: number
        }
        Update: {
          calculated_at?: string
          dimension_breakdown?: Json
          final_score?: number
          id?: string
          month?: number
          notes?: string | null
          unit_id?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "manager_scores_monthly_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_scores_monthly_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "manager_scores_monthly_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "manager_scores_monthly_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_scores_monthly_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_scores_monthly_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      manager_to_supervisor_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          from_user_id: string
          id: string
          status: string
          title: string
          to_user_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          from_user_id: string
          id?: string
          status?: string
          title: string
          to_user_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          from_user_id?: string
          id?: string
          status?: string
          title?: string
          to_user_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      master_manager_notes: {
        Row: {
          created_at: string
          id: string
          manager_user_id: string
          master_user_id: string
          note: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_user_id: string
          master_user_id: string
          note: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_user_id?: string
          master_user_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_one_on_ones: {
        Row: {
          action_items: Json | null
          completed_at: string | null
          created_at: string
          gerente_user_id: string
          id: string
          master_user_id: string
          notes: string | null
          scheduled_for: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          completed_at?: string | null
          created_at?: string
          gerente_user_id: string
          id?: string
          master_user_id: string
          notes?: string | null
          scheduled_for: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          completed_at?: string | null
          created_at?: string
          gerente_user_id?: string
          id?: string
          master_user_id?: string
          notes?: string | null
          scheduled_for?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_pending_decisions: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          description: string | null
          id: string
          ref_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          description?: string | null
          id?: string
          ref_id?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          description?: string | null
          id?: string
          ref_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_pinned_items: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          link: string | null
          ordem: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          link?: string | null
          ordem?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          link?: string | null
          ordem?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_snapshots: {
        Row: {
          alerts: Json
          created_at: string
          id: string
          kpis: Json
          snapshot_date: string
          top_movers: Json
        }
        Insert: {
          alerts?: Json
          created_at?: string
          id?: string
          kpis?: Json
          snapshot_date: string
          top_movers?: Json
        }
        Update: {
          alerts?: Json
          created_at?: string
          id?: string
          kpis?: Json
          snapshot_date?: string
          top_movers?: Json
        }
        Relationships: []
      }
      master_spy_log: {
        Row: {
          action_taken: string | null
          id: string
          master_user_id: string
          target_unit_id: string | null
          target_user_id: string | null
          viewed_at: string
        }
        Insert: {
          action_taken?: string | null
          id?: string
          master_user_id: string
          target_unit_id?: string | null
          target_user_id?: string | null
          viewed_at?: string
        }
        Update: {
          action_taken?: string | null
          id?: string
          master_user_id?: string
          target_unit_id?: string | null
          target_user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      master_visits: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          master_user_id: string
          notes: string | null
          photos: Json
          scheduled_for: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          master_user_id: string
          notes?: string | null
          photos?: Json
          scheduled_for: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          master_user_id?: string
          notes?: string | null
          photos?: Json
          scheduled_for?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      mentorship_requests: {
        Row: {
          created_at: string
          id: string
          mentor_response: string | null
          mentor_user_id: string
          message: string
          requester_user_id: string
          responded_at: string | null
          status: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_response?: string | null
          mentor_user_id: string
          message: string
          requester_user_id: string
          responded_at?: string | null
          status?: string
          topic_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_response?: string | null
          mentor_user_id?: string
          message?: string
          requester_user_id?: string
          responded_at?: string | null
          status?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_requests_mentor_user_id_fkey"
            columns: ["mentor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_mentor_user_id_fkey"
            columns: ["mentor_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_mentor_user_id_fkey"
            columns: ["mentor_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "mentorship_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_topics: {
        Row: {
          active: boolean
          code: string
          created_at: string
          icon: string | null
          id: string
          name: string
          ordem: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          ordem?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          ordem?: number
        }
        Relationships: []
      }
      milestone_celebrations: {
        Row: {
          celebrated_at: string
          created_at: string
          id: string
          milestone_date: string
          milestone_type: string
          post_visible: boolean
          praise_id: string | null
          user_id: string
        }
        Insert: {
          celebrated_at?: string
          created_at?: string
          id?: string
          milestone_date: string
          milestone_type: string
          post_visible?: boolean
          praise_id?: string | null
          user_id: string
        }
        Update: {
          celebrated_at?: string
          created_at?: string
          id?: string
          milestone_date?: string
          milestone_type?: string
          post_visible?: boolean
          praise_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_celebrations_praise_id_fkey"
            columns: ["praise_id"]
            isOneToOne: false
            referencedRelation: "praises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_celebrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "milestone_celebrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "milestone_celebrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
      }
      missing_product_requests: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          customer_count: number
          id: string
          notes: string | null
          priority_score: number
          product_name: string
          registered_by_user_id: string | null
          status: string
          status_changed_at: string | null
          status_changed_by: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          customer_count?: number
          id?: string
          notes?: string | null
          priority_score?: number
          product_name: string
          registered_by_user_id?: string | null
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          customer_count?: number
          id?: string
          notes?: string | null
          priority_score?: number
          product_name?: string
          registered_by_user_id?: string | null
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missing_product_requests_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_product_requests_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_product_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_product_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "missing_product_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      missing_product_upvotes: {
        Row: {
          id: string
          request_id: string
          upvoted_at: string
          user_id: string
        }
        Insert: {
          id?: string
          request_id: string
          upvoted_at?: string
          user_id: string
        }
        Update: {
          id?: string
          request_id?: string
          upvoted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missing_product_upvotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "missing_product_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_product_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mystery_visit_criteria: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          ordem: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          ordem?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          ordem?: number
        }
        Relationships: []
      }
      mystery_visit_scores: {
        Row: {
          comment: string | null
          created_at: string
          criteria_id: string
          id: string
          score: number
          visit_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          criteria_id: string
          id?: string
          score: number
          visit_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          criteria_id?: string
          id?: string
          score?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mystery_visit_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "mystery_visit_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mystery_visit_scores_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "mystery_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      mystery_visits: {
        Row: {
          anonymous_to_team: boolean
          created_at: string
          id: string
          notes: string | null
          overall_score: number | null
          photos: Json
          target_unit_id: string
          updated_at: string
          visit_date: string
          visit_time: string | null
          visitor_user_id: string
        }
        Insert: {
          anonymous_to_team?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          overall_score?: number | null
          photos?: Json
          target_unit_id: string
          updated_at?: string
          visit_date: string
          visit_time?: string | null
          visitor_user_id: string
        }
        Update: {
          anonymous_to_team?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          overall_score?: number | null
          photos?: Json
          target_unit_id?: string
          updated_at?: string
          visit_date?: string
          visit_time?: string | null
          visitor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mystery_visits_target_unit_id_fkey"
            columns: ["target_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mystery_visits_target_unit_id_fkey"
            columns: ["target_unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "mystery_visits_target_unit_id_fkey"
            columns: ["target_unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "mystery_visits_visitor_user_id_fkey"
            columns: ["visitor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          grouping_key: string | null
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
          grouping_key?: string | null
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
          grouping_key?: string | null
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
          digest_frequency: string
          general_announcements: boolean
          group_notifications: boolean
          hr_messages: boolean
          id: string
          important_notices: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_frequency?: string
          general_announcements?: boolean
          group_notifications?: boolean
          hr_messages?: boolean
          id?: string
          important_notices?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_frequency?: string
          general_announcements?: boolean
          group_notifications?: boolean
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
      onboarding_journeys: {
        Row: {
          completed_at: string | null
          completed_modules: number
          created_at: string
          expected_completion_date: string
          id: string
          last_activity_at: string | null
          started_at: string
          status: string
          total_modules: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_modules?: number
          created_at?: string
          expected_completion_date?: string
          id?: string
          last_activity_at?: string | null
          started_at?: string
          status?: string
          total_modules?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_modules?: number
          created_at?: string
          expected_completion_date?: string
          id?: string
          last_activity_at?: string | null
          started_at?: string
          status?: string
          total_modules?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_journeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_journeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_journeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
      }
      org_alocacoes: {
        Row: {
          alocado_em: string
          alocado_por: string | null
          id: string
          ordem: number
          posicao: string
          profile_id: string
          setor: string | null
          sub_setor: string | null
          unit_id: string
        }
        Insert: {
          alocado_em?: string
          alocado_por?: string | null
          id?: string
          ordem?: number
          posicao: string
          profile_id: string
          setor?: string | null
          sub_setor?: string | null
          unit_id: string
        }
        Update: {
          alocado_em?: string
          alocado_por?: string | null
          id?: string
          ordem?: number
          posicao?: string
          profile_id?: string
          setor?: string | null
          sub_setor?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_alocacoes_alocado_por_fkey"
            columns: ["alocado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_alocacoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_alocacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_alocacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "org_alocacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      painel_opens: {
        Row: {
          opened_date: string
          user_id: string
        }
        Insert: {
          opened_date: string
          user_id: string
        }
        Update: {
          opened_date?: string
          user_id?: string
        }
        Relationships: []
      }
      pdi_goals: {
        Row: {
          ano: number
          closed_at: string | null
          created_at: string
          descricao: string
          encarregado_user_id: string
          gerente_user_id: string | null
          id: string
          meta_unidade: string | null
          meta_valor: number | null
          prazo: string | null
          status: string
          titulo: string
          trimestre: number
          unit_id: string | null
          updated_at: string
          valor_atual: number | null
        }
        Insert: {
          ano: number
          closed_at?: string | null
          created_at?: string
          descricao: string
          encarregado_user_id: string
          gerente_user_id?: string | null
          id?: string
          meta_unidade?: string | null
          meta_valor?: number | null
          prazo?: string | null
          status?: string
          titulo: string
          trimestre: number
          unit_id?: string | null
          updated_at?: string
          valor_atual?: number | null
        }
        Update: {
          ano?: number
          closed_at?: string | null
          created_at?: string
          descricao?: string
          encarregado_user_id?: string
          gerente_user_id?: string | null
          id?: string
          meta_unidade?: string | null
          meta_valor?: number | null
          prazo?: string | null
          status?: string
          titulo?: string
          trimestre?: number
          unit_id?: string | null
          updated_at?: string
          valor_atual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdi_goals_encarregado_user_id_fkey"
            columns: ["encarregado_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_goals_encarregado_user_id_fkey"
            columns: ["encarregado_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_goals_encarregado_user_id_fkey"
            columns: ["encarregado_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_goals_gerente_user_id_fkey"
            columns: ["gerente_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_goals_gerente_user_id_fkey"
            columns: ["gerente_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_goals_gerente_user_id_fkey"
            columns: ["gerente_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "pdi_goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      pdi_progress_updates: {
        Row: {
          autor_user_id: string
          created_at: string
          goal_id: string
          id: string
          observacao: string
          valor_atual: number | null
        }
        Insert: {
          autor_user_id: string
          created_at?: string
          goal_id: string
          id?: string
          observacao: string
          valor_atual?: number | null
        }
        Update: {
          autor_user_id?: string
          created_at?: string
          goal_id?: string
          id?: string
          observacao?: string
          valor_atual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdi_progress_updates_autor_user_id_fkey"
            columns: ["autor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_progress_updates_autor_user_id_fkey"
            columns: ["autor_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_progress_updates_autor_user_id_fkey"
            columns: ["autor_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pdi_progress_updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "pdi_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_article_feedback: {
        Row: {
          article_id: string
          comment: string | null
          created_at: string
          id: string
          updated_at: string
          useful: boolean | null
          user_id: string
        }
        Insert: {
          article_id: string
          comment?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          useful?: boolean | null
          user_id: string
        }
        Update: {
          article_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          useful?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "playbook_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_article_views: {
        Row: {
          article_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          article_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          article_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "playbook_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_articles: {
        Row: {
          active: boolean
          category_id: string
          context: string
          created_at: string
          created_by: string | null
          featured_until: string | null
          id: string
          real_example: string | null
          script: string | null
          tags: string[]
          title: string
          updated_at: string
          version: number
          video_url: string | null
          visible_to: string[]
          what_not_to_do: string | null
        }
        Insert: {
          active?: boolean
          category_id: string
          context: string
          created_at?: string
          created_by?: string | null
          featured_until?: string | null
          id?: string
          real_example?: string | null
          script?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          version?: number
          video_url?: string | null
          visible_to?: string[]
          what_not_to_do?: string | null
        }
        Update: {
          active?: boolean
          category_id?: string
          context?: string
          created_at?: string
          created_by?: string | null
          featured_until?: string | null
          id?: string
          real_example?: string | null
          script?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          version?: number
          video_url?: string | null
          visible_to?: string[]
          what_not_to_do?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "playbook_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_categories: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          ordem: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          id: string
          option_id: string
          poll_id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          id?: string
          option_id: string
          poll_id: string
          user_id: string
          voted_at?: string
        }
        Update: {
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_anonymous: boolean
          author_user_id: string
          created_at: string
          expires_at: string
          id: string
          notified_30min: boolean
          options: Json
          question: string
          status: string
          target_roles: string[]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          allow_anonymous?: boolean
          author_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          notified_30min?: boolean
          options: Json
          question: string
          status?: string
          target_roles?: string[]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          allow_anonymous?: boolean
          author_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          notified_30min?: boolean
          options?: Json
          question?: string
          status?: string
          target_roles?: string[]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "polls_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "polls_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "polls_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "polls_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
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
          praise_type: string
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
          praise_type?: string
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
          praise_type?: string
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
          admissao_date: string | null
          afastado_desde: string | null
          afastado_status: string | null
          ativo: boolean
          audio_painel_enabled: boolean
          available_for_coverage: boolean
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          cargo_text: string | null
          cargo_titulo: string | null
          cbo: string | null
          codigo_empregado: string | null
          coverage_dates: unknown[] | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          descricao: string | null
          email: string
          first_login_at: string | null
          foto_url: string | null
          gerencia: Database["public"]["Enums"]["gerencia_tipo"]
          id: string
          is_general_manager: boolean | null
          is_placeholder: boolean
          is_test: boolean
          lider_setor_id: string | null
          login_count: number
          must_change_password: boolean
          nascimento_date: string | null
          nome: string
          painel_mode: string
          painel_onboarding_seen: boolean
          pcd_flag: boolean | null
          periodo: string | null
          permission_units: string[]
          pis: string | null
          posicao_organograma: string | null
          role: Database["public"]["Enums"]["cargo_tipo"] | null
          setor: Database["public"]["Enums"]["setor_tipo"] | null
          setor_organograma: string | null
          setor_text: string | null
          sexo: string | null
          telefone: string | null
          theme_preference: string
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          unit_id: string | null
          updated_at: string
          user_id: string | null
          username: string | null
          welcome_banner_dismissed: boolean
        }
        Insert: {
          admissao_date?: string | null
          afastado_desde?: string | null
          afastado_status?: string | null
          ativo?: boolean
          audio_painel_enabled?: boolean
          available_for_coverage?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          cargo_text?: string | null
          cargo_titulo?: string | null
          cbo?: string | null
          codigo_empregado?: string | null
          coverage_dates?: unknown[] | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          descricao?: string | null
          email: string
          first_login_at?: string | null
          foto_url?: string | null
          gerencia?: Database["public"]["Enums"]["gerencia_tipo"]
          id?: string
          is_general_manager?: boolean | null
          is_placeholder?: boolean
          is_test?: boolean
          lider_setor_id?: string | null
          login_count?: number
          must_change_password?: boolean
          nascimento_date?: string | null
          nome: string
          painel_mode?: string
          painel_onboarding_seen?: boolean
          pcd_flag?: boolean | null
          periodo?: string | null
          permission_units?: string[]
          pis?: string | null
          posicao_organograma?: string | null
          role?: Database["public"]["Enums"]["cargo_tipo"] | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          setor_organograma?: string | null
          setor_text?: string | null
          sexo?: string | null
          telefone?: string | null
          theme_preference?: string
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          welcome_banner_dismissed?: boolean
        }
        Update: {
          admissao_date?: string | null
          afastado_desde?: string | null
          afastado_status?: string | null
          ativo?: boolean
          audio_painel_enabled?: boolean
          available_for_coverage?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          cargo_text?: string | null
          cargo_titulo?: string | null
          cbo?: string | null
          codigo_empregado?: string | null
          coverage_dates?: unknown[] | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          descricao?: string | null
          email?: string
          first_login_at?: string | null
          foto_url?: string | null
          gerencia?: Database["public"]["Enums"]["gerencia_tipo"]
          id?: string
          is_general_manager?: boolean | null
          is_placeholder?: boolean
          is_test?: boolean
          lider_setor_id?: string | null
          login_count?: number
          must_change_password?: boolean
          nascimento_date?: string | null
          nome?: string
          painel_mode?: string
          painel_onboarding_seen?: boolean
          pcd_flag?: boolean | null
          periodo?: string | null
          permission_units?: string[]
          pis?: string | null
          posicao_organograma?: string | null
          role?: Database["public"]["Enums"]["cargo_tipo"] | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          setor_organograma?: string | null
          setor_text?: string | null
          sexo?: string | null
          telefone?: string | null
          theme_preference?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      recommendations: {
        Row: {
          action_link: string | null
          created_at: string
          description: string | null
          dismissed_at: string | null
          expires_at: string
          id: string
          priority: number
          target_user_id: string
          title: string
          type: string
        }
        Insert: {
          action_link?: string | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          expires_at?: string
          id?: string
          priority?: number
          target_user_id: string
          title: string
          type: string
        }
        Update: {
          action_link?: string | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          expires_at?: string
          id?: string
          priority?: number
          target_user_id?: string
          title?: string
          type?: string
        }
        Relationships: []
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
      safety_incidents: {
        Row: {
          action_corrective: string | null
          action_immediate: string | null
          created_at: string
          description: string
          id: string
          incident_type: string
          location_in_store: string | null
          occurred_at: string
          people_involved: string | null
          photos: Json
          registered_by_user_id: string
          resolved_at: string | null
          resolved_by_user_id: string | null
          root_cause: string | null
          setor: string | null
          severity: string
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          action_corrective?: string | null
          action_immediate?: string | null
          created_at?: string
          description: string
          id?: string
          incident_type: string
          location_in_store?: string | null
          occurred_at: string
          people_involved?: string | null
          photos?: Json
          registered_by_user_id: string
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          root_cause?: string | null
          setor?: string | null
          severity: string
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          action_corrective?: string | null
          action_immediate?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          location_in_store?: string | null
          occurred_at?: string
          people_involved?: string | null
          photos?: Json
          registered_by_user_id?: string
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          root_cause?: string | null
          setor?: string | null
          severity?: string
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "safety_incidents_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "safety_incidents_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "safety_incidents_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "safety_incidents_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "safety_incidents_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "safety_incidents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "safety_incidents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      sales_metrics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          metric_date: string
          metric_hour: number | null
          revenue: number
          source: string
          ticket_avg: number | null
          transactions: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          metric_date: string
          metric_hour?: number | null
          revenue?: number
          source: string
          ticket_avg?: number | null
          transactions?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          metric_date?: string
          metric_hour?: number | null
          revenue?: number
          source?: string
          ticket_avg?: number | null
          transactions?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_metrics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_metrics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "sales_metrics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          month: number
          target_revenue: number
          target_transactions: number
          unit_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          month: number
          target_revenue?: number
          target_transactions?: number
          unit_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          month?: number
          target_revenue?: number
          target_transactions?: number
          unit_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "sales_targets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
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
      shift_swaps: {
        Row: {
          created_at: string
          id: string
          message: string | null
          original_shift_id: string
          requester_user_id: string
          responded_at: string | null
          status: string
          swap_with_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          original_shift_id: string
          requester_user_id: string
          responded_at?: string | null
          status?: string
          swap_with_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          original_shift_id?: string
          requester_user_id?: string
          responded_at?: string | null
          status?: string
          swap_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swaps_original_shift_id_fkey"
            columns: ["original_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reminded_at: string | null
          role_in_shift: string | null
          setor: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          status: string
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reminded_at?: string | null
          role_in_shift?: string | null
          setor?: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          status?: string
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reminded_at?: string | null
          role_in_shift?: string | null
          setor?: string | null
          shift_date?: string
          shift_end?: string
          shift_start?: string
          status?: string
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "shifts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      stories: {
        Row: {
          author_user_id: string
          caption: string | null
          created_at: string
          duration_seconds: number
          expires_at: string
          id: string
          media_type: string
          media_url: string
          setor: string | null
          unit_id: string
        }
        Insert: {
          author_user_id: string
          caption?: string | null
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          id?: string
          media_type: string
          media_url: string
          setor?: string | null
          unit_id: string
        }
        Update: {
          author_user_id?: string
          caption?: string | null
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          setor?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "stories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_user_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_user_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
          onboarding_track: boolean
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
          onboarding_track?: boolean
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
          onboarding_track?: boolean
          ordem?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      tv_display_cards: {
        Row: {
          card_type: string
          config: Json
          created_at: string
          display_id: string
          enabled: boolean
          id: string
          ordem: number
          updated_at: string
        }
        Insert: {
          card_type: string
          config?: Json
          created_at?: string
          display_id: string
          enabled?: boolean
          id?: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          card_type?: string
          config?: Json
          created_at?: string
          display_id?: string
          enabled?: boolean
          id?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tv_display_cards_display_id_fkey"
            columns: ["display_id"]
            isOneToOne: false
            referencedRelation: "tv_displays"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_displays: {
        Row: {
          active: boolean
          created_at: string
          display_token: string
          id: string
          name: string
          slide_duration_seconds: number
          slug: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_token?: string
          id?: string
          name: string
          slide_duration_seconds?: number
          slug: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_token?: string
          id?: string
          name?: string
          slide_duration_seconds?: number
          slug?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tv_displays_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tv_displays_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "tv_displays_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      unit_sector_templates: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          ordem: number
          sector_name: string
          unit_id: string | null
          unit_kind: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          ordem?: number
          sector_name: string
          unit_id?: string | null
          unit_kind: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          ordem?: number
          sector_name?: string
          unit_id?: string | null
          unit_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_sector_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_sector_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "unit_sector_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
        ]
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
          total_desejado: number
          type: Database["public"]["Enums"]["unit_type"]
          unit_kind: string
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
          total_desejado?: number
          type: Database["public"]["Enums"]["unit_type"]
          unit_kind?: string
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
          total_desejado?: number
          type?: Database["public"]["Enums"]["unit_type"]
          unit_kind?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          completed: boolean
          created_at: string
          current_progress: number
          id: string
          last_calculated_at: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          completed?: boolean
          created_at?: string
          current_progress?: number
          id?: string
          last_calculated_at?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          completed?: boolean
          created_at?: string
          current_progress?: number
          id?: string
          last_calculated_at?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mentorship_offers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          message: string | null
          topic_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          message?: string | null
          topic_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          message?: string | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mentorship_offers_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "mentorship_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mentorship_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_mentorship_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_mentorship_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      weekly_commitments: {
        Row: {
          commitment_text: string
          created_at: string
          evaluated_at: string | null
          evidencia: string
          id: string
          ordem: number
          status: string
          unit_id: string | null
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          commitment_text: string
          created_at?: string
          evaluated_at?: string | null
          evidencia?: string
          id?: string
          ordem: number
          status?: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          commitment_text?: string
          created_at?: string
          evaluated_at?: string | null
          evidencia?: string
          id?: string
          ordem?: number
          status?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_commitments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_commitments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "weekly_commitments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "weekly_commitments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "weekly_commitments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "weekly_commitments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wellbeing_checkins: {
        Row: {
          checkin_date: string
          composite_score: number
          created_at: string
          id: string
          notes: string | null
          responses: Json
          risk_level: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          checkin_date?: string
          composite_score?: number
          created_at?: string
          id?: string
          notes?: string | null
          responses: Json
          risk_level?: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          checkin_date?: string
          composite_score?: number
          created_at?: string
          id?: string
          notes?: string | null
          responses?: Json
          risk_level?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellbeing_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wellbeing_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wellbeing_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wellbeing_questions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          dimension: string
          id: string
          ordem: number
          question_text: string
          reverse_scoring: boolean
          scale_max: number
          scale_min: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          dimension: string
          id?: string
          ordem?: number
          question_text: string
          reverse_scoring?: boolean
          scale_max?: number
          scale_min?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          dimension?: string
          id?: string
          ordem?: number
          question_text?: string
          reverse_scoring?: boolean
          scale_max?: number
          scale_min?: number
        }
        Relationships: []
      }
      whatsapp_summaries: {
        Row: {
          created_at: string
          id: string
          raw_input: string
          summary: Json | null
          unit_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          raw_input: string
          summary?: Json | null
          unit_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          raw_input?: string
          summary?: Json | null
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_summaries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_summaries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "whatsapp_summaries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_unit_checklist_progress"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "whatsapp_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "whatsapp_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_hoje"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "whatsapp_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_aniversariantes_proximos_7d"
            referencedColumns: ["user_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      notification_groups: {
        Row: {
          earliest_at: string | null
          event_count: number | null
          grouping_key: string | null
          latest_at: string | null
          sample_body: string | null
          sample_payload: Json | null
          sample_title: string | null
          type: Database["public"]["Enums"]["notification_event_type"] | null
          unit_id: string | null
          unread_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_aniversariantes_hoje: {
        Row: {
          cargo: Database["public"]["Enums"]["cargo_tipo"] | null
          cargo_titulo: string | null
          dia: number | null
          foto_url: string | null
          mes: number | null
          nome: string | null
          setor: Database["public"]["Enums"]["setor_tipo"] | null
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
          user_id: string | null
        }
        Insert: {
          cargo?: Database["public"]["Enums"]["cargo_tipo"] | null
          cargo_titulo?: string | null
          dia?: never
          foto_url?: string | null
          mes?: never
          nome?: string | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          user_id?: string | null
        }
        Update: {
          cargo?: Database["public"]["Enums"]["cargo_tipo"] | null
          cargo_titulo?: string | null
          dia?: never
          foto_url?: string | null
          mes?: never
          nome?: string | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_aniversariantes_proximos_7d: {
        Row: {
          cargo: Database["public"]["Enums"]["cargo_tipo"] | null
          cargo_titulo: string | null
          days_ahead: number | null
          dia: number | null
          foto_url: string | null
          mes: number | null
          nome: string | null
          setor: Database["public"]["Enums"]["setor_tipo"] | null
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
          user_id: string | null
        }
        Insert: {
          cargo?: Database["public"]["Enums"]["cargo_tipo"] | null
          cargo_titulo?: string | null
          days_ahead?: never
          dia?: never
          foto_url?: string | null
          mes?: never
          nome?: string | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          user_id?: string | null
        }
        Update: {
          cargo?: Database["public"]["Enums"]["cargo_tipo"] | null
          cargo_titulo?: string | null
          days_ahead?: never
          dia?: never
          foto_url?: string | null
          mes?: never
          nome?: string | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_auditoria_visual: {
        Row: {
          completed_at: string | null
          completion_data: string | null
          completion_id: string | null
          foto_url: string | null
          gestor_cargo: string | null
          gestor_nome: string | null
          gestor_user_id: string | null
          item_id: string | null
          item_text: string | null
          observacao: string | null
          requires_photo: boolean | null
          response_id: string | null
          template_id: string | null
          template_name: string | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_responses_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "checklist_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_heatmap_indicators: {
        Row: {
          avisos_pendentes: number | null
          mood_baixo_count: number | null
          total_advertencias: number | null
          total_checklist_atrasados: number | null
          total_complaints: number | null
          total_faltas_setor: number | null
          total_ocorrencias: number | null
          total_suspensoes: number | null
          total_vagas_abertas: number | null
          unit_id: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
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
      v_safety_incidents_heatmap: {
        Row: {
          month: string | null
          near_miss_count: number | null
          severe_count: number | null
          total_incidents: number | null
          unit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_auditoria_visual"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "safety_incidents_unit_id_fkey"
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
      v_wellbeing_aggregated: {
        Row: {
          avg_composite_score: number | null
          count_responses: number | null
          month: string | null
          pct_alerta: number | null
          pct_atencao: number | null
          pct_critico: number | null
          pct_ok: number | null
          unit_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_create_praise: {
        Args: { _autor: string; _destinatario_member: string; _type: string }
        Returns: boolean
      }
      can_review_document_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      can_view_aviso: {
        Args: { _aviso: string; _user: string }
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
      can_view_leadership_answer: {
        Args: { _answer_id: string; _uid: string }
        Returns: boolean
      }
      can_view_pdi_goal: {
        Args: { _goal_id: string; _uid: string }
        Returns: boolean
      }
      can_view_playbook_article: {
        Args: { _article_id: string; _uid: string }
        Returns: boolean
      }
      can_view_team_member: {
        Args: { _member_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_user_achievements: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
      chat_mark_read: { Args: { _conv: string }; Returns: undefined }
      chat_unread_count: { Args: { _uid: string }; Returns: number }
      compute_feedback_hash: {
        Args: { _cycle_id: string; _user_id: string }
        Returns: string
      }
      coverage_profile_id_for: { Args: { _uid: string }; Returns: string }
      create_or_get_direct_chat: { Args: { _other: string }; Returns: string }
      fn_heatmap_indicators: {
        Args: { _period?: string }
        Returns: {
          avisos_pendentes: number
          mood_baixo_count: number
          total_advertencias: number
          total_checklist_atrasados: number
          total_complaints: number
          total_faltas_setor: number
          total_ocorrencias: number
          total_suspensoes: number
          total_vagas_abertas: number
          unit_id: string
        }[]
      }
      fn_manager_feedback_aggregated: {
        Args: { _cycle_id?: string; _manager_user_id: string }
        Returns: {
          avg_score: number
          count_responses: number
          cycle_id: string
          distribution: Json
          ordem: number
          question_code: string
          question_id: string
          question_text: string
        }[]
      }
      fn_manager_feedback_comments: {
        Args: { _cycle_id: string; _manager_user_id: string }
        Returns: {
          comment: string
        }[]
      }
      fn_my_checkin_done_this_month: { Args: never; Returns: boolean }
      fn_my_day_overview: { Args: never; Returns: Json }
      fn_notification_grouping_key: {
        Args: { _payload: Json; _type: string }
        Returns: string
      }
      fn_sales_compare_units: {
        Args: { _from: string; _to: string }
        Returns: {
          revenue: number
          transactions: number
          unit_id: string
          unit_name: string
        }[]
      }
      fn_sales_range: {
        Args: { _from: string; _to: string; _unit_id: string }
        Returns: {
          metric_date: string
          revenue: number
          ticket_avg: number
          transactions: number
        }[]
      }
      fn_sales_today_summary: { Args: { _unit_id: string }; Returns: Json }
      fn_search_missing_products: {
        Args: { _limit?: number; _query: string }
        Returns: {
          brand: string
          category: string
          customer_count: number
          id: string
          product_name: string
          similarity: number
          status: string
        }[]
      }
      fn_user_already_answered_cycle: {
        Args: { _cycle_id: string }
        Returns: boolean
      }
      fn_wellbeing_aggregated: {
        Args: { _from?: string; _to?: string; _unit_id?: string }
        Returns: {
          avg_composite_score: number
          count_responses: number
          month: string
          pct_alerta: number
          pct_atencao: number
          pct_critico: number
          pct_ok: number
          unit_id: string
        }[]
      }
      fn_wellbeing_critical_alerts: {
        Args: never
        Returns: {
          created_at: string
          risk_level: string
          unit_id: string
          user_hash: string
        }[]
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
      is_chat_admin: { Args: { _conv: string; _uid: string }; Returns: boolean }
      is_chat_participant: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      is_commitment_viewer: { Args: { _user_id: string }; Returns: boolean }
      is_culture_editor: { Args: { _user_id: string }; Returns: boolean }
      is_eligible_for_leadership_question: {
        Args: { _question_id: string; _uid: string }
        Returns: boolean
      }
      is_eligible_for_poll: {
        Args: { _poll_id: string; _uid: string }
        Returns: boolean
      }
      is_leadership: { Args: { _user_id: string }; Returns: boolean }
      is_master_or_admin: { Args: { _uid: string }; Returns: boolean }
      is_rh_admin: { Args: { _user_id: string }; Returns: boolean }
      is_rh_or_admin: { Args: { _uid: string }; Returns: boolean }
      is_safety_viewer: { Args: { _uid: string }; Returns: boolean }
      is_unit_manager: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      profile_matches_occurrence_reason: {
        Args: { _motivos: Json; _unit_id: string; _user_id: string }
        Returns: boolean
      }
      question_deadline_passed: {
        Args: { _question_id: string }
        Returns: boolean
      }
      regenerate_tv_display_token: {
        Args: { _display_id: string }
        Returns: string
      }
      resolve_churn_risk: {
        Args: { _id: string; _note: string; _status: string }
        Returns: undefined
      }
      run_onboarding_status_cron: { Args: never; Returns: undefined }
      seed_default_tv_cards: {
        Args: { _display_id: string }
        Returns: undefined
      }
      send_onboarding_incentive: {
        Args: { _user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_quiz: {
        Args: { _answers: Json; _module_id: string }
        Returns: Json
      }
      user_already_answered_question: {
        Args: { _question_id: string; _uid: string }
        Returns: boolean
      }
      user_can_access_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      wellbeing_hash_user: { Args: { _user_id: string }; Returns: string }
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
        | "aniversario"
        | "aniversario_curio"
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
        "aniversario",
        "aniversario_curio",
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
