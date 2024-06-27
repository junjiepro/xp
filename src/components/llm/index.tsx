"use client";

import { useTranslation } from "next-export-i18n";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trash,
  Plus,
  ListPlus,
  PlusCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLLM } from "@/hooks/use-llm";
import {
  Block,
  ChannelInterface,
  EdittingBlock,
  XpLLMReciveEvent,
  XpModel,
  XpModelParams,
} from "@/types/datas.types";
import xpChannel from "@/lib/channel";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/hooks/use-user-profile";
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useRoles } from "@/hooks/use-organizations";
import { cn } from "@/lib/utils";

const EXAMPLE_MESSAGES: Message[] = [
  {
    role: "user",
    message: `Alice: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'?  
Bob:`,
  },
  {
    role: "assistant",
    message: `Alice: Can you tell me how to create a python application to go through all the files in one directory where the file’s name DOES NOT end with '.json'?  
Bob: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'`,
    event: {
      channel: "",
      data: { status: "loading", message: "Loading Model" },
    },
  },
  {
    role: "user",
    message: `Alice: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'?  
Bob:`,
  },
  {
    role: "assistant",
    message: `Alice: Can you tell me how to create a python application to go through all the files in one directory where the file’s name DOES NOT end with '.json'?  
Bob: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'`,
    event: {
      channel: "",
      data: {
        queue: 1,
        status: "queue",
        message: "generating",
        prompt: "",
        sentence: "asd asd",
        token: "asd",
        tokensSec: 5.3,
        totalTime: 61262,
      },
    },
  },
  {
    role: "user",
    message: `Alice: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'?  
Bob:`,
  },
  {
    role: "assistant",
    message: `Alice: Can you tell me how to create a python application to go through all the files in one directory where the file’s name DOES NOT end with '.json'?  
Bob: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'`,
    event: {
      channel: "",
      data: { status: "complete", message: "", output: "Loading Model" },
    },
  },
];

