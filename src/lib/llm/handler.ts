import {
  ChannelInterface,
  ChannelManagerInterface,
  XpEventHandler,
  XpLLMAbortEvent,
  XpLLMReciveData,
  XpLLMStartEvent,
} from "@/types/datas.types";
import {
  CreateWebWorkerMLCEngine,
  MLCEngineConfig,
  ChatOptions,
  WebWorkerMLCEngine,
} from "@mlc-ai/web-llm";

const candleWorker = new Worker(new URL("./candle-worker.js", import.meta.url));
// const webLLMWorker = new Worker(
//   new URL("./web-llm-worker.ts", import.meta.url),
//   {
//     type: "module",
//   }
// );

function generateSequence(
  runningModel: Running,
  updateStatus: (data: XpLLMReciveData) => void
) {
  const { modelId, model, controller, params } = runningModel;
  const weightsURL =
    model.model instanceof Array
      ? model.model.map((m) => model.base_url + m)
      : model.base_url + model.model;
  const tokenizerURL = model.base_url + model.tokenizer;
  const configURL = model.base_url + model.config;

  candleWorker.postMessage({
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
    candleWorker.postMessage({ command: "abort" });
  };
  const handleMessage = (event: { data: XpLLMReciveData }) => {
    const { status, error } = event.data;
    if (status) updateStatus(event.data);
    if (error || status === "complete") {
      candleWorker.removeEventListener("message", handleMessage);
    }
  };

  controller.signal.addEventListener("abort", handleAbort);
  candleWorker.addEventListener("message", handleMessage);
}

interface Running extends XpLLMStartEvent {
  controller: AbortController;
}

class XpLLMHandler implements XpEventHandler {
  private todos: XpLLMStartEvent[] = [];
  private current: Running | undefined;
  private channelManager: ChannelManagerInterface | undefined;
  private channel: ChannelInterface | undefined;
  constructor() {}
  run() {
    const self = this;
    if (!self.current && !self.channel && self.channelManager) {
      const todo = self.todos.length ? self.todos[0] : undefined;
      if (todo) {
        self.todos = self.todos.slice(1, self.todos.length);
        self.todos.forEach((t, i) => {
          self.channelManager?.channel(t.channel)?.emit("xp-llm-recive", {
            channel: t.channel,
            data: {
              status: "queue",
              message: "queue",
              queue: i,
            },
          });
        });
        self.current = {
          ...todo,
          controller: new AbortController(),
        };
        self.channel = self.channelManager.channel(self.current.channel);
        generateSequence(self.current, self.updateStatus.bind(self));
      }
    }
  }
  startListener(ev: XpLLMStartEvent) {
    this.todos.push(ev);
    this.run();
  }
  abortListener(ev: XpLLMAbortEvent) {
    if (ev.channel === this.current?.channel) {
      this.current.controller.abort();
    } else {
      this.todos = this.todos.filter((t) => t.channel !== ev.channel);
    }
  }
  updateStatus(data: XpLLMReciveData) {
    this.channel?.emit("xp-llm-recive", {
      channel: "",
      data,
    });
    if (data.status === "complete" || data.status === "aborted") {
      this.current = undefined;
      this.channel = undefined;
      this.run();
    }
  }
  register(channelManager: ChannelManagerInterface) {
    this.channelManager = channelManager;
    channelManager
      .on("xp-llm-start", this.startListener.bind(this))
      .on("xp-llm-abort", this.abortListener.bind(this));
  }
  unregister(channelManager: ChannelManagerInterface) {
    channelManager
      .off("xp-llm-start", this.startListener.bind(this))
      .off("xp-llm-abort", this.abortListener.bind(this));
    this.todos = [];
    if (this.current) {
      this.current.controller.abort();
      this.current = undefined;
    }
    if (this.channel) this.channel = undefined;
  }
}

const xpllmHander = new XpLLMHandler();

const webLLMServiceWorkerRegister = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register(
        new URL("./web-llm-worker.ts", import.meta.url), // worker script
        { type: "module" } // set scope to "/" to avoid any issues
      )
      .then((registration) => console.log("scope is: ", registration.scope));
  }
};

export { xpllmHander, webLLMServiceWorkerRegister };
