import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Project from "@/models/Project";

// GET all projects
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get("clientName");
    const assetClass = searchParams.get("assetClass");
    const search = searchParams.get("search");
    //eslint-disable-next-line
    let query: any = {};

    if (clientName) {
      query.clientName = new RegExp(clientName, "i");
    }

    if (assetClass) {
      query.assetClass = assetClass;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const projects = await Project.find(query)
      .select("projectName clientName assetClass createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      projectName,
      clientName,
      assetClass,
      sourceFileName,
      sourceFileUrl,
      sourceFileMimeType,
      document,
    } = body;

    // Validation
    if (!projectName || !clientName || !assetClass || !document) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = new Project({
      projectName,
      clientName,
      assetClass,
      sourceFileName,
      sourceFileUrl,
      sourceFileMimeType,
      document,
    });

    await project.save();

    return NextResponse.json(
      {
        success: true,
        project: project.toJSON(),
      },
      { status: 201 }
    );
    //eslint-disable-next-line
  } catch (error: any) {
    console.error("Error creating project:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
