import ProjectsList from "@/components/ProjectsList";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              Manage your document analysis projects
            </p>
          </div>
          <Link
            href="/projects/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        {/* Projects List */}
        <ProjectsList />
      </div>
    </div>
  );
}
