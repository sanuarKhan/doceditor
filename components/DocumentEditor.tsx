"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
  Loader2,
  ArrowLeft,
  Save,
  Download,
} from "lucide-react";
import { IProject, ISection } from "@/types";

interface DocumentEditorProps {
  projectId: string;
}

export default function DocumentEditor({ projectId }: DocumentEditorProps) {
  const router = useRouter();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editor State
  const [autoSelect, setAutoSelect] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ISection | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    element: ISection;
    x: number;
    y: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch project
  useEffect(() => {
    fetchProject();
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
      } else {
        setError(data.error || "Failed to fetch project");
      }
    } catch (err) {
      setError("Failed to load project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!project) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: project.document }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save");
      }

      // Show success message
      alert("Project saved successfully!");
      //eslint-disable-next-line
    } catch (err: any) {
      alert(err.message || "Failed to save project");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle section expand/collapse
  const toggleSection = (sectionId: string) => {
    if (!project) return;

    const updateSections = (sections: ISection[]): ISection[] => {
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

    setProject({
      ...project,
      document: {
        ...project.document,
        sections: updateSections(project.document.sections),
      },
    });
  };

  // Handle element selection
  const handleElementClick = (element: ISection, event: React.MouseEvent) => {
    if (autoSelect) {
      event.stopPropagation();
      setSelectedElement(element);
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (element: ISection, event: React.MouseEvent) => {
    if (autoSelect) {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        element,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  // Start editing
  const startEditing = (element: ISection) => {
    setEditingId(element.id);
    setEditContent(element.content);
  };

  // Save edit
  const saveEdit = (elementId: string) => {
    if (!project) return;

    const updateInSections = (sections: ISection[]): ISection[] => {
      return sections.map((section) => {
        if (section.id === elementId) {
          return { ...section, content: editContent };
        }
        if (section.children) {
          return {
            ...section,
            children: section.children.map((child) =>
              child.id === elementId
                ? { ...child, content: editContent }
                : child
            ),
          };
        }
        return section;
      });
    };

    setProject({
      ...project,
      document: {
        ...project.document,
        sections: updateInSections(project.document.sections),
      },
    });

    setEditingId(null);
    setEditContent("");
  };

  // Change element type
  const changeElementType = (
    element: ISection,
    newType: "section" | "question"
  ) => {
    if (!project) return;

    const updateType = (sections: ISection[]): ISection[] => {
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

    setProject({
      ...project,
      document: {
        ...project.document,
        sections: updateType(project.document.sections),
      },
    });
    setContextMenu(null);
  };

  // Render element (recursive)
  const renderElement = (element: ISection, depth = 0) => {
    const isSection = element.type === "section";
    const isSelected = selectedElement?.id === element.id;
    const isEditing = editingId === element.id;

    return (
      <div key={element.id} className="relative">
        <div
          onClick={(e) => handleElementClick(element, e)}
          onContextMenu={(e) => handleContextMenu(element, e)}
          className={`
            group relative py-3 px-4 rounded-lg transition
            ${
              isSelected
                ? "bg-blue-50 ring-2 ring-blue-500"
                : "hover:bg-gray-50"
            }
            ${depth > 0 ? "ml-8" : ""}
          `}
        >
          <div className="flex items-start gap-3">
            {/* Badge */}
            {autoSelect && (
              <div
                className={`
                  w-6 h-6 rounded flex items-center justify-center text-xs font-semibold mt-1
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

            {/* Expand/Collapse Button */}
            {isSection && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(element.id);
                }}
                className="mt-1"
              >
                {element.expanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">
                  {element.number}
                </span>
                {isSection && (
                  <span className="font-semibold text-gray-900">
                    {element.title}
                  </span>
                )}
              </div>

              {!isSection && (
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(element.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {element.content}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Edit Button */}
            {autoSelect && !isSection && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(element);
                }}
                className="opacity-0 group-hover:opacity-100 transition"
              >
                <Edit3 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Children */}
        {isSection && element.expanded && element.children && (
          <div className="mt-2">
            {element.children.map((child) => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-red-600 mb-4">{error || "Project not found"}</p>
          <button
            onClick={() => router.push("/projects")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </button>

          <div className="flex items-center gap-4">
            {/* Auto-select Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Auto-select</span>
              <button
                onClick={() => {
                  setAutoSelect(!autoSelect);
                  setSelectedElement(null);
                }}
                className={`
                  relative w-12 h-6 rounded-full transition
                  ${autoSelect ? "bg-blue-600" : "bg-gray-300"}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition transform
                    ${autoSelect ? "translate-x-7" : "translate-x-1"}
                  `}
                />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={saveProject}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>

            {/* Export Button */}
            <button
              onClick={() => alert("Export feature coming soon!")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Document Header */}
          <div className="text-center mb-8 pb-8 border-b border-gray-200">
            <div className="w-16 h-16 bg-blue-600 mx-auto mb-4 rounded-lg flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {project.document.title}
            </h1>
            <p className="text-gray-600">{project.document.subtitle}</p>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>{project.clientName}</span>
              <span>•</span>
              <span>{project.assetClass}</span>
            </div>
          </div>

          {/* Sections */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Document Structure
            </h2>
            <div className="space-y-2">
              {project.document.sections.map((section) =>
                renderElement(section)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl py-2 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-xs text-gray-400 mb-1">
            Edit Category
          </div>
          <button
            onClick={() => changeElementType(contextMenu.element, "section")}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2"
          >
            <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center text-xs">
              S
            </div>
            Section
          </button>
          <button
            onClick={() => changeElementType(contextMenu.element, "question")}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2"
          >
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-xs">
              Q
            </div>
            Question
          </button>
          <button
            onClick={() => {
              setSelectedElement(null);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2 border-t border-gray-700 mt-1"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
}
