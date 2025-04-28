"use client";

import AuthForm from "@/components/auth-form";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import xpServer from "@/lib/applications/server/xp-server";
import { Cloud, LogIn, MonitorSmartphone } from "lucide-react";
import { LinkWithLocale, useTranslation } from "next-export-i18n";
import React from "react";

export default function Auth() {
  const { t } = useTranslation();

  const [localUserName, setLocalUserName] = React.useState("");

  React.useEffect(() => {
    xpServer.getAllLocalDevices().then((data) => {
      const local = data?.find((d) => d.data?.provider?.type === "local");
      setLocalUserName(local?.data?.name || "");
    });
  }, []);

  const signInLocalAccount = () => {
    xpServer.signIn();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-[-24px] text-sm text-muted-foreground border-b">
        <div className="flex-1 md:flex-none flex items-center gap-1 bg-primary text-primary-foreground px-4 py-3 rounded-t-md">
          <Cloud className="h-4 w-4" />
          {t("auth.provider.supabase")}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex-1 md:flex-none flex items-center justify-end gap-1 px-4 py-3 rounded-t-md cursor-pointer group/local hover:bg-muted"
                onClick={signInLocalAccount}
              >
                <MonitorSmartphone className="h-4 w-4" />
                {t("auth.provider.local")}
                <LogIn className="hidden h-4 w-4 group-hover/local:block" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 break-words whitespace-normal">
              {localUserName || t("auth.provider.tip.local")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <AuthForm />
      <Separator />
      <p className="px-8 text-center text-sm text-muted-foreground">
        {t("auth.agree")}
        <LinkWithLocale
          href="/auth/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t("auth.terms")}
        </LinkWithLocale>
        {t("auth.and")}
        <LinkWithLocale
          href="/auth/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t("auth.privacy")}
        </LinkWithLocale>
      </p>
    </>
  );
}
