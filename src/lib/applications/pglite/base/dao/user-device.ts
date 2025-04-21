import { UserDevice } from "@/types/datas.types";
import { BaseDAO } from "../../db/db";
import { PerformanceMonitor } from "../../db/monitor";
import { uuid } from "@electric-sql/pglite";

class UserDeviceDAO extends BaseDAO<UserDevice> {
  protected tableName: string = "user_devices";

  @PerformanceMonitor.track
  async create(
    user: Omit<UserDevice, "created_at" | "used_at">
  ): Promise<UserDevice> {
    return this.withTransaction(async (trx) => {
      try {
        // Local provider
        if (!user.user_id) {
          const id = uuid();
          const {
            rows: [created],
          } = await this.insert<
            Omit<UserDevice, "created_at" | "used_at">,
            UserDevice
          >(trx, {
            id,
            user_id: id,
            data: user.data,
          });
          return created;
        }

        const {
          rows: [created],
        } = await this.insert<
          Omit<UserDevice, "created_at" | "used_at">,
          UserDevice
        >(trx, user);
        return created;
      } catch (error) {
        this.handleQueryError("create", error);
      }
    });
  }

  @PerformanceMonitor.track
  async update(id: string, data: UserDevice["data"]): Promise<UserDevice> {
    return this.withTransaction(async (trx) => {
      try {
        const {
          rows: [updated],
        } = await trx.query<UserDevice>(
          "update user_devices set data = $1 where id = $2 returning *",
          [data, id]
        );

        return updated;
      } catch (error) {
        this.handleQueryError("update", error);
      }
    });
  }

  @PerformanceMonitor.track
  async use(id: string): Promise<UserDevice> {
    return this.withTransaction(async (trx) => {
      try {
        const {
          rows: [updated],
        } = await trx.query<UserDevice>(
          "update user_devices set used_at = now() where id = $1 returning *",
          [id]
        );

        return updated;
      } catch (error) {
        this.handleQueryError("update", error);
      }
    });
  }

  @PerformanceMonitor.track
  async get(id: string): Promise<UserDevice | null> {
    return this.withTransaction(async (trx) => {
      try {
        const {
          rows: [user],
        } = await trx.query<UserDevice>(
          "select * from user_devices where id = $1",
          [id]
        );

        return user;
      } catch (error) {
        this.handleQueryError("get", error);
      }
    });
  }

  @PerformanceMonitor.track
  async getByUserId(user_id: string): Promise<UserDevice | null> {
    return this.withTransaction(async (trx) => {
      try {
        const {
          rows: [user],
        } = await trx.query<UserDevice>(
          "select * from user_devices where user_id = $1",
          [user_id]
        );

        return user;
      } catch (error) {
        this.handleQueryError("getByUserId", error);
      }
    });
  }

  @PerformanceMonitor.track
  async getAll(): Promise<UserDevice[]> {
    return this.withTransaction(async (trx) => {
      try {
        const { rows: users } = await trx.query<UserDevice>(
          "select * from user_devices order by used_at desc"
        );

        return users;
      } catch (error) {
        this.handleQueryError("getAll", error);
      }
    });
  }

  @PerformanceMonitor.track
  async delete(id: string): Promise<void> {
    return this.withTransaction(async (trx) => {
      try {
        await trx.query(`delete from user_devices where id = $1`, [id]);
      } catch (error) {
        this.handleQueryError("delete", error);
      }
    });
  }
}

export default UserDeviceDAO;
