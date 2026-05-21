import { FoundationPublicClient } from "@/widgets/foundation-public/foundation-public-client";

export default async function FoundationPublicRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FoundationPublicClient fundId={id} />;
}
