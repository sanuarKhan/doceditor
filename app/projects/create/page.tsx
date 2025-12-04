import CreateProjectForm from "@/components/CreateProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Project
          </h1>
          <p className="text-gray-600 mt-2">
            Upload a document to analyze its structure with AI
          </p>
        </div>

        {/* Form */}
        <CreateProjectForm />
      </div>
    </div>
  );
}
