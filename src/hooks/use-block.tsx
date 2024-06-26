import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import * as React from "react";
import { useUserProfile } from "./use-user-profile";
import { Block, Blocks, EdittingBlock } from "@/types/datas.types";

const supabase = createClientComponentClient<Database>();

export function useSettingBlock<T>(
  organizationId: string,
  applicationKey: string,
  blockKey: string,
  defaultData: T
) {
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
      user_id: "",
      created_at: "",
    },
  });

  const load = React.useCallback(() => {
    if (loading) {
      return;
    }
    setLoading(true);
    const load1 = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("setting_blocks")
          .select("*")
          .eq("application_key", applicationKey)
          .eq("block_key", blockKey)
          .is("user_id", null)
          .order("created_at", { ascending: true });
        setBlocks((prev) => ({ ...prev, public: (data as Block<T>[]) || [] }));
      }
    };

    const load2 = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("setting_blocks")
          .select("*")
          .eq("application_key", applicationKey)
          .eq("block_key", blockKey)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        setBlocks((prev) => ({ ...prev, public: (data as Block<T>[]) || [] }));
      }
    };

    Promise.all([load1(), load2()]).finally(() => setLoading(false));
  }, [applicationKey, blockKey, loading, user?.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const mutate = async (block: Block<T>) => {
    if (user?.id) {
      if (block.id === "") {
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
      if (!next && block.id === "") {
        next = {
          organization_id: organizationId,
          application_key: applicationKey,
          block_key: blockKey,
          created_at: "",
          user_id: null,
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
