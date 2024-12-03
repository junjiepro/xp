import { registerClient, registerServer } from "../base/host";
import { starter as clientStarter } from "./client";
import { starter as serverStarter } from "./server";

const register = () => {
  registerClient("example", clientStarter);
  registerServer("example", serverStarter);
};

export default register;
