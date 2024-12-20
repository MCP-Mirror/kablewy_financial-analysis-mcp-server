#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { tools, Tool } from "./tools.js";

dotenv.config();

if (!process.env.ALPHA_VANTAGE_API_KEY) {
  throw new Error("ALPHA_VANTAGE_API_KEY environment variable is required");
}

if (!process.env.FMP_API_KEY) {
  throw new Error("FMP_API_KEY environment variable is required");
}

class FinancialServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: "financial-mcp-server",
      version: "0.1.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema
        }))
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const tool = tools.find(t => t.name === request.params.name) as Tool;
        
        if (!tool) {
          return {
            content: [{
              type: "text",
              text: `Unknown tool: ${request.params.name}`
            }],
            isError: true
          };
        }

        try {
          const result = await tool.handler(request.params.arguments || {});
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `API error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Financial Analysis MCP server running on stdio");
  }
}

const server = new FinancialServer();
server.run().catch(console.error);