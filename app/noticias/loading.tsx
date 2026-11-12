import { Container } from "@/components/ui/icons";
import {
  ArticleCardSkeleton,
  ArticleGridSkeleton,
  ArticleListItemSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function NewsLoading() {
  return (
    <LoadingRegion label="Carregando notícias">
      <PageHeaderSkeleton filter />
      <Container className="pb-24 pt-10 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-line pb-5">
          <div className="space-y-3">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-10 w-72 max-w-full" />
          </div>
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10">
          <ArticleCardSkeleton featured />
          <div className="self-start">
            <Skeleton className="mb-1 h-6 w-36" />
            {Array.from({ length: 4 }, (_, i) => (
              <ArticleListItemSkeleton key={i} />
            ))}
          </div>
        </div>
        <Skeleton className="mb-6 mt-14 h-7 w-48" />
        <ArticleGridSkeleton count={3} />
      </Container>
    </LoadingRegion>
  );
}
