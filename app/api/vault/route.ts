import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), "generated");
    if (!fs.existsSync(baseDir)) {
      return NextResponse.json({ files: {} });
    }

    const files: Record<string, string> = {};

    function readDirRecursive(dir: string, relativePath: string = "") {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          readDirRecursive(fullPath, relPath);
        } else {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            files[relPath] = content;
          } catch (e) {
            console.error(`Error reading ${relPath}:`, e);
          }
        }
      });
    }

    readDirRecursive(baseDir);

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
