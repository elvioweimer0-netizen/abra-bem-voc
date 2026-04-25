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
      avisos: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          id: string
          titulo: string
          unidade: Database["public"]["Enums"]["unidade_tipo"] | null
          urgente: boolean
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          id?: string
          titulo: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"] | null
          urgente?: boolean
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
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
          template_id: string
          tipo_resposta: Database["public"]["Enums"]["checklist_response_type"]
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          obrigatorio?: boolean
          ordem: number
          template_id: string
          tipo_resposta?: Database["public"]["Enums"]["checklist_response_type"]
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          obrigatorio?: boolean
          ordem?: number
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
          cargo: Database["public"]["Enums"]["cargo_tipo"]
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
        ]
      }
      leadership_occurrences: {
        Row: {
          atribuido_a: string | null
          created_at: string
          criado_em: string
          descricao: string
          foto_url: string | null
          gravidade: Database["public"]["Enums"]["occurrence_severity"]
          id: string
          reportado_por: string
          resolvido_em: string | null
          status: Database["public"]["Enums"]["occurrence_status"]
          tipo: Database["public"]["Enums"]["occurrence_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          atribuido_a?: string | null
          created_at?: string
          criado_em?: string
          descricao: string
          foto_url?: string | null
          gravidade?: Database["public"]["Enums"]["occurrence_severity"]
          id?: string
          reportado_por: string
          resolvido_em?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          tipo?: Database["public"]["Enums"]["occurrence_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          atribuido_a?: string | null
          created_at?: string
          criado_em?: string
          descricao?: string
          foto_url?: string | null
          gravidade?: Database["public"]["Enums"]["occurrence_severity"]
          id?: string
          reportado_por?: string
          resolvido_em?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          tipo?: Database["public"]["Enums"]["occurrence_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_occurrences_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      profiles: {
        Row: {
          ativo: boolean
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          created_at: string
          email: string
          gerencia: Database["public"]["Enums"]["gerencia_tipo"]
          id: string
          nome: string
          permission_units: string[]
          role: Database["public"]["Enums"]["cargo_tipo"] | null
          setor: Database["public"]["Enums"]["setor_tipo"] | null
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          created_at?: string
          email: string
          gerencia?: Database["public"]["Enums"]["gerencia_tipo"]
          id?: string
          nome: string
          permission_units?: string[]
          role?: Database["public"]["Enums"]["cargo_tipo"] | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          created_at?: string
          email?: string
          gerencia?: Database["public"]["Enums"]["gerencia_tipo"]
          id?: string
          nome?: string
          permission_units?: string[]
          role?: Database["public"]["Enums"]["cargo_tipo"] | null
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
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
      units: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          location: string | null
          name: string
          type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          location?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_departamento: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["setor_tipo"]
      }
      get_user_unidade: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["unidade_tipo"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["cargo_tipo"]
          _user_id: string
        }
        Returns: boolean
      }
      user_can_access_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      advertencia_tipo: "verbal" | "escrita"
      cargo_tipo:
        | "admin"
        | "gerente"
        | "lider"
        | "colaborador"
        | "master"
        | "adm_departamento"
        | "supervisor"
        | "gerente_adm"
        | "gerente_loja"
        | "encarregado"
      checklist_period:
        | "abertura"
        | "durante"
        | "fechamento"
        | "producao_dia"
        | "operacao_cd"
      checklist_response_type: "sim_nao" | "texto" | "foto"
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
      occurrence_severity: "baixa" | "media" | "alta"
      occurrence_status: "aberto" | "em_tratamento" | "resolvido"
      occurrence_type:
        | "atendimento"
        | "quebra"
        | "manutencao"
        | "disciplina"
        | "outro"
      ocorrencia_status: "aberta" | "em_andamento" | "concluida"
      reuniao_status: "agendada" | "em_andamento" | "finalizada" | "cancelada"
      reuniao_tipo: "online" | "presencial" | "hibrida"
      setor_tipo:
        | "acougue"
        | "padaria"
        | "hortifruti"
        | "mercearia"
        | "frente_de_caixa"
        | "deposito"
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
      cargo_tipo: [
        "admin",
        "gerente",
        "lider",
        "colaborador",
        "master",
        "adm_departamento",
        "supervisor",
        "gerente_adm",
        "gerente_loja",
        "encarregado",
      ],
      checklist_period: [
        "abertura",
        "durante",
        "fechamento",
        "producao_dia",
        "operacao_cd",
      ],
      checklist_response_type: ["sim_nao", "texto", "foto"],
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
      reuniao_status: ["agendada", "em_andamento", "finalizada", "cancelada"],
      reuniao_tipo: ["online", "presencial", "hibrida"],
      setor_tipo: [
        "acougue",
        "padaria",
        "hortifruti",
        "mercearia",
        "frente_de_caixa",
        "deposito",
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
