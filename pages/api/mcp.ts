import { server } from "@/lib/mcp";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { NextApiRequest, NextApiResponse } from "next";

const transports: Record<string, SSEServerTransport> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const transport = new SSEServerTransport("/api/mcp", res);
    transports[transport.sessionId] = transport;

    res.on("close", () => {
      delete transports[transport.sessionId];
    });

    await server.connect(transport);
  } else if (req.method === "POST") {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];

    if (!transport) {
      return res.status(400).json({ error: "Session non trouvée" });
    }
    
    // @ts-ignore - The SDK types might vary based on version
    await transport.handlePostMessage(req, res);
  } else {
    res.status(405).end();
  }
}
