import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const fullBlueprintSchema = {
  type: "object",
  properties: {
    blueprint: {
      type: "object",
      properties: {
        project: {
          type: "object",
          properties: {
            siteName: { type: "string" },
            baseUrl: { type: "string" }
          },
          required: ["siteName", "baseUrl"]
        },
        brand: {
          type: "object",
          properties: {
            name: { type: "string" },
            vatID: { type: "string" },
            taxID: { type: "string" }
          },
          required: ["name"]
        },
        contentPages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              routeName: { type: "string" },
              pageType: { type: "string" },
              url: { type: "string" },
              h1: { type: "string" },
              seoTitle: { type: "string" },
              seoDescription: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              markdownContent: { type: "string" }
            },
            required: ["routeName", "h1", "url", "pageType"]
          }
        }
      },
      required: ["project", "brand", "contentPages"]
    },
    variables: {
      type: "object"
    }
  },
  required: ["blueprint", "variables"]
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model = "gemini-1.5-pro" } = body;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a Senior Technical SEO Architect. Use the provided RESEARCH CONTEXT to design an Elite SEO Blueprint with exactly 15 pages. Every page must be perfectly SEO optimized. Output in JSON format.",
        responseMimeType: "application/json",
        // @ts-ignore
        responseJsonSchema: fullBlueprintSchema,
      }
    });

    const responseText = await response.text();
    return NextResponse.json(JSON.parse(responseText || '{}'));
  } catch (error: any) {
    console.error("!!! [Architect Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
