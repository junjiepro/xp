import { XpModel } from '@/types/datas.types';
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const DEFAULT_MODEL_BASE_URLS = ["https://huggingface.co/", "https://hf-mirror.com/"]
const DEFAULT_MODELS: Record<string, XpModel> = {
  phi_1_5_q4k: {
    base_url:
      "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-q4k.gguf",
    tokenizer: "tokenizer.json",
    config: "phi-1_5.json",
    quantized: true,
    seq_len: 2048,
    size: "800 MB",
  },
  phi_1_5_q80: {
    base_url:
      "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-q80.gguf",
    tokenizer: "tokenizer.json",
    config: "phi-1_5.json",
    quantized: true,
    seq_len: 2048,
    size: "1.51 GB",
  },
  phi_2_0_q4k: {
    base_url:
      "/radames/phi-2-quantized/resolve/main/",
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
    base_url:
      "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-puffin-phi-v2-q4k.gguf",
    tokenizer: "tokenizer-puffin-phi-v2.json",
    config: "puffin-phi-v2.json",
    quantized: true,
    seq_len: 2048,
    size: "798 MB",
  },
  puffin_phi_v2_q80: {
    base_url:
      "/lmz/candle-quantized-phi/resolve/main/",
    model: "model-puffin-phi-v2-q80.gguf",
    tokenizer: "tokenizer-puffin-phi-v2.json",
    config: "puffin-phi-v2.json",
    quantized: true,
    seq_len: 2048,
    size: "1.50 GB",
  },
};

const modelBaseUrls = atomWithStorage<string[]>(
  'xp-model-base-urls', DEFAULT_MODEL_BASE_URLS
)
const models = atomWithStorage<Record<string, XpModel>>(
  'xp-models', DEFAULT_MODELS
)

export const useModelBaseUrls = () => {
  return useAtomValue(modelBaseUrls)
}

export const useSetModelBaseUrls = () => {
  return useSetAtom(modelBaseUrls)
}

export const useModels = () => {
  return useAtomValue(models)
}

export const useSetModels = () => {
  return useSetAtom(models)
}

const xpWorker = new Worker(new URL('../lib/llm/xpWorker.js', import.meta.url))

async function generateSequence(modelId: string, model: XpModel, params: {
  prompt: string,
  temperature: number,
  topP: number,
  repeatPenalty: number,
  seed: number,
  maxSeqLen: number
}, controller: AbortController) {
  const weightsURL =
    model.model instanceof Array
      ? model.model.map((m) => model.base_url + m)
      : model.base_url + model.model;
  const tokenizerURL = model.base_url + model.tokenizer;
  const configURL = model.base_url + model.config;

  function updateStatus(_data: any) {
    // switch (data.status) {
    //   case "loading":
    //     outStatus.hidden = false;
    //     outStatus.textContent = data.message;
    //     outGen.hidden = true;
    //     outCounter.hidden = true;
    //     break;
    //   case "generating":
    //     const { message, prompt, sentence, tokensSec, totalTime } = data;
    //     outStatus.hidden = true;
    //     outCounter.hidden = false;
    //     outGen.hidden = false;
    //     outGen.innerHTML = snarkdown(prompt + sentence);
    //     outCounter.innerHTML = `${(totalTime / 1000).toFixed(
    //       2
    //     )}s (${tokensSec.toFixed(2)} tok/s)`;
    //     break;
    //   case "complete":
    //     break;
    // }
  }

  return new Promise((resolve, reject) => {
    xpWorker.postMessage({
      weightsURL,
      modelId,
      tokenizerURL,
      configURL,
      quantized: model.quantized,
      prompt: params.prompt.trim(),
      temp: params.temperature,
      top_p: params.topP,
      repeatPenalty: params.repeatPenalty,
      seed: params.seed,
      maxSeqLen: params.maxSeqLen,
      command: "start",
    });

    const handleAbort = () => {
      xpWorker.postMessage({ command: "abort" });
    };
    const handleMessage = (event: { data: any; }) => {
      const { status, error, message, prompt, sentence } = event.data;
      if (status) updateStatus(event.data);
      if (error) {
        xpWorker.removeEventListener("message", handleMessage);
        reject(new Error(error));
      }
      if (status === "aborted") {
        xpWorker.removeEventListener("message", handleMessage);
        resolve(event.data);
      }
      if (status === "complete") {
        xpWorker.removeEventListener("message", handleMessage);
        resolve(event.data);
      }
    };

    controller.signal.addEventListener("abort", handleAbort);
    xpWorker.addEventListener("message", handleMessage);
  });
}
