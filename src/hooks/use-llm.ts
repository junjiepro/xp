import { XpModel, APIModel } from "@/types/datas.types";
import { useSettingBlock } from "./use-block";
import { prebuiltAppConfig, AppConfig } from "@mlc-ai/web-llm";

const DEFAULT_CORE = [
  {
    name: "API",
    description:
      "The official Node.js / Typescript library for the OpenAI API.",
    github: "https://github.com/openai/openai-node",
  },
  {
    name: "Candle",
    description: "Minimalist ML framework for Rust.",
    github: "https://github.com/huggingface/candle",
  },
  {
    name: "WebLLM",
    description: "High-performance In-browser LLM Inference Engine.",
    github: "https://github.com/mlc-ai/web-llm",
  },
];
const DEFAULT_MODEL_BASE_URLS = [
  "https://huggingface.co",
  "https://hf-mirror.com",
];
const DEFAULT_MODELS: Record<string, XpModel> = {
  phi_1_5_q4k: {
    base_url: "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-q4k.gguf",
    tokenizer: "tokenizer.json",
    config: "phi-1_5.json",
    quantized: true,
    seq_len: 2048,
    size: "800 MB",
  },
  phi_1_5_q80: {
    base_url: "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-q80.gguf",
    tokenizer: "tokenizer.json",
    config: "phi-1_5.json",
    quantized: true,
    seq_len: 2048,
    size: "1.51 GB",
  },
  phi_2_0_q4k: {
    base_url: "/radames/phi-2-quantized/resolve/main/",
    model: [
      "model-v2-q4k.gguf_aa.part",
      "model-v2-q4k.gguf_ab.part",
      "model-v2-q4k.gguf_ac.part",
    ],
    tokenizer: "tokenizer.json",
    config: "config.json",
    quantized: true,
    seq_len: 2048,
    size: "1.57GB",
  },
  puffin_phi_v2_q4k: {
    base_url: "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-puffin-phi-v2-q4k.gguf",
    tokenizer: "tokenizer-puffin-phi-v2.json",
    config: "puffin-phi-v2.json",
    quantized: true,
    seq_len: 2048,
    size: "798 MB",
  },
  puffin_phi_v2_q80: {
    base_url: "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-puffin-phi-v2-q80.gguf",
    tokenizer: "tokenizer-puffin-phi-v2.json",
    config: "puffin-phi-v2.json",
    quantized: true,
    seq_len: 2048,
    size: "1.50 GB",
  },
};
const TEMPLATES = [
  {
    title: "Simple prompt",
    prompt: `Sebastien is in London today, it’s the middle of July yet it’s raining, so Sebastien is feeling gloomy. He`,
  },
  {
    title: "Think step by step",
    prompt: `Suppose Alice originally had 3 apples, then Bob gave Alice 7 apples, then Alice gave Cook 5 apples, and then Tim gave Alice 3x the amount of apples Alice had. How many apples does Alice have now?  
Let’s think step by step.`,
  },
  {
    title: "Explaing a code snippet",
    prompt: `What does this script do?  
\`\`\`python
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(('', 0))
s.listen(1)
conn, addr = s.accept()
print('Connected by', addr)
return conn.getsockname()[1]
\`\`\`
Let’s think step by step.`,
  },
  {
    title: "Question answering",
    prompt: `Instruct: What is the capital of France?  
Output:`,
  },
  {
    title: "Chat mode",
    prompt: `Alice: Can you tell me how to create a python application to go through all the files
in one directory where the file’s name DOES NOT end with '.json'?  
Bob:`,
  },
  {
    title: "Python code completion",
    prompt: `"""write a python function called batch(function, list) which call function(x) for x in
list in parallel"""  
Solution:`,
  },
  {
    title: "Python Sample",
    prompt: `"""Can you make sure those histograms appear side by side on the same plot:  
\`\`\`python
plt.hist(intreps_retrained[0][1].view(64,-1).norm(dim=1).detach().cpu().numpy(), bins = 20)
plt.hist(intreps_pretrained[0][1].view(64,-1).norm(dim=1).detach().cpu().numpy(), bins = 20)
\`\`\`  
"""`,
  },
  {
    title: "Write a Twitter post",
    prompt: `Write a twitter post for the discovery of gravitational wave.  
Twitter Post:`,
  },
  {
    title: "Write a review",
    prompt: `Write a polite review complaining that the video game 'Random Game' was too badly optimized and it burned my laptop.  
Very polite review:`,
  },
];

const DEFAULT_API_MODELS: APIModel[] = [
  {
    base_url: "https://api-inference.huggingface.co",
    api_key: "",
    model: "openai-gpt",
    model_id: "huggingface-openai-gpt",
  },
];

type LLMApplicationSettings = {
  core: { name: string; description: string; github: string }[];
  "candle.urls": string[];
  "candle.models": Record<string, XpModel>;
  "candle.templates": { title: string; prompt: string }[];
  "webllm.model_list": AppConfig["model_list"];
  "api.model_list": APIModel[];
};
const useLLMSettingBlock = <T extends keyof LLMApplicationSettings>(
  organizationId: string,
  applicationKey: "llm",
  blockKey: T,
  defaultData: LLMApplicationSettings[T],
  emptyData?: LLMApplicationSettings[T]
) => {
  return useSettingBlock<LLMApplicationSettings[T]>(
    organizationId,
    applicationKey,
    blockKey,
    defaultData,
    emptyData
  );
};

export const useLLM = (organizationId: string) => {
  const { blocks: core } = useLLMSettingBlock(
    organizationId,
    "llm",
    "core",
    DEFAULT_CORE,
    []
  );

  const { blocks: candleUrls, mutateBlock: mutateCandleUrls } =
    useLLMSettingBlock(
      organizationId,
      "llm",
      "candle.urls",
      DEFAULT_MODEL_BASE_URLS,
      []
    );
  const { blocks: candleModels, mutateBlock: mutateCandleModels } =
    useLLMSettingBlock(
      organizationId,
      "llm",
      "candle.models",
      DEFAULT_MODELS,
      {}
    );
  const { blocks: candleTemplates, mutateBlock: mutateCandleTemplates } =
    useLLMSettingBlock(
      organizationId,
      "llm",
      "candle.templates",
      TEMPLATES,
      []
    );

  const { blocks: webllmModelList, mutateBlock: mutateWebllmModelList } =
    useLLMSettingBlock(
      organizationId,
      "llm",
      "webllm.model_list",
      prebuiltAppConfig.model_list,
      []
    );

  const { blocks: apiModelList, mutateBlock: mutateApiModelList } =
    useLLMSettingBlock(
      organizationId,
      "llm",
      "api.model_list",
      DEFAULT_API_MODELS,
      []
    );

  return {
    core,
    candleUrls,
    mutateCandleUrls,
    candleModels,
    mutateCandleModels,
    candleTemplates,
    mutateCandleTemplates,
    webllmModelList,
    mutateWebllmModelList,
    apiModelList,
    mutateApiModelList,
  };
};
