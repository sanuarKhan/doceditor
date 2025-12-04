import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { analyzeDocumentWithGemini } from "@/lib/gemini";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Analyze with Gemini (handles PDFs, images, and DOCX)
    const analysis = await analyzeDocumentWithGemini(
      fileBuffer,
      mimeType,
      filename
    );

    return NextResponse.json({
      success: true,
      document: analysis,
    });
  } catch (error: any) {
    console.error("Error analyzing document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze document" },
      { status: 500 }
    );
  }
}
