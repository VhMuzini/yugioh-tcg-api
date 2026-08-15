import { buildApp } from './app';
import { env } from './config/env';

const app = buildApp();

app
  .listen({ port: env.port, host: env.host })
  .then((address) => {
    app.log.info(`yugioh-tcg-api rodando em ${address}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
