import { init } from "../db/db";
import { migrations, memoryDbMigrations } from "./migration";
import UserDeviceDAO from "./dao/user-device";
import SettingBlockDAO from "./dao/setting-block";
import ApplicationBlockDAO from "./dao/application-block";
import { type Knex } from "knex";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { UserDevice } from "@/types/datas.types";

const db = await init(migrations, "xp-pglite");

const sessionKey = "xp-local-provider-session";

class LocalProvider {
  private localStorage = window.localStorage;
  private localSession?: Session;
  private authStateChangeCallback?: (
    event: AuthChangeEvent,
    session: Session | null
  ) => void | Promise<void>;

  private db = db;
  private memoryDb?: Knex;

  private userDeviceDao = new UserDeviceDAO(this.db);
  private settingBlockDao = new SettingBlockDAO(this.db);
  private applicationBlockDao = new ApplicationBlockDAO(this.db);

  private memoryApplicationBlock?: ApplicationBlockDAO;

  private currentUserDevice?: UserDevice;

  /// Auth

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
      const sessionData = this.localStorage.getItem(sessionKey);
      if (sessionData) {
        let session: Session | null = null;
        try {
          session = JSON.parse(sessionData);
        } catch (error) {
          console.error("Failed to parse session data:", error);
        }

        if (session) {
          // Check if user exists
          this.userDeviceDao.getByUserId(session.user.id).then((device) => {
            if (device && device.id === device.user_id) {
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
    let device = devices.find((device) => device.user_id === device.id);
    if (!device) {
      // create local user
      device = await this.createUserDevice({
        user_id: "",
        data: {
          name: "Local User",
          provider: {
            type: "local",
            url: "",
          },
          user: {
            username: "Local User",
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
      this.localStorage.setItem(sessionKey, JSON.stringify(session));
      this.authStateChangeCallback?.("SIGNED_IN", session);
      this.useDevice(device.id).then((d) => {
        this.currentUserDevice = d;
      });
    }
  }

  async signOut() {
    this.localSession = undefined;
    this.localStorage.removeItem(sessionKey);
    this.authStateChangeCallback?.("SIGNED_OUT", null);
  }

  /// DB

  async createUserDevice(
    user: Omit<UserDevice, "id" | "created_at" | "used_at">
  ) {
    return this.userDeviceDao.create(user);
  }

  async getAllDevices() {
    return this.userDeviceDao.getAll();
  }

  async useDevice(id: string) {
    return this.userDeviceDao.use(id);
  }

  /// Memory DB

  async initMemoryDb() {
    this.memoryDb = await init(memoryDbMigrations);
    this.memoryApplicationBlock = new ApplicationBlockDAO(this.memoryDb);
  }

  async closeMemoryDb() {
    if (this.memoryDb) {
      await this.memoryDb.destroy();
      this.memoryDb = undefined;
      this.memoryApplicationBlock = undefined;
    }
  }
}

export default LocalProvider;
