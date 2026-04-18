import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const batchResultsSchema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          routeName: { type: "string" },
          content: { type: "string", description: "The 1200-word expert markdown content for this specific page." }
        },
        required: ["routeName", "content"]
      }
    }
  },
  required: ["results"]
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!apiKey) return NextResponse.json({ success: false, error: "API_KEY_MISSING" });

    const ai = new GoogleGenAI({ apiKey });
    const { pages, blueprint, model = "gemini-3-flash-preview" } = await req.json();
    
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ success: false, error: "BATCH_INVALID" });
    }

    const brandName = blueprint.brand?.name || "L'entreprise";
    const pageTargets = pages.map((p: any) => p.h1).join(", ");

    console.log(`>>> [SQUAD] Writing Batch: ${pageTargets} using ${model}`);

    const systemPrompt = `
You are an Elite SEO Copywriter. You must write the full content for the current BATCH of pages.
BRAND: ${brandName}.
PAGES TO WRITE:
${pages.map((p: any) => `- ${p.routeName}: ${p.h1} (${p.seoDescription})`).join("\n")}

REQUIREMENTS:
1. For EACH page, write 1000-1200 words of expert Markdown.
2. Use professional silos: ensure content between these pages is semantically interlinked.
3. Include FAQ and CTA for each.
4. Return the result in a JSON array matched by routeName.
`;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: "Proceed with the core batch writing." }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        // @ts-ignore
        responseJsonSchema: batchResultsSchema
      }
    });

    if (!response.text) throw new Error("Réponse de l'IA vide.");

    const data = JSON.parse(response.text);
    return NextResponse.json({ success: true, results: data.results });
  } catch (error: any) {
    console.error("!!! [Squad Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
