import { UserDevice } from "@/types/datas.types";
import { BaseDAO } from "../../db/db";
import { PerformanceMonitor } from "../../db/monitor";
import { DatabaseError } from "../../db/error";

class UserDeviceDAO extends BaseDAO<UserDevice> {
  protected tableName: string = "user_devices";
  private table = (trx?: Knex.Transaction) =>
    (trx || this.db)<UserDevice>(this.tableName);

  @PerformanceMonitor.track
  async create(
    user: Omit<UserDevice, "created_at" | "used_at">
  ): Promise<UserDevice> {
    return this.withTransaction(async (trx) => {
      try {
        // Local provider
        if (!user.user_id) {
          const id = this.db.fn.uuid();
          const [created] = await this.table(trx)
            .insert({ ...user, id, user_id: id })
            .returning("*")
            .catch((error: any) => {
              throw new DatabaseError("Create user device failed", error);
            });
          return created;
        }
        const [created] = await this.table(trx)
          .insert(user)
          .returning("*")
          .catch((error: any) => {
            throw new DatabaseError("Create user device failed", error);
          });
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
        const [updated] = await this.table(trx)
          .update({ data })
          .where({ id })
          .returning("*")
          .catch((error: any) => {
            throw new DatabaseError("Update user device failed", error);
          });
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
        const [updated] = await this.table(trx)
          .update({ used_at: this.db.fn.now() })
          .where({ id })
          .returning("*")
          .catch((error: any) => {
            throw new DatabaseError("Update user device used_at failed", error);
          });
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
        const [user] = await this.table(trx)
          .where({ id })
          .catch((error: any) => {
            throw new DatabaseError("Get user device failed", error);
          });
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
        const [user] = await this.table(trx)
          .where({ user_id })
          .catch((error: any) => {
            throw new DatabaseError("Get user device by user_id failed", error);
          });
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
        const users = await this.table(trx)
          .orderBy("used_at", "desc")
          .catch((error: any) => {
            throw new DatabaseError("Get user devices failed", error);
          });
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
        await this.table(trx)
          .where({ id })
          .del()
          .catch((error: any) => {
            throw new DatabaseError("Delete user device failed", error);
          });
      } catch (error) {
        this.handleQueryError("delete", error);
      }
    });
  }
}

export default UserDeviceDAO;
