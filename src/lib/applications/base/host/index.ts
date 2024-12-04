import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const serverStarters: Record<string, (transport: Transport) => Promise<void>> =
  {};
const clientStarters: Record<
  string,
  (transport: Transport) => Promise<Client>
> = {};
const clients: Record<string, Client> = {};

export const registerServer = (
  name: string,
  server: (transport: Transport) => Promise<void>
) => {
  serverStarters[name] = server;
};

export const registerClient = (
  name: string,
  client: (transport: Transport) => Promise<Client>
) => {
  clientStarters[name] = client;
};

export const getClient = async (name: string): Promise<Client> => {
  if (!clients[name]) {
    if (!serverStarters[name] || !clientStarters[name]) {
      throw new Error("Client or Server not found: " + name);
    }
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await serverStarters[name](serverTransport);
    clients[name] = await clientStarters[name](clientTransport);
  }
  return clients[name];
};

export const getClientTransport = async (name: string): Promise<Transport> => {
  if (!serverStarters[name]) {
    throw new Error("Server not found: " + name);
  }
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await serverStarters[name](serverTransport);
  return clientTransport;
};
