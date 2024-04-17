

/// LOCAL Storage

export type XpDatas = Record<string, XpUserData>;

export type XpUserData = {
  server: XpServerData;
  device: XpDeviceData;
}

export type XpServerData = {
  type: XpServerType;
  serverlessBaseUrl?: string;
}

export type XpServerType = "supabase" | 'serverless' | 'local';

export type XpDeviceData = {
  id: string;
  name: string;
}

/// XP LLM

export type XpModel = {
  base_url: string;
  model: string | string[];
  tokenizer: string;
  config: string;
  quantized: boolean
  seq_len: number
  size: string;
}

export type XpModelParams = {
  prompt: string,
  temperature: number,
  topP: number,
  repeatPenalty: number,
  seed: number,
  maxSeqLen: number
}

export interface XpLLMStartEvent extends XpEvent {
  model: XpModel;
  modelId: string;
  params: XpModelParams;
}

export interface XpLLMAbortEvent extends XpEvent {

}

export interface XpLLMReciveData {
  status: 'loading' | 'generating' | 'complete' | 'aborted'
  error?: string
  message: string
  prompt?: string
  sentence?: string
  token?: string
  tokensSec?: number
  totalTime?: number
  output?: string
}

export interface XpLLMReciveEvent extends XpEvent {
  data: XpLLMReciveData;
}

/// EVENT

export interface XpEvent {
  channel: string;
}

export interface ChannelInterface {
  emit<K extends keyof XpEventHandlersEventMap>(type: K, arg: XpEventHandlersEventMap[K]): boolean

  on<K extends keyof XpEventHandlersEventMap>(type: K, listener: (ev: XpEventHandlersEventMap[K]) => any, context?: any): (ev: XpEventHandlersEventMap[K]) => any

  off<K extends keyof XpEventHandlersEventMap>(type: K, listener: (ev: XpEventHandlersEventMap[K]) => any, context?: any): this
}

export interface ChannelManagerInterface {
  channel(c: string): ChannelInterface

  emit<K extends keyof XpEventHandlersEventMap>(type: K, arg: XpEventHandlersEventMap[K]): boolean

  on<K extends keyof XpEventHandlersEventMap>(type: K, listener: (ev: XpEventHandlersEventMap[K]) => any, context?: any): this

  off<K extends keyof XpEventHandlersEventMap>(type: K, listener: (ev: XpEventHandlersEventMap[K]) => any, context?: any): this
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
