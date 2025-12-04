import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  extractTextFromFile,
  analyzeDocumentWithAI,
  analyzeImageWithAI,
} from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, mimeType } = body;

    if (!filename || !mimeType) {
      return NextResponse.json(
        { error: "Missing filename or mimeType" },
        { status: 400 }
      );
    }

    const filepath = join(process.cwd(), "public", "uploads", filename);
    const fileBuffer = await readFile(filepath);

    let analysis;

    if (mimeType.startsWith("image/")) {
      const base64Image = fileBuffer.toString("base64");
      analysis = await analyzeImageWithAI(base64Image);
    } else {
      const extractedText = await extractTextFromFile(fileBuffer, mimeType);
      analysis = await analyzeDocumentWithAI(extractedText, mimeType);
    }

    return NextResponse.json({
      success: true,
      document: analysis,
    });
  } catch (error: any) {
    console.error("Error analyzing document", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze document" },
      { status: 500 }
    );
  }
}
