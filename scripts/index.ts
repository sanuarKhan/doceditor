// Test script to explore PDFParse API
// scripts/explore-pdfparse.ts
import { PDFParse } from "pdf-parse";
import { readFile } from "fs/promises";
import { join } from "path";

async function explorePDFParse() {
  try {
    // Read a test PDF
    const fileBuffer = await readFile(join(__dirname, "../test.pdf"));

    // Create instance
    const pdfParser = new PDFParse(fileBuffer);

    console.log("PDFParse prototype methods:");
    console.log(Object.getOwnPropertyNames(PDFParse.prototype));

    console.log("\nPDFParse instance methods:");
    console.log(Object.getOwnPropertyNames(pdfParser));

    // Try to parse
    await pdfParser.parse();

    console.log("\nAfter parse():");
    console.log("Available properties:", Object.keys(pdfParser));

    // Check for text
    if ("text" in pdfParser) {
      console.log(
        "\nText property exists, length:",
        (pdfParser.text as string)?.length
      );
    }

    if ("getText" in pdfParser && typeof pdfParser.getText === "function") {
      const text = await pdfParser.getText();
      console.log("\ngetText() returned:", typeof text);
      if (typeof text === "string") {
        console.log("Text length:", text.length);
        console.log("First 200 chars:", text.substring(0, 200));
      } else if (text && typeof text === "object") {
        console.log("Text object keys:", Object.keys(text));
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

explorePDFParse();
