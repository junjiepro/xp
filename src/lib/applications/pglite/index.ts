import { registerClient, registerServer } from "../base/host";
import { starter as clientStarter } from "./client";
import { starter as serverStarter } from "./server";

const register = () => {
  registerClient("pglite", clientStarter);
  registerServer("pglite", serverStarter);
};

export default register;
