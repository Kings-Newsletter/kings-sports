# Deploy: Vercel + domínio na Cloudflare

O portal é publicado em **https://kingsnewsletter.com/sports**. O domínio
`kingsnewsletter.com` tem o DNS na Cloudflare (proxy ligado) e aponta para o
projeto da King's Newsletter na Vercel. O King's Sports é um **projeto Vercel
separado**; o projeto da Newsletter encaminha `/sports/*` para ele (multi-zone).

```
navegador ──► Cloudflare (DNS + proxy) ──► Vercel: projeto da Newsletter
                                              │  rewrite /sports/:path*
                                              ▼
                                           Vercel: projeto kings-sports
                                           (basePath /sports)
```

Por isso **não é preciso criar registro DNS novo** na Cloudflare: o tráfego de
`/sports` já chega à Vercel pelo domínio da Newsletter.

## 1. Criar o projeto na Vercel

1. **Add New → Project** e importe `Kings-Newsletter/kings-sports`.
2. Framework: Next.js (detectado; o `vercel.json` fixa `npm ci` e `npm run build`).
3. **Settings → Git → Production Branch:** `main`. A `dev` gera deploys de preview.
4. **Settings → Functions → Region:** use a mesma região do cluster MongoDB
   (ex.: `gru1` se o Atlas estiver em São Paulo, `iad1` se estiver em us-east-1).
   Função longe do banco deixa cada página mais lenta.
5. Não adicione domínio próprio a este projeto. Ele responde em
   `kings-sports.vercel.app/sports`, e quem abre a raiz desse endereço é
   redirecionado para `/sports`.

## 2. Variáveis de ambiente

Em **Settings → Environment Variables**:

| Variável | Production | Preview | Observação |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://kingsnewsletter.com/sports` | igual | Canonical, Open Graph, sitemap e robots |
| `NEXT_PUBLIC_BASE_PATH` | `/sports` | `/sports` | Precisa bater com o rewrite da Newsletter |
| `NEXT_PUBLIC_NEWSLETTER_URL` | `https://kingsnewsletter.com` | igual | |
| `NEXT_PUBLIC_EDITORIAL_EMAIL` | `editorial@kingsnewsletter.com` | igual | |
| `MONGODB_URI` | URI do cluster | URI do cluster | Marque como **Sensitive** |
| `MONGODB_DB` | `kings_newsletter` | `kings_newsletter_preview` | |
| `MONGODB_COLLECTION` | `sports` | `sports` | |

As `NEXT_PUBLIC_*` entram no build: depois de mudar alguma, faça **Redeploy**.

No MongoDB Atlas, libere o acesso da Vercel em **Network Access** (a Vercel não
tem IP fixo nos planos comuns, então normalmente é `0.0.0.0/0` com usuário de
banco só de leitura na coleção `sports`).

Pela CLI, se preferir:

```bash
vercel link
vercel env add MONGODB_URI production --sensitive
vercel env pull .env.local
```

## 3. Rewrite no projeto da Newsletter

No repositório da King's Newsletter (o projeto que responde por
`kingsnewsletter.com`), adicione o rewrite. Em `next.config`:

```ts
async rewrites() {
  return [
    { source: "/sports", destination: "https://kings-sports.vercel.app/sports" },
    { source: "/sports/:path*", destination: "https://kings-sports.vercel.app/sports/:path*" },
  ];
}
```

Ou, se ela usar `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/sports", "destination": "https://kings-sports.vercel.app/sports" },
    { "source": "/sports/:path*", "destination": "https://kings-sports.vercel.app/sports/:path*" }
  ]
}
```

Os assets do portal ficam em `/sports/_next/...`, então o mesmo rewrite cobre
JS, CSS e `next/image`. Garanta que a Newsletter não tenha nenhuma rota própria
começando com `/sports`, porque rotas do sistema de arquivos vencem o rewrite.

## 4. Cloudflare

O DNS de `kingsnewsletter.com` já está na Cloudflare apontando para a Vercel.
Confira só estes ajustes (todos no painel da zona):

- **SSL/TLS → Overview:** modo **Full (strict)**. "Flexible" causa loop de
  redirecionamento com a Vercel.
- **Speed → Optimization:** desligue **Rocket Loader** (reescreve os scripts e
  quebra a hidratação do React). Auto Minify não existe mais, mas se a zona
  tiver alguma transformação de HTML/JS, deixe desligada.
- **Caching:** não crie regra de "Cache Everything" para `/sports/*`. O HTML
  tem placar ao vivo e já sai com `Cache-Control` da Vercel; a Cloudflare
  respeita esses cabeçalhos. Assets em `/sports/_next/static/*` já são imutáveis.
- **Security → Bots:** se o "Bot Fight Mode" estiver ligado, verifique se ele
  não bloqueia o Googlebot nem as requisições internas da Vercel.
- **Registros DNS** (já devem existir, proxy laranja):
  - `kingsnewsletter.com` → `A 76.76.21.21` (ou o valor que a Vercel mostrar no projeto da Newsletter)
  - `www` → `CNAME cname.vercel-dns.com`

Se um dia o portal for para um subdomínio (ex.: `sports.kingsnewsletter.com`):
adicione o domínio no projeto kings-sports na Vercel, crie
`CNAME sports → cname.vercel-dns.com` na Cloudflare, defina
`NEXT_PUBLIC_BASE_PATH=""` e `NEXT_PUBLIC_SITE_URL=https://sports.kingsnewsletter.com`,
e faça redeploy.

## 5. Conferir depois do deploy

```bash
curl -sI https://kings-sports.vercel.app/sports
curl -sI https://kingsnewsletter.com/sports
curl -s https://kingsnewsletter.com/sports/robots.txt
curl -s https://kingsnewsletter.com/sports/sitemap.xml | head
```

- As duas primeiras devem responder `200`, com `server: cloudflare` e
  `x-vercel-id` na segunda.
- Abra `https://kingsnewsletter.com/sports` com o DevTools e confira que nenhum
  asset de `/sports/_next/` retorna 404.
- Crawlers só leem o `robots.txt` da raiz do domínio, então o
  `/sports/robots.txt` não tem efeito. Adicione ao `robots.txt` da Newsletter a
  linha `Sitemap: https://kingsnewsletter.com/sports/sitemap.xml`.
- No Google Search Console, envie `https://kingsnewsletter.com/sports/sitemap.xml`.
