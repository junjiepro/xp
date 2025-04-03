import { UserDevice } from "@/types/datas.types";
import { supabase } from "../server";
import { DatabaseError } from "../../pglite/db/error";

class UserDeviceDAO {
  async create(
    user: Omit<UserDevice, "id" | "created_at" | "used_at">
  ): Promise<UserDevice> {
    if (typeof user.data === undefined || user.data === null) {
      user.data = {
        name: "",
        provider: { type: "supabase" },
        user: { username: "" },
      };
    }
    if (user.data) {
      const { data: users } = await supabase.from("user_devices").select("id");
      user.data["name"] = `Device ${users?.length || 0 + 1}`;
    }
    const { data: created, error } = await supabase
      .from("user_devices")
      .insert({ ...user })
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Create user device failed", error);
    }
    return created as UserDevice;
  }

  async update(id: string, data: UserDevice["data"]): Promise<UserDevice> {
    const { data: updated, error } = await supabase
      .from("user_devices")
      .update({ data })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Update user device failed", error);
    }
    return updated as UserDevice;
  }

  async use(id: string): Promise<void> {
    await supabase.rpc("use_device", { device_id: id });
  }

  async get(id: string): Promise<UserDevice | null> {
    const { data: user, error } = await supabase
      .from("user_devices")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new DatabaseError("Get user device failed", error);
    }
    return user as UserDevice;
  }

  async getAll(): Promise<UserDevice[]> {
    const { data: users, error } = await supabase
      .from("user_devices")
      .select("*")
      .order("used_at", { ascending: false });
    if (error) {
      throw new DatabaseError("Get user devices failed", error);
    }
    return users as UserDevice[];
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("user_devices").delete().eq("id", id);
    if (error) {
      throw new DatabaseError("Delete user device failed", error);
    }
  }
}

export default UserDeviceDAO;
