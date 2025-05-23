"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileBox,
  Loader2,
  NotepadTextDashed,
  CornerDownLeft,
  Mic,
  Paperclip,
  Settings,
  Share,
  Github,
  Trash,
  Eraser,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLLM } from "@/hooks/use-llm";
import {
  APIModel,
  ChannelInterface,
  XpLLMReciveEvent,
  XpModel,
  XpModelParams,
} from "@/types/datas.types";
import xpChannel from "@/lib/channel";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import LLMMessage, { Message } from "./message";
import { useSearchParams } from "next/navigation";
import {
  SettingBlockConfigDialog,
  SettingBlockConfigDrawer,
} from "../setting-block-config";
import {
  ModelBlockRenderer,
  PromptBlockRenderer,
  URLBlockRenderer,
} from "./block-renderer";
import {
  ModelRecord,
  MLCEngineInterface,
  CreateMLCEngine,
  ChatCompletionMessageParam,
} from "@mlc-ai/web-llm";
import { cn } from "@/lib/utils";
import OpenAI from "openai";

const WebLLMEmptyBlock: ModelRecord[] = [
  {
    model: "https://huggingface.co/mlc-ai/Qwen2-0.5B-Instruct-q0f16-MLC",
    model_id: "Qwen2-0.5B-Instruct-q0f16-MLC",
    model_lib:
      "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_43/Qwen2-0.5B-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm",
    low_resource_required: true,
    vram_required_MB: 1624.12,
    overrides: {
      context_window_size: 4096,
    },
  },
];

const apiEmptyBlock: APIModel[] = [
  {
    base_url: "https://api-inference.huggingface.co",
    api_key: "",
    model: "openai-gpt",
    model_id: "example-huggingface-openai-gpt",
  },
];

