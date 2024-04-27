import { Database } from "@/types/database.types";
import { Access } from "@/types/datas.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import * as React from "react";

type SettingBlock = Database["public"]["Tables"]["setting_blocks"]["Row"];

const supabase = createClientComponentClient<Database>();

export function useSettingBlock<T>(
  applicationKey: string,
  rootBlockKey: string,
  defaultData: T
) {
  // TODO: Add access control
  const [blocks, setBlocks] = React.useState<SettingBlock[]>([]);
  const [access, setAccess] = React.useState<Record<string, Access>>({});
  const [data, setData] = React.useState<T>(defaultData);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setData((prev) => {
      const res = blocks.reduce<{ a: Record<string, any>; d: T }>(
        (d, block) => {
          d.a[block.block_key] = block.access;
          const keys = block.block_key.split(".");
          let current = d.d;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = block.block;
          return d;
        },
        {
          a: {},
          d: prev,
        }
      );
      setAccess((prevAccess) => ({ ...prevAccess, ...res.a }));
      return res.d;
    });
  }, [blocks]);

  const load = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    supabase
      .from("setting_blocks")
      .select("*")
      .eq("application_key", applicationKey)
      .eq("block_key", rootBlockKey)
      .then(({ data }) => {
        setBlocks((prev) => prev.concat(data || []));
        supabase
          .from("setting_blocks")
          .select("*")
          .eq("application_key", applicationKey)
          .like("block_key", `${rootBlockKey}.%`)
          .neq("block_key", rootBlockKey)
          .then(({ data }) => {
            setBlocks((prev) => prev.concat(data || []));
            setLoading(false);
          });
      });
  };

  React.useEffect(() => {
    load();
  }, []);

  const updateData = (key: string, value: any) => {
    setData((prev) => {
      const keys = key.split(".");
      let current = prev;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return prev;
    });
  };
  const updateAccess = (key: string, value: Access) => {
    setAccess((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {};

  return {
    data,
    access,
    reload: load,
    loading,
    save,
    saving,
    updateData,
    updateAccess,
  };
}
