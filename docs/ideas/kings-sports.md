# King's Sports

## Problem Statement

Como dar ao torcedor brasileiro, num lugar só, **o que tem para ver hoje** em vários
esportes, **o que importou ontem** e **o dinheiro por trás do jogo** — com a voz da King's?

## Recommended Direction

**Um guia diário com uma seção-assinatura.** A home é o **Guia do dia**: jogos de hoje de
todos os esportes cobertos, com horário, onde assistir e status ao vivo. Logo abaixo,
**A rodada em 1 minuto**: resultados, tabela e três frases editoriais sobre o que importa.
Toda semana, um texto da série **Dinheiro em jogo** (transferências, SAFs, receitas,
salários), que liga o leitor de volta à King's Newsletter e ao `kings-economia`.

Sozinho, o guia seria um ge piorado; sozinha, a série seria um blog sem audiência. Juntos,
o guia traz o hábito diário e a série dá o motivo de existir.

Tecnicamente: tarefas agendadas (cron da Vercel) buscam os dados nas APIs, normalizam por
uma camada de adaptadores e gravam na **coleção `sports` do banco da King's Newsletter**
(mesmo cluster, coleção separada; o portal nunca toca nas coleções da Newsletter). As páginas só leem do banco, então os limites gratuitos aguentam qualquer
volume de visitas, e trocar de provedor não mexe nas páginas.

### Fontes de dados

| Esporte | Principal | Complemento | Reserva |
|---|---|---|---|
| Futebol (inclui Copa do Brasil, Europa League e Liga Portugal) | ESPN (sem chave) | Football-Data.co.uk (histórico, só resultados) | SportAPI |
| NBA | ESPN | — | SportAPI |
| NFL | ESPN | — | — |
| F1 | OpenF1 + Jolpica (sem chave) | — | — |
| Escudos | ESPN (junto com os dados) | — | TheSportsDB (chave pública `123`) |

Decisão de 10/11/2026: o dono do projeto (não comercial) autorizou usar a API pública não
documentada da ESPN como fonte principal. Ela não tem cota, cobre mais ligas e traz os
escudos. Risco: pode mudar sem aviso — por isso cada competição cai para a SportAPI quando
a ESPN falha.

Ressalvas do SportAPI: operado pela Semalt LLC, dados "de fontes públicas", sem licença das
ligas.

## Key Assumptions to Validate

- [ ] O SportAPI entrega Série A e Libertadores com placar correto e no horário — comparar
      uma rodada inteira com o ge.
- [ ] Os limites gratuitos cobrem um dia real (SportAPI: 7.000/mês ≈ 230/dia) — registrar as chamadas da coleta por uma semana.
- [ ] Você mantém "onde assistir" e as três frases da rodada — fazer duas semanas
      manualmente antes de investir em telas de edição.
- [ ] O leitor da Newsletter clica em esporte — link para um "Dinheiro em jogo" numa edição
      e medir os cliques.

## MVP Scope

**Entra**
- Esportes nível 1: futebol (Brasileirão A e B, Copa do Brasil, Libertadores,
  Sul-Americana e as principais ligas europeias).
- Esportes nível 2: F1, NBA e NFL, com placar, calendário e tabela.
- Guia do dia, A rodada em 1 minuto, série Dinheiro em jogo.
- Placar ao vivo com atualização automática e página de cada partida (lances, estatísticas,
  escalações), viabilizados pela ESPN sem custo.
- Estatísticas: artilharia, assistências e líderes da NBA e da NFL; fotos dos pilotos da F1.
- Páginas de resultados, calendário e classificações (já existem).
- Ingestão agendada para a coleção `sports` do MongoDB da Newsletter, com adaptadores por provedor.
- Identidade visual própria: o ouro King's como único laço com a marca; fonte condensada
  esportiva, números tabulares nos placares, nova cor de destaque, cartões em estilo de
  placar no lugar da moldura de papel.

**Sai do MVP**: tênis, vôlei, MMA e outros (nível 3, depois que o fluxo editorial rodar).

## Not Doing (and Why)

- Login e "meus times" — custa caro e só vale quando houver leitor recorrente.
- Edição por e-mail — decisão do produto: o portal é o produto.
- Odds, cotações e qualquer dado de aposta — risco de reputação para a marca King's e
  publicidade de apostas regulada no Brasil (Lei 14.790/2023). As colunas de odds do
  Football-Data.co.uk são descartadas na importação.
- Agregação de manchetes por RSS — não diferencia e cria dependência de terceiros.
- OpenLigaDB — só cobre futebol alemão, que o SportAPI já entrega.
- Tênis, MMA e outros esportes de atleta contra atleta — o formato da ESPN é diferente e
  exige um adaptador próprio; ficam para depois do MVP.

## Open Questions

- Quanto tempo por semana há para curadoria e texto? É a restrição real do projeto.
- Como `kingsnewsletter.com/sports` chega a este app: rewrite no projeto da Newsletter na
  Vercel ou projeto separado com domínio próprio?
- Haverá anúncios ou outra receita? Muda a prioridade de SEO e de "onde assistir".
