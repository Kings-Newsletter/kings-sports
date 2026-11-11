import type { Metadata } from "next";

import { SportFilter } from "@/components/sports/sport-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getTransfers } from "@/lib/data";
import { formatShortDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { getSport } from "@/lib/sports";
import type { Transfer } from "@/lib/types";

type SearchParams = Promise<{ sport?: string }>;

const typeLabel: Record<Transfer["type"], string> = {
  transferencia: "Transferência",
  emprestimo: "Empréstimo",
  livre: "Sem vínculo",
  renovacao: "Renovação",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { sport } = await searchParams;
  const current = getSport(sport);
  return buildMetadata({
    title: current ? `Transferências de ${current.name}` : "Transferências",
    description: "Mercado da bola e movimentações de atletas, com origem, destino e tipo de acordo.",
    path: current ? `/transferencias?sport=${current.slug}` : "/transferencias",
  });
}

export default async function TransfersPage({ searchParams }: { searchParams: SearchParams }) {
  const { sport } = await searchParams;
  const current = getSport(sport);
  const transfers = await getTransfers({ sport });

  return (
    <Container>
      <PageHeader
        section="/transferencias"
        title={current ? `Transferências de ${current.name}` : "Transferências"}
        description="Movimentações confirmadas. Rumor não entra: cada linha exige confirmação de clube ou fonte primária."
      >
        <SportFilter basePath="/transferencias" active={sport} />
      </PageHeader>

      <div className="py-10 sm:py-12">
        {transfers.length > 0 ? (
          <div className="overflow-hidden rounded-card border border-line-soft bg-ink-850/60 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line-soft text-[0.625rem] text-mist-500">
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Atleta
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      De
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Para
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Tipo
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Valor
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="border-b border-line-soft/60 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-mist-100">{transfer.player}</td>
                      <td className="px-4 py-3 text-mist-400">{transfer.from}</td>
                      <td className="px-4 py-3 text-mist-200">{transfer.to}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-mist-300">
                          {typeLabel[transfer.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-mist-400">{transfer.fee ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-xs text-mist-500">
                        {formatShortDate(transfer.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma transferência registrada"
            description="O mercado é acompanhado apenas com confirmação oficial. Anúncios de clube e documentos entram como fonte na linha."
          />
        )}
      </div>
    </Container>
  );
}
