import EventEmitter from "eventemitter3";

const serverStarters: Record<string, (runner: Runner) => Promise<void>> = {};

class Runner extends EventEmitter {
  private _isRunning: boolean = false;

  constructor() {
    super();
  }

  start() {
    if (this._isRunning) {
      throw new Error("Runner is already running");
    }
    this._isRunning = true;
    this.emit("spawn");
  }

  stop() {
    if (!this._isRunning) {
      return;
    }
    this._isRunning = false;
    this.emit("close", 0);
  }

  destroy(error?: Error) {
    if (error) {
      this.emit("error", error);
    }
    this.stop();
  }
}

const spawn = (name: string) => {
  const server = serverStarters[name];
  if (!server) {
    throw new Error("Server not found: " + name);
  }

  const runner = new Runner();
  server(runner).catch((error) => runner.destroy(error));

  return runner;
};

const registerServer = (
  name: string,
  server: (runner: Runner) => Promise<void>
) => {
  serverStarters[name] = server;
};

export { spawn, Runner, registerServer };
