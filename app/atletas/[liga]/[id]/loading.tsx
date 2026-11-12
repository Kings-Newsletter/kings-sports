import { Container } from "@/components/ui/icons";
import {
  LoadingRegion,
  ProfileHeroSkeleton,
  SectionHeadingSkeleton,
  StatStripSkeleton,
  TableSkeleton,
  TileSkeleton,
} from "@/components/ui/skeleton";

export default function AthleteLoading() {
  return (
    <LoadingRegion label="Carregando o atleta">
      <ProfileHeroSkeleton round />
      <Container className="space-y-10 py-10 sm:py-12">
        <section>
          <SectionHeadingSkeleton />
          <StatStripSkeleton />
        </section>
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section>
            <SectionHeadingSkeleton />
            <TableSkeleton rows={6} columns={6} />
          </section>
          <aside className="space-y-3">
            <SectionHeadingSkeleton />
            <TileSkeleton />
            <TileSkeleton />
          </aside>
        </div>
      </Container>
    </LoadingRegion>
  );
}
