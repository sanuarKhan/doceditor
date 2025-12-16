import { IDocument, IProject, ISection } from "@/types";
import mongoose, { Schema, Document, Model } from "mongoose";

// Section Schema (nested)
const SectionSchema = new Schema<ISection>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["section", "question"],
      required: true,
    },
    number: String,
    title: String,
    content: { type: String, default: "" },
    expanded: { type: Boolean, default: true },
    editable: { type: Boolean, default: true },
    children: [{ type: Schema.Types.Mixed }],
  },
  { _id: false }
);

// Document Schema (nested)
const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true },
    subtitle: String,
    sections: [SectionSchema],
  },
  { _id: false }
);

// Project Schema
const ProjectSchema = new Schema<IProject>(
  {
    projectName: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [200, "Project name cannot exceed 200 characters"],
    },
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      maxlength: [200, "Client name cannot exceed 200 characters"],
    },
    assetClass: {
      type: String,
      required: [true, "Asset class is required"],
      enum: [
        "Venture Capital",
        "Private Equity",
        "Real Estate",
        "Hedge Fund",
        "Other",
      ],
    },
    sourceFileName: {
      type: String,
      required: true,
    },
    sourceFileUrl: String,
    sourceFileMimeType: String,
    document: {
      type: DocumentSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ProjectSchema.index({ projectName: 1 });
ProjectSchema.index({ clientName: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ projectName: "text", clientName: "text" });

// Prevent model recompilation in development
const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
