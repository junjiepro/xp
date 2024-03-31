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
