import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import * as React from "react";
import { useUserProfile } from "./use-user-profile";
import { Block, Blocks } from "@/types/datas.types";

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
          ...block,
          organization_id: organizationId,
          application_key: applicationKey,
          block_key: blockKey,
          block: block.block as any,
        });
      } else {
        await supabase
          .from("setting_blocks")
          .update({
            ...block,
            organization_id: organizationId,
            application_key: applicationKey,
            block_key: blockKey,
            block: block.block as any,
          })
          .eq("id", block.id);
      }

      load();
    }
  };

  const mutateBlock = (block: Block<T>, target: "public" | "private") => {
    setBlocks((prev) => {
      if (target === "public") {
        let updated = false;
        const next_public = prev.public.map((b) => {
          if (b.id === block.id) {
            updated = true;
            block.user_id = null;
            return block;
          }
          return b;
        });
        if (!updated && block.id === "") {
          updated = true;
          block.user_id = null;
          next_public.push(block);
        }

        if (!updated) {
          mutate(block);
        }

        return { public: next_public, private: prev.private };
      } else if (target === "private") {
        if (block.id === prev.private.id) {
          block.access = { owners: [], roles: [] };
          block.user_id = user?.id || null;

          mutate(block);

          return { public: prev.public, private: block };
        }
      }

      return prev;
    });
  };

  return {
    blocks,
    reload: load,
    loading,
    mutateBlock,
  };
}
