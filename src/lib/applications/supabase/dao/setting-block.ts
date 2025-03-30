import { SettingBlock } from "@/types/datas.types";
import { DatabaseError } from "../../pglite/db/error";
import { supabase } from "../server";
import { CryptoService } from "../../pglite/db/security";

type SecretBlock = {
  data: SettingBlock["block"];
};

class SettingBlockDAO {
  async create(
    settingBlock: Omit<SettingBlock, "id" | "created_at">
  ): Promise<SettingBlock> {
    const secretBlock: SecretBlock = { data: settingBlock.block };
    const encryptedBlock = await CryptoService.encrypt(
      JSON.stringify(secretBlock)
    );
    const { data: created, error } = await supabase
      .from("setting_blocks")
      .insert({ ...settingBlock, block: encryptedBlock } as any)
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Create setting block failed", error);
    }
    return created as SettingBlock;
  }

  async update(
    id: string,
    block: SettingBlock["block"]
  ): Promise<SettingBlock> {
    const secretBlock: SecretBlock = { data: block };
    const encryptedBlock = await CryptoService.encrypt(
      JSON.stringify(secretBlock)
    );
    const { data: updated, error } = await supabase
      .from("setting_blocks")
      .update({ block: encryptedBlock })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Update setting block failed", error);
    }
    return updated as SettingBlock;
  }

  async get(id: string): Promise<SettingBlock | null> {
    const { data: settingBlock, error } = await supabase
      .from("setting_block_with_permissions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new DatabaseError("Get setting block failed", error);
    }
    if (!settingBlock.block) return settingBlock;
    const secretBlock: SecretBlock = JSON.parse(
      await CryptoService.decrypt(settingBlock.block as string)
    );
    return { ...settingBlock, block: secretBlock.data };
  }

  async getByBlock(block: Partial<SettingBlock>): Promise<SettingBlock[]> {
    const { data: settingBlocks, error } = await supabase
      .from("setting_block_with_permissions")
      .select("*")
      .match(block);
    if (error) {
      throw new DatabaseError("Get setting blocks failed", error);
    }
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
  }

  async delete(id: string): Promise<SettingBlock> {
    const { data: deleted, error } = await supabase
      .from("setting_blocks")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new DatabaseError("Delete setting block failed", error);
    }
    return deleted as SettingBlock;
  }
}

export default SettingBlockDAO;
