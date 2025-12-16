import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Project from "@/models/Project";
import mongoose from "mongoose";
import { IProject } from "@/types";

// GET single project
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // MOCK DATA FOR VERIFICATION
    if (id === "mock-project") {
      return NextResponse.json({
        success: true,
        project: {
          _id: "mock-project",
          projectName: "Mock Project",
          clientName: "Mock Client",
          assetClass: "Venture Capital",
          document: {
            title: "Mock Document",
            subtitle: "For UI Verification",
            sections: [
              {
                id: "sec-1",
                type: "section",
                title: "Section 1",
                number: "1.0",
                content: "<p>This is a <strong>mock</strong> section.</p>",
                expanded: true,
                children: []
              }
            ]
          }
        },
      });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const project = await Project.findById(id).lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT update project
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { document, projectName, clientName, assetClass } = body;

    const updateData: Partial<IProject> = {};
    if (document) updateData.document = document;
    if (projectName) updateData.projectName = projectName;
    if (clientName) updateData.clientName = clientName;
    if (assetClass) updateData.assetClass = assetClass;

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: project.toJSON(),
    });
  } catch (error: unknown) {
    console.error("Error updating project:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
