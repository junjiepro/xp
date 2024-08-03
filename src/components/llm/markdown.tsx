/**
 * @typedef {import('@wooorm/starry-night').Grammar} Grammar
 * @typedef {import('unified').PluggableList} PluggableList
 */

import { createStarryNight } from "@wooorm/starry-night";
import sourceCss from "@wooorm/starry-night/source.css";
import sourceJs from "@wooorm/starry-night/source.js";
import sourceTs from "@wooorm/starry-night/source.ts";
import sourceTsx from "@wooorm/starry-night/source.tsx";
import textHtmlBasic from "@wooorm/starry-night/text.html.basic";
import textMd from "@wooorm/starry-night/text.md";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import React, { TextareaHTMLAttributes } from "react";
// @ts-expect-error: untyped.
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import Markdown from "react-markdown";
// To do: replace with `starry-night` when async plugins are supported.
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import { useTheme } from "next-themes";

import "github-markdown-css/github-markdown-light.css";
import "@wooorm/starry-night/style/both";
import "highlight.js/styles/github.min.css";
import { cn } from "@/lib/utils";

/** @type {ReadonlyArray<Grammar>} */
const grammars = [
  sourceCss,
  sourceJs,
  sourceTs,
  sourceTsx,
  textHtmlBasic,
  textMd,
];

let globalStarryNight: Awaited<ReturnType<typeof createStarryNight>>;

function MarkdownTextarea({
  value,
  onChange,
  delay = 500,
  ...props
}: Omit<TextareaHTMLAttributes<string>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}) {
  const [text, setText] = React.useState(value);
  const [starryNight, setStarryNight] = React.useState(globalStarryNight);

  React.useEffect(() => {
    if (!starryNight) {
      createStarryNight(grammars).then(
        /**
         * @returns {undefined}
         */
        function (x) {
          globalStarryNight = x;
          setStarryNight(x);

          const missing = globalStarryNight.missingScopes();
          if (missing.length > 0) {
            throw new Error("Missing scopes: `" + missing + "`");
          }
        }
      );
    }
  }, []);
  React.useEffect(() => {
    setText(value);
  }, [value]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      onChange(text);
    }, delay);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="editor-inner">
      <div className="draw">
        {starryNight &&
          toJsxRuntime(starryNight.highlight(text, "text.md"), {
            Fragment,
            jsx,
            jsxs,
          })}
        {/* Trailing whitespace in a `textarea` is shown, but not in a `div`
  with `white-space: pre-wrap`.
  Add a `br` to make the last newline explicit. */}
        {/\n[ \t]*$/.test(text) ? <br /> : undefined}
      </div>
      <textarea
        spellCheck="false"
        className="write"
        value={text}
        rows={text.split("\n").length + 1}
        onChange={function (event) {
          setText(event.target.value);
        }}
      />
    </div>
  );
}

/** @type {PluggableList} */
const rehypePlugins = [rehypeSlug, rehypeHighlight, rehypeRaw];
/** @type {PluggableList} */
const remarkPlugins = [remarkToc, remarkGfm];

export default function MarkdownMessage({ children }: { children?: string }) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        colorScheme: theme,
      }}
    >
      <Markdown
        className={cn(
          "rounded-md shadow-lg dark:shadow-slate-50 border border-slate-950 dark:border-slate-300 p-4 markdown-body",
          theme === "dark" ? "github-dark" : "github-light"
        )}
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {children}
      </Markdown>
    </div>
  );
}

export { MarkdownTextarea };
