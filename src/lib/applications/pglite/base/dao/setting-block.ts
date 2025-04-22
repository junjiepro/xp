import { SettingBlock } from "@/types/datas.types";
import { BaseDAO } from "../../db/db";
import { PerformanceMonitor } from "../../db/monitor";
import { CryptoService } from "../../db/security";

type SecretBlock = {
  data: SettingBlock["block"];
};

class SettingBlockDAO extends BaseDAO<SettingBlock> {
  protected tableName: string = "setting_blocks";

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
        const {
          rows: [created],
        } = await this.insert<
          Omit<SettingBlock, "id" | "created_at">,
          SettingBlock
        >(trx, { ...settingBlock, block: encryptedBlock });

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

        const {
          rows: [updated],
        } = await trx.query<SettingBlock>(
          "update setting_blocks set block = $1 where id = $2 returning *",
          [encryptedBlock, id]
        );

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
        const { rows: settingBlocks } = await trx.query<SettingBlock>(
          "select * from setting_blocks where id = $1",
          [id]
        );
        if (!settingBlocks || settingBlocks.length === 0) return null;
        const settingBlock = settingBlocks[0];
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
        const { rows: settingBlocks } = await trx.query<SettingBlock>(
          `select * from setting_blocks where ${Object.keys(block)
            .map((key) => `${key} = $${key}`)
            .join(" and ")}`,
          Object.values(block)
        );
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
        const {
          rows: [deleted],
        } = await trx.query<SettingBlock>(
          "delete from setting_blocks where id = $1 returning *",
          [id]
        );

        return deleted;
      } catch (error) {
        this.handleQueryError("delete", error);
      }
    });
  }
}

export default SettingBlockDAO;
