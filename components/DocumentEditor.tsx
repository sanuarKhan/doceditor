"use client";
import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  ArrowLeft,
  Download,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { IProject, ISection } from "@/types";

interface DocumentEditorProps {
  initialProject: IProject;
}

export default function DocumentEditor({
  initialProject,
}: DocumentEditorProps) {
  const [project, setProject] = useState<IProject>(initialProject);
  const [autoSelect, setAutoSelect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    element: ISection;
    x: number;
    y: number;
  } | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // Auto-save function
  const autoSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaving(true);
      // Simulate API call
      setTimeout(() => {
        setSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Toggle section expand/collapse
  const toggleSection = (sectionId: string) => {
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

  // Toggle selection
  const toggleSelection = (elementId: string) => {
    const updateSections = (sections: ISection[]): ISection[] => {
      return sections.map((section) => {
        if (section.id === elementId) {
          return { ...section, selected: !section.editable };
        }
        if (section.children) {
          return {
            ...section,
            children: section.children.map((child) =>
              child.id === elementId
                ? { ...child, selected: !child.editable }
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
        sections: updateSections(project.document.sections),
      },
    });
  };

  // Change element type
  const changeElementType = (
    element: ISection,
    newType: "section" | "question"
  ) => {
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

  // Update content
  const updateContent = (
    id: string,
    field: "title" | "content",
    value: string
  ) => {
    const updateInSections = (sections: ISection[]): ISection[] => {
      return sections.map((section) => {
        if (section.id === id) {
          return { ...section, [field]: value };
        }
        if (section.children) {
          return {
            ...section,
            children: updateInSections(section.children),
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

    autoSave();
  };

  // Handle right-click context menu
  const handleContextMenu = (element: ISection, event: React.MouseEvent) => {
    if (autoSelect && element.editable) {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        element,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  // Render element with inline editing
  const renderElement = (element: ISection, depth = 0) => {
    const isSection = element.type === "section";
    const isExpanded = element.expanded !== false;
    const isSelected = element.editable !== true;

    return (
      <div key={element.id} className="relative group/item border-none">
        <div
          className={`
            relative rounded-lg transition-all duration-200
            ${depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-6" : ""}
            ${isSelected ? "bg-blue-50" : ""}
          `}
          onContextMenu={(e) => handleContextMenu(element, e)}
        >
          {/* Section Header */}
          {isSection && (
            <div className="flex items-start gap-3 mb-4 group/header">
              {/* S Badge (only visible in selection mode) */}
              {autoSelect && (
                <div className="w-7 h-7 rounded bg-gray-800 text-white flex items-center justify-center text-xs font-bold mt-1 shrink-0">
                  S
                </div>
              )}

              {/* Expand/Collapse Icon */}
              <button
                onClick={() => toggleSection(element.id)}
                className="mt-1.5 p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Section Number & Title */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {element.number && (
                    <span className="font-bold text-gray-900 text-lg shrink-0">
                      {element.number}.
                    </span>
                  )}
                  {autoSelect ? (
                    <input
                      value={element.title || ""}
                      onChange={(e) =>
                        updateContent(element.id, "title", e.target.value)
                      }
                      className="flex-1 font-bold text-gray-900 text-lg bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50/30 rounded px-2 py-1 -ml-2 transition-all overflow-hidden resize-none"
                      placeholder="Section title..."
                    />
                  ) : (
                    <span className="flex-1 font-bold text-gray-900 text-lg">
                      {element.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Plus/Minus Button (only in selection mode, appears on hover) */}
              {autoSelect && (
                <button
                  onClick={() => toggleSelection(element.id)}
                  className="opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0 mt-1 p-2 hover:bg-cyan-600 rounded-lg border border-gray-200 bg-gray-900 shadow-sm absolute top-45 right-60 -translate-50 z-50"
                  title={isSelected ? "Deselect" : "Select"}
                >
                  {isSelected ? (
                    <Minus className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Question/Content */}
          {!isSection && (
            <div className="group/content mb-3">
              <div className="relative flex gap-3">
                {/* C Badge (only visible in selection mode) */}
                {autoSelect && (
                  <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-1 shrink-0">
                    C
                  </div>
                )}

                {/* Content - Editable in selection mode, read-only otherwise */}
                <div className="flex-1 relative">
                  {autoSelect ? (
                    <>
                      <textarea
                        value={element.content}
                        onChange={(e) => {
                          updateContent(element.id, "content", e.target.value);
                        }}
                        className={`w-full text-gray-700 leading-relaxed bg-transparent border rounded-lg px-4 py-3 outline-none transition-all resize-none min-h-auto overflow-hidden ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/30"
                            : "border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-blue-50/30"
                        }`}
                        placeholder="Add content..."
                        style={{
                          height: "auto",
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "auto";
                          target.style.height = target.scrollHeight + "px";
                        }}
                      />

                      {/* Plus/Minus Button (only in selection mode, appears on hover) */}
                      <button
                        onClick={() => toggleSelection(element.id)}
                        className="absolute top-45 right-60 -translate-50 opacity-0 group-hover/content:opacity-100 transition-opacity p-2 hover:bg-teal-600 rounded-lg border border-gray-200 bg-gray-900 shadow-sm z-50"
                        title={isSelected ? "Deselect" : "Select"}
                      >
                        {isSelected ? (
                          <Minus className="w-4 h-4 text-gray-600 bg-blue-600" />
                        ) : (
                          <Plus className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </>
                  ) : (
                    // Read-only mode - looks like PDF viewer
                    <div className="text-gray-700 leading-relaxed px-4 py-3 border-0">
                      {element.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Children (rendered when section is expanded) */}
          {isSection && isExpanded && element.children && (
            <div className="space-y-3 mt-2">
              {element.children.map((child) => renderElement(child, depth + 1))}
            </div>
          )}

          {/* Collapsed Preview */}
          {isSection && !isExpanded && element.children && (
            <div
              className={`text-sm text-gray-500 italic mb-4 ${
                autoSelect ? "ml-14" : "ml-8"
              }`}
            >
              {element.children.length} item
              {element.children.length !== 1 ? "s" : ""} hidden
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex items-center gap-6">
            {/* Auto-save Status (only shown in selection mode) */}
            {autoSelect && (
              <div className="flex items-center gap-2 text-sm">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-gray-600">Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                ) : null}
              </div>
            )}

            {autoSelect && <div className="h-6 w-px bg-gray-300" />}

            {/* Selection Mode Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {autoSelect ? "Edit Mode" : "View Mode"}
              </span>
              <button
                onClick={() => setAutoSelect(!autoSelect)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${autoSelect ? "bg-blue-600" : "bg-gray-300"}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm
                    ${autoSelect ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm bg-white">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
      {/* Document Content */}
      <div className="flex-1 overflow-y-auto py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Document Header */}
            <div className="p-12 border-b border-gray-100 bg-linear-to-br from-blue-50 to-white">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-blue-200/50">
                  <FileText className="w-10 h-10" />
                </div>

                {/* Title - Editable only in selection mode */}
                {autoSelect ? (
                  <input
                    type="text"
                    value={project.document.title}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        document: {
                          ...project.document,
                          title: e.target.value,
                        },
                      })
                    }
                    className="text-4xl font-bold text-gray-900 text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50/30 rounded-lg px-4 py-2 w-full transition-all"
                    placeholder="Document Title"
                    onBlur={autoSave}
                  />
                ) : (
                  <h1 className="text-4xl font-bold text-gray-900">
                    {project.document.title}
                  </h1>
                )}

                {/* Subtitle - Editable only in selection mode */}
                {project.document.subtitle &&
                  (autoSelect ? (
                    <input
                      type="text"
                      value={project.document.subtitle}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          document: {
                            ...project.document,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      className="text-xl text-gray-600 text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50/30 rounded-lg px-4 py-2 w-full transition-all"
                      placeholder="Document Subtitle"
                      onBlur={autoSave}
                    />
                  ) : (
                    <p className="text-xl text-gray-600">
                      {project.document.subtitle}
                    </p>
                  ))}

                <div className="flex items-center justify-center gap-6 pt-4">
                  <div className="px-4 py-2 bg-white rounded-full text-gray-700 font-medium shadow-sm border border-gray-200">
                    {project.clientName}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="px-4 py-2 bg-white rounded-full text-gray-700 font-medium shadow-sm border border-gray-200">
                    {project.assetClass}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-12 space-y-6">
              {project.document.sections.map((section) =>
                renderElement(section)
              )}
            </div>
          </div>

          {/* Bottom Spacing */}
          <div className="h-20"></div>
        </div>
      </div>
      {/* Context Menu (only in selection mode) */}
      {contextMenu && autoSelect && (
        <div
          className="fixed z-50 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-1 min-w-48 overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
            Change Type
          </div>
          <button
            onClick={() => changeElementType(contextMenu.element, "section")}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
          >
            <div className="w-6 h-6 bg-gray-800 text-white rounded flex items-center justify-center text-xs font-bold shadow-sm">
              S
            </div>
            Section
          </button>
          <button
            onClick={() => changeElementType(contextMenu.element, "question")}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
          >
            <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold shadow-sm">
              C
            </div>
            Content/Question
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => {
              toggleSelection(contextMenu.element.id);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-3"
          >
            <Minus className="w-4 h-4" />
            Deselect
          </button>
        </div>
      )}
      {/* Helper Text (only in selection mode)
      {autoSelect && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
          Edit Mode Active - Hover to select, right-click for options
        </div>
      )} */}
    </div>
  );
}
//TODO:
//database operations
//plus minus button fuction fixing
