import { v2 as cloudinary } from 'cloudinary';
import Bottleneck from 'bottleneck';
import { env } from '../config/env';
import type { YgoCardImage } from '../types/card.types';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export interface RehostedImages {
  full: string;
  small: string;
  cropped: string;
}

// A instância free do Render tem só 0.1 CPU. Sem limitar a concorrência
// aqui, uma busca que retorna dezenas de cartas dispara dezenas de
// uploads simultâneos pro Cloudinary e estoura o timeout do proxy do
// Render (499 / Request Timeout).
const limiter = new Bottleneck({ maxConcurrent: 6 });

class CloudinaryService {
  /**
   * Pede pro Cloudinary buscar a imagem direto na URL da YGOPRODeck e
   * guardar uma cópia permanente. A partir daqui o front nunca mais
   * aponta pro domínio da YGOPRODeck, evitando o hotlink que o guia
   * da API proíbe.
   *
   * public_id fixo por carta + overwrite:false = o Cloudinary só baixa
   * de fato na primeira vez; nas próximas chamadas devolve o recurso
   * já existente sem nova requisição à origem.
   */
  private async uploadOnce(remoteUrl: string, publicId: string): Promise<string> {
    const result = await limiter.schedule(() =>
      cloudinary.uploader.upload(remoteUrl, {
        public_id: publicId,
        folder: env.cloudinary.folder,
        overwrite: false,
        unique_filename: false,
        resource_type: 'image',
      }),
    );
    return result.secure_url;
  }

  /** Usado na listagem: re-hospeda só a imagem pequena de uma carta. */
  async rehostSmallImage(cardId: number, image: YgoCardImage): Promise<string> {
    return this.uploadOnce(image.image_url_small, `card_${cardId}_small`);
  }

  /** Usado no detalhe: re-hospeda as três variações de uma carta. */
  async rehostCardImages(cardId: number, image: YgoCardImage): Promise<RehostedImages> {
    const [full, small, cropped] = await Promise.all([
      this.uploadOnce(image.image_url, `card_${cardId}_full`),
      this.uploadOnce(image.image_url_small, `card_${cardId}_small`),
      this.uploadOnce(image.image_url_cropped, `card_${cardId}_cropped`),
    ]);

    return { full, small, cropped };
  }
}

export const cloudinaryService = new CloudinaryService();
