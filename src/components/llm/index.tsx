"use client"

import { useTranslation } from "next-export-i18n"
import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bot, Check, FileBox, Loader2, MessageCircleX, NotepadTextDashed, Pause, SendHorizonal, UserRound } from "lucide-react"
import { useLLMDatas, useSetLLMDatas } from "@/hooks/use-llm"
import { ChannelInterface, XpLLMReciveEvent, XpModel, XpModelParams } from "@/types/datas.types"
import xpChannel from "@/lib/channel"
import { Label } from "../ui/label"
import { Slider } from "../ui/slider"
import { Textarea } from "../ui/textarea"
import { ScrollArea } from "../ui/scroll-area"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/hooks/use-user-profile"

export function LLM() {
  const { t } = useTranslation()
  const user = useUserProfile()

  const llmDatas = useLLMDatas(user?.id || '')
  const models = React.useMemo(() => {
    return llmDatas?.models || {}
  }, [llmDatas?.models])
  const modelBaseUrls = React.useMemo(() => {
    return llmDatas?.modelBaseUrls || []
  }, [llmDatas?.modelBaseUrls])
  const templates = React.useMemo(() => {
    return llmDatas?.promptTemplates || []
  }, [llmDatas?.promptTemplates])
  const [channel, setChannel] = React.useState<ChannelInterface>()

  const [modelId, setModelId] = React.useState<string>(Object.keys(models)[0])
  const [modelBaseUrl, setModelBaseUrl] = React.useState(modelBaseUrls[0])
  const [params, setParams] = React.useState<XpModelParams>({
    prompt: '',
    temperature: 0.0,
    topP: 1.0,
    repeatPenalty: 1.10,
    seed: 299792458,
    maxSeqLen: 200
  })
  const [messages, setMessages] = React.useState<{ role: string; message: string; event?: XpLLMReciveEvent }[]>([{
    role: 'user',
    message: `Alice: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'?  
Bob:`
  }, {
    role: 'assistant',
    message: `Alice: Can you tell me how to create a python application to go through all the files in one directory where the file’s name DOES NOT end with '.json'?  
Bob: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'`,
    event: { channel: '', data: { status: 'loading', message: 'Loading Model' } }
  }, {
    role: 'user',
    message: `Alice: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'?  
Bob:`
  }, {
    role: 'assistant',
    message: `Alice: Can you tell me how to create a python application to go through all the files in one directory where the file’s name DOES NOT end with '.json'?  
Bob: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'`,
    event: {
      channel: '', data: {
        queue: 1,
        status: 'queue', message: 'generating', prompt: '',
        sentence: 'asd asd',
        token: 'asd',
        tokensSec: 5.3,
        totalTime: 61262
      }
    }
  }, {
    role: 'user',
    message: `Alice: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'?  
Bob:`
  }, {
    role: 'assistant',
    message: `Alice: Can you tell me how to create a python application to go through all the files in one directory where the file’s name DOES NOT end with '.json'?  
Bob: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'
Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'`,
    event: { channel: '', data: { status: 'complete', message: '', output: 'Loading Model' } }
  }])
  const [prompt, setPrompt] = React.useState('')
  const [processing, setProcessing] = React.useState(false)

  const model = React.useMemo(() => modelId ? models[modelId] : undefined, [modelId, models])
  const maxSeqLen = React.useMemo(() => model ? model.seq_len : 2048, [model])

  const [scrollToBottom, setScrollToBottom] = React.useState(true)
  const scrollElement = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (scrollToBottom) scrollElement.current?.scrollIntoView({ behavior: 'smooth' })
  }, [scrollToBottom, messages])

  const updateParams = (type: keyof XpModelParams, value: number | string) => {
    let val = value
    switch (type) {
      case "prompt":
        break;
      case "temperature":
        val = Number(val) > 2 ? 2 : Number(val) < 0 ? 0 : Number(val)
        break;
      case "topP":
        val = Number(val) > 1 ? 1 : Number(val) < 0 ? 0 : Number(val)
        break;
      case "repeatPenalty":
        val = Number(val) > 2 ? 2 : Number(val) < 1 ? 1 : Number(val)
        break;
      case "seed":
        val = parseInt(val.toString())
        break;
      case "maxSeqLen":
        val = Number(val) > maxSeqLen ? maxSeqLen : Number(val) < 1 ? 1 : parseInt(val.toString())
        break;
      default:
        break;
    }
    setParams(pre => ({
      ...pre,
      [type]: val
    }))
  }
  const randSeed = () =>
    updateParams('seed', Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString().slice(0, 9))


  const start = () => {
    if (channel && prompt && model) {
      setProcessing(true)
      setMessages((ms) => ms.concat([{ role: 'user', message: prompt }]))
      setPrompt('')
      channel.emit('xp-llm-start', {
        model: {
          ...model,
          base_url: `${modelBaseUrl}${model?.base_url}`
        },
        modelId,
        params: {
          ...params,
          prompt,
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
    if (e.data.error || e.data.status === 'complete' || e.data.status === 'aborted') {
      setProcessing(false)
    }
    setMessages((ms) => {
      const msg = {
        role: 'assistant',
        message: e.data.output || `${e.data.sentence || ''}`,
        event: e
      }
      if (ms && ms.length) {
        const last = ms[ms.length - 1];
        if (last.event) {
          msg.event.data.tokensSec = msg.event.data.tokensSec || last.event.data.tokensSec
          msg.event.data.totalTime = msg.event.data.totalTime || last.event.data.totalTime
          msg.message = msg.event?.data.sentence || last.event?.data.sentence || ''
          return ms.slice(0, ms.length - 1).concat([msg])
        } else {
          return ms.concat([msg])
        }
      } else {
        return [msg]
      }
    })
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
      <div className="h-full flex flex-col justify-between p-6 space-y-4">
        <div>XP LLM</div>
        <ScrollArea
          className="flex-auto w-full p-3"
          onScroll={(e) => {
            const target = e.target as HTMLElement
            const shouldScrollToBottom = target.scrollHeight - target.scrollTop === target.clientHeight
            setScrollToBottom(shouldScrollToBottom)
          }}
        >
          {messages.map((msg, i) =>
            <div key={i} className={cn('mt-2 flex w-full space-x-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && <Bot className="h-8 w-8" />}
              <div className="flex justify-between space-x-4 max-w-[80%]">
                <div className="space-y-1">
                  <pre className="rounded-md bg-slate-950 dark:bg-slate-700 p-4 whitespace-pre-wrap break-words">
                    <code className="text-white">{msg.message}</code>
                  </pre>
                  <div className="flex flex-row pt-2 text-xs text-muted-foreground space-x-1">
                    {typeof msg.event?.data.queue !== 'undefined' && <span>{`${msg.event?.data.queue + 1} queue`}</span>}
                    {msg.event?.data.totalTime && <span>{`${(msg.event?.data.totalTime / 1000).toFixed(2)}s`}</span>}
                    {msg.event?.data.tokensSec && <span>{`(${msg.event?.data.tokensSec.toFixed(2)} tok/s)`}</span>}
                    {msg.event?.data.error ?
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <MessageCircleX className="h-4 w-4 text-red-400" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-full">
                          <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">{msg.event?.data.status}</h4>
                              <pre className="mt-2 rounded-md bg-slate-950 dark:bg-slate-700 p-4 whitespace-pre-wrap break-words">
                                <code className="text-white">
                                  {JSON.stringify({
                                    ...msg.event?.data,
                                    sentence: undefined,
                                    output: undefined,
                                    prompt: undefined
                                  }, null, 2)}
                                </code>
                              </pre>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      : <>
                        {msg.event?.data.status && msg.event?.data.status !== 'complete' && msg.event?.data.status !== 'aborted' &&
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </HoverCardTrigger>
                            <HoverCardContent className="w-full">
                              <div className="flex justify-between space-x-4">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">{msg.event?.data.status}</h4>
                                  <pre className="mt-2 rounded-md bg-slate-950 dark:bg-slate-700 p-4 whitespace-pre-wrap break-words">
                                    <code className="text-white">
                                      {JSON.stringify({
                                        ...msg.event?.data,
                                        sentence: undefined,
                                        output: undefined,
                                        prompt: undefined
                                      }, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        }
                        {msg.event?.data.status && msg.event?.data.status !== 'complete' && msg.event?.data.status !== 'aborted' && <Pause className="h-4 w-4 hover:cursor-pointer" onClick={() => abort()} />}
                        {msg.event?.data.status === 'complete' && <Check className="h-4 w-4" />}
                        {msg.event?.data.status === 'aborted' && <Check className="h-4 w-4" />}
                      </>}
                  </div>
                  {scrollToBottom && messages.length - 1 === i && <div ref={scrollElement} />}
                </div>
              </div>
              {msg.role === 'user' && <UserRound className="h-8 w-8" />}
            </div>)}
        </ScrollArea>
        <div className="grid w-full items-center gap-1.5">
          <Dialog>
            <DialogTrigger asChild>
              <Label htmlFor="text" className="hover:cursor-pointer flex flex-row space-x-1">
                <FileBox className="w-4 h-4" />
                <span>{modelId}</span>
              </Label>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Edit model config</DialogTitle>
                <DialogDescription>
                  Make changes to your model config here.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="modelBaseUrl" className="text-left">
                    Model base url
                  </Label>
                  <Select name="modelBaseUrl" value={modelBaseUrl} onValueChange={(v) => setModelBaseUrl(v)}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Select a model base url" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>URL</SelectLabel>
                        {modelBaseUrls.map((url) =>
                          <SelectItem key={url} value={url}>{url}</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="model" className="text-left">
                    Model
                  </Label>
                  <Select name="model" value={modelId} onValueChange={(v) => setModelId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Model</SelectLabel>
                        {Object.entries(models).map(([mid, m]) =>
                          <SelectItem key={mid} value={mid}>{mid}{` (${m.size})`}</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant={'ghost'}><FileBox className="h-4 w-4 mr-1" />{model?.size}</Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-96">
                      <div className="flex justify-between space-x-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">{modelId}</h4>
                          <pre className="mt-2 rounded-md bg-slate-950 dark:bg-slate-700 p-4 whitespace-pre-wrap break-words">
                            <code className="text-white">{JSON.stringify(model, null, 2)}</code>
                          </pre>
                          <div className="flex items-center pt-2">
                            <span className="text-xs text-muted-foreground">
                              {modelBaseUrl}{model?.base_url}
                            </span>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="name" className="text-left">
                    Maximum length
                  </Label>
                  <Slider
                    value={[params.maxSeqLen]}
                    onValueChange={(v) => updateParams('maxSeqLen', v[0])}
                    max={maxSeqLen}
                    min={1}
                    step={1}
                  />
                  <Input
                    type="number"
                    value={params.maxSeqLen}
                    min={1}
                    max={maxSeqLen}
                    onChange={(v) => updateParams('maxSeqLen', v.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="name" className="text-left">
                    Temperature
                  </Label>
                  <Slider
                    value={[params.temperature]}
                    onValueChange={(v) => updateParams('temperature', v[0])}
                    max={2}
                    min={0}
                    step={0.01}
                  />
                  <Input
                    type="text"
                    value={params.temperature.toFixed(2)}
                    min={0}
                    max={2}
                    onChange={(v) => updateParams('temperature', v.target.value)} />
                </div>
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="name" className="text-left">
                    Top-p
                  </Label>
                  <Slider
                    value={[params.topP]}
                    onValueChange={(v) => updateParams('topP', v[0])}
                    max={1}
                    min={0}
                    step={0.01}
                  />
                  <Input
                    type="text"
                    value={params.topP.toFixed(2)}
                    min={0}
                    max={1}
                    onChange={(v) => updateParams('topP', v.target.value)} />
                </div>
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="name" className="text-left">
                    Repeat Penalty
                  </Label>
                  <Slider
                    value={[params.repeatPenalty]}
                    onValueChange={(v) => updateParams('repeatPenalty', v[0])}
                    max={2}
                    min={1}
                    step={0.01}
                  />
                  <Input
                    type="text"
                    value={params.repeatPenalty.toFixed(2)}
                    min={1}
                    max={2}
                    onChange={(v) => updateParams('repeatPenalty', v.target.value)} />
                </div>
                <div className="grid grid-cols-3 items-center gap-3">
                  <Label htmlFor="name" className="text-left">
                    Seed
                  </Label>
                  <Input
                    type="number"
                    value={params.seed}
                    onChange={(v) => updateParams('seed', v.target.value)} />
                  <Button onClick={() => randSeed()}>Rand</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="h-[100px] flex flex-row justify-center space-x-2">
            <Textarea className="h-10 bg-slate-100 dark:bg-slate-800" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={params.maxSeqLen} />
            <div className="space-y-1">
              <Button type="submit" size="icon" disabled={processing || !prompt} onClick={() => start()}>
                {processing ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><NotepadTextDashed /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Prompt Template</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {templates.map(template =>
                      <DropdownMenuItem key={template.title} onClick={() => setPrompt(template.prompt)}>
                        <NotepadTextDashed className="mr-2 h-4 w-4" />
                        <span>{template.title}</span>
                      </DropdownMenuItem>)}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}