import { Container } from "@/components/ui/icons";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeadingSkeleton,
  TileSkeleton,
} from "@/components/ui/skeleton";

export default function CompetitionsLoading() {
  return (
    <LoadingRegion label="Carregando competições">
      <PageHeaderSkeleton />
      <Container className="space-y-10 py-10 sm:py-12">
        {[6, 3].map((count, i) => (
          <section key={i}>
            <SectionHeadingSkeleton />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: count }, (_, j) => (
                <TileSkeleton key={j} />
              ))}
            </div>
          </section>
        ))}
      </Container>
    </LoadingRegion>
  );
}
