import { Container } from "@/components/ui/icons";
import { DayRailSkeleton, LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ResultsLoading() {
  return (
    <LoadingRegion label="Carregando resultados">
      <PageHeaderSkeleton filter />
      <Container className="space-y-10 py-10 sm:py-12">
        <section>
          <Skeleton className="mb-5 h-7 w-40" />
          <div className="space-y-2">
            <DayRailSkeleton groups={2} />
            <DayRailSkeleton groups={1} />
            <DayRailSkeleton groups={2} />
          </div>
        </section>
      </Container>
    </LoadingRegion>
  );
}
