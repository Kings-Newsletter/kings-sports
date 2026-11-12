import { Container } from "@/components/ui/icons";
import { DayRailSkeleton, LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <LoadingRegion label="Carregando o calendário">
      <PageHeaderSkeleton filter />
      <Container>
        <div className="flex items-center justify-between gap-3 border-b border-line-soft py-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2 py-10">
          <DayRailSkeleton groups={2} />
          <DayRailSkeleton groups={1} />
          <DayRailSkeleton groups={2} />
        </div>
      </Container>
    </LoadingRegion>
  );
}
