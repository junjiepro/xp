import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InnerClientTransport } from "../base/mcp/client/inner";

export const starter = async () => {
  const transport = new InnerClientTransport("example");

  const client = new Client(
    {
      name: "example-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  return client;
};
