"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useXpDatas } from "@/hooks/use-datas";
import { useDevices } from "@/hooks/use-devices";
import { useUserProfile } from "@/hooks/use-user-profile";
import { format } from "date-fns";
import { MonitorSmartphone } from "lucide-react";
import { useTranslation } from "next-export-i18n";
import { Badge } from "@/components/ui/badge";

export default function DeviceOverview() {
  const { t } = useTranslation();
  const xpDatas = useXpDatas();
  const devices = useDevices();
  const userProfile = useUserProfile();
  return (<div className="flex-1 space-y-4 p-8 pt-6">
    <div className="flex flex-col md:flex-row items-center justify-between space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">{t("device.title")}</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {devices.map((device) => (
        <Card key={device.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userProfile?.id && xpDatas[userProfile?.id].device.id === device.id ? <Badge>{t("device.current")}</Badge> : null}
            </CardTitle>
            <MonitorSmartphone />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold py-2">{device.data?.name || device.id}</div>
            <p className="text-xs text-muted-foreground text-right">
              {t("device.formSchema.usedAt.label")} {device.used_at && format(device.used_at, "yyyy/MM/dd HH:mm")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>)
}