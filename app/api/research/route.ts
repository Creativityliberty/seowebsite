import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // Use Flash for speed in research
    const model = ai.models.get("gemini-3-flash-preview");
    
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Realise une recherche Google approfondie sur le sujet suivant et extrais :
        1. Les 3 principaux concurrents (URLs).
        2. Les 5 questions les plus posées (PPA).
        3. Les tendances SEO actuelles.
        
        Sujet : ${prompt}` }] }],
      tools: [{ googleSearchRetrieval: {} }]
    });

    return NextResponse.json({ success: true, research: response.text });
  } catch (error: any) {
    console.error("!!! [Research Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
