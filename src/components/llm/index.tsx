"use client"

import { useTranslation } from "next-export-i18n"
import React from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, SendHorizonal } from "lucide-react"
import { useModelBaseUrls, useModels } from "@/hooks/use-llm"
import { ChannelInterface, XpLLMReciveEvent, XpModel, XpModelParams } from "@/types/datas.types"
import xpChannel from "@/lib/channel"
import { Label } from "../ui/label"

export function LLM() {
  const { t } = useTranslation()

  const models = useModels()
  const modelBaseUrls = useModelBaseUrls()
  const [channel, setChannel] = React.useState<ChannelInterface>()

  const [modelId, setModelId] = React.useState<string>()
  const [modelBaseUrl, setModelBaseUrl] = React.useState('')
  const [params, setParams] = React.useState<XpModelParams>()
  const [messages, setMessages] = React.useState<{ role: string; message: string; }[]>([])
  const [prompt, setPrompt] = React.useState('')
  const [processing, setProcessing] = React.useState(false)

  const start = () => {
    if (prompt) {
      setProcessing(true)
      setMessages((ms) => ms.concat([{ role: 'user', message: prompt }]))
      setPrompt('')
      channel?.emit('xp-llm-start', {
        model: {
          base_url: "",
          model: "",
          tokenizer: "",
          config: "",
          quantized: false,
          seq_len: 0,
          size: ""
        },
        modelId: "",
        params: {
          prompt: "",
          temperature: 0,
          topP: 0,
          repeatPenalty: 0,
          seed: 0,
          maxSeqLen: 0
        },
        channel: ""
      })
    }
  }

  const abort = () => {
    channel?.emit('xp-llm-abort', { channel: '' })
    setProcessing(false)
  }

  const recive = (e: XpLLMReciveEvent) => {
    console.log(e)
  }

  React.useEffect(() => {
    const c = xpChannel.channel(new Date().getTime().toString())
    const f = c.on('xp-llm-recive', recive)
    setChannel(c)
    return () => {
      abort()
      c.off('xp-llm-recive', f)
      setChannel(undefined)
    }
  }, [])

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <CardTitle>XP LLM</CardTitle>
        </CardHeader>
        <CardContent className="flex-auto">

        </CardContent>
        <CardFooter>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="text">Prompt</Label>
            <div className="h-[100px] flex flex-row justify-center space-x-2">
              <Input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              <Button type="submit" size="icon" disabled={processing || !prompt} onClick={() => start()}>
                {processing ? <Loader2 /> : <SendHorizonal />}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}