import { Container } from "@/components/ui/icons";
import { ArticleGridSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function AnalysisLoading() {
  return (
    <LoadingRegion label="Carregando análises">
      <PageHeaderSkeleton />
      <Container className="py-10 sm:py-12">
        <ArticleGridSkeleton count={6} />
      </Container>
    </LoadingRegion>
  );
}
