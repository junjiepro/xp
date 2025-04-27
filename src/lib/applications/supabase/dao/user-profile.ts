import { UserProfile } from "@/types/datas.types";
import { supabase } from "../server";
import { BaseDAO } from "./base";

class UserProfileDAO extends BaseDAO {
  async update(id: string, username: string): Promise<UserProfile> {
    const { data: updated, error } = await supabase
      .from("user_profiles")
      .update({ username })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      this.handleQueryError("update", error);
    }
    return updated;
  }

  async get(id: string): Promise<UserProfile | null> {
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      this.handleQueryError("get", error);
    }
    return user;
  }
}

export default UserProfileDAO;
