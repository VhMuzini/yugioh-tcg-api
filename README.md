# yugioh-tcg-api

API em Fastify + TypeScript que consulta a [YGOPRODeck API](https://ygoprodeck.com/api-guide/) e
re-hospeda as imagens das cartas no Cloudinary (a YGOPRODeck proíbe hotlink direto das imagens).

## Rotas

- `GET /cards` — busca cartas. Query params: `name`, `fname`, `type`, `race`, `attribute`,
  `archetype`, `num`, `offset` (mesma semântica do `cardinfo.php` da YGOPRODeck).
- `GET /cards/:id` — detalhe de uma carta pelo passcode (id).
- `GET /health` — healthcheck.

## Setup

```bash
cp .env.example .env
# preencher CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
npm install
npm run dev
```

## Decisões de arquitetura

- **Throttling contra a YGOPRODeck**: `bottleneck` limita as chamadas de saída (default 5
  concorrentes / 100ms de intervalo) pra nunca chegar perto do limite oficial de 20 req/s —
  estourar isso gera ban de 1h do seu IP.
- **Cache de respostas**: `node-cache` guarda o resultado cru do `cardinfo.php` por 2 dias
  (TTL configurável via `CARD_CACHE_TTL`), já que os dados de carta raramente mudam.
- **Imagens**: nunca servimos a URL da YGOPRODeck pro front. No primeiro acesso a uma carta,
  pedimos pro Cloudinary buscar a imagem na origem e guardar uma cópia permanente
  (`public_id` fixo + `overwrite:false`), então nas próximas vezes o Cloudinary serve do
  próprio cache dele sem bater na YGOPRODeck de novo.
- **Rate limit da nossa própria API**: `@fastify/rate-limit` protege o serviço de abuso
  externo, independente do throttling contra a YGOPRODeck.

## Próximos passos

- [ ] Testes de integração das rotas
- [ ] Endpoint de arquétipos / sets (se o front-livro egípcio precisar de navegação por coleção)
- [ ] Deploy via Docker/Portainer
