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
          departamento: Database["public"]["Enums"]["setor_tipo"] | null
          email: string
          id: string
          nome: string
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          created_at?: string
          departamento?: Database["public"]["Enums"]["setor_tipo"] | null
          email: string
          id?: string
          nome: string
          unidade: Database["public"]["Enums"]["unidade_tipo"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          created_at?: string
          departamento?: Database["public"]["Enums"]["setor_tipo"] | null
          email?: string
          id?: string
          nome?: string
          unidade?: Database["public"]["Enums"]["unidade_tipo"]
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
      colaborador_status: "ativo" | "inativo" | "ferias" | "afastado"
      endomarketing_tipo: "aniversario" | "destaque" | "campanha" | "mensagem"
      galeria_categoria:
        | "equipe"
        | "eventos"
        | "campanhas"
        | "loja"
        | "destaques"
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
      ],
      colaborador_status: ["ativo", "inativo", "ferias", "afastado"],
      endomarketing_tipo: ["aniversario", "destaque", "campanha", "mensagem"],
      galeria_categoria: [
        "equipe",
        "eventos",
        "campanhas",
        "loja",
        "destaques",
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
    },
  },
} as const
