"use client";

import Together from "together-ai";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLLM } from "@/hooks/use-llm";
import { APIModel } from "@/types/datas.types";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

export default function GenerateImage() {
  const searchParams = useSearchParams();

  const organizationId = searchParams.get("organizationId");

  const { apiModelList } = useLLM(organizationId || "");
  // API
  const apiModels = useMemo(() => {
    return apiModelList.public
      .concat([apiModelList.private, apiModelList.local])
      .reduce((acc, t) => {
        acc.push(...t.block);
        return acc;
      }, [] as APIModel[])
      .filter((b) => b.base_url.includes("together"));
  }, [apiModelList]);

  const [prompt, setPrompt] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [userAPIKey, setUserAPIKey] = useState("");
  const debouncedPrompt = useDebounce(prompt, 3000);
  const [generations, setGenerations] = useState<
    { prompt: string; image: ImageResponse }[]
  >([]);
  let [activeIndex, setActiveIndex] = useState<number>();

  useEffect(() => {
    if (apiModels.length > 0) {
      setUserAPIKey(apiModels[0].api_key || "");
    }
  }, [apiModels]);

  const { data: image, isFetching } = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt],
    queryFn: async () => {
      const client = new Together({ apiKey: userAPIKey });
      let res = await client.images.create({
        prompt,
        model: "black-forest-labs/FLUX.1-schnell-Free",
        width: 1024,
        height: 768,
        seed: iterativeMode ? 123 : undefined,
        steps: 3,
        // @ts-expect-error - this is not typed in the API
        response_format: "base64",
      });
      return res.data[0] as unknown as ImageResponse;
    },
    enabled: !!debouncedPrompt.trim(),
    staleTime: Infinity,
    retry: false,
  });

  let isDebouncing = prompt !== debouncedPrompt;

  useEffect(() => {
    if (image && !generations.map((g) => g.image).includes(image)) {
      setGenerations((images) => [...images, { prompt, image }]);
      setActiveIndex(generations.length);
    }
  }, [generations, image, prompt]);

  let activeImage =
    activeIndex !== undefined ? generations[activeIndex].image : undefined;

  return (
    <ScrollArea className="h-full">
      <div className="flex h-full flex-col px-5">
        <header className="flex justify-center pt-20 md:justify-end md:pt-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Add your{" "}
              <a
                href="https://api.together.xyz/settings/api-keys"
                target="_blank"
                className="underline underline-offset-4 transition hover:text-blue-500"
              >
                Together API Key
              </a>{" "}
              in{" "}
              <a
                href={`/organization/xpllm?organizationId=${organizationId}`}
                target="_blank"
                className="underline underline-offset-4 transition hover:text-blue-500"
              >
                XP LLM API
              </a>{" "}
            </label>
          </div>
        </header>

        <div className="flex justify-center">
          <form className="mt-10 w-full max-w-lg">
            <fieldset>
              <div className="relative">
                <Textarea
                  autoFocus
                  rows={4}
                  spellCheck={false}
                  placeholder="Describe your image..."
                  required
                  disabled={!userAPIKey}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full resize-none border-opacity-50 px-4 text-base"
                />
                <div
                  className={`${
                    isFetching || isDebouncing ? "flex" : "hidden"
                  } absolute bottom-3 right-3 items-center justify-center`}
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>

              <div className="mt-3 text-sm md:text-right">
                <label
                  title="Use earlier images as references"
                  className="inline-flex items-center gap-2"
                >
                  Consistency mode
                  <Switch
                    checked={iterativeMode}
                    onCheckedChange={setIterativeMode}
                  />
                </label>
              </div>
            </fieldset>
          </form>
        </div>
        <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
          {!activeImage || !prompt ? (
            <div className="max-w-xl md:max-w-4xl lg:max-w-3xl">
              <p className="text-xl font-semibold md:text-3xl lg:text-4xl">
                Generate images in real-time
              </p>
              <p className="mt-4 text-balance text-sm md:text-base lg:text-lg">
                Enter a prompt and generate images in milliseconds as you type.
                Powered by Flux on Together AI.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex w-full max-w-4xl flex-col justify-center">
              <div>
                <Image
                  // placeholder="blur"
                  // blurDataURL={imagePlaceholder.blurDataURL}
                  width={1024}
                  height={768}
                  src={`data:image/png;base64,${activeImage.b64_json}`}
                  alt=""
                  className={`${
                    isFetching ? "animate-pulse" : ""
                  } max-w-full rounded-lg object-cover shadow-sm shadow-black`}
                />
              </div>

              <div className="mt-4 flex gap-4 overflow-x-scroll pb-4">
                {generations.map((generatedImage, i) => (
                  <button
                    key={i}
                    className="w-32 shrink-0 opacity-50 hover:opacity-100"
                    onClick={() => setActiveIndex(i)}
                  >
                    <Image
                      // placeholder="blur"
                      // blurDataURL={imagePlaceholder.blurDataURL}
                      width={1024}
                      height={768}
                      src={`data:image/png;base64,${generatedImage.image.b64_json}`}
                      alt=""
                      className="max-w-full rounded-lg object-cover shadow-sm shadow-black"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
