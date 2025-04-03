import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import LocalProvider from "../pglite/base";
import { SupabaseProvider } from "../supabase/server";
import { UserDevice } from "@/types/datas.types";

class XpServer {
  private localProvider = new LocalProvider();
  private supabaseProvider = new SupabaseProvider();

  /// Auth

  onAuthStateChange(
    callback: (
      event: AuthChangeEvent,
      session: Session | null
    ) => void | Promise<void>
  ) {
    this.localProvider.onAuthStateChange(callback);
    return this.supabaseProvider.onAuthStateChange(callback);
  }

  async signIn() {
    return await this.localProvider.signIn();
  }

  async signOut() {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.signOut()
      : await this.supabaseProvider.signOut();
  }

  /// DB

  async getUserProfile(userId: string) {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.getUserProfile(userId)
      : await this.supabaseProvider.getUserProfile(userId);
  }

  async getOrganizationsByUserId(userId: string) {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.getOrganizationsByUserId(userId)
      : await this.supabaseProvider.getOrganizationsByUserId(userId);
  }

  async getRoleWithOrganizationsByUserId(userId: string) {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.getRoleWithOrganizationsByUserId(userId)
      : await this.supabaseProvider.getRoleWithOrganizationsByUserId(userId);
  }

  async getCurrentDevices(): Promise<UserDevice[]> {
    return this.localProvider.isSignedIn()
      ? [this.localProvider.getCurrentDevice()!]
      : await this.supabaseProvider.getDevices();
  }

  async createOrUseDevice(userId: string) {
    if (this.localProvider.isSignedIn()) {
      await this.localProvider.useDevice(userId);
    } else {
      let deviceInLocal = await this.localProvider.getByUserId(userId);
      let deviceInSupabase: UserDevice | null = null;
      if (deviceInLocal) {
        deviceInSupabase = await this.supabaseProvider.getDevice(
          deviceInLocal.id
        );
        if (!deviceInSupabase) {
          deviceInSupabase = await this.supabaseProvider.createDevice(
            userId,
            deviceInLocal.data?.name
          );
        }
      } else {
        deviceInSupabase = await this.supabaseProvider.createDevice(userId);
        deviceInLocal = await this.localProvider.createUserDevice({
          id: deviceInSupabase.id,
          user_id: userId,
          data: deviceInSupabase.data,
        });
      }

      if (deviceInLocal) {
        await this.localProvider.useDevice(deviceInLocal.id);
      }
      if (deviceInSupabase) {
        await this.supabaseProvider.useDevice(deviceInSupabase.id);
      }
    }
  }
}

const xpServer = new XpServer();

export default xpServer;
