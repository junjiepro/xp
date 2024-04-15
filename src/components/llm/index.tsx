"use client"

import { useTranslation } from "next-export-i18n"
import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, SendHorizonal, Settings } from "lucide-react"
import { useModelBaseUrls, useModels } from "@/hooks/use-llm"
import { ChannelInterface, XpLLMReciveEvent, XpModel, XpModelParams } from "@/types/datas.types"
import xpChannel from "@/lib/channel"
import { Label } from "../ui/label"

export function LLM() {
  const { t } = useTranslation()

  const models = useModels()
  const modelBaseUrls = useModelBaseUrls()
  const [channel, setChannel] = React.useState<ChannelInterface>()

  const [modelId, setModelId] = React.useState<string>(Object.keys(models)[0])
  const [modelBaseUrl, setModelBaseUrl] = React.useState(modelBaseUrls[0])
  const [params, setParams] = React.useState<XpModelParams>()
  const [messages, setMessages] = React.useState<{ role: string; message: string; }[]>([])
  const [prompt, setPrompt] = React.useState('')
  const [processing, setProcessing] = React.useState(false)

  const model = React.useMemo(() => modelId && models[modelId], [modelId, models])

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
            <Dialog>
              <DialogTrigger asChild>
                <Label htmlFor="text" className="hover:cursor-pointer flex flex-row space-x-1">
                  <span>{modelId}</span>
                  <Settings className="h-4 w-4" />
                </Label>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Model
                    </Label>
                    <Select value={modelId} onValueChange={(v) => setModelId(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Model</SelectLabel>
                          {Object.entries(models).map(([mid, m]) =>
                            <SelectItem key={mid} value={mid}>{mid}</SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      defaultValue="@peduarte"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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