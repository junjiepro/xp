"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trash, PlusCircle, BrainCircuit, FileBox } from "lucide-react";
import { EdittingBlock, XpModel } from "@/types/datas.types";

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

const example: Record<string, XpModel> = {
  example_phi_1_5_q4k: {
    base_url: "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-q4k.gguf",
    tokenizer: "tokenizer.json",
    config: "phi-1_5.json",
    quantized: true,
    seq_len: 2048,
    size: "800 MB",
  },
};
const ModelBlockRenderer = (
  block: EdittingBlock<Record<string, XpModel>> | undefined,
  setBlock: (block: EdittingBlock<Record<string, XpModel>> | undefined) => void
) => {
  const addExample = () => {
    const next = {
      ...block,
      id: block?.id || "",
      block: {
        ...block?.block,
        [`phi_1_5_q4k_${Date.now()}`]: {
          ...example.example_phi_1_5_q4k,
        },
      },
      access: {
        ...block?.access,
        owners: [...(block?.access?.owners || [])],
        roles: [...(block?.access?.roles || [])],
      },
    };
    setBlock(next);
  };
  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(block?.block || {}).map(([k, v]) => (
          <AccordionItem key={k} value={k}>
            <AccordionTrigger>
              <div className="flex items-center">
                <FileBox className="w-4 h-4 mr-2" />
                <span>{k}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button
        className="space-x-2"
        onClick={(e) => {
          e.preventDefault();
          addExample();
        }}
      >
        <PlusCircle className="w-4 h-4" />
        <span>Add example</span>
      </Button>
    </>
  );
};

export { URLBlockRenderer, ModelBlockRenderer };
