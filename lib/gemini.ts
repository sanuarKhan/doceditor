import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Process document directly with Gemini (supports PDFs natively!)
 * Using the NEW @google/genai package
 */
export async function analyzeDocumentWithGemini(
  fileBuffer: Buffer,
  mimeType: string

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
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

    // NEW API: Using generateContent from @google/genai
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash", // or 'gemini-2.0-flash-exp' for latest
      contents: contents,
    });
    //eslint-disable-next-line
    const analysisText: any = response.text;

    if (!analysisText) {
      throw new Error("Gemini response returned no text content.");
    }

    // Clean up response
    let cleanText = analysisText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/```\n?/g, "");
    }

    const analysis = JSON.parse(cleanText);
    return analysis;
  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    throw new Error(`Failed to analyze document: ${error}`);
  }
}

/**
 * Analyze text content (for DOCX files)
 */
//eslint-disable-next-line
async function analyzeTextContent(text: string): Promise<any> {
  try {
    const prompt = `You are a document analysis AI. Analyze the following document text and extract its structure.

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

Document text:
${text}

Return ONLY valid JSON, no markdown code blocks or additional text.`;

    // NEW API: Using generateContent from @google/genai
    const response = await genai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [{ text: prompt }],
    });
    //eslint-disable-next-line
    const analysisText: any = response.text;

    // Clean up response
    let cleanText = analysisText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/```\n?/g, "");
    }

    const analysis = JSON.parse(cleanText);
    return analysis;
  } catch (error) {
    console.error("Error analyzing text:", error);
    throw new Error(`Failed to analyze text: ${error}`);
  }
}

/**
 * Alternative: Fetch and analyze document from URL
 * Useful for remote PDFs
 */
//eslint-disable-next-line
export async function analyzeDocumentFromUrl(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mimeType = response.headers.get("content-type") || "application/pdf";
    const filename = url.split("/").pop() || "document";

    return await analyzeDocumentWithGemini(buffer, mimeType);
  } catch (error) {
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
