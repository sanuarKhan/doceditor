import mongoose, { Schema, Document, Model } from "mongoose";

// Section Interface
export interface ISection {
  id: string;
  type: "section" | "question";
  number: string;
  title?: string;
  content: string;
  expanded?: boolean;
  editable?: boolean;
  children?: ISection[];
}

// Document Structure Interface
export interface IDocument {
  title: string;
  subtitle: string;
  sections: ISection[];
}

// Project Interface
export interface IProject extends Document {
  projectName: string;
  clientName: string;
  assetClass: string;
  sourceFileName: string;
  sourceFileUrl?: string;
  sourceFileMimeType?: string;
  document: IDocument;
  createdAt: Date;
  updatedAt: Date;
}

// Section Schema (nested)
const SectionSchema = new Schema<ISection>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["section", "question"],
      required: true,
    },
    number: { type: String, required: true },
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
