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
import {
  Trash,
  PlusCircle,
  BrainCircuit,
  FileBox,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";
import { EdittingBlock, XpModel } from "@/types/datas.types";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { ModelRecord } from "@mlc-ai/web-llm";

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
            <AccordionContent className="p-2 space-y-2 bg-muted rounded-lg">
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
                        className="flex flex-row items-center justify-end gap-1"
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
                    <div className="flex flex-row items-center justify-end gap-1">
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

type PromptTemplate = {
  title: string;
  prompt: string;
};

const PromptBlockRenderer = (
  block: EdittingBlock<PromptTemplate[]> | undefined,
  setBlock: (block: EdittingBlock<PromptTemplate[]> | undefined) => void
) => {
  const [open, setOpen] = React.useState(false);
  const addExample = () => {
    const next = {
      ...block,
      id: block?.id || "",
      block: [...(block?.block || []), { title: "", prompt: "" }],
      access: {
        ...block?.access,
        owners: [...(block?.access?.owners || [])],
        roles: [...(block?.access?.roles || [])],
      },
    };
    setBlock(next);
    setEdittingIndex(next.block.length - 1);
  };

  const [edittingIndex, setEdittingIndex] = React.useState<number>();
  const nextValue = (index: number, key: keyof PromptTemplate, val: string) => {
    const next = {
      ...block,
      id: block?.id || "",
      block: (block?.block || []).map((v, i) => {
        if (i === index) {
          return {
            ...v,
            [key]: val,
          };
        }
        return v;
      }),
      access: {
        ...block?.access,
        owners: [...(block?.access?.owners || [])],
        roles: [...(block?.access?.roles || [])],
      },
    };
    return next;
  };
  const removeValue = (index: number) => {
    const next = {
      ...block,
      id: block?.id || "",
      block: (block?.block || []).filter((_, i) => i !== index),
      access: {
        ...block?.access,
        owners: [...(block?.access?.owners || [])],
        roles: [...(block?.access?.roles || [])],
      },
    };
    setEdittingIndex(undefined);
    setBlock(next);
  };
  return (
    <>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="justify-between"
            >
              <span className="truncate">
                {edittingIndex !== undefined &&
                block?.block?.length &&
                block?.block?.length > edittingIndex
                  ? block.block[edittingIndex].title
                  : "Select prompt..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search prompt..." />
              <CommandList>
                <CommandEmpty>No prompt found.</CommandEmpty>
                <CommandGroup>
                  {block?.block.map((b, i) => (
                    <CommandItem
                      key={i}
                      value={b.title}
                      onSelect={() => {
                        setEdittingIndex(i);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          i === edittingIndex ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {b.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
        {edittingIndex !== undefined &&
        block?.block?.length &&
        block?.block?.length > edittingIndex ? (
          <Button
            className="space-x-2"
            variant={"destructive"}
            onClick={(e) => {
              e.preventDefault();
              removeValue(edittingIndex);
            }}
          >
            <X className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        ) : null}
      </div>
      <div className="pt-4">
        {edittingIndex !== undefined &&
        block?.block?.length &&
        block?.block?.length > edittingIndex ? (
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Title"
              value={block.block[edittingIndex].title}
              onChange={(e) => {
                setBlock(nextValue(edittingIndex, "title", e.target.value));
              }}
            />
            <Textarea
              placeholder="Prompt"
              value={block.block[edittingIndex].prompt}
              onChange={(e) => {
                setBlock(nextValue(edittingIndex, "prompt", e.target.value));
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
};

const WebLLMModelBlockRenderer = (
  block: EdittingBlock<ModelRecord[]> | undefined,
  setBlock: (block: EdittingBlock<ModelRecord[]> | undefined) => void
) => {
  return <></>;
};

export {
  URLBlockRenderer,
  ModelBlockRenderer,
  PromptBlockRenderer,
  WebLLMModelBlockRenderer,
};
