import { ChannelInterface, ChannelManagerInterface, XpEventHandler, XpLLMAbortEvent, XpLLMReciveData, XpLLMStartEvent } from '@/types/datas.types';

const xpWorker = new Worker(new URL('./xpWorker.js', import.meta.url))

function generateSequence(runningModel: Running, updateStatus: (data: XpLLMReciveData) => void) {
  const { modelId, model, controller, params } = runningModel;
  const weightsURL =
    model.model instanceof Array
      ? model.model.map((m) => model.base_url + m)
      : model.base_url + model.model;
  const tokenizerURL = model.base_url + model.tokenizer;
  const configURL = model.base_url + model.config;

  // function updateStatus(_data: any) {
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
  // }


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
  const handleMessage = (event: { data: XpLLMReciveData; }) => {
    const { status, error } = event.data;
    if (status) updateStatus(event.data);
    if (error || status === "aborted" || status === "complete") {
      xpWorker.removeEventListener("message", handleMessage);
    }
  };

  controller.signal.addEventListener("abort", handleAbort);
  xpWorker.addEventListener("message", handleMessage);
}


interface Running extends XpLLMStartEvent {
  controller: AbortController;
}

class XpLLMHandler implements XpEventHandler {
  private todos: XpLLMStartEvent[] = []
  private current: Running | undefined
  private channelManager: ChannelManagerInterface | undefined
  private channel: ChannelInterface | undefined
  constructor() { }
  run() {
    if (!this.current && !this.channel && this.channelManager) {
      const todo = this.todos.pop()
      if (todo) {
        this.current = {
          ...todo,
          controller: new AbortController()
        }
        this.channel = this.channelManager.channel(this.current.channel)
        generateSequence(this.current, this.updateStatus)
      }
    }
  }
  startListener(ev: XpLLMStartEvent) {
    this.todos.push(ev)
    this.run()
  }
  abortListener(ev: XpLLMAbortEvent) {
    if (ev.channel === this.current?.channel) {
      this.current.controller.abort()
    } else {
      this.todos = this.todos.filter(t => t.channel !== ev.channel)
    }
  }
  updateStatus(data: XpLLMReciveData) {
    this.channel?.emit("xp-llm-recive", {
      channel: '',
      data
    })
    if (data.status === 'complete' || data.status === 'aborted') {
      this.current = undefined
      this.channel = undefined
      this.run()
    }
  }
  register(channelManager: ChannelManagerInterface) {
    this.channelManager = channelManager
    channelManager
      .on("xp-llm-start", this.startListener)
      .on("xp-llm-abort", this.abortListener)
  }
  unregister(channelManager: ChannelManagerInterface) {
    channelManager
      .off("xp-llm-start", this.startListener)
      .off("xp-llm-abort", this.abortListener)
    this.todos = []
    if (this.current) {
      this.current.controller.abort()
      this.current = undefined
    }
    if (this.channel) this.channel = undefined
  }
}

const xpllmHander = new XpLLMHandler();

export { xpllmHander }
