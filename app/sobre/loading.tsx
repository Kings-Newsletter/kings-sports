import { Container } from "@/components/ui/icons";
import { LoadingRegion, PageHeaderSkeleton, ProseSkeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <LoadingRegion>
      <PageHeaderSkeleton />
      <Container className="max-w-3xl py-10 sm:py-12">
        <ProseSkeleton paragraphs={4} />
      </Container>
    </LoadingRegion>
  );
}
