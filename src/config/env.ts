import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  ygoprodeck: {
    baseUrl: process.env.YGOPRODECK_BASE_URL ?? 'https://db.ygoprodeck.com/api/v7',
    maxConcurrent: Number(process.env.YGOPRODECK_MAX_CONCURRENT ?? 5),
    minTimeMs: Number(process.env.YGOPRODECK_MIN_TIME_MS ?? 100),
  },

  cardCacheTtlSeconds: Number(process.env.CARD_CACHE_TTL ?? 172800), // 2 dias, conforme guia da API

  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME'),
    apiKey: required('CLOUDINARY_API_KEY'),
    apiSecret: required('CLOUDINARY_API_SECRET'),
    folder: process.env.CLOUDINARY_FOLDER ?? 'yugioh-tcg',
  },
} as const;
