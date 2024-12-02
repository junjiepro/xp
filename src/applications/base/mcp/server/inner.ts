import { Runner } from "../../runner";
import { ReadBuffer, serializeMessage } from "../shared/inner";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

/**
 * Server transport for inner: this communicates with a MCP client by reading from the current runner' events.
 */
export class InnerServerTransport implements Transport {
  private _process: Runner;
  private _readBuffer: ReadBuffer = new ReadBuffer();
  private _started = false;

  constructor(runner: Runner) {
    this._process = runner;
  }

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  // Arrow functions to bind `this` properly, while maintaining function identity.
  _ondata = (chunk: string) => {
    this._readBuffer.append(chunk);
    this.processReadBuffer();
  };
  _onerror = (error: Error) => {
    this.onerror?.(error);
  };

  /**
   * Starts listening for messages on stdin.
   */
  async start(): Promise<void> {
    console.log("Starting InnerServerTransport");
    if (this._started) {
      throw new Error(
        "InnerServerTransport already started! If using Server class, note that connect() calls start() automatically."
      );
    }

    this._started = true;
    this._process.on("in-data", this._ondata);
    this._process.on("in-error", this._onerror);
    this._process.emit("spawn", 0);
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
    this._process.off("in-data", this._ondata);
    this._process.off("in-error", this._onerror);
    this._process.stop();
    this._readBuffer.clear();
    this.onclose?.();
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve) => {
      const json = serializeMessage(message);
      if (this._process.emit("out-data", json)) {
        resolve();
      } else {
        this._process.once("out-drain", resolve);
      }
    });
  }
}
