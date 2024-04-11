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

export type XpModel = {
  base_url: string;
  model: string | string[];
  tokenizer: string;
  config: string;
  quantized: boolean
  seq_len: number
  size: string;
}
