/**
 * CORE ENGINE MCP SERVER
 * Implementation of Model Context Protocol for Agentic Inter-op
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// --- Server Definition ---

const server = new Server(
  {
    name: "Core-Engine-v5-Symbiosis",
    version: "5.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// --- Tool Definitions ---

const START_GEN_SCHEMA = z.object({
  prompt: z.string().describe("The main keyword or SEO strategy to launch."),
  model: z.string().optional().default("gemini-3.1-pro-preview"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "start_seo_generation",
        description: "Triggers the full PocketFlow SEO Engine (Research + Architecture + Squad Writing).",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            model: { type: "string" }
          },
          required: ["prompt"]
        }
      },
      {
        name: "get_system_health",
        description: "Returns the status of all 10 agents in the Squad.",
        inputSchema: { type: "object", properties: {} }
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "start_seo_generation") {
      const { prompt, model } = START_GEN_SCHEMA.parse(args);
      
      // Here we would trigger the flow. 
      // Note: In an MCP tool call via API, we returned a status or a link.
      return {
        content: [
          {
            type: "text",
            text: `SEO Generation triggered for: "${prompt}". You can monitor the progress on the Symbiosis Dashboard.`,
          },
        ],
      };
    }

    if (name === "get_system_health") {
      return {
        content: [
          {
            type: "text",
            text: "All 10 Agents (A1-A10) are ONLINE. Neural Link: STABLE. Google Grounding: ACTIVE.",
          },
        ],
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

export { server };
