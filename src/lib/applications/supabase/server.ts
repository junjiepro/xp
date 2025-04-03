import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import UserProfileDao from "../supabase/dao/user-profile";
import UserDeviceDao from "../supabase/dao/user-device";
import OrganizationDao from "../supabase/dao/organization";
import RoleDao from "../supabase/dao/role";
import SettingBlockDao from "../supabase/dao/setting-block";
import ApplicationBlockDao from "../supabase/dao/application-block";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export const supabase = createClientComponentClient<Database>();

class SupabaseProvider {
  private supabase = supabase;

  private userProfileDao = new UserProfileDao();
  private userDeviceDao = new UserDeviceDao();
  private organizationDao = new OrganizationDao();
  private roleDao = new RoleDao();
  private settingBlockDao = new SettingBlockDao();
  private applicationBlockDao = new ApplicationBlockDao();

  /// Auth

  onAuthStateChange(
    callback: (
      event: AuthChangeEvent,
      session: Session | null
    ) => void | Promise<void>
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  /// DB

  async getUserProfile(id: string) {
    return this.userProfileDao.get(id);
  }

  async getOrganizationsByUserId(id: string) {
    return this.organizationDao.getUserOrganizations(id);
  }

  async getRoleWithOrganizationsByUserId(userId: string) {
    return this.roleDao.getRoleWithOrganizationsByUserId(userId);
  }

  async getDevices() {
    return this.userDeviceDao.getAll();
  }

  async createDevice(userId: string, name?: string) {
    return this.userDeviceDao.create({
      user_id: userId,
      ...(name
        ? {
            data: {
              name,
              provider: { type: "supabase" },
              user: { username: "" },
            },
          }
        : {}),
    });
  }

  async useDevice(id: string) {
    return this.userDeviceDao.use(id);
  }

  async getDevice(id: string) {
    return this.userDeviceDao.get(id);
  }
}

export { SupabaseProvider };
