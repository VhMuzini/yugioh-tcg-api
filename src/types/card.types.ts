export interface YgoCardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface YgoCardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

export interface YgoCardRaw {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  race: string;
  archetype?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  card_images: YgoCardImage[];
  card_prices: YgoCardPrice[];
}

/**
 * Versão leve da carta, usada na listagem (/cards). Só re-hospeda a
 * imagem pequena, pra não estourar o tempo de resposta re-hospedando
 * 3 imagens de cada carta de um resultado com dezenas de itens.
 */
export interface CardSummary {
  id: number;
  name: string;
  type: string;
  race: string;
  archetype?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  image: string;
}

/**
 * Carta completa, usada no detalhe (/cards/:id), com as três imagens
 * já re-hospedadas no Cloudinary em vez do domínio da YGOPRODeck.
 */
export interface Card {
  id: number;
  name: string;
  type: string;
  frameType: string;
  description: string;
  race: string;
  archetype?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  images: {
    full: string;
    small: string;
    cropped: string;
  };
  price?: YgoCardPrice;
}

export interface CardInfoQuery {
  name?: string;
  fname?: string;
  id?: string;
  type?: string;
  race?: string;
  attribute?: string;
  archetype?: string;
  num?: number;
  offset?: number;
}
