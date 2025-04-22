import { ApplicationBlock } from "@/types/datas.types";
import { BaseDAO } from "../../db/db";
import { PerformanceMonitor } from "../../db/monitor";

class ApplicationBlockDAO extends BaseDAO<ApplicationBlock> {
  protected tableName: string = "application_blocks";

  @PerformanceMonitor.track
  async create(
    applicationBlock: Omit<ApplicationBlock, "id" | "created_at">
  ): Promise<ApplicationBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const {
          rows: [created],
        } = await this.insert<
          Omit<ApplicationBlock, "id" | "created_at">,
          ApplicationBlock
        >(trx, applicationBlock);
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
        const {
          rows: [updated],
        } = await trx.query<ApplicationBlock>(
          "update application_blocks set block = $1 where id = $2 returning *",
          [block, id]
        );
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
        const { rows: applicationBlocks } = await trx.query<ApplicationBlock>(
          "select * from application_blocks where id = $1",
          [id]
        );
        if (!applicationBlocks || applicationBlocks.length === 0) return null;
        const applicationBlock = applicationBlocks[0];
        return applicationBlock;
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
        const { rows: applicationBlocks } = await trx.query<ApplicationBlock>(
          `select * from application_blocks where ${Object.keys(block)
            .map((key) => `${key} = $${key}`)
            .join(" and ")}`,
          Object.values(block)
        );
        return applicationBlocks;
      } catch (error) {
        this.handleQueryError("getAll", error);
      }
    });
  }

  @PerformanceMonitor.track
  async delete(id: string): Promise<ApplicationBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const {
          rows: [deleted],
        } = await trx.query<ApplicationBlock>(
          "delete from application_blocks where id = $1 returning *",
          [id]
        );
        return deleted;
      } catch (error) {
        this.handleQueryError("delete", error);
      }
    });
  }
}

export default ApplicationBlockDAO;
