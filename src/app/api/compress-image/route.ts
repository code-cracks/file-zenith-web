import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

import { CompressFileType, DEFAULT_COMPRESS_QUALITY } from '@/utils/image-compress';

const compressFile: Record<CompressFileType, (buffer: Buffer, quality: number) => Promise<Buffer>> =
  {
    jpg: (buffer: Buffer, quality: number) => {
      return sharp(buffer)
        .jpeg({ quality: Math.min(quality, 100), mozjpeg: true })
        .toBuffer();
    },
    png: (buffer: Buffer) => {
      return sharp(buffer).png({ compressionLevel: 9, quality: 100, effort: 10 }).toBuffer();
    },
    webp: (buffer: Buffer, quality: number) => {
      return sharp(buffer)
        .webp({ quality: Math.min(quality, 100) })
        .toBuffer();
    },
    avif: (buffer: Buffer, quality: number) => {
      return sharp(buffer)
        .avif({ quality: Math.min(quality, 100), effort: 9, chromaSubsampling: '4:2:0' })
        .toBuffer();
    },
  };

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const quality = parseInt(formData.get('quality') as string) || DEFAULT_COMPRESS_QUALITY;

    const results = await Promise.all(
      files.map(async (file) => {
        // 获取文件 buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        const fileType = (
          file.type.split('/')[-1] === 'jpeg' ? 'jpg' : file.type.split('/')[-1]
        ) as CompressFileType;

        const compressedBuffer: Buffer = await (compressFile[fileType] ?? compressFile.avif)(
          buffer,
          quality,
        );

        // 转换为 base64
        const base64 = compressedBuffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return {
          name: file.name,
          url: dataUrl,
          originalSize: buffer.length,
          compressedSize: compressedBuffer.length,
          type: file.type,
        };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('图片压缩失败:', error);

    return NextResponse.json({ error: '图片压缩失败' }, { status: 500 });
  }
}
