import { Container } from "@/components/ui/icons";
import {
  FixtureGroupSkeleton,
  LoadingRegion,
  PersonGridSkeleton,
  ProfileHeroSkeleton,
  SectionHeadingSkeleton,
} from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <LoadingRegion label="Carregando o time">
      <ProfileHeroSkeleton />
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
          <PersonGridSkeleton count={6} />
        </section>
      </Container>
    </LoadingRegion>
  );
}
