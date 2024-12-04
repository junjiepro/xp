import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

export const starter = async (transport: Transport) => {
  const server = new Server(
    {
      name: "example-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
      },
    }
  );

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "file:///example.txt",
          name: "Example Resource",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === "file:///example.txt") {
      return {
        contents: [
          {
            uri: "file:///example.txt",
            mimeType: "text/plain",
            text: "This is the content of the example resource.",
          },
        ],
      };
    } else {
      throw new Error("Resource not found");
    }
  });

  await server.connect(transport);
};
