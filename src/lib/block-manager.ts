import type { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type SettingBlock = Database["public"]["Tables"]["setting_blocks"]["Row"];

const supabase = createClientComponentClient<Database>();

class SettingBlockManager<T extends Record<string, any>> {
  private applicationKey: string;
  private rootBlockKey: string;
  private data: T;
  private blocks: SettingBlock[] = [];
  private access: Record<string, any> = {};
  private loading = false;
  private saving = false;
  constructor(applicationKey: string, rootBlockKey: string, defaultData: T) {
    this.applicationKey = applicationKey;
    this.rootBlockKey = rootBlockKey;
    this.data = defaultData;
    this.load();
  }
  async load() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    const { data: data1 } = await supabase
      .from("setting_blocks")
      .select("*")
      .eq("application_key", this.applicationKey)
      .eq("block_key", this.rootBlockKey);
    if (data1) {
      this.blocks = data1;
    }
    const { data: data2 } = await supabase
      .from("setting_blocks")
      .select("*")
      .eq("application_key", this.applicationKey)
      .like("block_key", `${this.rootBlockKey}.%`)
      .neq("block_key", this.rootBlockKey);
    if (data2) {
      this.blocks = this.blocks.concat(data2);
    }
    this.fromBlocks();
    this.loading = false;
  }
  async save() {
    if (this.saving) {
      return;
    }
    this.saving = true;
    this.toBlocks();
    for (const block of this.blocks) {
      const { error } = await supabase
        .from("setting_blocks")
        .update({ block: block.block, access: block.access })
        .eq("id", block.id);
      if (error) {
        console.error(error);
      }
    }
    this.saving = false;
  }
  toBlocks() {}
  fromBlocks() {
    const prev = this.data;
    this.data = this.blocks.reduce<T>((data, block) => {
      // TODO
      this.access[block.block_key] = block.access;
      const keys = block.block_key.split(".");
      let current = data;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = block.block;
      return data;
    }, prev);
  }
  getData(): Readonly<T> {
    return Object.freeze(this.data);
  }
  getDataAccess(key: string): Readonly<any> {
    let a = this.access[key];
    if (a) return Object.freeze(a);
    const keys = key.split(".");
    while (keys.pop()) {
      a = this.access[keys.join(".")];
      if (a) return Object.freeze(a);
    }
    return Object.freeze({});
  }
}
