import { Container } from "@/components/ui/icons";
import {
  LoadingRegion,
  ProfileHeroSkeleton,
  SectionHeadingSkeleton,
  StatStripSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

export default function DriverLoading() {
  return (
    <LoadingRegion label="Carregando o piloto">
      <ProfileHeroSkeleton round />
      <Container className="space-y-10 py-10 sm:py-12">
        <section>
          <SectionHeadingSkeleton />
          <StatStripSkeleton count={4} />
        </section>
        <section>
          <SectionHeadingSkeleton />
          <TableSkeleton rows={8} columns={5} />
        </section>
      </Container>
    </LoadingRegion>
  );
}
