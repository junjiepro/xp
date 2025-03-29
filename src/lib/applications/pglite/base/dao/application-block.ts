import { ApplicationBlock } from "@/types/datas.types";
import { BaseDAO } from "../../db/db";
import { PerformanceMonitor } from "../../db/monitor";
import { type Knex } from "knex";
import { DatabaseError } from "../../db/error";

class ApplicationBlockDAO extends BaseDAO<ApplicationBlock> {
  protected tableName: string = "application_blocks";
  private table = (trx?: Knex.Transaction) =>
    (trx || this.db)<ApplicationBlock>(this.tableName);

  @PerformanceMonitor.track
  async create(
    ApplicationBlock: Omit<ApplicationBlock, "id" | "created_at">
  ): Promise<ApplicationBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const [created] = await this.table(trx)
          .insert(ApplicationBlock)
          .returning("*")
          .catch((error) => {
            throw new DatabaseError("Create application block failed", error);
          });
        return created;
      } catch (error) {
        this.handleQueryError("create", error);
      }
    });
  }

  @PerformanceMonitor.track
  async update(
    id: string,
    block: ApplicationBlock["block"]
  ): Promise<ApplicationBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const [updated] = await this.table(trx)
          .update({ block })
          .where({ id })
          .returning("*")
          .catch((error) => {
            throw new DatabaseError("Update application block failed", error);
          });
        return updated;
      } catch (error) {
        this.handleQueryError("update", error);
      }
    });
  }

  @PerformanceMonitor.track
  async get(id: string): Promise<ApplicationBlock | null> {
    return this.withTransaction(async (trx) => {
      try {
        const [ApplicationBlock] = await this.table(trx)
          .where({ id })
          .catch((error) => {
            throw new DatabaseError("Get application block failed", error);
          });
        return ApplicationBlock;
      } catch (error) {
        this.handleQueryError("get", error);
      }
    });
  }

  @PerformanceMonitor.track
  async getByBlock(
    block: Partial<ApplicationBlock>
  ): Promise<ApplicationBlock[]> {
    return this.withTransaction(async (trx) => {
      try {
        const ApplicationBlocks = await this.table(trx)
          .where(block)
          .catch((error) => {
            throw new DatabaseError("Get application blocks failed", error);
          });
        return ApplicationBlocks;
      } catch (error) {
        this.handleQueryError("getAll", error);
      }
    });
  }

  @PerformanceMonitor.track
  async delete(id: string): Promise<ApplicationBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const [deleted] = await this.table(trx)
          .delete()
          .where({ id })
          .returning("*")
          .catch((error) => {
            throw new DatabaseError("Delete application block failed", error);
          });
        return deleted;
      } catch (error) {
        this.handleQueryError("delete", error);
      }
    });
  }
}