export function LLM() {
  const searchParams = useSearchParams();

  const organizationId = searchParams.get("organizationId");
  const roles = useRoles();
  const is_admin = React.useMemo(
    () =>
      roles.some(
        (r) =>
          r.role_name?.toUpperCase() === "ADMINISTRATOR" &&
          r.organization_id === organizationId
      ),
    [roles, organizationId]
  );
  const { core, candleModels, candleUrls, candleTemplates, mutateCandleUrls } =
    useLLM(organizationId || "");
  const models = React.useMemo(() => {
    return candleModels.public
      .concat([candleModels.private])
      .reduce((acc, t) => {
        Object.entries(t.block).forEach(([k, v]) => {
          acc[k] = v;
        });
        return acc;
      }, {} as Record<string, XpModel>);
  }, [candleModels]);
  const editableModels = React.useMemo(
    () => candleModels.public.filter((b) => !!b.is_admin || !!b.is_owner),
    [candleModels]
  );
  const modelBaseUrls = React.useMemo(() => {
    return candleUrls.public.concat([candleUrls.private]).reduce((acc, t) => {
      t.block.forEach((b) => {
        if (!acc.includes(b)) {
          acc.push(b);
        }
      });
      return acc;
    }, [] as string[]);
  }, [candleUrls]);
  const editableModelBaseUrls = React.useMemo(
    () => candleUrls.public.filter((b) => !!b.is_admin || !!b.is_owner),
    [candleUrls]
  );
  const templates = React.useMemo(() => {
    return candleTemplates.public
      .concat([candleTemplates.private])
      .reduce((acc, t) => {
        acc.push(...t.block);
        return acc;
      }, [] as { title: string; prompt: string }[]);
  }, [candleTemplates]);
  const editableTemplates = React.useMemo(
    () => candleTemplates.public.filter((b) => !!b.is_admin || !!b.is_owner),
    [candleTemplates]
  );

  const [channel, setChannel] = React.useState<ChannelInterface>();

  const [urlSettingsOpened1, setUrlSettingsOpened1] = React.useState(false);
  const [urlSettingsOpened2, setUrlSettingsOpened2] = React.useState(false);
  const [privateUrlSettings, setPrivateUrlSettings] =
    React.useState<EdittingBlock<string[]>>();
  const [privateUrlSettingsUpdating, setPrivateUrlSettingsUpdating] =
    React.useState(false);
  const savePrivateUrlSettings = () => {
    if (privateUrlSettingsUpdating || !privateUrlSettings) {
      return;
    }
    setPrivateUrlSettingsUpdating(true);
    mutateCandleUrls(privateUrlSettings, "private").then(() =>
      setPrivateUrlSettingsUpdating(false)
    );
  };
  const [publicUrlSettings, setPublicUrlSettings] =
    React.useState<EdittingBlock<string[]>>();
  const [publicUrlSettingsUpdating, setPublicUrlSettingsUpdating] =
    React.useState(false);
  const savePublicUrlSettings = () => {
    if (publicUrlSettingsUpdating || !publicUrlSettings) {
      return;
    }
    setPublicUrlSettingsUpdating(true);
    mutateCandleUrls(publicUrlSettings, "public").then(() =>
      setPublicUrlSettingsUpdating(false)
    );
  };
  React.useEffect(() => {
    if (urlSettingsOpened1 || urlSettingsOpened2) {
      setPrivateUrlSettings({
        id: candleUrls.private.id,
        block: [...candleUrls.private.block],
        access: { ...candleUrls.private.access },
      });
      if (editableModelBaseUrls.length) {
        const p = editableModelBaseUrls[0];
        setPublicUrlSettings({
          id: p.id,
          block: [...p.block],
          access: { ...p.access },
        });
      } else if (is_admin) {
        setPublicUrlSettings({
          id: "",
          block: [],
          access: { owners: [], roles: [] },
        });
      } else {
        setPublicUrlSettings(undefined);
      }
    }
  }, [urlSettingsOpened1, urlSettingsOpened2]);

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
  const [messages, setMessages] = React.useState<Message[]>(EXAMPLE_MESSAGES);
  const [prompt, setPrompt] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  const model = React.useMemo(
    () => (modelId ? models[modelId] : undefined),
    [modelId, models]
  );
  const maxSeqLen = React.useMemo(
    () => (model ? model.seq_len : 2048),
    [model]
  );

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

  const start = () => {
    if (channel && prompt && model) {
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
    }
  };

  const abort = () => {
    channel?.emit("xp-llm-abort", { channel: "" });
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
      const msg = {
        role: "assistant",
        message: e.data.output || `${e.data.sentence || ""}`,
        event: e,
      };
      if (ms && ms.length) {
        const last = ms[ms.length - 1];
        if (last.event) {
          msg.event.data.tokensSec =
            msg.event.data.tokensSec || last.event.data.tokensSec;
          msg.event.data.totalTime =
            msg.event.data.totalTime || last.event.data.totalTime;
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
  }, []);

  return (
    <div className="h-full flex flex-col">
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
        <h1 className="text-xl font-semibold">XP LLM</h1>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
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
            <form className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Settings
                </legend>
                <div className="grid gap-3 py-4">
                  <div className="grid grid-cols-3 items-center gap-3">
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
                              <Drawer
                                open={urlSettingsOpened1}
                                onOpenChange={setUrlSettingsOpened1}
                              >
                                <DrawerTrigger asChild>
                                  <div className="cursor-pointer mr-2">
                                    <Settings className="size-4" />
                                    <span className="sr-only">Settings</span>
                                  </div>
                                </DrawerTrigger>
                                <DrawerContent className="max-h-[70vh]">
                                  <DrawerHeader>
                                    <DrawerTitle>URL Configuration</DrawerTitle>
                                    <DrawerDescription>
                                      Configure the settings for the model base
                                      urls.
                                    </DrawerDescription>
                                  </DrawerHeader>
                                  <form className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
                                    <fieldset className="grid gap-6">
                                      <Tabs defaultValue="private">
                                        <TabsList className="grid w-full grid-cols-2 sticky top-0">
                                          <TabsTrigger value="private">
                                            Private
                                          </TabsTrigger>
                                          <TabsTrigger
                                            value="public"
                                            disabled={
                                              !is_admin &&
                                              !editableModelBaseUrls.length
                                            }
                                          >
                                            Public
                                          </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="private">
                                          <Card>
                                            <CardHeader>
                                              <CardTitle>Private</CardTitle>
                                              <CardDescription>
                                                Your private settings here.
                                              </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                              {!privateUrlSettings?.block
                                                ?.length ? (
                                                <div>
                                                  <Button
                                                    variant={"ghost"}
                                                    onClick={() => {
                                                      setPrivateUrlSettings(
                                                        (prev) => {
                                                          if (prev) {
                                                            return {
                                                              ...prev,
                                                              block: [""],
                                                            };
                                                          }
                                                          return prev;
                                                        }
                                                      );
                                                    }}
                                                  >
                                                    <PlusCircle className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              ) : null}
                                              {privateUrlSettings?.block?.map(
                                                (url, index) => (
                                                  <div
                                                    key={index}
                                                    className="flex flex-row items-center justify-between gap-2"
                                                  >
                                                    <Input
                                                      autoFocus={!url}
                                                      value={url}
                                                      onChange={(e) => {
                                                        setPrivateUrlSettings(
                                                          (prev) => {
                                                            if (prev) {
                                                              return {
                                                                ...prev,
                                                                block:
                                                                  prev.block?.map(
                                                                    (u, i) => {
                                                                      if (
                                                                        i ===
                                                                        index
                                                                      ) {
                                                                        return e
                                                                          .target
                                                                          .value;
                                                                      } else {
                                                                        return u;
                                                                      }
                                                                    }
                                                                  ),
                                                              };
                                                            }
                                                            return prev;
                                                          }
                                                        );
                                                      }}
                                                    />
                                                    <Button
                                                      variant={"ghost"}
                                                      onClick={() => {
                                                        setPrivateUrlSettings(
                                                          (prev) => {
                                                            if (prev) {
                                                              return {
                                                                ...prev,
                                                                block:
                                                                  prev.block.reduce(
                                                                    (
                                                                      acc,
                                                                      u,
                                                                      i
                                                                    ) => {
                                                                      acc.push(
                                                                        u
                                                                      );
                                                                      if (
                                                                        i ===
                                                                        index
                                                                      ) {
                                                                        acc.push(
                                                                          ""
                                                                        );
                                                                      }
                                                                      return acc;
                                                                    },
                                                                    [] as string[]
                                                                  ),
                                                              };
                                                            }
                                                            return prev;
                                                          }
                                                        );
                                                      }}
                                                    >
                                                      <PlusCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                      variant={"ghost"}
                                                      onClick={() => {
                                                        setPrivateUrlSettings(
                                                          (prev) => {
                                                            if (prev) {
                                                              return {
                                                                ...prev,
                                                                block:
                                                                  prev.block?.filter(
                                                                    (_, i) =>
                                                                      i !==
                                                                      index
                                                                  ),
                                                              };
                                                            }
                                                            return prev;
                                                          }
                                                        );
                                                      }}
                                                    >
                                                      <Trash className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                  </div>
                                                )
                                              )}
                                            </CardContent>
                                            <CardFooter>
                                              <Button
                                                disabled={
                                                  privateUrlSettingsUpdating
                                                }
                                                onClick={() =>
                                                  savePrivateUrlSettings()
                                                }
                                              >
                                                Save changes
                                              </Button>
                                            </CardFooter>
                                          </Card>
                                        </TabsContent>
                                        <TabsContent
                                          value="public"
                                          className={cn(
                                            "overflow-auto p-0",
                                            !is_admin &&
                                              !editableModelBaseUrls.length &&
                                              "hidden"
                                          )}
                                        >
                                          <Card>
                                            <CardHeader>
                                              <CardTitle>Public</CardTitle>
                                              <CardDescription>
                                                The public settings for the
                                                organization here.
                                              </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                              {!publicUrlSettings?.block
                                                ?.length ? (
                                                <div>
                                                  <Button
                                                    variant={"ghost"}
                                                    onClick={() => {
                                                      setPublicUrlSettings(
                                                        (prev) => {
                                                          if (prev) {
                                                            return {
                                                              ...prev,
                                                              block: [""],
                                                            };
                                                          }
                                                          return prev;
                                                        }
                                                      );
                                                    }}
                                                  >
                                                    <PlusCircle className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              ) : null}
                                              {publicUrlSettings?.block?.map(
                                                (url, index) => (
                                                  <div
                                                    key={index}
                                                    className="flex flex-row items-center justify-between gap-2"
                                                  >
                                                    <Input
                                                      autoFocus={!url}
                                                      value={url}
                                                      onChange={(e) => {
                                                        setPublicUrlSettings(
                                                          (prev) => {
                                                            if (prev) {
                                                              return {
                                                                ...prev,
                                                                block:
                                                                  prev.block?.map(
                                                                    (u, i) => {
                                                                      if (
                                                                        i ===
                                                                        index
                                                                      ) {
                                                                        return e
                                                                          .target
                                                                          .value;
                                                                      } else {
                                                                        return u;
                                                                      }
                                                                    }
                                                                  ),
                                                              };
                                                            }
                                                            return prev;
                                                          }
                                                        );
                                                      }}
                                                    />
                                                    <Button
                                                      variant={"ghost"}
                                                      onClick={() => {
                                                        setPublicUrlSettings(
                                                          (prev) => {
                                                            if (prev) {
                                                              return {
                                                                ...prev,
                                                                block:
                                                                  prev.block.reduce(
                                                                    (
                                                                      acc,
                                                                      u,
                                                                      i
                                                                    ) => {
                                                                      acc.push(
                                                                        u
                                                                      );
                                                                      if (
                                                                        i ===
                                                                        index
                                                                      ) {
                                                                        acc.push(
                                                                          ""
                                                                        );
                                                                      }
                                                                      return acc;
                                                                    },
                                                                    [] as string[]
                                                                  ),
                                                              };
                                                            }
                                                            return prev;
                                                          }
                                                        );
                                                      }}
                                                    >
                                                      <PlusCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                      variant={"ghost"}
                                                      onClick={() => {
                                                        setPublicUrlSettings(
                                                          (prev) => {
                                                            if (prev) {
                                                              return {
                                                                ...prev,
                                                                block:
                                                                  prev.block?.filter(
                                                                    (_, i) =>
                                                                      i !==
                                                                      index
                                                                  ),
                                                              };
                                                            }
                                                            return prev;
                                                          }
                                                        );
                                                      }}
                                                    >
                                                      <Trash className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                  </div>
                                                )
                                              )}
                                            </CardContent>
                                            <CardFooter>
                                              <Button
                                                disabled={
                                                  publicUrlSettingsUpdating
                                                }
                                                onClick={() =>
                                                  savePublicUrlSettings()
                                                }
                                              >
                                                Save changes
                                              </Button>
                                            </CardFooter>
                                          </Card>
                                        </TabsContent>
                                      </Tabs>
                                    </fieldset>
                                  </form>
                                </DrawerContent>
                              </Drawer>
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
                  <div className="grid grid-cols-3 items-center gap-3">
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
                          <SelectLabel>Model</SelectLabel>
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
                        <Button variant={"ghost"}>
                          <FileBox className="h-4 w-4 mr-1" />
                          {model?.size}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-96">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">{modelId}</h4>
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
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Maximum length
                    </Label>
                    <Slider
                      value={[params.maxSeqLen]}
                      onValueChange={(v) => updateParams("maxSeqLen", v[0])}
                      max={maxSeqLen}
                      min={1}
                      step={1}
                    />
                    <Input
                      type="number"
                      value={params.maxSeqLen}
                      min={1}
                      max={maxSeqLen}
                      onChange={(v) =>
                        updateParams("maxSeqLen", v.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Temperature
                    </Label>
                    <Slider
                      value={[params.temperature]}
                      onValueChange={(v) => updateParams("temperature", v[0])}
                      max={2}
                      min={0}
                      step={0.01}
                    />
                    <Input
                      type="text"
                      value={params.temperature.toFixed(2)}
                      min={0}
                      max={2}
                      onChange={(v) =>
                        updateParams("temperature", v.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Top-p
                    </Label>
                    <Slider
                      value={[params.topP]}
                      onValueChange={(v) => updateParams("topP", v[0])}
                      max={1}
                      min={0}
                      step={0.01}
                    />
                    <Input
                      type="text"
                      value={params.topP.toFixed(2)}
                      min={0}
                      max={1}
                      onChange={(v) => updateParams("topP", v.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Repeat Penalty
                    </Label>
                    <Slider
                      value={[params.repeatPenalty]}
                      onValueChange={(v) => updateParams("repeatPenalty", v[0])}
                      max={2}
                      min={1}
                      step={0.01}
                    />
                    <Input
                      type="text"
                      value={params.repeatPenalty.toFixed(2)}
                      min={1}
                      max={2}
                      onChange={(v) =>
                        updateParams("repeatPenalty", v.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Seed
                    </Label>
                    <Input
                      type="number"
                      value={params.seed}
                      onChange={(v) => updateParams("seed", v.target.value)}
                    />
                    <Button onClick={() => randSeed()}>Rand</Button>
                  </div>
                </div>
              </fieldset>
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Messages
                </legend>
                <div className="grid gap-3">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="system">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" placeholder="You are a..." />
                </div>
              </fieldset>
            </form>
          </DrawerContent>
        </Drawer>
        <Button variant="outline" size="sm" className="ml-auto gap-1.5 text-sm">
          <Share className="size-3.5" />
          Share
        </Button>
      </header>
      <main className="h-1/2 grid flex-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="hidden h-full overflow-auto gap-8 md:block">
          <ScrollArea className="h-full pr-2 pb-2">
            <form className="grid w-full items-start gap-6">
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Settings
                </legend>
                <div className="grid gap-3 py-4">
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="modelBaseUrl" className="text-left">
                      Model base url
                    </Label>
                    <Select
                      name="modelBaseUrl"
                      value={modelBaseUrl}
                      onValueChange={(v) => setModelBaseUrl(v)}
                    >
                      <SelectTrigger className="col-span-2">
                        <SelectValue placeholder="Select a model base url" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>URL</SelectLabel>
                          {modelBaseUrls.map((url) => (
                            <SelectItem key={url} value={url}>
                              {url}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
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
                          <SelectLabel>Model</SelectLabel>
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
                        <Button variant={"ghost"}>
                          <FileBox className="h-4 w-4 mr-1" />
                          {model?.size}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-96">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">{modelId}</h4>
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
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Maximum length
                    </Label>
                    <Slider
                      value={[params.maxSeqLen]}
                      onValueChange={(v) => updateParams("maxSeqLen", v[0])}
                      max={maxSeqLen}
                      min={1}
                      step={1}
                    />
                    <Input
                      type="number"
                      value={params.maxSeqLen}
                      min={1}
                      max={maxSeqLen}
                      onChange={(v) =>
                        updateParams("maxSeqLen", v.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Temperature
                    </Label>
                    <Slider
                      value={[params.temperature]}
                      onValueChange={(v) => updateParams("temperature", v[0])}
                      max={2}
                      min={0}
                      step={0.01}
                    />
                    <Input
                      type="text"
                      value={params.temperature.toFixed(2)}
                      min={0}
                      max={2}
                      onChange={(v) =>
                        updateParams("temperature", v.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Top-p
                    </Label>
                    <Slider
                      value={[params.topP]}
                      onValueChange={(v) => updateParams("topP", v[0])}
                      max={1}
                      min={0}
                      step={0.01}
                    />
                    <Input
                      type="text"
                      value={params.topP.toFixed(2)}
                      min={0}
                      max={1}
                      onChange={(v) => updateParams("topP", v.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Repeat Penalty
                    </Label>
                    <Slider
                      value={[params.repeatPenalty]}
                      onValueChange={(v) => updateParams("repeatPenalty", v[0])}
                      max={2}
                      min={1}
                      step={0.01}
                    />
                    <Input
                      type="text"
                      value={params.repeatPenalty.toFixed(2)}
                      min={1}
                      max={2}
                      onChange={(v) =>
                        updateParams("repeatPenalty", v.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="name" className="text-left">
                      Seed
                    </Label>
                    <Input
                      type="number"
                      value={params.seed}
                      onChange={(v) => updateParams("seed", v.target.value)}
                    />
                    <Button onClick={() => randSeed()}>Rand</Button>
                  </div>
                </div>
              </fieldset>
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Messages
                </legend>
                <div className="grid gap-3">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="system">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="You are a..."
                    className="min-h-[9.5rem]"
                  />
                </div>
              </fieldset>
            </form>
          </ScrollArea>
        </div>
        <div className="flex h-full flex-col rounded-xl bg-muted/50 p-4 overflow-auto lg:col-span-2">
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
                {messages.length - 1 === i && <div ref={scrollElement} />}
              </LLMMessage>
            ))}
          </ScrollArea>
          <form
            className="h-[120px] relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
            x-chunk="dashboard-03-chunk-1"
          >
            <Label htmlFor="message" className="sr-only">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={params.maxSeqLen}
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
                  <DropdownMenuLabel>Prompt Template</DropdownMenuLabel>
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
          </form>
        </div>
      </main>
    </div>
  );
}
