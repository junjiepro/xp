import { Organization } from "@/types/datas.types";
import { supabase } from "../server";
import { DatabaseError } from "../../pglite/db/error";

class OrganizationDAO {
  async create(name: string, created_by: string): Promise<Organization> {
    const { data: created, error } = await supabase
      .from("organizations")
      .insert({ name, created_by })
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Create organization failed", error);
    }
    return created;
  }

  async update(id: string, name: string): Promise<Organization> {
    const { data: updated, error } = await supabase
      .from("organizations")
      .update({ name })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Update organization failed", error);
    }
    return updated;
  }

  async get(id: string): Promise<Organization | null> {
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new DatabaseError("Get organization failed", error);
    }
    return organization;
  }

  async getUserOrganizations(id: string): Promise<Organization[]> {
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select(
        `
        organization_id,
        user_and_roles (
            user_id
        )
        `
      )
      .eq("user_and_roles.user_id", id)
      .eq("name", "User");
    if (rolesError) {
      throw new DatabaseError("Get roles failed", rolesError);
    }
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("*")
      .in("id", roles?.map((r) => r.organization_id) || []);
    if (error) {
      throw new DatabaseError("Get organizations failed", error);
    }
    return organizations;
  }

  async delete(id: string): Promise<Organization> {
    const { data: deleted, error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Delete organization failed", error);
    }
    return deleted;
  }
}

export default OrganizationDAO;
