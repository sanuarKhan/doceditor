"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, FileText, CheckCircle } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";


export default function CreateProjectForm() {
  const router = useRouter();


  const [formData, setFormData] = useState<{
    projectName: string;
    clientName: string;
    assetClass: string;
    uploadedFile: {
      name: string;
      url: string;
      key: string;
      size: number;
    } | null;
  }>({
    projectName: "",
    clientName: "",
    assetClass: "",
    uploadedFile: null,
  });



  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "form" | "uploading" | "analyzing" | "done"
  >("form");

  const [error, setError] = useState("");





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.projectName ||
      !formData.clientName ||
      !formData.assetClass ||
      !formData.uploadedFile
    ) {
      setError("Please fill all required fields");
      return;
    }

    try {
      // 3. Analyze Document
      setCurrentStep("analyzing");
      setAnalyzing(true);


      const analyzeRes = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: formData.uploadedFile.url, // Use formData.uploadedFile.url
          mimeType: "application/pdf", // Assuming PDF based on service, as type is not available from uploadthing
          filename: formData.uploadedFile.name // Use formData.uploadedFile.name
        }),
      });

      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.error || "Document analysis failed");
      }

      const { document } = await analyzeRes.json();

      // Step 2: Create project with analyzed data
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: formData.projectName,
          clientName: formData.clientName,
          assetClass: formData.assetClass,
          sourceFileName: formData.uploadedFile.name,
          sourceFileUrl: formData.uploadedFile.url,
          sourceFileMimeType: "application/pdf", // Assuming PDF based on service
          document,
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error || "Project creation failed");
      }

      const { project } = await createRes.json();
      setCurrentStep("done");
      setAnalyzing(false);

      // Navigate to the new project
      setTimeout(() => {
        router.push(`/projects/${project._id}`);
      }, 1000);
    } catch (err: unknown) {
      console.error("Error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      setCurrentStep("form");
      setAnalyzing(false);
    }
  };

  // Show progress indicator
  if (currentStep !== "form") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="max-w-md mx-auto text-center">


          {currentStep === "analyzing" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing with AI...
              </h3>
              <p className="text-gray-600">
                Our AI is extracting the document structure. This may take 10-30
                seconds.
              </p>
            </>
          )}

          {currentStep === "done" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Project Created Successfully!
              </h3>
              <p className="text-gray-600">Redirecting to your project...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.projectName}
            onChange={(e) =>
              setFormData({ ...formData, projectName: e.target.value })
            }
            placeholder="e.g., Q3 Due Diligence"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Client Name & Asset Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              placeholder="e.g., ABC Investment Fund"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Class <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.assetClass}
              onChange={(e) =>
                setFormData({ ...formData, assetClass: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select category</option>
              <option value="Venture Capital">Venture Capital</option>
              <option value="Private Equity">Private Equity</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Hedge Fund">Hedge Fund</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Document <span className="text-red-500">*</span>
          </label>

          {!formData.uploadedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition">
              <UploadButton
                endpoint="fileUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    const file = res[0];
                    setFormData(prev => ({
                      ...prev,
                      uploadedFile: {
                        name: file.name,
                        url: file.url,
                        key: file.key,
                        size: file.size,
                      }
                    }));
                    console.log("Files: ", res);
                    // alert("Upload Completed");
                  }
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                PDF, DOCX, DOC, or Images (Max 256MB)
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formData.uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(formData.uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, uploadedFile: null })}
                className="text-red-500 hover:text-red-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={analyzing}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {analyzing ? "Processing..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
