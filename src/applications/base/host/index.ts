import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const clientStarters: Record<string, () => Promise<Client>> = {};
const clients: Record<string, Client> = {};

export const registerClient = (name: string, client: () => Promise<Client>) => {
  clientStarters[name] = client;
};

export const getClient = async (name: string): Promise<Client> => {
  if (!clients[name]) {
    if (!clientStarters[name]) {
      throw new Error("Client not found: " + name);
    }
    clients[name] = await clientStarters[name]();
  }
  return clients[name];
};
