/**
 * Firecrawl Service - Transform website to clean Markdown
 */

const API_KEY = process.env.FIRECRAWL_API_KEY;
const API_URL = "https://api.firecrawl.dev/v1";

export interface FirecrawlResult {
  markdown?: string;
  metadata?: any;
  success: boolean;
  error?: string;
}

export async function scrapeUrl(url: string): Promise<FirecrawlResult> {
  if (!API_KEY) {
    return { success: false, error: "Missing FIRECRAWL_API_KEY" };
  }

  try {
    const response = await fetch(`${API_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to scrape");
    }

    const data = await response.json();
    return {
      success: true,
      markdown: data.data?.markdown,
      metadata: data.data?.metadata,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Crawl tool for Gemini
 */
export const FirecrawlTool = {
  name: "scrape_website",
  description: "Scrapes a website and returns its content in clean Markdown format. Useful for competitor analysis.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "The URL of the website to scrape." }
    },
    required: ["url"]
  }
};
