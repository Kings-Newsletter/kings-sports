import { Container } from "@/components/ui/icons";
import {
  LoadingRegion,
  SectionHeadingSkeleton,
  Skeleton,
  StatStripSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

function TeamSide() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Skeleton className="size-16 rounded-full sm:size-24" />
      <Skeleton className="h-5 w-24 sm:h-7 sm:w-40" />
    </div>
  );
}

export default function MatchLoading() {
  return (
    <LoadingRegion label="Carregando a partida">
      <section className="border-b border-line-soft bg-[radial-gradient(60rem_22rem_at_50%_0%,rgb(37_99_235_/_0.16),transparent_70%)]">
        <Container className="py-8 sm:py-12">
          <div className="mb-8 flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-10">
            <TeamSide />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-14 w-28 sm:h-20 sm:w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <TeamSide />
          </div>
        </Container>
      </section>
      <Container className="space-y-10 py-10 sm:py-12">
        <StatStripSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <SectionHeadingSkeleton />
            <TableSkeleton rows={6} columns={3} />
          </section>
          <section>
            <SectionHeadingSkeleton />
            <TableSkeleton rows={6} columns={3} />
          </section>
        </div>
      </Container>
    </LoadingRegion>
  );
}
