import { Container } from "@/components/ui/icons";
import { LoadingRegion, PageHeaderSkeleton, PersonGridSkeleton } from "@/components/ui/skeleton";

export default function DriversLoading() {
  return (
    <LoadingRegion label="Carregando pilotos">
      <PageHeaderSkeleton />
      <Container className="py-10 sm:py-12">
        <PersonGridSkeleton count={10} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5" />
      </Container>
    </LoadingRegion>
  );
}
