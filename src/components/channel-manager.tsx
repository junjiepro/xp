"use client";

import xpChannel from "@/lib/channel";
import { xpllmHander, webLLMServiceWorkerRegister } from "@/lib/llm/handler";
import React from "react";

export default function ChannelManager({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    xpChannel.register(xpllmHander);

    // webLLMServiceWorkerRegister();

    return () => {
      xpChannel.unregister();
    };
  }, []);
  return children;
}
