"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Check,
  Edit3,
  FileText,
  Plus,
  Loader2,
  ArrowLeft,
  Save,
  Search,
  Calendar,
  Users,
  Folder,
  Trash2,
  Copy,
  Eye,
  Download,
} from "lucide-react";
import CreateProjectForm from "./CreateProjectForm";
import ProjectsList from "./ProjectsList";
import { Project, ProjectDocument, Section } from "@/types";
import DocumentEditor from "./DocumentEditor";

// Types
// interface Section {
//   id: string;
//   type: "section" | "question";
//   number: string;
//   title?: string;
//   content: string;
//   expanded?: boolean;
//   editable?: boolean;
//   children?: Section[];
// }

// interface ProjectDocument {
//   title: string;
//   subtitle: string;
//   sections: Section[];
// }

// interface Project {
//   _id: string;
//   projectName: string;
//   clientName: string;
//   assetClass: string;
//   sourceFileName: string;
//   sourceFileUrl?: string;
//   sourceFileMimeType?: string;
//   document: ProjectDocument;
//   createdAt: string;
//   updatedAt: string;
//   formattedDate?: string;
// }

const DocumentAnalyzerApp = () => {
  // View state
  const [view, setView] = useState<"projects" | "create" | "editor">(
    "projects"
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project>(projects[0]);
  const [autoSelect, setAutoSelect] = useState(false);
  const [selectedElement, setSelectedElement] = useState<Section | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    element: Section;
    x: number;
    y: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetClassFilter, setAssetClassFilter] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Create Project Form State
  const [formData, setFormData] = useState({
    projectName: "",
    clientName: "",
    assetClass: "",
    sourceFile: null as File | null,
  });

  // Document Structure State
  const [document, setDocument] = useState<ProjectDocument | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (assetClassFilter) params.append("assetClass", assetClassFilter);

      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();

      if (data.success) {
        setProjects(data.projects);
      } else {
        console.error("Error fetching projects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload and analysis
  const analyzeDocument = async (file: File): Promise<ProjectDocument> => {
    setIsAnalyzing(true);

    try {
      // 1. Upload file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || "File upload failed");
      }

      const uploadData = await uploadRes.json();

      // 2. Analyze document
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadData.filename,
          mimeType: uploadData.type,
        }),
      });

      if (!analyzeRes.ok) {
        const error = await analyzeRes.json();
        throw new Error(error.error || "Document analysis failed");
      }

      const analysisData = await analyzeRes.json();
      return analysisData.document;
    } catch (error) {
      console.error("Error analyzing document:", error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle project creation
  const handleCreateProject = async () => {
    if (
      !formData.projectName ||
      !formData.clientName ||
      !formData.assetClass ||
      !formData.sourceFile
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const analyzedDoc = await analyzeDocument(formData.sourceFile);

      // Save to database
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: formData.projectName,
          clientName: formData.clientName,
          assetClass: formData.assetClass,
          sourceFileName: formData.sourceFile.name,
          sourceFileMimeType: formData.sourceFile.type,
          document: analyzedDoc,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create project");
      }

      const data = await res.json();
      const newProject = data.project;

      setProjects([...projects, newProject]);
      setCurrentProject(newProject);
      setDocument(analyzedDoc);
      setView("editor");

      // Reset form
      setFormData({
        projectName: "",
        clientName: "",
        assetClass: "",
        sourceFile: null,
      });
    } catch (error: any) {
      console.error("Error creating project:", error);
      alert(error.message || "Failed to create project");
    }
  };

  // Save document updates
  const saveDocument = async (documentData: ProjectDocument) => {
    if (!currentProject) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${currentProject._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: documentData }),
      });

      if (!res.ok) {
        throw new Error("Failed to save document");
      }

      const data = await res.json();
      if (data.success) {
        setCurrentProject(data.project);
        console.log("Document saved successfully");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  // Toggle section expand/collapse
  const toggleSection = (sectionId: string) => {
    if (!document) return;

    const updateSections = (sections: Section[]): Section[] => {
      return sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, expanded: !section.expanded };
        }
        if (section.children) {
          return { ...section, children: updateSections(section.children) };
        }
        return section;
      });
    };

    const updatedDocument = {
      ...document,
      sections: updateSections(document.sections),
    };

    setDocument(updatedDocument);
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        document: updatedDocument,
      });
      saveDocument(updatedDocument);
    }
  };

  // Handle element selection
  const handleElementClick = (element: Section, event: React.MouseEvent) => {
    if (autoSelect) {
      event.stopPropagation();
      setSelectedElement(element);
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (element: Section, event: React.MouseEvent) => {
    if (autoSelect) {
      event.preventDefault();
      setContextMenu({
        element,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  // Start editing an element
  const startEditing = (element: Section) => {
    setEditingId(element.id);
    setEditContent(element.content);
  };

  // Save edited content
  const saveEdit = (elementId: string) => {
    if (!document) return;

    const updateInSections = (sections: Section[]): Section[] => {
      return sections.map((section) => {
        if (section.id === elementId) {
          return { ...section, content: editContent };
        }
        if (section.children) {
          const updatedChildren = section.children.map((child) => {
            if (child.id === elementId) {
              return { ...child, content: editContent };
            }
            return child;
          });
          return { ...section, children: updatedChildren };
        }
        return section;
      });
    };

    const updatedDocument = {
      ...document,
      sections: updateInSections(document.sections),
    };

    setDocument(updatedDocument);
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        document: updatedDocument,
      });
      saveDocument(updatedDocument);
    }
    setEditingId(null);
    setEditContent("");
  };

  // Delete a project
  const deleteProject = async (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete project");
      }

      // Remove from state
      setProjects(projects.filter((p) => p._id !== projectId));

      // If current project is deleted, go back to projects view
      if (currentProject && currentProject._id === projectId) {
        setCurrentProject(projects[0]);
        setView("projects");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  // Change element type (section/question)
  const changeElementType = (
    element: Section,
    newType: "section" | "question"
  ) => {
    if (!document) return;

    const updateType = (sections: Section[]): Section[] => {
      return sections.map((section) => {
        if (section.id === element.id) {
          return { ...section, type: newType };
        }
        if (section.children) {
          return {
            ...section,
            children: section.children.map((child) =>
              child.id === element.id ? { ...child, type: newType } : child
            ),
          };
        }
        return section;
      });
    };

    const updatedDocument = {
      ...document,
      sections: updateType(document.sections),
    };

    setDocument(updatedDocument);
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        document: updatedDocument,
      });
      saveDocument(updatedDocument);
    }
    setContextMenu(null);
  };

  // Deselect element
  const deselectElement = () => {
    setSelectedElement(null);
    setContextMenu(null);
  };

  // Render element in document editor
  const renderElement = (element: Section, depth = 0) => {
    const isSection = element.type === "section";
    const isSelected = selectedElement?.id === element.id;
    const isEditing = editingId === element.id;

    return (
      <div key={element.id} className="relative">
        <div
          onClick={(e) => handleElementClick(element, e)}
          onContextMenu={(e) => handleContextMenu(element, e)}
          className={`
            group relative py-3 px-4 rounded-lg transition-all duration-200
            ${
              isSelected
                ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-2"
                : "hover:bg-gray-50"
            }
            ${depth > 0 ? "ml-8" : ""}
            border border-transparent hover:border-gray-200
          `}
        >
          <div className="flex items-start gap-3">
            {autoSelect && (
              <div
                className={`
                w-6 h-6 rounded flex items-center justify-center text-xs font-semibold mt-1 flex-shrink-0
                ${
                  isSection
                    ? "bg-gray-800 text-white"
                    : "bg-blue-600 text-white"
                }
              `}
              >
                {isSection ? "S" : "Q"}
              </div>
            )}

            {isSection && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(element.id);
                }}
                className="mt-1 flex-shrink-0"
              >
                {element.expanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                  {element.number}
                </span>
                {isSection && element.title && (
                  <span className="font-semibold text-gray-900">
                    {element.title}
                  </span>
                )}
              </div>

              {!isSection && (
                <div className="mt-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[120px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(element.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {element.content}
                      </p>
                      {autoSelect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(element);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit3 className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isSection && element.expanded && element.children && (
          <div className="mt-2 border-l border-gray-200 ml-8 pl-4">
            {element.children.map((child) => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Projects List View
  // const ProjectsView = () => (
  //   <div className="min-h-screen bg-gray-50 p-4 md:p-8">
  //     <div className="max-w-7xl mx-auto">
  //       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
  //         <div>
  //           <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
  //           <p className="text-gray-600 mt-2">
  //             Manage your document analysis projects
  //           </p>
  //         </div>
  //         <button
  //           onClick={() => setView("create")}
  //           className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
  //         >
  //           <Plus className="w-5 h-5" />
  //           Create Project
  //         </button>
  //       </div>

  //       {/* Filters */}
  //       <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
  //         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //           <div>
  //             <div className="flex items-center gap-2">
  //               <Search className="w-4 h-4 text-gray-400" />
  //               <input
  //                 type="text"
  //                 placeholder="Search projects..."
  //                 value={searchTerm}
  //                 onChange={(e) => setSearchTerm(e.target.value)}
  //                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
  //               />
  //             </div>
  //           </div>
  //           <div>
  //             <select
  //               value={assetClassFilter}
  //               onChange={(e) => setAssetClassFilter(e.target.value)}
  //               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
  //             >
  //               <option value="">All Asset Classes</option>
  //               <option value="Venture Capital">Venture Capital</option>
  //               <option value="Private Equity">Private Equity</option>
  //               <option value="Real Estate">Real Estate</option>
  //               <option value="Hedge Fund">Hedge Fund</option>
  //               <option value="Other">Other</option>
  //             </select>
  //           </div>
  //           <div className="md:col-span-1">
  //             <button
  //               onClick={() => {
  //                 setSearchTerm("");
  //                 setAssetClassFilter("");
  //               }}
  //               className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
  //             >
  //               Clear Filters
  //             </button>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Projects Grid */}
  //       {loading ? (
  //         <div className="flex justify-center items-center h-64">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //         </div>
  //       ) : projects.length === 0 ? (
  //         <div className="bg-white rounded-lg shadow-sm p-12 text-center">
  //           <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  //           <h3 className="text-xl font-semibold text-gray-700 mb-2">
  //             No projects yet
  //           </h3>
  //           <p className="text-gray-500 mb-6">
  //             Create your first project to get started
  //           </p>
  //           <button
  //             onClick={() => setView("create")}
  //             className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
  //           >
  //             Create Project
  //           </button>
  //         </div>
  //       ) : (
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //           {projects.map((project) => (
  //             <div
  //               key={project._id}
  //               onClick={() => {
  //                 setCurrentProject(project);
  //                 setDocument(project.document);
  //                 setView("editor");
  //               }}
  //               className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 border border-gray-200"
  //             >
  //               <div className="flex items-start justify-between mb-4">
  //                 <div>
  //                   <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
  //                     {project.projectName}
  //                   </h3>
  //                   <p className="text-sm text-gray-600 mt-1">
  //                     <Users className="w-4 h-4 inline mr-1" />
  //                     Client: {project.clientName}
  //                   </p>
  //                 </div>
  //                 <div
  //                   className={`px-2 py-1 rounded-full text-xs font-medium ${
  //                     project.assetClass === "Venture Capital"
  //                       ? "bg-purple-100 text-purple-800"
  //                       : project.assetClass === "Private Equity"
  //                       ? "bg-blue-100 text-blue-800"
  //                       : project.assetClass === "Real Estate"
  //                       ? "bg-green-100 text-green-800"
  //                       : project.assetClass === "Hedge Fund"
  //                       ? "bg-yellow-100 text-yellow-800"
  //                       : "bg-gray-100 text-gray-800"
  //                   }`}
  //                 >
  //                   {project.assetClass}
  //                 </div>
  //               </div>

  //               <div className="space-y-2 mb-4">
  //                 <div className="flex items-center gap-2 text-sm text-gray-500">
  //                   <Folder className="w-4 h-4" />
  //                   <span>Document: {project.sourceFileName}</span>
  //                 </div>
  //                 <div className="flex items-center gap-2 text-sm text-gray-500">
  //                   <Calendar className="w-4 h-4" />
  //                   <span>
  //                     Created:{" "}
  //                     {new Date(project.createdAt).toLocaleDateString()}
  //                   </span>
  //                 </div>
  //               </div>

  //               <div className="flex items-center justify-between pt-4 border-t border-gray-100">
  //                 <button
  //                   onClick={(e) => {
  //                     e.stopPropagation();
  //                     navigator.clipboard.writeText(project._id);
  //                     alert("Project ID copied to clipboard");
  //                   }}
  //                   className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
  //                   title="Copy Project ID"
  //                 >
  //                   <Copy className="w-3 h-3" />
  //                   Copy ID
  //                 </button>

  //                 <div className="flex items-center gap-2">
  //                   <button
  //                     onClick={(e) => {
  //                       e.stopPropagation();
  //                       setCurrentProject(project);
  //                       setDocument(project.document);
  //                       setView("editor");
  //                     }}
  //                     className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
  //                     title="View Project"
  //                   >
  //                     <Eye className="w-3 h-3" />
  //                     View
  //                   </button>
  //                   <button
  //                     onClick={(e) => deleteProject(project._id, e)}
  //                     className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
  //                     title="Delete Project"
  //                   >
  //                     <Trash2 className="w-3 h-3" />
  //                     Delete
  //                   </button>
  //                 </div>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       )}

  //       {/* Stats */}
  //       {!loading && projects.length > 0 && (
  //         <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
  //           <div className="text-sm text-gray-600">
  //             Showing {projects.length} project
  //             {projects.length !== 1 ? "s" : ""}
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );

  // // Create Project View
  // const CreateProjectView = () => {
  //   return (
  //     <div className="min-h-screen bg-gray-50 p-4">
  //       <div className="max-w-2xl mx-auto">
  //         <div className="mb-8">
  //           <button
  //             onClick={() => setView("projects")}
  //             className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
  //           >
  //             <ArrowLeft className="w-4 h-4" />
  //             Back to Projects
  //           </button>
  //           <h1 className="text-3xl font-bold text-gray-900">
  //             Create New Project
  //           </h1>
  //           <p className="text-gray-600 mt-2">
  //             Upload a document and let AI analyze its structure
  //           </p>
  //         </div>

  //         <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
  //           <div className="space-y-6">
  //             {/* Project Name */}
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700 mb-2">
  //                 Project Name<span className="text-red-500">*</span>
  //               </label>
  //               <input
  //                 type="text"
  //                 value={formData.projectName}
  //                 onChange={(e) =>
  //                   setFormData({ ...formData, projectName: e.target.value })
  //                 }
  //                 placeholder="Enter project name"
  //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
  //               />
  //             </div>

  //             {/* Client Name and Asset Class */}
  //             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //               <div>
  //                 <label className="block text-sm font-medium text-gray-700 mb-2">
  //                   Client Name<span className="text-red-500">*</span>
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={formData.clientName}
  //                   onChange={(e) =>
  //                     setFormData({ ...formData, clientName: e.target.value })
  //                   }
  //                   placeholder="Enter client name"
  //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
  //                 />
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-medium text-gray-700 mb-2">
  //                   Asset Class<span className="text-red-500">*</span>
  //                 </label>
  //                 <select
  //                   value={formData.assetClass}
  //                   onChange={(e) =>
  //                     setFormData({ ...formData, assetClass: e.target.value })
  //                   }
  //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
  //                 >
  //                   <option value="">Select category</option>
  //                   <option value="Venture Capital">Venture Capital</option>
  //                   <option value="Private Equity">Private Equity</option>
  //                   <option value="Real Estate">Real Estate</option>
  //                   <option value="Hedge Fund">Hedge Fund</option>
  //                   <option value="Other">Other</option>
  //                 </select>
  //               </div>
  //             </div>

  //             {/* File Upload */}
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700 mb-2">
  //                 Source Document<span className="text-red-500">*</span>
  //               </label>
  //               <div
  //                 onClick={() => fileInputRef.current?.click()}
  //                 className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
  //               >
  //                 {formData.sourceFile ? (
  //                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  //                     <div className="flex items-center gap-3">
  //                       <FileText className="w-5 h-5 text-blue-600" />
  //                       <div>
  //                         <p className="text-sm font-medium text-gray-900">
  //                           {formData.sourceFile.name}
  //                         </p>
  //                         <p className="text-xs text-gray-500">
  //                           {(formData.sourceFile.size / 1024 / 1024).toFixed(
  //                             2
  //                           )}{" "}
  //                           MB
  //                         </p>
  //                       </div>
  //                     </div>
  //                     <button
  //                       onClick={(e) => {
  //                         e.stopPropagation();
  //                         setFormData({ ...formData, sourceFile: null });
  //                       }}
  //                       className="text-red-500 hover:text-red-700"
  //                     >
  //                       <X className="w-5 h-5" />
  //                     </button>
  //                   </div>
  //                 ) : (
  //                   <div>
  //                     <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
  //                     <p className="text-sm text-gray-600 mb-2">
  //                       Click to upload or drag and drop
  //                     </p>
  //                     <p className="text-xs text-gray-500">
  //                       PDF, DOC, DOCX, JPG, PNG up to 10MB
  //                     </p>
  //                   </div>
  //                 )}
  //               </div>
  //               <input
  //                 ref={fileInputRef}
  //                 type="file"
  //                 accept=".pdf,.doc,.docx,image/*"
  //                 onChange={(e) =>
  //                   setFormData({
  //                     ...formData,
  //                     sourceFile: e.target.files?.[0] || null,
  //                   })
  //                 }
  //                 className="hidden"
  //               />
  //             </div>

  //             {/* Info Box */}
  //             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //               <p className="text-sm text-blue-800">
  //                 <strong>How it works:</strong> Upload your document, and our
  //                 AI will automatically analyze its structure, extracting
  //                 sections and questions for easy editing.
  //               </p>
  //             </div>

  //             {/* Actions */}
  //             <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
  //               <button
  //                 onClick={() => setView("projects")}
  //                 className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
  //                 disabled={isAnalyzing}
  //               >
  //                 Cancel
  //               </button>
  //               <button
  //                 onClick={handleCreateProject}
  //                 disabled={isAnalyzing}
  //                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 flex items-center gap-2"
  //               >
  //                 {isAnalyzing ? (
  //                   <>
  //                     <Loader2 className="w-4 h-4 animate-spin" />
  //                     Analyzing Document...
  //                   </>
  //                 ) : (
  //                   "Create Project"
  //                 )}
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  // // Document Editor View
  // const EditorView = () => {
  //   if (!currentProject || !document) {
  //     return (
  //       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //           <p className="text-gray-600">Loading project...</p>
  //         </div>
  //       </div>
  //     );
  //   }

  //   return (
  //     <div
  //       className={`min-h-screen bg-gray-50 ${
  //         isFullscreen ? "fixed inset-0 z-50 bg-white" : ""
  //       }`}
  //     >
  //       {/* Header */}
  //       <div className="bg-white border-b border-gray-200 px-6 py-4">
  //         <div className="max-w-7xl mx-auto">
  //           <div className="flex items-center justify-between">
  //             <div className="flex items-center gap-4">
  //               <button
  //                 onClick={() => setView("projects")}
  //                 className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
  //               >
  //                 <ArrowLeft className="w-4 h-4" />
  //                 Back to Projects
  //               </button>
  //               <div>
  //                 <h1 className="text-lg font-semibold text-gray-900">
  //                   {currentProject.projectName}
  //                 </h1>
  //                 <p className="text-sm text-gray-600">
  //                   {currentProject.clientName} • {currentProject.assetClass}
  //                 </p>
  //               </div>
  //             </div>

  //             <div className="flex items-center gap-4">
  //               <div className="flex items-center gap-2">
  //                 <span className="text-sm text-gray-600">Auto-select</span>
  //                 <button
  //                   onClick={() => setAutoSelect(!autoSelect)}
  //                   className={`
  //                     relative w-12 h-6 rounded-full transition
  //                     ${autoSelect ? "bg-blue-600" : "bg-gray-300"}
  //                   `}
  //                 >
  //                   <div
  //                     className={`
  //                     absolute top-1 w-4 h-4 bg-white rounded-full transition transform
  //                     ${autoSelect ? "translate-x-7" : "translate-x-1"}
  //                   `}
  //                   />
  //                 </button>
  //               </div>

  //               <button
  //                 onClick={() => setIsFullscreen(!isFullscreen)}
  //                 className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
  //               >
  //                 {isFullscreen ? (
  //                   <>
  //                     <Minimize2 className="w-4 h-4" />
  //                     Exit Fullscreen
  //                   </>
  //                 ) : (
  //                   <>
  //                     <Maximize2 className="w-4 h-4" />
  //                     Fullscreen
  //                   </>
  //                 )}
  //               </button>

  //               <button
  //                 onClick={() => saveDocument(document)}
  //                 disabled={saving}
  //                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 flex items-center gap-2"
  //               >
  //                 <Save className="w-4 h-4" />
  //                 {saving ? "Saving..." : "Save Document"}
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Document Content */}
  //       <div className="max-w-5xl mx-auto p-4 md:p-8">
  //         <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
  //           {/* Document Header */}
  //           <div className="text-center mb-8 pb-8 border-b border-gray-200">
  //             <div className="w-16 h-16 bg-blue-600 mx-auto mb-4 rounded-lg flex items-center justify-center">
  //               <FileText className="w-8 h-8 text-white" />
  //             </div>
  //             <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
  //               {document.title}
  //             </h1>
  //             {document.subtitle && (
  //               <p className="text-gray-600 text-lg">{document.subtitle}</p>
  //             )}
  //           </div>

  //           {/* Sections */}
  //           <div>
  //             <div className="flex items-center justify-between mb-6">
  //               <h2 className="text-xl font-bold text-gray-900">
  //                 Document Structure
  //               </h2>
  //               <div className="text-sm text-gray-500">
  //                 {autoSelect
  //                   ? "Click elements to select"
  //                   : "Enable auto-select to edit"}
  //               </div>
  //             </div>
  //             <div className="space-y-2">
  //               {document.sections.map((section) => renderElement(section))}
  //             </div>
  //           </div>

  //           {/* Editor Help */}
  //           {autoSelect && (
  //             <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
  //               <h3 className="font-semibold text-blue-800 mb-2">
  //                 Editing Mode Active
  //               </h3>
  //               <ul className="text-sm text-blue-700 space-y-1">
  //                 <li>• Click on questions to select them</li>
  //                 <li>• Click the edit icon to modify content</li>
  //                 <li>• Click section headers to expand/collapse</li>
  //                 <li>• Don't forget to save your changes</li>
  //               </ul>
  //             </div>
  //           )}

  //           {/* Project Info Footer */}
  //           <div className="mt-8 pt-6 border-t border-gray-200">
  //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
  //               <div>
  //                 <p>
  //                   <strong>Source File:</strong>{" "}
  //                   {currentProject.sourceFileName}
  //                 </p>
  //                 <p>
  //                   <strong>Created:</strong>{" "}
  //                   {new Date(currentProject.createdAt).toLocaleString()}
  //                 </p>
  //               </div>
  //               <div>
  //                 <p>
  //                   <strong>Last Updated:</strong>{" "}
  //                   {new Date(currentProject.updatedAt).toLocaleString()}
  //                 </p>
  //                 <p>
  //                   <strong>Document ID:</strong> {currentProject._id}
  //                 </p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Context Menu */}
  //       {contextMenu && (
  //         <>
  //           <div
  //             className="fixed inset-0 z-40"
  //             onClick={() => setContextMenu(null)}
  //           />
  //           <div
  //             className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl py-2 min-w-[160px]"
  //             style={{ left: contextMenu.x, top: contextMenu.y }}
  //           >
  //             <div className="px-3 py-1 text-xs text-gray-400 mb-1">
  //               Edit Category
  //             </div>
  //             <button
  //               onClick={() =>
  //                 changeElementType(contextMenu.element, "section")
  //               }
  //               className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2"
  //             >
  //               <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center text-xs">
  //                 S
  //               </div>
  //               Section
  //             </button>
  //             <button
  //               onClick={() =>
  //                 changeElementType(contextMenu.element, "question")
  //               }
  //               className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2"
  //             >
  //               <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-xs">
  //                 Q
  //               </div>
  //               Question
  //             </button>
  //             <button
  //               onClick={deselectElement}
  //               className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2"
  //             >
  //               <div className="w-5 h-5 border border-gray-600 rounded flex items-center justify-center text-xs">
  //                 D
  //               </div>
  //               Deselect
  //             </button>
  //           </div>
  //         </>
  //       )}
  //     </div>
  //   );
  // };

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50">
      {view === "projects" && <ProjectsList projects={projects} />}
      {view === "create" && <CreateProjectForm />}
      {view === "editor" && <DocumentEditor Projects={currentProject} />}
    </div>
  );
};

export default DocumentAnalyzerApp;
