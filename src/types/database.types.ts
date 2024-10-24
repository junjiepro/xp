export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      application_blocks: {
        Row: {
          access: Json;
          application_key: string;
          block: Json;
          block_key: string;
          created_at: string;
          id: string;
          organization_id: string;
          user_id: string | null;
        };
        Insert: {
          access: Json;
          application_key: string;
          block: Json;
          block_key: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          user_id?: string | null;
        };
        Update: {
          access?: Json;
          application_key?: string;
          block?: Json;
          block_key?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_application_blocks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_application_blocks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "public_application_blocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_application_blocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["user_id"];
          }
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          created_at: string;
          editable: boolean;
          id: string;
          name: string;
          organization_id: string;
        };
        Insert: {
          created_at?: string;
          editable?: boolean;
          id?: string;
          name?: string;
          organization_id?: string;
        };
        Update: {
          created_at?: string;
          editable?: boolean;
          id?: string;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["organization_id"];
          }
        ];
      };
      setting_blocks: {
        Row: {
          access: Json;
          application_key: string;
          block: Json;
          block_key: string;
          created_at: string;
          id: string;
          organization_id: string;
          user_id: string | null;
        };
        Insert: {
          access: Json;
          application_key: string;
          block: Json;
          block_key: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          user_id?: string | null;
        };
        Update: {
          access?: Json;
          application_key?: string;
          block?: Json;
          block_key?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_setting_blocks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_setting_blocks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "public_setting_blocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_setting_blocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_and_roles: {
        Row: {
          created_at: string;
          role_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_and_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_user_and_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["role_id"];
          },
          {
            foreignKeyName: "public_user_and_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_user_and_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_devices: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          used_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          used_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          used_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_devices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          created_at: string;
          id: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          username?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      setting_block_with_permissions: {
        Row: {
          access: Json | null;
          application_key: string | null;
          block: Json | null;
          block_key: string | null;
          created_at: string | null;
          id: string | null;
          is_admin: boolean | null;
          is_owner: boolean | null;
          organization_id: string | null;
          user_id: string | null;
        };
        Insert: {
          access?: Json | null;
          application_key?: string | null;
          block?: Json | null;
          block_key?: string | null;
          created_at?: string | null;
          id?: string | null;
          is_admin?: never;
          is_owner?: never;
          organization_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          access?: Json | null;
          application_key?: string | null;
          block?: Json | null;
          block_key?: string | null;
          created_at?: string | null;
          id?: string | null;
          is_admin?: never;
          is_owner?: never;
          organization_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_setting_blocks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_setting_blocks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "public_setting_blocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_setting_blocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_role_with_organizations";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_role_with_organizations: {
        Row: {
          organization_id: string | null;
          organization_name: string | null;
          role_id: string | null;
          role_name: string | null;
          user_id: string | null;
          user_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_profiles_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      get_organization_of_role: {
        Args: {
          role_id: string;
        };
        Returns: string;
      };
      is_administrator_of_organization: {
        Args: {
          p_user_id: string;
          p_organization_id: string;
        };
        Returns: boolean;
      };
      is_owner_of_organization: {
        Args: {
          p_user_id: string;
          p_organization_id: string;
        };
        Returns: boolean;
      };
      is_role_of_organization: {
        Args: {
          p_user_id: string;
          p_role_id: string;
        };
        Returns: boolean;
      };
      is_user_of_organization: {
        Args: {
          p_user_id: string;
          p_organization_id: string;
        };
        Returns: boolean;
      };
      use_device: {
        Args: {
          device_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;
