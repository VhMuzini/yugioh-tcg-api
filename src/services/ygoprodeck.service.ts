import Bottleneck from 'bottleneck';
import NodeCache from 'node-cache';
import { env } from '../config/env';
import type { CardInfoQuery, YgoCardRaw } from '../types/card.types';

// Respeita o limite oficial de 20 req/s por IP da YGOPRODeck.
// Ficamos com folga (default: 5 concorrentes, 100ms entre chamadas)
// pra nunca chegar perto do ban de 1h.
const limiter = new Bottleneck({
  maxConcurrent: env.ygoprodeck.maxConcurrent,
  minTime: env.ygoprodeck.minTimeMs,
});

// Cache em memória das respostas cruas do cardinfo.php.
// O próprio guia da API recomenda cache de ~2 dias, já que os dados
// das cartas raramente mudam.
const cache = new NodeCache({ stdTTL: env.cardCacheTtlSeconds });

class YgoprodeckService {
  private buildUrl(query: CardInfoQuery): string {
    const params = new URLSearchParams();
    if (query.name) params.set('name', query.name);
    if (query.fname) params.set('fname', query.fname);
    if (query.id) params.set('id', query.id);
    if (query.type) params.set('type', query.type);
    if (query.race) params.set('race', query.race);
    if (query.attribute) params.set('attribute', query.attribute);
    if (query.archetype) params.set('archetype', query.archetype);
    // Cuidado: usar "if (query.num)" quebra quando o valor é 0, já que
    // 0 é falsy em JS. offset=0 é um valor legítimo e comum (primeira
    // página), então checamos undefined explicitamente.
    if (query.num !== undefined) params.set('num', String(query.num));
    if (query.offset !== undefined) params.set('offset', String(query.offset));

    return `${env.ygoprodeck.baseUrl}/cardinfo.php?${params.toString()}`;
  }

  private cacheKey(query: CardInfoQuery): string {
    return JSON.stringify(query);
  }

  async searchCards(query: CardInfoQuery): Promise<YgoCardRaw[]> {
    const key = this.cacheKey(query);
    const cached = cache.get<YgoCardRaw[]>(key);
    if (cached) return cached;

    const url = this.buildUrl(query);

    const response = await limiter.schedule(() => fetch(url));

    // A YGOPRODeck retorna 400 quando a busca não encontra nada.
    if (response.status === 400) return [];

    if (!response.ok) {
      throw new Error(`YGOPRODeck respondeu ${response.status} para ${url}`);
    }

    const body = (await response.json()) as { data: YgoCardRaw[] };
    cache.set(key, body.data);
    return body.data;
  }

  async getCardById(id: string): Promise<YgoCardRaw | null> {
    const cards = await this.searchCards({ id });
    return cards[0] ?? null;
  }
}

export const ygoprodeckService = new YgoprodeckService();
