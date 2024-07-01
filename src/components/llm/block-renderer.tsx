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
import { Trash, PlusCircle, BrainCircuit, FileBox, Check } from "lucide-react";
import { EdittingBlock, XpModel } from "@/types/datas.types";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

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

  const [value, setValue] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const nextValue = (
    k: string,
    key: keyof XpModel,
    val: string | string[] | boolean
  ) => {
    const next = {
      ...block,
      id: block?.id || "",
      block: {
        ...block?.block,
        [k]: {
          base_url: block?.block?.[k]?.base_url || "",
          model: block?.block?.[k]?.model || "",
          tokenizer: block?.block?.[k]?.tokenizer || "",
          config: block?.block?.[k]?.config || "",
          quantized: block?.block?.[k]?.quantized || false,
          seq_len: block?.block?.[k]?.seq_len || 2048,
          size: block?.block?.[k]?.size || "",
          [key]: val,
        },
      },
      access: {
        ...block?.access,
        owners: [...(block?.access?.owners || [])],
        roles: [...(block?.access?.roles || [])],
      },
    };
    return next;
  };
  return (
    <>
      <Accordion
        value={value}
        onValueChange={(v) => {
          setValue(v);
          setName(v);
        }}
        type="single"
        collapsible
        className="w-full"
      >
        {Object.entries(block?.block || {}).map(([k, v]) => (
          <AccordionItem key={k} value={k}>
            <AccordionTrigger>
              <div className="flex items-center">
                <FileBox className="w-4 h-4 mr-2" />
                <span>{k}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-1 space-y-2">
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Name</div>
                <div className="flex flex-row items-center gap-1">
                  <Input
                    value={name}
                    autoFocus
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                  />

                  <Button
                    variant={"ghost"}
                    onClick={(e) => {
                      e.preventDefault();
                      const key = name || k;
                      const next = {
                        ...block,
                        id: block?.id || "",
                        block: {
                          ...block?.block,
                          [key]: {
                            base_url: block?.block?.[k]?.base_url || "",
                            model: block?.block?.[k]?.model || "",
                            tokenizer: block?.block?.[k]?.tokenizer || "",
                            config: block?.block?.[k]?.config || "",
                            quantized: block?.block?.[k]?.quantized || false,
                            seq_len: block?.block?.[k]?.seq_len || 2048,
                            size: block?.block?.[k]?.size || "",
                          },
                        },
                        access: {
                          ...block?.access,
                          owners: [...(block?.access?.owners || [])],
                          roles: [...(block?.access?.roles || [])],
                        },
                      };
                      if (key !== k) {
                        delete next.block[k];
                        setValue(key);
                      }
                      setBlock(next);
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={"ghost"}
                    onClick={(e) => {
                      e.preventDefault();
                      const next = {
                        ...block,
                        id: block?.id || "",
                        block: {
                          ...block?.block,
                        },
                        access: {
                          ...block?.access,
                          owners: [...(block?.access?.owners || [])],
                          roles: [...(block?.access?.roles || [])],
                        },
                      };
                      delete next.block[k];
                      setBlock(next);
                    }}
                  >
                    <Trash className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Base URL</div>
                <Input
                  value={v.base_url}
                  onChange={(e) => {
                    setBlock(nextValue(k, "base_url", e.target.value));
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Model</div>
                <div className="flex flex-col items-center justify-end gap-1">
                  {Array.isArray(v.model) ? (
                    v.model.map((i, index) => (
                      <div
                        key={index}
                        className="flex flex-row items-center justify-end"
                      >
                        <Input
                          value={i}
                          onChange={(e) => {
                            setBlock(
                              nextValue(
                                k,
                                "model",
                                Array.isArray(v.model)
                                  ? v.model.map((v, i) =>
                                      i === index ? e.target.value : v
                                    )
                                  : e.target.value
                              )
                            );
                          }}
                        />
                        <Button
                          variant={"ghost"}
                          onClick={(e) => {
                            e.preventDefault();
                            setBlock(
                              nextValue(
                                k,
                                "model",
                                Array.isArray(v.model)
                                  ? [...v.model, ""]
                                  : [v.model, ""]
                              )
                            );
                          }}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                        {v.model.length > 1 ? (
                          <Button
                            variant={"ghost"}
                            onClick={(e) => {
                              e.preventDefault();
                              setBlock(
                                nextValue(
                                  k,
                                  "model",
                                  Array.isArray(v.model)
                                    ? v.model.filter((v, i) => i !== index)
                                    : v.model
                                )
                              );
                            }}
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-row items-center justify-end">
                      <Input
                        value={v.model}
                        onChange={(e) => {
                          setBlock(
                            nextValue(
                              k,
                              "model",
                              Array.isArray(v.model)
                                ? [e.target.value]
                                : e.target.value
                            )
                          );
                        }}
                      />
                      <Button
                        variant={"ghost"}
                        onClick={(e) => {
                          e.preventDefault();
                          setBlock(
                            nextValue(
                              k,
                              "model",
                              Array.isArray(v.model)
                                ? [...v.model, ""]
                                : [v.model, ""]
                            )
                          );
                        }}
                      >
                        <PlusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Tokenizer</div>
                <Input
                  value={v.tokenizer}
                  onChange={(e) => {
                    setBlock(nextValue(k, "tokenizer", e.target.value));
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Config</div>
                <Input
                  value={v.config}
                  onChange={(e) => {
                    setBlock(nextValue(k, "config", e.target.value));
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Quantized</div>
                <Switch
                  checked={v.quantized}
                  onCheckedChange={(e) =>
                    setBlock(nextValue(k, "quantized", e))
                  }
                />
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Seq len</div>
                <Input
                  value={v.seq_len}
                  type="number"
                  onChange={(e) => {
                    setBlock(nextValue(k, "seq_len", e.target.value));
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="w-32">Size</div>
                <Input
                  value={v.size}
                  onChange={(e) => {
                    setBlock(nextValue(k, "size", e.target.value));
                  }}
                />
              </div>
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
