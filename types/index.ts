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

export interface IDocument {
  title: string;
  subtitle: string;
  sections: ISection[];
}

export interface IProject {
  _id: string;
  projectName: string;
  clientName: string;
  assetClass:
    | "Venture Capital"
    | "Private Equity"
    | "Real Estate"
    | "Hedge Fund"
    | "Other";
  sourceFileName: string;
  sourceFileUrl?: string;
  sourceFileMimeType?: string;
  document: IDocument;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnalysis {
  title: string;
  subtitle: string;
  sections: Array<{
    id: string;
    type: "section" | "question";
    number: string;
    title?: string;
    content: string;
    expanded?: boolean;
    editable?: boolean;
    children?: unknown[];
  }>;
}
