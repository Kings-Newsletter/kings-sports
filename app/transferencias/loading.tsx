import { Container } from "@/components/ui/icons";
import { LoadingRegion, PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function TransfersLoading() {
  return (
    <LoadingRegion label="Carregando transferências">
      <PageHeaderSkeleton filter />
      <Container className="py-10 sm:py-12">
        <TableSkeleton rows={10} columns={6} />
      </Container>
    </LoadingRegion>
  );
}
