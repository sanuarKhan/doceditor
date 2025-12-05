import DocumentEditor from "@/components/DocumentEditor";
import connectDB from "@/lib/db";
import Project from "@/models/Project";
import { notFound } from "next/navigation";
import { IDocument, IProject } from "@/types";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectEditorPage({ params }: PageProps) {
  const { id } = await params;

  await connectDB();
  const project = await Project.findById(id).lean().exec();

  if (!project) return notFound();

  // ------------------------------------------------------------
  // 👇 FIX: Add a check for the missing 'document' sub-document
  // ------------------------------------------------------------
  if (!project.document || typeof project.document.title === "undefined") {
    // Option A: Use a different error page (less likely to be correct here)
    // return notFound();

    // Option B (Best): Provide a sensible default empty document object
    // This requires ensuring IDocument structure matches the default you provide.
    console.error(
      `Project ID ${id} is missing a required 'document' sub-document.`
    );

    // We will assume your IDocument looks something like this for a fallback:
    const defaultDocument = {
      title: "Untitled Document",
      subtitle: "Missing Data",
      sections: [], // Based on your ISection usage in DocumentEditor
    };
    project.document = defaultDocument;
  }
  // ------------------------------------------------------------

  // Now proceed with sanitization, using the checked or defaulted document:
  const sanitizedProject: IProject = {
    _id: project._id.toString(),
    projectName: project.projectName,
    clientName: project.clientName,
    assetClass: project.assetClass as IProject["assetClass"],
    sourceFileName: project.sourceFileName,
    sourceFileUrl: project.sourceFileUrl,
    sourceFileMimeType: project.sourceFileMimeType,

    // Pass the checked/defaulted document
    document: project.document as IDocument,

    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };

  return <DocumentEditor initialProject={sanitizedProject} />;
}
