import { ApplicationBlock } from "@/types/datas.types";
import { BaseDAO } from "./base";
import { supabase } from "../server";

class ApplicationBlockDAO extends BaseDAO {
  async create(
    applicationBlock: Omit<ApplicationBlock, "id" | "created_at">
  ): Promise<ApplicationBlock> {
    const { data: created, error } = await supabase
      .from("application_blocks")
      .insert({ ...applicationBlock })
      .select()
      .single();
    if (error) {
      this.handleQueryError("create", error);
    }
    return created;
  }

  async update(
    id: string,
    block: ApplicationBlock["block"]
  ): Promise<ApplicationBlock> {
    const { data: updated, error } = await supabase
      .from("application_blocks")
      .update({ block })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      this.handleQueryError("update", error);
    }
    return updated;
  }

  async get(id: string): Promise<ApplicationBlock | null> {
    const { data: applicationBlock, error } = await supabase
      .from("application_blocks")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      this.handleQueryError("get", error);
    }
    return applicationBlock;
  }

  async getByBlock(
    block: Partial<ApplicationBlock>
  ): Promise<ApplicationBlock[]> {
    const { data: applicationBlocks, error } = await supabase
      .from("application_blocks")
      .select("*")
      .match(block);
    if (error) {
      this.handleQueryError("getByBlock", error);
    }
    return applicationBlocks;
  }

  async delete(id: string): Promise<ApplicationBlock> {
    const { data: deleted, error } = await supabase
      .from("application_blocks")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error) {
      this.handleQueryError("delete", error);
    }
    return deleted as ApplicationBlock;
  }
}

export default ApplicationBlockDAO;
