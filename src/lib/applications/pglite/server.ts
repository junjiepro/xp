import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { PGlite } from "@electric-sql/pglite";

const mainDb = new PGlite("idb://xp-main-pgdata");

export const starter = async (transport: Transport) => {
  const server = new Server(
    {
      name: "pglite-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  const SCHEMA_PATH = "schema";

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const result = await mainDb.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    return {
      resources: (result.rows as any[]).map((row) => ({
        uri: new URL(`${row.table_name}/${SCHEMA_PATH}`).href,
        mimeType: "application/json",
        name: `"${row.table_name}" database schema`,
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resourceUrl = new URL(request.params.uri);

    const pathComponents = resourceUrl.pathname.split("/");
    const schema = pathComponents.pop();
    const tableName = pathComponents.pop();

    if (schema !== SCHEMA_PATH) {
      throw new Error("Invalid resource URI");
    }

    const result = await mainDb.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
      [tableName]
    );

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(result.rows, null, 2),
        },
      ],
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "query",
          description: "Run a read-only SQL query",
          inputSchema: {
            type: "object",
            properties: {
              sql: { type: "string" },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "query") {
      const sql = request.params.arguments?.sql as string;

      try {
        await mainDb.query("BEGIN TRANSACTION READ ONLY");
        const result = await mainDb.query(sql);
        return {
          content: [
            { type: "text", text: JSON.stringify(result.rows, null, 2) },
          ],
          isError: false,
        };
      } catch (error) {
        throw error;
      } finally {
        mainDb
          .query("ROLLBACK")
          .catch((error) =>
            console.warn("Could not roll back transaction:", error)
          );
      }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  await server.connect(transport);
};
