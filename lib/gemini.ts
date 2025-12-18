import { DocumentAnalysis } from "@/types";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function analyzeDocumentWithGemini(
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentAnalysis> {
  try {
    // For DOCX files, extract text first (Gemini doesn't support DOCX directly)
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const textContent = result.value;
      return await analyzeTextContent(textContent);
    }

    // For PDFs and images, send directly to Gemini
    const base64Data = fileBuffer.toString("base64");

    const prompt = `You are a document analysis AI. Analyze this document and extract its structure.

Identify:
1. Main sections (usually numbered like "1.0", "2.0", etc.)
2. Subsections or questions under each main section (like "1.1", "1.2", etc.)
3. The content/description for each item

Return a JSON structure following this schema:
{
  "title": "Document title",
  "subtitle": "Document subtitle or description",
  "sections": [
    {
      "id": "s1",
      "type": "section",
      "number": "1.0",
      "title": "Section title",
      "content": "",
      "expanded": true,
      "editable": false,
      "children": [
        {
          "id": "q1_1",
          "type": "question",
          "number": "1.1",
          "content": "Question or subsection text",
          "editable": true
        }
      ]
    }
  ]
}

IMPORTANT:
- Generate unique IDs using format: s1, s2, s3 for sections and q1_1, q1_2, q2_1 for questions
- Use underscores in IDs (not dots): q1_1 not q1.1
- Set "expanded": true for all sections
- Set "editable": true for questions, false for sections
- Extract the actual document title and subtitle from the content
- Preserve all numbering exactly as it appears in the document
- Be thorough - extract ALL sections and questions from the document

Return ONLY valid JSON, no markdown code blocks or additional text.`;

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ];

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const analysisText = response.text;

    if (!analysisText || typeof analysisText !== "string") {
      throw new Error("Gemini response returned no text content.");
    }

    // Clean up response
    let cleanText = analysisText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/```\n?/g, "");
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    cleanText = cleanText.trim();

    const analysis = JSON.parse(cleanText) as DocumentAnalysis;
    return analysis;
  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze document: ${message}`);
  }
}

/**
 * Analyze text content (for DOCX files)
 */
export async function analyzeTextContent(
  text: string
): Promise<DocumentAnalysis> {
  try {
    console.log(`[Gemini] Analyzing text length: ${text.length}`);

    // Chunking strategy: If text is > 100k chars, we might need a summary first or just hope 1.5 Pro handles it.
    // For now, attempting with 2.5/1.5 Flash with high token limit.

    const prompt = `You are a document analysis AI. Analyze the document structure.
    
    1. Extract the document Title and Subtitle.
    2. Identify ALL main sections (1.0, 2.0...) and subsections/questions (1.1, 1.2...).
    3. Be exhaustive. Do not skip sections.
    
    Return STRICT JSON:
    {
      "title": "...",
      "subtitle": "...",
      "sections": [
        {
          "id": "s1", "type": "section", "number": "1.0", "title": "...", "content": "Summary/Intro...", "expanded": true, "editable": false,
          "children": [
             { "id": "q1_1", "type": "question", "number": "1.1", "content": "...", "editable": true }
          ]
        }
      ]
    }
    
    IMPORTANT:
    - Return ONLY valid JSON. No markdown fences.
    - If the document is huge, focus on the structure and first few paragraphs of content per section.
    - unique IDs: s1, s2... q1_1, q1_2...
    
    Document text fragment:
    ${text.slice(0, 300000)} ... [truncated for prompt limit if needed]
    `;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash", // 1.5 Flash has 1M context window, better for large docs than 2.5-flash-exp potentially? Or verify 2.5 window.
      contents: [{ text: prompt }],
    });

    const analysisText = response.text; // Correct method call .text() often simpler

    if (!analysisText) throw new Error("Empty response from Gemini");

    // Simple cleanup just in case
    let cleanText = analysisText.trim();
    if (cleanText.startsWith("```json"))
      cleanText = cleanText.replace(/```json\n?/, "");
    if (cleanText.startsWith("```"))
      cleanText = cleanText.replace(/```\n?/, "");
    if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);

    try {
      return JSON.parse(cleanText) as DocumentAnalysis;
    } catch (parseError: unknown) {
      console.error("JSON Parse failed. Attempting repair...", parseError);
      // Very basic repair: try to find the last valid closing brace sequence
      // This is a naive heuristic
      const lastBrace = cleanText.lastIndexOf("}");
      if (lastBrace > -1) {
        const sub = cleanText.substring(0, lastBrace + 1);
        try {
          return JSON.parse(sub) as DocumentAnalysis;
        } catch {
          console.error("Repair failed");
          throw parseError;
        }
      }
      throw parseError;
    }
  } catch (error: unknown) {
    console.error("Error analyzing text:", error);
    throw new Error(`Failed to analyze text: ${error}`);
  }
}

/**
 * Alternative: Fetch and analyze document from URL
 * Useful for remote PDFs
 */

export async function analyzeDocumentFromUrl(
  url: string
): Promise<DocumentAnalysis> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mimeType = response.headers.get("content-type") || "application/pdf";
    // const filename = url.split("/").pop() || "document";

    return await analyzeDocumentWithGemini(buffer, mimeType);
  } catch (error: unknown) {
    console.error("Error analyzing document from URL:", error);
    throw new Error(`Failed to analyze document from URL: ${error}`);
  }
}

/**
 * Get supported file types
 */
export function getSupportedFileTypes() {
  return {
    mimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
    ],
    extensions: [
      ".pdf",
      ".docx",
      ".doc",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
    ],
  };
}

/**
 * Get available Gemini models
 */
export function getAvailableModels() {
  return {
    current: "gemini-2.5-flash",
    flash: "gemini-1.5-flash", // Faster, cheaper
    latest: "gemini-2.0-flash-exp", // Newest experimental
    vision: "gemini-1.5-pro-vision", // For image-heavy documents
  };
}
