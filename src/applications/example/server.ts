import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { InnerServerTransport } from "../base/mcp/server/inner";
import { Runner } from "../base/runner";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export const starter = async (runner: Runner) => {
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

  const transport = new InnerServerTransport(runner);
  await server.connect(transport);
};
