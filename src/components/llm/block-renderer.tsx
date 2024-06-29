"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, PlusCircle } from "lucide-react";
import { EdittingBlock } from "@/types/datas.types";

const URLBlockRenderer = (
  block: EdittingBlock<string[]> | undefined,
  setBlock: (block: EdittingBlock<string[]> | undefined) => void
) => {
  return (
    <>
      {!block?.block?.length ? (
        <div>
          <Button
            variant={"ghost"}
            onClick={(e) => {
              e.preventDefault();
              const next = {
                ...block,
                id: block?.id || "",
                block: [""],
                access: {
                  ...block?.access,
                  owners: [...(block?.access?.owners || [])],
                  roles: [...(block?.access?.roles || [])],
                },
              };
              setBlock(next);
            }}
          >
            <PlusCircle className="w-4 h-4" />
          </Button>
        </div>
      ) : null}
      {block?.block?.map((url, index) => (
        <div
          key={index}
          className="flex flex-row items-center justify-between gap-2"
        >
          <Input
            autoFocus={!url}
            value={url}
            onChange={(e) => {
              const next = {
                ...block,
                id: block?.id || "",
                block: block.block?.map((u, i) => {
                  if (i === index) {
                    return e.target.value;
                  } else {
                    return u;
                  }
                }),
                access: {
                  ...block?.access,
                  owners: [...(block?.access?.owners || [])],
                  roles: [...(block?.access?.roles || [])],
                },
              };
              setBlock(next);
            }}
          />
          <Button
            variant={"ghost"}
            onClick={(e) => {
              e.preventDefault();
              const next = {
                ...block,
                id: block?.id || "",
                block: block.block.reduce((acc, u, i) => {
                  acc.push(u);
                  if (i === index) {
                    acc.push("");
                  }
                  return acc;
                }, [] as string[]),
                access: {
                  ...block?.access,
                  owners: [...(block?.access?.owners || [])],
                  roles: [...(block?.access?.roles || [])],
                },
              };
              setBlock(next);
            }}
          >
            <PlusCircle className="w-4 h-4" />
          </Button>
          <Button
            variant={"ghost"}
            onClick={(e) => {
              e.preventDefault();
              const next = {
                ...block,
                id: block?.id || "",
                block: block.block.filter((_, i) => i !== index),
                access: {
                  ...block?.access,
                  owners: [...(block?.access?.owners || [])],
                  roles: [...(block?.access?.roles || [])],
                },
              };
              setBlock(next);
            }}
          >
            <Trash className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
    </>
  );
};

export { URLBlockRenderer };
