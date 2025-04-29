import { AuthChangeEvent, Session, Subscription } from "@supabase/supabase-js";
import LocalProvider from "../pglite/base";
import { SupabaseProvider } from "../supabase/server";
import { UserDevice, UserDeviceData } from "@/types/datas.types";

class XpServer {
  private localProvider = new LocalProvider();
  private supabaseProvider = new SupabaseProvider();

  currentUserDevice: UserDevice | undefined;

  /// Auth

  onAuthStateChange(
    callback: (
      event: AuthChangeEvent,
      session: Session | null
    ) => void | Promise<void>
  ) {
    const self = this;

    this.localProvider.onAuthStateChange(callback);
    const supabaseCallback = async (
      event: AuthChangeEvent,
      session: Session | null
    ) => {
      if (!self.localProvider.isSignedIn()) {
        await callback(event, session);
      }
    };
    return this.supabaseProvider.onAuthStateChange(supabaseCallback);
  }

  async signIn() {
    await this.localProvider.signIn();
  }

  async signOut() {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.signOut()
      : await this.supabaseProvider.signOut();
  }

  /// DB

  /// User

  async getUserProfile(userId: string) {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.getUserProfile(userId)
      : await this.supabaseProvider.getUserProfile(userId);
  }

  async updateUserProfile(userId: string, username: string) {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.updateUserProfile(userId, username)
      : await this.supabaseProvider.updateUserProfile(userId, username);
  }

  /// Device

  async getCurrentDevices(): Promise<UserDevice[]> {
    return this.localProvider.isSignedIn()
      ? [this.localProvider.getCurrentDevice()!]
      : await this.supabaseProvider.getDevices();
  }

  async getAllLocalDevices(): Promise<UserDevice[] | undefined> {
    return this.localProvider.getAllDevices();
  }

  async createOrUseDevice(userId: string) {
    if (this.localProvider.isSignedIn()) {
      this.currentUserDevice = await this.localProvider.useDevice(userId);
    } else {
      let deviceInLocal = await this.localProvider.getDeviceByUserId(userId);
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
        this.currentUserDevice = await this.localProvider.useDevice(
          deviceInLocal.id,
          deviceInSupabase
        );
      }
      if (deviceInSupabase) {
        await this.supabaseProvider.useDevice(deviceInSupabase.id);
      }
    }
  }

  async updateDevice(id: string, data: UserDeviceData) {
    if (this.localProvider.isSignedIn()) {
      this.localProvider.updateUserDevice(id, data);
    } else {
      this.supabaseProvider.updateDevice(id, data);
      const deviceInLocal = await this.localProvider.getDevice(id);
      if (deviceInLocal) {
        this.localProvider.updateUserDevice(id, data);
      }
    }
  }

  /// Organization

  async createNewOrganization(name: string, created_by: string) {
    if (this.localProvider.isSignedIn()) {
      throw new Error("Local provider not support create organization");
    } else {
      return await this.supabaseProvider.createNewOrganization(
        name,
        created_by
      );
    }
  }

  async getOrganizationsByUserId(userId: string) {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.getOrganizationsByUserId(userId)
      : await this.supabaseProvider.getOrganizationsByUserId(userId);
  }

  async deleteOrganization(id: string) {
    if (this.localProvider.isSignedIn()) {
      throw new Error("Local provider not support delete organization");
    } else {
      return this.supabaseProvider.deleteOrganization(id);
    }
  }

  async updateOrganizationName(id: string, name: string) {
    if (this.localProvider.isSignedIn()) {
      throw new Error("Local provider not support update organization name");
    } else {
      return this.supabaseProvider.updateOrganizationName(id, name);
    }
  }

  /// Role

  async getRoleWithOrganizationsByUserId(userId: string) {
    return this.localProvider.isSignedIn()
      ? await this.localProvider.getRoleWithOrganizationsByUserId(userId)
      : await this.supabaseProvider.getRoleWithOrganizationsByUserId(userId);
  }

  async getRolesByOrganizationId(organization_id: string) {
    if (this.localProvider.isSignedIn()) {
      throw this.localProvider.getRolesByOrganizationId(organization_id);
    } else {
      return this.supabaseProvider.getRolesByOrganizationId(organization_id);
    }
  }
}

const xpServer = new XpServer();

export default xpServer;
