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

export function useSettingBlock<T extends object>(
  organizationId: string,
  applicationKey: string,
  blockKey: string,
  defaultData: T,
  emptyData?: T
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
    local: {
      id: "",
      organization_id: organizationId,
      application_key: applicationKey,
      block_key: blockKey,
      block: emptyData || defaultData,
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

  const _load = React.useCallback(async () => {
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

      const blockStr = localStorage.getItem(
        `block-${user.id}-${organizationId}-${applicationKey}-${blockKey}`
      );
      let localData: Block<T> | null = null;
      try {
        localData = blockStr ? JSON.parse(blockStr) : null;
      } catch (e) {
        console.error(e);
      }

      setBlocks((prev) => ({
        public: (publicDate as Block<T>[]) || [],
        private: privateData?.length
          ? (privateData[0] as Block<T>)
          : prev.private,
        local: localData || prev.local,
      }));
    }
  }, [applicationKey, blockKey, organizationId, user?.id]);
  const load = React.useCallback(() => {
    if (loading) {
      return;
    }
    setLoading(true);

    _load().then(() => setLoading(false));
  }, [loading, _load]);

  React.useEffect(() => {
    if (organizationId && user?.id) {
      load();
    }
  }, [load, organizationId, user?.id]);

  const mutate = async (block: Block<T>) => {
    let id = block.id;
    if (user?.id) {
      if (!block.id) {
        const { data } = await supabase
          .from("setting_blocks")
          .insert({
            organization_id: organizationId,
            application_key: applicationKey,
            block_key: blockKey,
            block: block.block as any,
            access: block.access,
            user_id: block.user_id,
          })
          .select("id");
        id = data?.[0]?.id || block.id;
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

    return id;
  };
  const deleteBlock = async (id: string) => {
    await supabase.from("setting_blocks").delete().eq("id", id);

    load();
  };
  const saveLocal = (block: Block<T>) => {
    let id = block.id;
    if (user?.id) {
      const blockStr = JSON.stringify(block);
      localStorage.setItem(
        `block-${user.id}-${organizationId}-${applicationKey}-${blockKey}`,
        blockStr
      );

      load();
    }

    return id;
  };

  const mutateBlock = async (
    block: Block<T> | EdittingBlock<T>,
    target: "public" | "private" | "local",
    del?: boolean
  ) => {
    const prev = blocks;
    if (target === "public") {
      if (del) {
        if (block.id) {
          setBlocks({
            public: prev.public.filter((b) => b.id !== block.id),
            private: prev.private,
            local: prev.local,
          });
          await deleteBlock(block.id);
        }
        return undefined;
      }
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
        setBlocks({
          public: next_public,
          private: prev.private,
          local: prev.local,
        });
        return await mutate(next);
      }
      return undefined;
    } else if (target === "private") {
      if (block.id === prev.private.id) {
        const next = { ...prev.private, ...block };
        next.access = { owners: [], roles: [] };
        next.user_id = user?.id || null;

        setBlocks({ public: prev.public, private: next, local: prev.local });
        return await mutate(next);
      }
    } else if (target === "local") {
      if (block.id === prev.local.id) {
        const next = { ...prev.local, ...block };
        next.access = { owners: [], roles: [] };
        next.user_id = user?.id || null;

        setBlocks({ public: prev.public, private: prev.private, local: next });
        return saveLocal(next);
      }
    }

    return undefined;
  };

  return {
    blocks,
    reload: load,
    loading,
    mutateBlock,
  };
}
