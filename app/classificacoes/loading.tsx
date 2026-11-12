import { Container } from "@/components/ui/icons";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeadingSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

export default function StandingsLoading() {
  return (
    <LoadingRegion label="Carregando classificações">
      <PageHeaderSkeleton filter />
      <Container className="space-y-10 py-10 sm:py-12">
        {[12, 8].map((rows, i) => (
          <section key={i}>
            <SectionHeadingSkeleton />
            <TableSkeleton rows={rows} columns={9} />
          </section>
        ))}
      </Container>
    </LoadingRegion>
  );
}
