import { NextRequest, NextResponse } from "next/server";
import { analyzeTextContent } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Step 1: Get text from the PDF Processing Service
    // In production, this URL should be an env var. Defaulting to localhost for dev flow as per user setup
    const pdfServiceUrl =
      process.env.PDF_SERVICE_URL || "http://localhost:4000";

    console.log(
      `[NextAPI] Requesting text parsing from ${pdfServiceUrl}/parse...`
    );

    // We expect the PDF service to be running independently
    const parseResponse = await fetch(`${pdfServiceUrl}/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("[NextAPI] PDF Parsing Service failed:", errorText);
      throw new Error(
        `PDF Service Request Failed: ${parseResponse.status} ${parseResponse.statusText}`
      );
    }

    const { text } = await parseResponse.json();

    if (!text || text.length < 10) {
      throw new Error("Extracted text is empty or invalid.");
    }

    if (text && text.length > 50) {
      console.log(
        `[NextAPI] Text extracted (${text.length} chars). Analyzing with Gemini...`
      );
      const documentData = await analyzeTextContent(text);
      return NextResponse.json({
        success: true,
        document: documentData,
      });
    }

    throw new Error("Extracted text is too short or invalid.");
    //eslint-disable-next-line
  } catch (error: any) {
    console.error("[NextAPI] Analysis failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze document" },
      { status: 500 }
    );
  }
}
