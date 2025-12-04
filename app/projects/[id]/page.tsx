import DocumentEditor from "@/components/DocumentEditor";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProjectEditorPage({ params }: PageProps) {
  return <DocumentEditor projectId={params.id} />;
}
