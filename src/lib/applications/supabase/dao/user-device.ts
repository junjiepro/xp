import { UserDevice } from "@/types/datas.types";
import { supabase } from "../server";
import { BaseDAO } from "./base";

class UserDeviceDAO extends BaseDAO {
  async create(
    user: Omit<UserDevice, "id" | "created_at" | "used_at">
  ): Promise<UserDevice> {
    if (!user.data) {
      user.data = {
        name: "",
        provider: { type: "supabase" },
        user: { username: "", email: "" },
      };
    }
    if (user.data && !user.data.name) {
      const { data: users } = await supabase.from("user_devices").select("id");
      user.data["name"] = `Device ${users?.length || 0 + 1}`;
    }
    const { data: created, error } = await supabase
      .from("user_devices")
      .insert({ ...user })
      .select()
      .single();
    if (error) {
      this.handleQueryError("create", error);
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
      this.handleQueryError("update", error);
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
      this.handleQueryError("get", error);
    }
    return user as UserDevice;
  }

  async getAll(): Promise<UserDevice[]> {
    const { data: users, error } = await supabase
      .from("user_devices")
      .select("*")
      .order("used_at", { ascending: false });
    if (error) {
      this.handleQueryError("getAll", error);
    }
    return users as UserDevice[];
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("user_devices").delete().eq("id", id);
    if (error) {
      this.handleQueryError("delete", error);
    }
  }
}

export default UserDeviceDAO;
