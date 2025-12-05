import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getSupportedFileTypes } from "@/lib/gemini";
const isProduction = process.env.NODE_ENV === "production";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB
const { mimeTypes: ALLOWED_TYPES } = getSupportedFileTypes();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PDF, DOCX, DOC, JPG, PNG, WEBP",
          allowedTypes: ALLOWED_TYPES,
        },
        { status: 400 }
      );
    }

    if (isProduction) {
      // Use Vercel Blob
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      });
      return NextResponse.json({
        success: true,
        filename: blob.pathname,
        url: blob.url,
        size: file.size,
        type: file.type,
        originalName: file.name,
      });
    } else {
      // Use local filesystem
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory
      const uploadDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Generate unique filename
      // const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      // const extension = file.name.split(".").pop();
      const filename = file.name;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      return NextResponse.json({
        success: true,
        filename,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.type,
        originalName: file.name,
      });
    }
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
