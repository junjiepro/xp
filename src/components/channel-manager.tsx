"use client"

import xpChannel from "@/lib/channel"
import { xpllmHander } from "@/lib/llm/handler"
import React from "react"

export default function ChannelManager({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    xpChannel.register(xpllmHander)

    return () => {
      xpChannel.unregister();
    }
  }, [])
  return (
    <>
      {children}
    </>
  )
}