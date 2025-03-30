import { UserProfile } from "@/types/datas.types";
import { supabase } from "../server";
import { DatabaseError } from "../../pglite/db/error";

class UserProfileDAO {
  async update(id: string, username: string): Promise<UserProfile> {
    const { data: updated, error } = await supabase
      .from("user_profiles")
      .update({ username })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Update user profile failed", error);
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
      throw new DatabaseError("Get user profile failed", error);
    }
    return user;
  }
}

export default UserProfileDAO;
