export type CompressFileType = 'jpg' | 'png' | 'webp' | 'avif';

export const DEFAULT_COMPRESS_QUALITY = 80;

export const imageCompressConfigs: Record<CompressFileType, { name: string; mimeType: string[] }> =
  {
    jpg: {
      name: 'JPG',
      mimeType: ['image/jpeg', 'image/jpg'],
    },
    png: {
      name: 'PNG',
      mimeType: ['image/png'],
    },
    webp: {
      name: 'WebP',
      mimeType: ['image/webp'],
    },
    avif: {
      name: 'AVIF',
      mimeType: ['image/avif'],
    },
  };
