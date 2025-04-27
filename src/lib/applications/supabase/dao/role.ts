import { Role, RoleWithOrganization } from "@/types/datas.types";
import { supabase } from "../server";
import { BaseDAO } from "./base";

class RoleDAO extends BaseDAO {
  async getRolesByOrganizationId(id: string): Promise<Role[]> {
    const { data: roles, error } = await supabase
      .from("roles")
      .select("*")
      .eq("organization_id", id)
      .order("name", { ascending: true });
    if (error) {
      this.handleQueryError("getRolesByOrganizationId", error);
    }
    return roles;
  }

  async getRoleWithOrganizationsByUserId(
    id: string
  ): Promise<RoleWithOrganization[]> {
    const { data: user_roles, error } = await supabase
      .from("user_role_with_organizations")
      .select("*")
      .eq("user_id", id)
      .order("organization_name", { ascending: false })
      .order("organization_id", { ascending: false })
      .order("role_name", { ascending: false });
    if (error) {
      this.handleQueryError("getRoleWithOrganizationsByUserId", error);
    }
    return user_roles;
  }
}

export default RoleDAO;
