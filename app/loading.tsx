import { Container } from "@/components/ui/icons";
import {
  ArticleCardSkeleton,
  DayRailSkeleton,
  LoadingRegion,
  SectionHeadingSkeleton,
  Skeleton,
  TableSkeleton,
  TileSkeleton,
} from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <LoadingRegion label="Carregando a página inicial">
      <section className="border-b border-line-soft">
        <Container className="grid gap-10 py-8 sm:py-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <SectionHeadingSkeleton />
            <DayRailSkeleton groups={2} />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-8" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-line-soft">
        <Container className="py-10 sm:py-14">
          <SectionHeadingSkeleton />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ArticleCardSkeleton featured />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </Container>
      </section>

      <section className="border-b border-line-soft">
        <Container className="py-10 sm:py-14">
          <SectionHeadingSkeleton />
          <div className="grid gap-6 lg:grid-cols-2">
            <TableSkeleton rows={10} />
            <TableSkeleton rows={10} />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-10 sm:py-14">
          <SectionHeadingSkeleton />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <TileSkeleton key={i} />
            ))}
          </div>
        </Container>
      </section>
    </LoadingRegion>
  );
}
