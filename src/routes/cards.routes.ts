import type { FastifyInstance } from 'fastify';
import { ygoprodeckService } from '../services/ygoprodeck.service';
import { cloudinaryService } from '../services/cloudinary.service';
import type { Card, CardSummary, YgoCardRaw } from '../types/card.types';

// A YGOPRODeck pode devolver centenas de resultados numa busca fuzzy
// (ex: fname=magician). Re-hospedar imagem de todos de uma vez estoura
// o tempo de resposta na instância free do Render. Limitamos por
// padrão e deixamos o cliente paginar com num/offset.
const DEFAULT_LIST_SIZE = 24;
const MAX_LIST_SIZE = 24;

function toSummary(raw: YgoCardRaw, image: string): CardSummary {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    race: raw.race,
    archetype: raw.archetype,
    atk: raw.atk,
    def: raw.def,
    level: raw.level,
    attribute: raw.attribute,
    image,
  };
}

async function toCard(raw: YgoCardRaw): Promise<Card> {
  const images = await cloudinaryService.rehostCardImages(raw.id, raw.card_images[0]);

  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    frameType: raw.frameType,
    description: raw.desc,
    race: raw.race,
    archetype: raw.archetype,
    atk: raw.atk,
    def: raw.def,
    level: raw.level,
    attribute: raw.attribute,
    images,
    price: raw.card_prices?.[0],
  };
}

interface SearchQuerystring {
  name?: string;
  fname?: string;
  type?: string;
  race?: string;
  attribute?: string;
  archetype?: string;
  num?: number;
  offset?: number;
}

export async function cardsRoutes(app: FastifyInstance) {
  // GET /cards?fname=magician&type=Spell Card&num=24&offset=0
  // Retorna a versão leve da carta (CardSummary), com só a imagem pequena
  // já re-hospedada — pensado pra tela de listagem/livro.
  app.get<{ Querystring: SearchQuerystring }>('/cards', async (request, reply) => {
    const num = Math.min(request.query.num ?? DEFAULT_LIST_SIZE, MAX_LIST_SIZE);
    // A YGOPRODeck exige que "num" sempre venha acompanhado de "offset" —
    // mandar um sem o outro faz a API responder 400 (interpretado por nós
    // como "nenhum resultado"). Por isso sempre mandamos os dois juntos.
    const offset = request.query.offset ?? 0;
    const raw = await ygoprodeckService.searchCards({ ...request.query, num, offset });

    if (raw.length === 0) {
      return reply.status(404).send({ message: 'Nenhuma carta encontrada.' });
    }

    const page = raw.slice(0, num);

    const cards = await Promise.all(
      page.map(async (card) => {
        const image = await cloudinaryService.rehostSmallImage(card.id, card.card_images[0]);
        return toSummary(card, image);
      }),
    );

    return { data: cards, total: cards.length };
  });

  // GET /cards/:id
  // Retorna a carta completa, com as três variações de imagem
  // re-hospedadas — usado na tela de detalhe.
  app.get<{ Params: { id: string } }>('/cards/:id', async (request, reply) => {
    const raw = await ygoprodeckService.getCardById(request.params.id);

    if (!raw) {
      return reply.status(404).send({ message: 'Carta não encontrada.' });
    }

    return toCard(raw);
  });
}
