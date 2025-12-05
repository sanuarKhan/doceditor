import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { analyzeDocumentWithGemini } from "@/lib/gemini";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const body = await request.json();
    const { filename, mimeType } = body;

    if (!filename || !mimeType) {
      return NextResponse.json(
        { error: "Missing filename or mimeType" },
        { status: 400 }
      );
    }

    // Read the uploaded file
    const filepath = join(process.cwd(), "public", "uploads", filename);
    const fileBuffer = await readFile(filepath);

    // Analyze with Gemini
    const analysis = await analyzeDocumentWithGemini(fileBuffer, mimeType);

    return NextResponse.json({
      success: true,
      document: analysis,
    });
    //eslint-disable-next-line
  } catch (error: any) {
    console.error("Error analyzing document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze document" },
      { status: 500 }
    );
  }
}
