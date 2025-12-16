// import { NextRequest, NextResponse } from "next/server";
// import { readFile } from "fs/promises";
// import { join } from "path";
// import { analyzeDocumentWithGemini, analyzeTextContent } from "@/lib/gemini";

// const isProduction = process.env.NODE_ENV === "production";

// export async function POST(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     await context.params; // Await even if not used

//     const body = await request.json();
//     const { filename, mimeType, url } = body;

//     if (!url || !mimeType) {
//       return NextResponse.json(
//         { error: "Missing url or mimeType" },
//         { status: 400 }
//       );
//     }

//     let analysis;

//     // Use Express Service for PDFs (handles large files & special chars)
//     if (mimeType === "application/pdf") {
//       try {
//         console.log("Delegating PDF parsing to Express Service...");
//         const serviceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4000";

//         const parseRes = await fetch(`${serviceUrl}/parse`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ url }),
//         });

//         if (!parseRes.ok) {
//           const errText = await parseRes.text();
//           throw new Error(`PDF Service failed: ${parseRes.status} - ${errText}`);
//         }

//         const parseData = await parseRes.json();
//         const textContent = parseData.text;

//         // Now analyze the TEXT with Gemini
//         analysis = await analyzeTextContent(textContent);
//       } catch (e) {
//         console.error("PDF Service error", e);
//         throw e;
//       }
//     } else {
//       // Legacy/Gemini-Vision logic for Images/DOCX
//       // Only fetch buffer here to avoid memory issues with large PDFs
//       let fileBuffer: Buffer;

//       if (isProduction) {
//         // Fetch from Vercel Blob/UploadThing URL
//         const res = await fetch(url);
//         fileBuffer = Buffer.from(await res.arrayBuffer());
//       } else {
//         // Read from local filesystem (legacy dev mode) or URL if available
//         if (url.startsWith("http")) {
//           const res = await fetch(url);
//           fileBuffer = Buffer.from(await res.arrayBuffer());
//         } else {
//           const filepath = join(process.cwd(), "public", "uploads", filename);
//           fileBuffer = await readFile(filepath);
//         }
//       }

//       analysis = await analyzeDocumentWithGemini(fileBuffer, mimeType);
//     }

//     return NextResponse.json({
//       success: true,
//       document: analysis,
//     });
//   } catch (error: unknown) {
//     console.error("Error analyzing document:", error);
//     const message =
//       error instanceof Error ? error.message : "Failed to analyze document";
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
