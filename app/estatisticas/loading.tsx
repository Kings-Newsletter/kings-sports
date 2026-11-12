import { Container } from "@/components/ui/icons";
import { LoadingRegion, PageHeaderSkeleton, StatBoardSkeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <LoadingRegion label="Carregando estatísticas">
      <PageHeaderSkeleton filter />
      <Container className="py-10 sm:py-12">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <StatBoardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </LoadingRegion>
  );
}
