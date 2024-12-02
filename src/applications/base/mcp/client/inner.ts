import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { Runner, spawn } from "../../runner";
import { ReadBuffer, serializeMessage } from "../shared/inner";

/**
 * Client transport for inner: this will connect to a server by spawning a runner and communicating with it over events.
 */
export class InnerClientTransport implements Transport {
  private _process?: Runner;
  private _application: string;
  private _readBuffer: ReadBuffer = new ReadBuffer();

  onclose?: (() => void) | undefined;
  onerror?: ((error: Error) => void) | undefined;
  onmessage?: ((message: JSONRPCMessage) => void) | undefined;

  constructor(application: string) {
    this._application = application;
  }

  async start(): Promise<void> {
    if (this._process) {
      throw new Error(
        "InnerClientTransport already started! If using Client class, note that connect() calls start() automatically."
      );
    }

    return new Promise((resolve, reject) => {
      const { runner, run } = spawn(this._application);
      this._process = runner;

      if (!this._process) {
        reject(new Error("InnerClientTransport: Could not spawn application!"));
        return;
      }

      this._process.on("error", (error) => {
        if (error.name === "AbortError") {
          // Expected when close() is called.
          this.onclose?.();
          return;
        }

        reject(error);
        this.onerror?.(error);
      });

      this._process.on("spawn", () => {
        resolve();
      });

      this._process.on("close", (_code) => {
        this._process = undefined;
        this.onclose?.();
      });

      this._process.on("in-error", (error) => {
        this.onerror?.(error);
      });

      this._process.on("out-data", (chunk) => {
        this._readBuffer.append(chunk);
        this.processReadBuffer();
      });

      this._process.on("out-error", (error) => {
        this.onerror?.(error);
      });

      run();
    });
  }

  private processReadBuffer() {
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }

        this.onmessage?.(message);
      } catch (error) {
        this.onerror?.(error as Error);
      }
    }
  }

  async close(): Promise<void> {
    this._process?.stop();
    this._process = undefined;
    this._readBuffer.clear();
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve) => {
      if (!this._process) {
        throw new Error("Not connected");
      }

      const json = serializeMessage(message);
      if (this._process.emit("in-data", json)) {
        resolve();
      } else {
        this._process.once("in-drain", resolve);
      }
    });
  }
}
