"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDevices, useSetDevices } from "@/hooks/use-devices";
import { useUserProfile } from "@/hooks/use-user-profile";
import { format } from "date-fns";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { useTranslation } from "next-export-i18n";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import xpServer from "@/lib/applications/server/xp-server";
import { toast } from "sonner";
import { UserDevice } from "@/types/datas.types";

export default function DeviceOverview() {
  const { t } = useTranslation();
  const devices = useDevices();
  const setDevices = useSetDevices();
  const userProfile = useUserProfile();

  const [showUpdateDeviceDialog, setShowUpdateDeviceDialog] =
    React.useState(false);
  const [edittingDevice, setEdittingDevice] = React.useState<UserDevice | null>(
    null
  );
  const formSchema = z.object({
    name: z
      .string()
      .min(2, {
        message: t("device.formSchema.name.min"),
      })
      .max(50, {
        message: t("device.formSchema.name.max"),
      }),
  });
  const [processing, setProcessing] = React.useState(false);
  // 1. Define form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateDeviceAction(values);
  }

  const updateDeviceAction = (values: z.infer<typeof formSchema>) => {
    setProcessing(true);
    if (edittingDevice && userProfile) {
      xpServer
        .updateDevice(edittingDevice.id, {
          ...(edittingDevice.data as any),
          ...values,
        })
        .then(() => {
          setTimeout(() => {
            setEdittingDevice(null);
            setShowUpdateDeviceDialog(false);
            toast.success(t("tip.success.submit"));
            xpServer
              .getCurrentDevices()
              .then((data) => {
                console.log(data);
                setDevices(data);
              })
              .catch((error) => {
                toast.error(error.message);
                console.log(error);
              })
              .finally(() => {
                setProcessing(false);
              });
          }, 250);
        })
        .catch((error) => {
          toast.error(error.message);
          console.log(error);
          setProcessing(false);
        });
    }
  };

  const edittingDeviceData = edittingDevice?.data as any;
  React.useEffect(() => {
    form.setValue("name", edittingDeviceData?.name || "");
  }, [edittingDeviceData?.name]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("device.title")}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {devices.map((device) => (
          <Card
            key={device.id}
            className="hover:cursor-pointer"
            onClick={() => {
              setEdittingDevice(device);
              setShowUpdateDeviceDialog(true);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile?.id &&
                xpServer.currentUserDevice?.id === device.id ? (
                  <Badge>{t("device.current")}</Badge>
                ) : null}
              </CardTitle>
              <MonitorSmartphone />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold py-2">
                {(device.data as any)?.name || device.id}
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {t("device.formSchema.usedAt.label")}{" "}
                {device.used_at && format(device.used_at, "yyyy/MM/dd HH:mm")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog
        open={showUpdateDeviceDialog}
        onOpenChange={setShowUpdateDeviceDialog}
      >
        <DialogContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <DialogHeader>
                <DialogTitle>{t("device.update")}</DialogTitle>
                <DialogDescription>
                  {t("device.update_description")}
                </DialogDescription>
              </DialogHeader>
              <div>
                <div className="space-y-4 py-2 pb-4">
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("device.formSchema.name.label")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUpdateDeviceDialog(false)}
                >
                  {t("action.cancel")}
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("action.submit")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
