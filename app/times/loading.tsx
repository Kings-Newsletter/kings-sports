import { Container } from "@/components/ui/icons";
import {
  CrestGridSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeadingSkeleton,
} from "@/components/ui/skeleton";

export default function TeamsLoading() {
  return (
    <LoadingRegion label="Carregando times">
      <PageHeaderSkeleton />
      <Container className="space-y-14 py-10 sm:py-12">
        {[0, 1].map((i) => (
          <section key={i}>
            <SectionHeadingSkeleton />
            <CrestGridSkeleton count={12} />
          </section>
        ))}
      </Container>
    </LoadingRegion>
  );
}
