import { init } from "../db/db";
import { migrations, memoryDbMigrations } from "./migration";
import UserDeviceDAO from "./dao/user-device";
import SettingBlockDAO from "./dao/setting-block";
import ApplicationBlockDAO from "./dao/application-block";
import { type PGlite } from "@electric-sql/pglite";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  Organization,
  Role,
  RoleWithOrganization,
  UserDevice,
  UserProfile,
} from "@/types/datas.types";

const db = init(migrations, "idb://xp-pglite");

const sessionKey = "xp-local-provider-session";

class LocalProvider {
  private localStorage: Storage | null = process.browser
    ? window.localStorage
    : null;
  private localSession?: Session;
  private authStateChangeCallback?: (
    event: AuthChangeEvent,
    session: Session | null
  ) => void | Promise<void>;

  private db = db;
  private memoryDb?: PGlite;

  private userDeviceDao = this.db ? new UserDeviceDAO(this.db) : undefined;
  private settingBlockDao = this.db ? new SettingBlockDAO(this.db) : undefined;
  private applicationBlockDao = this.db
    ? new ApplicationBlockDAO(this.db)
    : undefined;

  private memoryApplicationBlock?: ApplicationBlockDAO;

  private currentUserDevice?: UserDevice;

  /// Auth

  isSignedIn() {
    return !!this.localSession;
  }

  getCurrentDevice() {
    return this.currentUserDevice;
  }

  onAuthStateChange(
    callback: (
      event: AuthChangeEvent,
      session: Session | null
    ) => void | Promise<void>
  ) {
    this.authStateChangeCallback = callback;

    // Check if session exists
    if (!this.localSession) {
      // Check if session exists in localStorage
      const sessionData = this.localStorage?.getItem(sessionKey);
      if (sessionData) {
        let session: Session | null = null;
        try {
          session = JSON.parse(sessionData);
        } catch (error) {
          console.error("Failed to parse session data:", error);
        }

        if (session) {
          // Check if user exists
          this.userDeviceDao?.getByUserId(session.user.id).then((device) => {
            if (device && device.id === device.user_id && session) {
              this.currentUserDevice = device;
              this.localSession = session;
              this.authStateChangeCallback?.("SIGNED_IN", session);
              this.useDevice(device.id).then((d) => {
                this.currentUserDevice = d;
              });
            }
          });
        }
      }
    }

    return { data: { subscription: undefined } };
  }

  async signIn() {
    const devices = await this.getAllDevices();
    // find local user
    let device = devices?.find((device) => device.user_id === device.id);
    if (!device) {
      // create local user
      device = await this.createUserDevice({
        id: "",
        user_id: "",
        data: {
          name: "Local User",
          provider: {
            type: "local",
          },
          user: {
            username: "Local User",
            email: "Local User",
          },
        },
      });
    }
    if (device) {
      // create session
      const session: Session = {
        user: {
          id: device.id,
          email: device.data?.name,
          app_metadata: {},
          user_metadata: {},
          aud: "",
          created_at: device.created_at,
        },
        access_token: device.id,
        refresh_token: "",
        expires_in: 0,
        token_type: "",
      };
      this.currentUserDevice = device;
      this.localSession = session;
      this.localStorage?.setItem(sessionKey, JSON.stringify(session));
      this.authStateChangeCallback?.("SIGNED_IN", session);
      this.useDevice(device.id).then((d) => {
        this.currentUserDevice = d;
      });
    }
  }

  async signOut() {
    this.localSession = undefined;
    this.localStorage?.removeItem(sessionKey);
    this.authStateChangeCallback?.("SIGNED_OUT", null);

    return {
      error: null,
    };
  }

  /// Local session

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const device = await this.userDeviceDao?.get(userId);
    return device
      ? {
          id: device.id,
          username: device.data?.name || "",
          created_at: device.created_at,
        }
      : null;
  }

  async updateUserProfile(id: string, username: string): Promise<UserProfile> {
    const device = await this.userDeviceDao?.update(id, {
      name: username,
      provider: {
        type: "local",
      },
      user: {
        username: username,
        email: username,
      },
    });
    if (!device) {
      throw new Error("Update user profile failed");
    }
    return {
      id: device.id,
      username: device.data?.name || "",
      created_at: device.created_at,
    };
  }

  async getOrganizationsByUserId(id: string): Promise<Organization[]> {
    const device = await this.userDeviceDao?.get(id);
    if (!device) {
      return [];
    }
    return [
      {
        id: device.id,
        name: device.data?.name || "",
        created_at: device.created_at,
        created_by: device.id,
      },
    ];
  }

  async getRoleWithOrganizationsByUserId(
    userId: string
  ): Promise<RoleWithOrganization[]> {
    const device = await this.userDeviceDao?.get(userId);
    if (!device) {
      return [];
    }
    const base: RoleWithOrganization = {
      organization_id: device.id,
      organization_name: device.data?.name || "",
      role_id: null,
      role_name: null,
      user_id: device.id,
      user_name: device.data?.name || "",
    };
    return ["Owner", "Administrator", "User"].map((role) => ({
      ...base,
      role_id: `${device.id}-${role}`,
      role_name: role,
    }));
  }

  async getRolesByOrganizationId(organization_id: string): Promise<Role[]> {
    const device = this.getCurrentDevice();
    if (!device) {
      return [];
    }
    return ["Owner", "Administrator", "User"].map((role) => ({
      id: `${device.id}-${role}`,
      organization_id,
      name: role,
      created_at: device.created_at,
      editable: false,
    }));
  }

  /// DB

  async createUserDevice(user: Omit<UserDevice, "created_at" | "used_at">) {
    return this.userDeviceDao?.create(user);
  }

  async getAllDevices() {
    return this.userDeviceDao?.getAll();
  }

  async useDevice(id: string, remoteUserDevice?: UserDevice) {
    return this.userDeviceDao?.use(id, remoteUserDevice);
  }

  async getDevice(id: string) {
    return this.userDeviceDao?.get(id);
  }

  async getDeviceByUserId(id: string) {
    return this.userDeviceDao?.getByUserId(id);
  }

  async updateUserDevice(id: string, data: UserDevice["data"]) {
    return this.userDeviceDao?.update(id, data);
  }

  /// Memory DB

  async initMemoryDb() {
    this.memoryDb = init(memoryDbMigrations);
    if (this.memoryDb)
      this.memoryApplicationBlock = new ApplicationBlockDAO(this.memoryDb);
  }

  async closeMemoryDb() {
    if (this.memoryDb) {
      await this.memoryDb.close();
      this.memoryDb = undefined;
      this.memoryApplicationBlock = undefined;
    }
  }
}

export default LocalProvider;
