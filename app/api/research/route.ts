import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!apiKey) {
      console.error("!!! [Research] API KEY IS MISSING");
      return NextResponse.json({ success: false, error: "API_KEY_MISSING" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { prompt, model = "gemini-1.5-flash" } = body;
    
    console.log(">>> [Research] Starting A0 Grounding for:", prompt);

    const modelName = model.includes('/') ? model : `models/${model}`;

    const response = await ai.models.generateContent({
      model: modelName, 
      contents: [{ role: "user", parts: [{ text: `Recherche Google : ${prompt}` }] }],
      config: {
        systemInstruction: "Réalise une recherche approfondie et extrais les concurrents, les questions PPA et les tendances SEO.",
        tools: [{ googleSearchRetrieval: {} }]
      }
    });

    const responseText = await response.text();
    return NextResponse.json({ success: true, research: responseText });
  } catch (error: any) {
    console.error("!!! [Research Error]", error);
    return NextResponse.json({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        hint: `Model: ${modelName || 'unknown'}. Verify if Google Search Grounding is active for this model.`
    }, { status: 500 });
  }
}
