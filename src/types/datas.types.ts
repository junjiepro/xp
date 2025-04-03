/// LOCAL Storage

import { Database } from "./database.types";

export type XpDatas = Record<string, XpUserData>;

export type XpUserData = {
  server: XpServerData;
  device: XpDeviceData;
  llm?: XpLLMData;
};

export type XpServerData = {
  type: XpServerType;
  serverlessBaseUrl?: string;
};

export type XpServerType = "supabase" | "serverless" | "local";

export type XpDeviceData = {
  id: string;
  name: string;
};

export type XpLLMData = {
  modelBaseUrls: string[];
  models: Record<string, XpModel>;
  promptTemplates: { title: string; prompt: string }[];
};

/// Data

export type UserDevice = Omit<
  Database["public"]["Tables"]["user_devices"]["Row"],
  "data"
> & {
  data?: UserDeviceData;
};
export type UserDeviceData = {
  name: string;
  provider: {
    type: "local" | "supabase";
  };
  user: {
    username: string;
  };
};
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Role = Database["public"]["Tables"]["roles"]["Row"];
export type RoleWithOrganization =
  Database["public"]["Views"]["user_role_with_organizations"]["Row"];

export type ApplicationBlock =
  Database["public"]["Tables"]["application_blocks"]["Row"];

export type SettingBlock =
  Database["public"]["Views"]["setting_block_with_permissions"]["Row"];
export type Block<T extends object> = Omit<SettingBlock, "block" | "access"> & {
  block: T;
  access: {
    owners: string[];
    roles: string[];
    title?: string;
    description?: string;
  };
};
export type Blocks<T extends object> = {
  public: Block<T>[];
  private: Block<T>;
  local: Block<T>;
};
export type EdittingBlock<T extends object> = {
  id: Block<T>["id"];
  block: Block<T>["block"];
  access: Block<T>["access"];
};
export type SettingBlockHandler<T extends object> = {
  loading: boolean;
  blocks: Blocks<T>;
  reload: () => void;
  mutateBlock: (
    block: Block<T> | EdittingBlock<T>,
    target: "public" | "private" | "local",
    del?: boolean
  ) => Promise<string | null | undefined>;
};

/// XP LLM

export type XpModel = {
  base_url: string;
  model: string | string[];
  tokenizer: string;
  config: string;
  quantized: boolean;
  seq_len: number;
  size: string;
};

export type XpModelParams = {
  prompt: string;
  temperature: number;
  topP: number;
  repeatPenalty: number;
  seed: number;
  maxSeqLen: number;
};

export interface XpLLMStartEvent extends XpEvent {
  model: XpModel;
  modelId: string;
  params: XpModelParams;
}

export interface XpLLMAbortEvent extends XpEvent {}

export interface XpLLMReciveData {
  status: "queue" | "loading" | "generating" | "complete" | "aborted";
  error?: string;
  queue?: number;
  message: string;
  prompt?: string;
  sentence?: string;
  token?: string;
  tokensSec?: number;
  totalTime?: number;
  output?: string;
}

export interface XpLLMReciveEvent extends XpEvent {
  data: XpLLMReciveData;
}

export type APIModel = {
  base_url: string;
  api_key: string;
  model: string;
  model_id: string;
};

/// EVENT

export interface XpEvent {
  channel: string;
}

export interface ChannelInterface {
  emit<K extends keyof XpEventHandlersEventMap>(
    type: K,
    arg: XpEventHandlersEventMap[K]
  ): boolean;

  on<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ): (ev: XpEventHandlersEventMap[K]) => any;

  off<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ): this;
}

export interface ChannelManagerInterface {
  channel(c: string): ChannelInterface;

  emit<K extends keyof XpEventHandlersEventMap>(
    type: K,
    arg: XpEventHandlersEventMap[K]
  ): boolean;

  on<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ): this;

  off<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ): this;
}

export interface XpEventHandler {
  register: (channelManager: ChannelManagerInterface) => void;

  unregister: (channelManager: ChannelManagerInterface) => void;
}

export interface XpEventHandlersEventMap {
  "xp-llm-start": XpLLMStartEvent;
  "xp-llm-abort": XpLLMAbortEvent;
  "xp-llm-recive": XpLLMReciveEvent;
}
