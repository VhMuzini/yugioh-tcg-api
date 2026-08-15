import type { FastifyInstance } from 'fastify';
import { ygoprodeckService } from '../services/ygoprodeck.service';
import { cloudinaryService } from '../services/cloudinary.service';
import type { Card, YgoCardRaw } from '../types/card.types';

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
  // GET /cards?fname=magician&type=Spell Card&num=20&offset=0
  app.get<{ Querystring: SearchQuerystring }>('/cards', async (request, reply) => {
    const raw = await ygoprodeckService.searchCards(request.query);

    if (raw.length === 0) {
      return reply.status(404).send({ message: 'Nenhuma carta encontrada.' });
    }

    const cards = await Promise.all(raw.map(toCard));
    return { data: cards, total: cards.length };
  });

  // GET /cards/:id
  app.get<{ Params: { id: string } }>('/cards/:id', async (request, reply) => {
    const raw = await ygoprodeckService.getCardById(request.params.id);

    if (!raw) {
      return reply.status(404).send({ message: 'Carta não encontrada.' });
    }

    return toCard(raw);
  });
}
