import { Container } from "@/components/ui/icons";
import {
  LoadingRegion,
  PersonGridSkeleton,
  ProfileHeroSkeleton,
  SectionHeadingSkeleton,
  StatStripSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

export default function ConstructorLoading() {
  return (
    <LoadingRegion label="Carregando a equipe">
      <ProfileHeroSkeleton />
      <Container className="space-y-10 py-10 sm:py-12">
        <section>
          <SectionHeadingSkeleton />
          <StatStripSkeleton />
        </section>
        <section>
          <SectionHeadingSkeleton />
          <PersonGridSkeleton count={2} className="grid grid-cols-2 gap-3 sm:max-w-md" />
        </section>
        <section>
          <SectionHeadingSkeleton />
          <TableSkeleton rows={6} columns={5} />
        </section>
      </Container>
    </LoadingRegion>
  );
}
