import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import * as React from "react";
import { useUserProfile } from "./use-user-profile";
import {
  Block,
  Blocks,
  EdittingBlock,
  SettingBlockHandler,
} from "@/types/datas.types";

const supabase = createClientComponentClient<Database>();

export function useSettingBlock<T>(
  organizationId: string,
  applicationKey: string,
  blockKey: string,
  defaultData: T
): SettingBlockHandler<T> {
  const user = useUserProfile();
  const [loading, setLoading] = React.useState(false);
  const [blocks, setBlocks] = React.useState<Blocks<T>>({
    public: [],
    private: {
      id: "",
      organization_id: organizationId,
      application_key: applicationKey,
      block_key: blockKey,
      block: defaultData,
      access: {
        owners: [],
        roles: [],
      },
      is_admin: false,
      is_owner: false,
      user_id: "",
      created_at: "",
    },
  });

  const _load = async () => {
    if (user?.id) {
      console.log("loading...", organizationId, applicationKey, blockKey);
      const { data: publicDate } = await supabase
        .from("setting_block_with_permissions")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("application_key", applicationKey)
        .eq("block_key", blockKey)
        .is("user_id", null)
        .order("created_at", { ascending: true });

      const { data: privateData } = await supabase
        .from("setting_blocks")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("application_key", applicationKey)
        .eq("block_key", blockKey)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      setBlocks((prev) => ({
        public: (publicDate as Block<T>[]) || [],
        private: privateData?.length
          ? (privateData[0] as Block<T>)
          : prev.private,
      }));
    }
  };
  const load = () => {
    if (loading) {
      return;
    }
    setLoading(true);

    _load().then(() => setLoading(false));
  };

  React.useEffect(() => {
    if (organizationId && user?.id) {
      load();
    }
  }, [organizationId, user?.id]);

  const mutate = async (block: Block<T>) => {
    if (user?.id) {
      if (!block.id) {
        await supabase.from("setting_blocks").insert({
          organization_id: organizationId,
          application_key: applicationKey,
          block_key: blockKey,
          block: block.block as any,
          access: block.access,
          user_id: block.user_id,
        });
      } else {
        await supabase
          .from("setting_blocks")
          .update({
            block: block.block as any,
            access: block.access,
          })
          .eq("id", block.id);
      }

      load();
    }
  };

  const mutateBlock = async (
    block: Block<T> | EdittingBlock<T>,
    target: "public" | "private"
  ) => {
    const prev = blocks;
    if (target === "public") {
      let next: Block<T> | undefined;
      const next_public = prev.public.map((b) => {
        if (b.id === block.id) {
          next = { ...b, ...block };
          next.user_id = null;
          return next;
        }
        return b;
      });
      if (!next && !block.id) {
        next = {
          organization_id: organizationId,
          application_key: applicationKey,
          block_key: blockKey,
          created_at: "",
          user_id: null,
          is_admin: false,
          is_owner: false,
          ...block,
        };
        next_public.push(next);
      }

      if (next) {
        setBlocks({ public: next_public, private: prev.private });
        return await mutate(next);
      }
    } else if (target === "private") {
      if (block.id === prev.private.id) {
        const next = { ...prev.private, ...block };
        next.access = { owners: [], roles: [] };
        next.user_id = user?.id || null;

        setBlocks({ public: prev.public, private: next });
        return await mutate(next);
      }
    }
  };

  return {
    blocks,
    reload: load,
    loading,
    mutateBlock,
  };
}
