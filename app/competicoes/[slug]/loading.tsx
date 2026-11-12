import { Container } from "@/components/ui/icons";
import {
  FixtureGroupSkeleton,
  LoadingRegion,
  ProfileHeroSkeleton,
  SectionHeadingSkeleton,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

export default function CompetitionLoading() {
  return (
    <LoadingRegion label="Carregando a competição">
      <ProfileHeroSkeleton />
      <Container className="flex gap-2 overflow-hidden border-b border-line-soft py-3">
        {["w-20", "w-24", "w-28", "w-20", "w-24"].map((w, i) => (
          <Skeleton key={i} className={`h-8 shrink-0 ${w}`} />
        ))}
      </Container>
      <Container className="space-y-10 py-10 sm:py-12">
        <div className="grid gap-8 xl:grid-cols-2">
          <section>
            <SectionHeadingSkeleton />
            <FixtureGroupSkeleton rows={4} />
          </section>
          <section>
            <SectionHeadingSkeleton />
            <FixtureGroupSkeleton rows={4} />
          </section>
        </div>
        <section>
          <SectionHeadingSkeleton />
          <TableSkeleton rows={12} columns={9} />
        </section>
      </Container>
    </LoadingRegion>
  );
}
