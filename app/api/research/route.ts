import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model = "gemini-1.5-pro" } = body;
    
    const response = await ai.models.generateContent({
      model: model, 
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
