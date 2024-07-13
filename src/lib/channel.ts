import {
  ChannelInterface,
  ChannelManagerInterface,
  XpEventHandler,
  XpEventHandlersEventMap,
} from "@/types/datas.types";
import EventEmitter from "eventemitter3";
import {
  MLCEngineConfig,
  ChatOptions,
  MLCEngineInterface,
  CreateServiceWorkerMLCEngine,
} from "@mlc-ai/web-llm";

class ChannelManager implements ChannelManagerInterface {
  private eventEmitter: EventEmitter;
  private handlers: XpEventHandler[] = [];
  constructor() {
    this.eventEmitter = new EventEmitter();
  }
  channel(c: string) {
    return new Channel(this, c);
  }
  register(h: XpEventHandler) {
    h.register(this);
    this.handlers.push(h);
    return this;
  }
  unregister() {
    this.handlers.forEach((h) => h.unregister(this));
    this.handlers = [];
    this.eventEmitter.removeAllListeners();
  }
  createEngine(
    modelId: string,
    engineConfig?: MLCEngineConfig,
    chatOpts?: ChatOptions
  ): Promise<MLCEngineInterface> {
    return CreateServiceWorkerMLCEngine(modelId, engineConfig, chatOpts);
  }
  emit<K extends keyof XpEventHandlersEventMap>(
    type: K,
    arg: XpEventHandlersEventMap[K]
  ) {
    return this.eventEmitter.emit(type, arg);
  }
  on<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ) {
    this.eventEmitter.on(type, listener, context);
    return this;
  }
  off<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ) {
    this.eventEmitter.off(type, listener, context);
    return this;
  }
}

class Channel implements ChannelInterface {
  private manager: ChannelManager;
  private channel: string;
  constructor(manager: ChannelManager, channel: string) {
    this.manager = manager;
    this.channel = channel;
  }
  emit<K extends keyof XpEventHandlersEventMap>(
    type: K,
    arg: XpEventHandlersEventMap[K]
  ) {
    arg.channel = this.channel;
    return this.manager.emit(type, arg);
  }
  on<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ) {
    const listenerWrapper = (ev: XpEventHandlersEventMap[K]) => {
      if (ev.channel === this.channel) {
        return listener(ev);
      }
    };
    this.manager.on(type, listenerWrapper, context);
    return listenerWrapper;
  }
  off<K extends keyof XpEventHandlersEventMap>(
    type: K,
    listener: (ev: XpEventHandlersEventMap[K]) => any,
    context?: any
  ) {
    this.manager.off(type, listener, context);
    return this;
  }
}

/**
 * the channel manager to handle XP event
 */
const xpChannel = new ChannelManager();

export default xpChannel;
