import { Container } from "@/components/ui/icons";
import { ArticleGridSkeleton, LoadingRegion, ProseSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <LoadingRegion label="Carregando a matéria">
      <Container className="max-w-3xl pb-12 pt-10 sm:pt-14">
        <Skeleton className="h-4 w-48" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full sm:h-12" />
          <Skeleton className="h-10 w-3/4 sm:h-12" />
          <Skeleton className="mt-2 h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <div className="flex items-center gap-3 pt-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="mt-8 aspect-[4/3] w-full rounded-card sm:aspect-[3/2]" />
        <div className="mt-10">
          <ProseSkeleton paragraphs={5} />
        </div>
      </Container>
      <div className="border-t border-line-soft">
        <Container className="py-10 sm:py-12">
          <Skeleton className="mb-6 h-7 w-48" />
          <ArticleGridSkeleton count={3} />
        </Container>
      </div>
    </LoadingRegion>
  );
}
