import { AdminNewsEditorPageContent } from "@/components/admin-news/AdminNewsEditorPageContent";

type AdminNewsEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminNewsEditPage({
  params,
}: AdminNewsEditPageProps) {
  const { id } = await params;

  return <AdminNewsEditorPageContent mode="edit" newsId={id} />;
}
