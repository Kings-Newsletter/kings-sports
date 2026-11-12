import { Container } from "@/components/ui/icons";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  PersonGridSkeleton,
  SectionHeadingSkeleton,
} from "@/components/ui/skeleton";

export default function PlayersLoading() {
  return (
    <LoadingRegion label="Carregando jogadores">
      <PageHeaderSkeleton />
      <Container className="space-y-14 py-10 sm:py-12">
        {[0, 1].map((i) => (
          <section key={i}>
            <SectionHeadingSkeleton />
            <PersonGridSkeleton count={6} />
          </section>
        ))}
      </Container>
    </LoadingRegion>
  );
}
