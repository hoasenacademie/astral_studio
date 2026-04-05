import ReportEditorStudio from "@/components/report-editor-studio";

export const dynamic = "force-dynamic";

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="studio-layout">
      <ReportEditorStudio reportId={id} />
    </main>
  );
}
