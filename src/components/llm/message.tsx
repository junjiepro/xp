"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { XpLLMReciveEvent } from "@/types/datas.types";

import {
  Bot,
  Check,
  Loader2,
  MessageCircleX,
  Pause,
  UserRound,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import MarkdownMessage from "./markdown";
import { CompletionUsage } from "openai/resources/completions.mjs";

export type Message = {
  role: "user" | "assistant" | "system" | "developer";
  message: string;
  // Candle
  event?: XpLLMReciveEvent;
  // OpenAI
  chunkId?: string;
  usage?: CompletionUsage | null;
  error?: unknown;
  abort?: boolean;
};

export default function LLMMessage({
  msg,
  abort,
  children,
  className,
}: {
  msg: Message;
  abort: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-2 flex w-full space-x-2",
        msg.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {msg.role === "assistant" && <Bot className="h-8 w-8" />}
      <div className="flex justify-between space-x-4 max-w-[80%]">
        <div className="w-full space-y-1">
          {msg.message && (
            <MarkdownMessage className={className}>
              {msg.message}
            </MarkdownMessage>
          )}
          {msg.role !== "user" && (
            <div className="flex flex-row pt-2 text-xs text-muted-foreground space-x-1">
              {typeof msg.event?.data.queue !== "undefined" && (
                <span>{`${msg.event?.data.queue + 1} queue`}</span>
              )}
              {msg.event?.data.totalTime && (
                <span>{`${(msg.event?.data.totalTime / 1000).toFixed(
                  2
                )}s`}</span>
              )}
              {msg.event?.data.tokensSec && (
                <span>{`(${msg.event?.data.tokensSec.toFixed(2)} tok/s)`}</span>
              )}
              {msg.usage && (
                <span>{`(${msg.usage.prompt_tokens} prompt tok)`}</span>
              )}
              {msg.usage && (
                <span>{`(${msg.usage.completion_tokens} completion tok)`}</span>
              )}
              {msg.event?.data.error || msg.error ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <MessageCircleX className="h-4 w-4 text-red-400" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-full">
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">
                          {msg.event?.data.status}
                        </h4>
                        <pre className="mt-2 rounded-md bg-destructive p-4 whitespace-pre-wrap break-words">
                          <code className="text-white">
                            {msg.event?.data.error
                              ? JSON.stringify(
                                  {
                                    ...msg.event?.data,
                                    sentence: undefined,
                                    output: undefined,
                                    prompt: undefined,
                                  },
                                  null,
                                  2
                                )
                              : msg.error?.toString()}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <>
                  {msg.event?.data.status &&
                    msg.event?.data.status !== "complete" &&
                    msg.event?.data.status !== "aborted" && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-full">
                          <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">
                                {msg.event?.data.status}
                              </h4>
                              <pre className="mt-2 rounded-md bg-slate-950 dark:bg-slate-700 p-4 whitespace-pre-wrap break-words">
                                <code className="text-white">
                                  {JSON.stringify(
                                    {
                                      ...msg.event?.data,
                                      sentence: undefined,
                                      output: undefined,
                                      prompt: undefined,
                                    },
                                    null,
                                    2
                                  )}
                                </code>
                              </pre>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  {msg.event?.data.status &&
                    msg.event?.data.status !== "complete" &&
                    msg.event?.data.status !== "aborted" && (
                      <Pause
                        className="h-4 w-4 hover:cursor-pointer"
                        onClick={() => abort()}
                      />
                    )}
                  {msg.event?.data.status === "complete" && (
                    <Check className="h-4 w-4" />
                  )}
                  {msg.event?.data.status === "aborted" && (
                    <Check className="h-4 w-4" />
                  )}
                  {msg.event?.data.status ? null : msg.usage || msg.abort ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <Pause
                        className="h-4 w-4 hover:cursor-pointer"
                        onClick={() => abort()}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
      {msg.role === "user" && <UserRound className="h-8 w-8" />}
    </div>
  );
}
