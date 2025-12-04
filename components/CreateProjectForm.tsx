"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, FileText, CheckCircle } from "lucide-react";

export default function CreateProjectForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    projectName: "",
    clientName: "",
    assetClass: "",
    file: null as File | null,
  });

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "form" | "uploading" | "analyzing" | "done"
  >("form");
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFormData({ ...formData, file });
      setError("");
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, file: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.projectName ||
      !formData.clientName ||
      !formData.assetClass ||
      !formData.file
    ) {
      setError("Please fill all required fields");
      return;
    }

    try {
      // Step 1: Upload file
      setCurrentStep("uploading");
      setUploading(true);

      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "File upload failed");
      }

      const uploadData = await uploadRes.json();
      setUploading(false);

      // Step 2: Analyze document
      setCurrentStep("analyzing");
      setAnalyzing(true);

      const analyzeRes = await fetch("/api/projects/temp/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadData.filename,
          mimeType: uploadData.type,
        }),
      });

      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.error || "Document analysis failed");
      }

      const { document } = await analyzeRes.json();
      setAnalyzing(false);

      // Step 3: Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: formData.projectName,
          clientName: formData.clientName,
          assetClass: formData.assetClass,
          sourceFileName: uploadData.originalName,
          sourceFileUrl: uploadData.url,
          sourceFileMimeType: uploadData.type,
          document,
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error || "Project creation failed");
      }

      const { project } = await createRes.json();
      setCurrentStep("done");

      // Navigate to the new project
      setTimeout(() => {
        router.push(`/projects/${project._id}`);
      }, 1000);
      // eslint-disable-next-line
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to create project");
      setCurrentStep("form");
      setUploading(false);
      setAnalyzing(false);
    }
  };

  // Show progress indicator
  if (currentStep !== "form") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="max-w-md mx-auto text-center">
          {currentStep === "uploading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Uploading Document...
              </h3>
              <p className="text-gray-600">
                Please wait while we upload your file
              </p>
            </>
          )}

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

          {formData.file ? (
            <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formData.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-red-500 hover:text-red-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload document
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOCX, DOC, or Images (Max 10MB)
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
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
            disabled={uploading || analyzing}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {uploading || analyzing ? "Processing..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
