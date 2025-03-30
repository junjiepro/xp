import { Role, RoleWithOrganization } from "@/types/datas.types";
import { supabase } from "../server";
import { DatabaseError } from "../../pglite/db/error";

class RoleDAO {
  async getRolesByOrganizationId(id: string): Promise<Role[]> {
    const { data: roles, error } = await supabase
      .from("roles")
      .select("*")
      .eq("organization_id", id)
      .order("name", { ascending: true });
    if (error) {
      throw new DatabaseError("Get roles failed", error);
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
      throw new DatabaseError("Get user_roles failed", error);
    }
    return user_roles;
  }
}

export default RoleDAO;
