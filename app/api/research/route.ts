import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const { prompt, model = "gemini-1.5-flash" } = body;
  const modelName = model.includes('/') ? model : `models/${model}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!apiKey) {
      console.error("!!! [Research] API KEY IS MISSING");
      return NextResponse.json({ success: false, error: "API_KEY_MISSING" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    console.log(`>>> [Research] Attempting Grounded Research for: ${prompt} using ${modelName}`);

    let responseText = "";

    try {
      // Tentative avec Grounding (Google Search)
      const response = await ai.models.generateContent({
        model: modelName, 
        contents: [{ role: "user", parts: [{ text: `Recherche Google approfondie sur : ${prompt}. Identifie les concurrents et les tendances SEO.` }] }],
        config: {
          systemInstruction: "Tu es un expert en recherche SEO. Utilise Google Search pour extraire des données réelles.",
          tools: [{ googleSearchRetrieval: {} }]
        }
      });
      responseText = await response.text();
    } catch (groundingError: any) {
      console.warn(">>> [Research] Grounding failed, falling back to internal knowledge:", groundingError.message);
      
      // Fallback sans outils (pour éviter les erreurs de permissions régionales)
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Analyse stratégique SEO pour le sujet : ${prompt}. Liste les concurrents probables et les thématiques clés.` }] }],
        config: {
          systemInstruction: "Tu es un expert en stratégie SEO. Génère une analyse basée sur tes connaissances internes."
        }
      });
      responseText = await fallbackResponse.text();
    }

    return NextResponse.json({ success: true, research: responseText });
  } catch (error: any) {
    console.error("!!! [Research Critical Error]", error);
    return NextResponse.json({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        hint: `Critical failure on model ${modelName}. check API keys and Vercel logs.`
    }, { status: 500 });
  }
}