export function LLM() {
  const searchParams = useSearchParams();

  const organizationId = searchParams.get("organizationId");

  const {
    core,
    candleModels,
    candleUrls,
    candleTemplates,
    webllmModelList,
    apiModelList,
    mutateCandleModels,
    mutateCandleUrls,
    mutateCandleTemplates,
    mutateWebllmModelList,
    mutateApiModelList,
  } = useLLM(organizationId || "");

  // Core
  const cores = React.useMemo(() => {
    return core.public.concat([core.private]).reduce(
      (acc, t) => {
        t.block.forEach((b) => {
          if (!acc.find((a) => a.name === b.name)) {
            acc.push(b);
          }
        });
        return acc;
      },
      [] as {
        name: string;
        description: string;
        github: string;
      }[]
    );
  }, [core]);
  // Candle
  const models = React.useMemo(() => {
    return candleModels.public
      .concat([candleModels.private, candleModels.local])
      .reduce((acc, t) => {
        Object.entries(t.block).forEach(([k, v]) => {
          acc[k] = v;
        });
        return acc;
      }, {} as Record<string, XpModel>);
  }, [candleModels]);
  const modelBaseUrls = React.useMemo(() => {
    return candleUrls.public
      .concat([candleUrls.private, candleUrls.local])
      .reduce((acc, t) => {
        t.block.forEach((b) => {
          if (!acc.includes(b)) {
            acc.push(b);
          }
        });
        return acc;
      }, [] as string[]);
  }, [candleUrls]);
  const templates = React.useMemo(() => {
    return candleTemplates.public
      .concat([candleTemplates.private, candleTemplates.local])
      .reduce((acc, t) => {
        acc.push(...t.block);
        return acc;
      }, [] as { title: string; prompt: string }[]);
  }, [candleTemplates]);
  // WebLLM
  const webllmModels = React.useMemo(() => {
    return webllmModelList.public
      .concat([webllmModelList.private, webllmModelList.local])
      .reduce((acc, t) => {
        acc.push(...t.block);
        return acc;
      }, [] as ModelRecord[]);
  }, [webllmModelList]);
  // API
  const apiModels = React.useMemo(() => {
    return apiModelList.public
      .concat([apiModelList.private, apiModelList.local])
      .reduce((acc, t) => {
        acc.push(...t.block);
        return acc;
      }, [] as APIModel[]);
  }, [apiModelList]);

  // Core
  const [coreName, setCoreName] = React.useState<string>(cores[0].name);
  const currentCore = cores.find((c) => c.name === coreName);

  // Candle
  const [channel, setChannel] = React.useState<ChannelInterface>();

  const [modelId, setModelId] = React.useState<string>(Object.keys(models)[0]);
  const [modelBaseUrl, setModelBaseUrl] = React.useState(modelBaseUrls[0]);
  const [params, setParams] = React.useState<XpModelParams>({
    prompt: "",
    temperature: 0.0,
    topP: 1.0,
    repeatPenalty: 1.1,
    seed: 299792458,
    maxSeqLen: 200,
  });
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [prompt, setPrompt] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  const model = React.useMemo(
    () => (modelId ? models[modelId] : undefined),
    [modelId, models]
  );

  const [webModelId, setWebModelId] = React.useState<string>(
    webllmModels?.[0]?.model_id
  );
  const webModel = React.useMemo(
    () =>
      webModelId
        ? webllmModels?.find((m) => m.model_id === webModelId)
        : undefined,
    [webModelId, webllmModels]
  );

  const [apiModelId, setApiModelId] = React.useState<string>(
    apiModels?.[0]?.model_id
  );
  const apiModel = React.useMemo(
    () =>
      apiModelId
        ? apiModels?.find((m) => m.model_id === apiModelId)
        : undefined,
    [apiModelId, apiModels]
  );

  const maxSeqLen =
    (currentCore?.name === "Candle"
      ? model?.seq_len
      : currentCore?.name === "WebLLM"
      ? webModel?.overrides?.context_window_size
      : 2048) || 2048;
  React.useEffect(() => {
    if (maxSeqLen < params.maxSeqLen) setParams({ ...params, maxSeqLen });
  }, [maxSeqLen]);

  const [scrollToBottom, setScrollToBottom] = React.useState(true);
  const scrollElement = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollToBottom)
      scrollElement.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateParams = (type: keyof XpModelParams, value: number | string) => {
    let val = value;
    switch (type) {
      case "prompt":
        break;
      case "temperature":
        val = Number(val) > 2 ? 2 : Number(val) < 0 ? 0 : Number(val);
        break;
      case "topP":
        val = Number(val) > 1 ? 1 : Number(val) < 0 ? 0 : Number(val);
        break;
      case "repeatPenalty":
        val = Number(val) > 2 ? 2 : Number(val) < 1 ? 1 : Number(val);
        break;
      case "seed":
        val = parseInt(val.toString());
        break;
      case "maxSeqLen":
        val =
          Number(val) > maxSeqLen
            ? maxSeqLen
            : Number(val) < 1
            ? 1
            : parseInt(val.toString());
        break;
      default:
        break;
    }
    setParams((pre) => ({
      ...pre,
      [type]: val,
    }));
  };
  const randSeed = () =>
    updateParams(
      "seed",
      Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
        .toString()
        .slice(0, 9)
    );

  const engine = React.useRef<MLCEngineInterface>();
  const selectedModelId = React.useRef("");
  const selectedModel = React.useRef("");

  const getEngine = async () => {
    console.log("getEngine...", webModel?.model_id);
    if (webModel?.model_id) {
      const modelJson = JSON.stringify(webModel);
      if (modelJson !== selectedModel.current) {
        selectedModel.current = modelJson;
        selectedModelId.current = webModel.model_id;

        console.log("create engine...", webModel.model_id);
        const e = await CreateMLCEngine(
          webModel.model_id,
          {
            appConfig: {
              model_list: webllmModels || [],
            },
            initProgressCallback: (report) => console.log(report),
          } // engineConfig
        );
        engine.current = e;
      }
    }
    if (engine.current) {
      console.log("engine created, start completions...");
      const chunks = await engine.current.chat.completions.create({
        messages: messages.map((v) => ({
          role: v.role,
          content: v.message,
        })) as ChatCompletionMessageParam[],
        temperature: 1,
        stream: true, // <-- Enable streaming
        stream_options: { include_usage: true },
      });

      let reply = "";
      for await (const chunk of chunks) {
        reply += chunk.choices[0]?.delta.content || "";
        console.log(reply);
        if (chunk.usage) {
          console.log(chunk.usage); // only last chunk has usage
        }
      }
    }
    return engine.current;
  };

  const openai = React.useRef<OpenAI>();
  const openaiAbortController = React.useRef<AbortController>();
  const openaiChunkId = React.useRef("");
  const selectedApiModelId = React.useRef("");
  const selectedApiModel = React.useRef("");

  const startAPI = async () => {
    if (apiModel?.model_id) {
      const modelJson = JSON.stringify(apiModel);
      if (modelJson !== selectedApiModel.current) {
        selectedApiModel.current = modelJson;
        selectedApiModelId.current = apiModel.model_id;

        console.log("create openai...", apiModel.model_id);
        const ai = new OpenAI({
          baseURL: apiModel.base_url,
          apiKey: apiModel.api_key,
          dangerouslyAllowBrowser: true,
        });
        openai.current = ai;
      }
    }
    if (openai.current && apiModel?.model) {
      console.log("openai created, start completions...");
      setMessages((ms) => ms.concat([{ role: "user", message: prompt }]));
      setPrompt("");
      openaiChunkId.current = "";
      try {
        const chunks = await openai.current.chat.completions.create({
          model: apiModel.model,
          messages: [
            ...messages.map((v) => ({ role: v.role, content: v.message })),
            { role: "user", content: prompt },
          ],
          stream: true, // <-- Enable streaming
        });
        openaiAbortController.current = chunks.controller;

        let reply = "";
        for await (const chunk of chunks) {
          reply += chunk.choices[0]?.delta.content || "";
          const role = chunk.choices[0]?.delta.role ?? "assistant";
          if (role !== "tool") {
            setMessages((ms) => {
              openaiChunkId.current = chunk.id;
              const msg: Message = {
                role,
                message: reply,
                chunkId: openaiChunkId.current,
                usage: chunk.usage,
              };
              let added = false;
              const next = ms.map((m) => {
                if (m.chunkId === openaiChunkId.current) {
                  added = true;
                  return msg;
                }
                return m;
              });

              return added ? next : ms.concat([msg]);
            });
          }
        }
      } catch (e) {
        console.error(e);
        if (openaiChunkId.current) {
          setMessages((ms) => {
            const msg: Message = {
              role: "assistant",
              message: "",
              chunkId: openaiChunkId.current,
              error: e,
            };
            let added = false;
            const next = ms.map((m) => {
              if (m.chunkId === openaiChunkId.current) {
                added = true;
                return { ...m, error: e };
              }
              return m;
            });

            return added ? next : ms.concat([msg]);
          });
        } else {
          setMessages((ms) =>
            ms.concat([{ role: "assistant", message: "", error: e }])
          );
        }
      }
    }

    return apiModel?.model_id;
  };

  const start = () => {
    if (currentCore?.name === "Candle" && channel && prompt && model) {
      setProcessing(true);
      setMessages((ms) => ms.concat([{ role: "user", message: prompt }]));
      setPrompt("");
      channel.emit("xp-llm-start", {
        model: {
          ...model,
          base_url: `${modelBaseUrl}${model?.base_url}`,
        },
        modelId,
        params: {
          ...params,
          prompt,
        },
        channel: "",
      });
    } else if (currentCore?.name === "WebLLM" && prompt && webModel) {
      setProcessing(true);
      getEngine().then((e) => {
        setProcessing(false);
      });
    } else if (currentCore?.name === "API" && prompt && apiModel) {
      setProcessing(true);
      startAPI().then((e) => {
        setProcessing(false);
      });
    }
  };

  const abort = () => {
    if (currentCore?.name === "Candle" && channel) {
      channel?.emit("xp-llm-abort", { channel: "" });
    } else if (currentCore?.name === "WebLLM") {
    } else if (currentCore?.name === "API") {
      openaiAbortController.current?.abort();
      openaiAbortController.current = undefined;
      setMessages((ms) =>
        ms.map((m) => {
          if (m.chunkId === openaiChunkId.current) {
            return { ...m, abort: true };
          }
          return m;
        })
      );
    }

    setProcessing(false);
  };

  const recive = (e: XpLLMReciveEvent) => {
    if (
      e.data.error ||
      e.data.status === "complete" ||
      e.data.status === "aborted"
    ) {
      setProcessing(false);
    }
    setMessages((ms) => {
      const msg: Message = {
        role: "assistant",
        message: e.data.output || `${e.data.sentence || ""}`,
        event: e,
      };
      if (ms && ms.length) {
        const last = ms[ms.length - 1];
        if (last.event) {
          if (msg.event) {
            msg.event.data.tokensSec =
              msg.event.data.tokensSec || last.event.data.tokensSec;
            msg.event.data.totalTime =
              msg.event.data.totalTime || last.event.data.totalTime;
          }
          msg.message =
            msg.event?.data.sentence || last.event?.data.sentence || "";
          return ms.slice(0, ms.length - 1).concat([msg]);
        } else {
          return ms.concat([msg]);
        }
      } else {
        return [msg];
      }
    });
  };

  React.useEffect(() => {
    const c = xpChannel.channel(new Date().getTime().toString());
    const f = c.on("xp-llm-recive", recive);
    setChannel(c);
    return () => {
      abort();
      c.off("xp-llm-recive", f);
      setChannel(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clean = () => {
    setMessages([]);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
        <h1 className="text-xl font-semibold italic text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span
                className={cn(
                  "cursor-pointer before:block before:absolute before:-inset-1 before:-skew-y-3 before:bg-slate-500 relative inline-block",
                  currentCore?.name === "Candle" && "before:bg-orange-500"
                )}
              >
                <HoverCard>
                  <HoverCardTrigger>
                    <span className="relative text-white">
                      {currentCore?.name}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 cursor-auto">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">
                        {currentCore?.name}
                      </h4>
                      <p className="text-sm">{currentCore?.description}</p>
                      <div
                        className={cn(
                          "hidden items-center pt-2",
                          currentCore?.github && "flex"
                        )}
                      >
                        <Github className="mr-2 h-4 w-4 opacity-70" />{" "}
                        <span className="text-xs text-muted-foreground">
                          <a href={currentCore?.github} target="_blank">
                            {currentCore?.github}
                          </a>
                        </span>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Core</DropdownMenuLabel>
                {cores.map((c) => (
                  <DropdownMenuItem
                    key={c.name}
                    onClick={() => setCoreName(c.name)}
                  >
                    <HoverCard>
                      <HoverCardTrigger>
                        <div>{c.name}</div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">{c.name}</h4>
                          <p className="text-sm">{c.description}</p>
                          <div
                            className={cn(
                              "hidden items-center pt-2",
                              c.github && "flex"
                            )}
                          >
                            <Github className="mr-2 h-4 w-4 opacity-70" />{" "}
                            <span className="text-xs text-muted-foreground">
                              <a href={c.github} target="_blank">
                                {c.github}
                              </a>
                            </span>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </h1>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <Settings className="size-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Configuration</DrawerTitle>
              <DrawerDescription>
                Configure the settings for the model and messages.
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Settings
                </legend>
                <div className="grid gap-3 py-4">
                  <div
                    className={cn(
                      "grid-cols-3 items-center gap-3 hidden",
                      currentCore?.name === "Candle" && "grid"
                    )}
                  >
                    <Label htmlFor="modelBaseUrl" className="text-left">
                      Model base url
                    </Label>
                    <Select
                      name="modelBaseUrl"
                      value={modelBaseUrl}
                      onValueChange={(v) => setModelBaseUrl(v)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a model base url" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>
                            <div className="flex items-center justify-between">
                              <span>URL</span>
                              {organizationId ? (
                                <SettingBlockConfigDrawer<string[]>
                                  title={"URL Configuration"}
                                  description={
                                    "Configure the settings for the model base urls."
                                  }
                                  organizationId={organizationId}
                                  blocks={candleUrls}
                                  mutateBlock={mutateCandleUrls}
                                  emptyBlock={[]}
                                  copy={(source) => [...source]}
                                  blockRenderer={URLBlockRenderer}
                                >
                                  <div className="cursor-pointer mr-2">
                                    <Settings className="size-4" />
                                    <span className="sr-only">Settings</span>
                                  </div>
                                </SettingBlockConfigDrawer>
                              ) : null}
                            </div>
                          </SelectLabel>
                          {modelBaseUrls.map((url) => (
                            <SelectItem key={url} value={url}>
                              {url}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {currentCore?.name === "Candle" && (
                    <div className={cn("grid-cols-3 items-center gap-3 grid")}>
                      <Label htmlFor="model" className="text-left">
                        Model
                      </Label>
                      <Select
                        name="model"
                        value={modelId}
                        onValueChange={(v) => setModelId(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>
                              <div className="flex items-center justify-between">
                                <span>Model</span>
                                {organizationId ? (
                                  <SettingBlockConfigDrawer<
                                    Record<string, XpModel>
                                  >
                                    title={"Model Configuration"}
                                    description={
                                      "Configure the settings for the Models."
                                    }
                                    organizationId={organizationId}
                                    blocks={candleModels}
                                    mutateBlock={mutateCandleModels}
                                    emptyBlock={{}}
                                    copy={(source) =>
                                      Object.entries(source).reduce(
                                        (acc, [k, v]) => ({
                                          ...acc,
                                          [k]: { ...v },
                                        }),
                                        {}
                                      )
                                    }
                                    blockRenderer={ModelBlockRenderer}
                                  >
                                    <div className="cursor-pointer mr-2">
                                      <Settings className="size-4" />
                                      <span className="sr-only">Settings</span>
                                    </div>
                                  </SettingBlockConfigDrawer>
                                ) : null}
                              </div>
                            </SelectLabel>
                            {Object.entries(models).map(([mid, m]) => (
                              <SelectItem key={mid} value={mid}>
                                {mid}
                                {` (${m.size})`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button
                            variant={"ghost"}
                            onClick={(e) => e.preventDefault()}
                          >
                            <FileBox className="h-4 w-4 mr-1" />
                            {model?.size}
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-96">
                          <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">
                                {modelId}
                              </h4>
                              <pre className="mt-2 rounded-md bg-slate-950 dark:bg-slate-700 p-4 whitespace-pre-wrap break-words">
                                <code className="text-white">
                                  {JSON.stringify(model, null, 2)}
                                </code>
                              </pre>
                              <div className="flex items-center pt-2">
                                <span className="text-xs text-muted-foreground">
                                  {modelBaseUrl}
                                  {model?.base_url}
                                </span>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  )}
                  {currentCore?.name === "WebLLM" && (
                    <div className={cn("grid-cols-3 items-center gap-3 grid")}>
                      <Label htmlFor="webModel" className="text-left">
                        Model
                      </Label>
                      <Select
                        name="webModel"
                        value={webModelId}
                        onValueChange={(v) => setWebModelId(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>
                              <div className="flex items-center justify-between">
                                <span>Model</span>
                                {organizationId ? (
                                  <SettingBlockConfigDrawer<ModelRecord[]>
                                    title={"Model Configuration"}
                                    description={
                                      "Configure the settings for the Models."
                                    }
                                    organizationId={organizationId}
                                    blocks={webllmModelList}
                                    mutateBlock={mutateWebllmModelList}
                                    emptyBlock={WebLLMEmptyBlock}
                                    copy={(source) =>
                                      source.map((m) => ({ ...m }))
                                    }
                                  >
                                    <div className="cursor-pointer mr-2">
                                      <Settings className="size-4" />
                                      <span className="sr-only">Settings</span>
                                    </div>
                                  </SettingBlockConfigDrawer>
                                ) : null}
                              </div>
                            </SelectLabel>
                            {webllmModels.map((m) => (
                              <SelectItem key={m.model_id} value={m.model_id}>
                                {m.model_id}
                                {` (${m.vram_required_MB} MB)`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button
                            variant={"ghost"}
                            onClick={(e) => e.preventDefault()}
                          >
                            <FileBox className="h-4 w-4 mr-1" />
                            {webModel?.vram_required_MB} MB
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-96">
                          <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">
                                {webModelId}
                              </h4>
                              <pre className="mt-2 rounded-md bg-slate-950 dark:bg-slate-700 p-4 whitespace-pre-wrap break-words">
                                <code className="text-white">
                                  {JSON.stringify(webModel, null, 2)}
                                </code>
                              </pre>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  )}
                  {currentCore?.name === "API" && (
                    <div className={cn("grid-cols-2 items-center gap-3 grid")}>
                      <Label htmlFor="apiModel" className="text-left">
                        Model
                      </Label>
                      <div className="flex items-center justify-end gap-4">
                        <Select
                          name="apiModel"
                          value={apiModelId}
                          onValueChange={(v) => setApiModelId(v)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              className="overflow-hidden"
                              placeholder="Select a model"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Model</SelectLabel>
                              {apiModels.map((m) => (
                                <SelectItem key={m.model_id} value={m.model_id}>
                                  {m.model_id}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {organizationId ? (
                          <SettingBlockConfigDrawer<APIModel[]>
                            title={"Model Configuration"}
                            description={
                              "Configure the settings for the Models."
                            }
                            organizationId={organizationId}
                            blocks={apiModelList}
                            mutateBlock={mutateApiModelList}
                            emptyBlock={apiEmptyBlock}
                            copy={(source) => source.map((m) => ({ ...m }))}
                          >
                            <div className="cursor-pointer mr-2">
                              <Settings className="size-4" />
                              <span className="sr-only">Settings</span>
                            </div>
                          </SettingBlockConfigDrawer>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </fieldset>
            </div>
          </DrawerContent>
        </Drawer>
        <Button variant="outline" size="sm" className="ml-auto gap-1.5 text-sm">
          <Share className="size-3.5" />
          Share
        </Button>
      </header>
      <main className="h-1/2 grid flex-1 gap-4 p-4">
        <div className="flex h-full flex-col rounded-xl bg-muted/50 p-4 overflow-auto">
          <ScrollArea
            className="flex-1 w-full p-3"
            onScroll={(e) => {
              const target = e.target as HTMLElement;
              const shouldScrollToBottom =
                target.scrollHeight - target.scrollTop <=
                  target.clientHeight + 1 &&
                target.scrollHeight - target.scrollTop >=
                  target.clientHeight - 1;
              setScrollToBottom(shouldScrollToBottom);
            }}
          >
            {messages.map((msg, i) => (
              <LLMMessage key={i} msg={msg} abort={abort}>
                {messages.length - 1 === i && !prompt && (
                  <div ref={scrollElement} />
                )}
              </LLMMessage>
            ))}
            {prompt && (
              <LLMMessage
                className="border-dashed"
                msg={{ role: "user", message: prompt }}
                abort={() => {}}
              >
                <div ref={scrollElement} />
              </LLMMessage>
            )}
          </ScrollArea>
          <div
            className="h-[120px] relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
            x-chunk="dashboard-03-chunk-1"
          >
            <Label htmlFor="message" className="sr-only">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  if (!processing && prompt) {
                    start();
                  }
                }
              }}
              // maxLength={params.maxSeqLen}
            />
            <div className="flex items-center p-3 pt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Paperclip className="size-4" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach File</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Mic className="size-4" />
                    <span className="sr-only">Use Microphone</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Use Microphone</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <NotepadTextDashed className="size-4" />
                    <span className="sr-only">Prompt Template</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                      <span>Prompt Template</span>
                      {organizationId ? (
                        <>
                          <SettingBlockConfigDrawer<
                            { title: string; prompt: string }[]
                          >
                            title={"Prompt Configuration"}
                            description={
                              "Configure the settings for the prompts."
                            }
                            organizationId={organizationId}
                            blocks={candleTemplates}
                            mutateBlock={mutateCandleTemplates}
                            emptyBlock={[]}
                            copy={(source) => [...source]}
                            blockRenderer={PromptBlockRenderer}
                          >
                            <div className="cursor-pointer mr-2 md:hidden">
                              <Settings className="size-4" />
                              <span className="sr-only">Settings</span>
                            </div>
                          </SettingBlockConfigDrawer>
                          <SettingBlockConfigDialog<
                            { title: string; prompt: string }[]
                          >
                            title={"Prompt Configuration"}
                            description={
                              "Configure the settings for the prompts."
                            }
                            organizationId={organizationId}
                            blocks={candleTemplates}
                            mutateBlock={mutateCandleTemplates}
                            emptyBlock={[]}
                            copy={(source) => [...source]}
                            blockRenderer={PromptBlockRenderer}
                          >
                            <div className="cursor-pointer mr-2 hidden md:block">
                              <Settings className="size-4" />
                              <span className="sr-only">Settings</span>
                            </div>
                          </SettingBlockConfigDialog>
                        </>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {templates.map((template) => (
                      <DropdownMenuItem
                        key={template.title}
                        onClick={() => setPrompt(template.prompt)}
                      >
                        <NotepadTextDashed className="mr-2 h-4 w-4" />
                        <span>{template.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={clean}>
                    <Eraser className="size-4" />
                    <span className="sr-only">Clean</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Clean</TooltipContent>
              </Tooltip>
              <Button
                type="submit"
                size="sm"
                className="ml-auto gap-1.5"
                disabled={processing || !prompt}
                onClick={() => start()}
              >
                Send Message
                {processing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CornerDownLeft className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
