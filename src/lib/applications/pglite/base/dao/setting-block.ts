import { SettingBlock } from "@/types/datas.types";
import { BaseDAO } from "../../db/db";
import { PerformanceMonitor } from "../../db/monitor";
import { type Knex } from "knex";
import { DatabaseError } from "../../db/error";
import { CryptoService } from "../../db/security";

type SecretBlock = {
  data: SettingBlock["block"];
};

class SettingBlockDAO extends BaseDAO<SettingBlock> {
  protected tableName: string = "setting_blocks";
  private table = (trx?: Knex.Transaction) =>
    (trx || this.db)<SettingBlock>(this.tableName);

  @PerformanceMonitor.track
  async create(
    settingBlock: Omit<SettingBlock, "id" | "created_at">
  ): Promise<SettingBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const secretBlock: SecretBlock = { data: settingBlock.block };
        const encryptedBlock = await CryptoService.encrypt(
          JSON.stringify(secretBlock)
        );
        const [created] = await this.table(trx)
          .insert({ ...settingBlock, block: encryptedBlock })
          .returning("*")
          .catch((error) => {
            throw new DatabaseError("Create setting block failed", error);
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
    block: SettingBlock["block"]
  ): Promise<SettingBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const secretBlock: SecretBlock = { data: block };
        const encryptedBlock = await CryptoService.encrypt(
          JSON.stringify(secretBlock)
        );
        const [updated] = await this.table(trx)
          .update({ block: encryptedBlock })
          .where({ id })
          .returning("*")
          .catch((error) => {
            throw new DatabaseError("Update setting block failed", error);
          });
        return updated;
      } catch (error) {
        this.handleQueryError("update", error);
      }
    });
  }

  @PerformanceMonitor.track
  async get(id: string): Promise<SettingBlock | null> {
    return this.withTransaction(async (trx) => {
      try {
        const [settingBlock] = await this.table(trx)
          .where({ id })
          .catch((error) => {
            throw new DatabaseError("Get setting block failed", error);
          });
        if (!settingBlock) return null;
        if (!settingBlock.block) return settingBlock;
        const secretBlock: SecretBlock = JSON.parse(
          await CryptoService.decrypt(settingBlock.block as string)
        );
        return { ...settingBlock, block: secretBlock.data };
      } catch (error) {
        this.handleQueryError("get", error);
      }
    });
  }

  @PerformanceMonitor.track
  async getByBlock(block: Partial<SettingBlock>): Promise<SettingBlock[]> {
    return this.withTransaction(async (trx) => {
      try {
        const settingBlocks = await this.table(trx)
          .where(block)
          .catch((error) => {
            throw new DatabaseError("Get setting blocks failed", error);
          });
        const decryptedSettingBlocks = await Promise.all(
          settingBlocks.map(async (settingBlock) => {
            if (!settingBlock.block) return settingBlock;
            const secretBlock: SecretBlock = JSON.parse(
              await CryptoService.decrypt(settingBlock.block as string)
            );
            return { ...settingBlock, block: secretBlock.data };
          })
        );
        return decryptedSettingBlocks;
      } catch (error) {
        this.handleQueryError("getAll", error);
      }
    });
  }

  @PerformanceMonitor.track
  async delete(id: string): Promise<SettingBlock> {
    return this.withTransaction(async (trx) => {
      try {
        const [deleted] = await this.table(trx)
          .delete()
          .where({ id })
          .returning("*")
          .catch((error) => {
            throw new DatabaseError("Delete setting block failed", error);
          });
        return deleted;
      } catch (error) {
        this.handleQueryError("delete", error);
      }
    });
  }
}

export default SettingBlockDAO;
