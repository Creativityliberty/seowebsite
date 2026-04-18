import { NextResponse } from "next/server";
import { generateAllFiles } from "@/lib/generator";

export const maxDuration = 60;

/**
 * @openapi
 * /finalize:
 *   post:
 *     summary: Assemblage final du pack SEO
 *     description: Prend le blueprint complet et génère l'arborescence finale de 16+ fichiers.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { blueprint, variables } = body;
    console.log(">>> [FINALIZE] Assembling full pack for:", blueprint?.project?.siteName);
    
    if (!blueprint || !variables) {
      return NextResponse.json({ error: "Missing blueprint or variables" }, { status: 400 });
    }

    const generatedFiles = generateAllFiles(blueprint, variables);
    
    return NextResponse.json({ generatedFiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
