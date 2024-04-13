"use client"

import { xpllmHander } from "@/hooks/use-llm"
import xpChannel from "@/lib/channel"
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