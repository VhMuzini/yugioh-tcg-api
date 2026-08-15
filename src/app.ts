import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { cardsRoutes } from './routes/cards.routes';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: env.corsOrigin,
  });

  // Protege a nossa própria API de abuso — não confundir com o
  // throttling que fazemos contra a YGOPRODeck em ygoprodeck.service.ts.
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.register(cardsRoutes);

  return app;
}
