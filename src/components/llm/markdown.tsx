"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import "github-markdown-css";

export default function MarkdownMessage({ children }: { children?: string }) {
  return (
    <div className="rounded-md shadow-lg dark:shadow-slate-50 border border-slate-950 dark:border-slate-300 p-4 markdown-body">
      <Markdown remarkPlugins={[remarkGfm, rehypeHighlight]}>
        {children}
      </Markdown>
    </div>
  );
}
