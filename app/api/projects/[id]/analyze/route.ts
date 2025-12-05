import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { analyzeDocumentWithGemini } from "@/lib/gemini";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await context.params; // Await even if not used

    const body = await request.json();
    const { filename, mimeType, url } = body;

    if (!url || !mimeType) {
      return NextResponse.json(
        { error: "Missing url or mimeType" },
        { status: 400 }
      );
    }

    // Declare fileBuffer outside the if/else
    let fileBuffer: Buffer;

    if (isProduction) {
      // Fetch from Vercel Blob URL
      const res = await fetch(url);
      fileBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Read from local filesystem
      const filepath = join(process.cwd(), "public", "uploads", filename);
      fileBuffer = await readFile(filepath);
    }

    // Analyze with Gemini
    const analysis = await analyzeDocumentWithGemini(fileBuffer, mimeType);

    return NextResponse.json({
      success: true,
      document: analysis,
    });
  } catch (error: unknown) {
    console.error("Error analyzing document:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
