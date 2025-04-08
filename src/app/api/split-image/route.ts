import sharp from 'sharp';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('image') as File;
    const rows = Number(data.get('rows'));
    const columns = Number(data.get('columns'));

    if (!file || !rows || !columns) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Invalid image buffer' }, { status: 400 });
    }

    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: 'Invalid image metadata' }, { status: 400 });
    }

    console.log('Processing image:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      rows,
      columns,
    });

    const pieces: string[] = [];
    const width = metadata.width;
    const height = metadata.height;
    const pieceWidth = Math.floor(width / columns);
    const pieceHeight = Math.floor(height / rows);

    if (pieceWidth <= 0 || pieceHeight <= 0) {
      return NextResponse.json({ error: 'Invalid piece dimensions' }, { status: 400 });
    }

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        const left = j * pieceWidth;
        const top = i * pieceHeight;
        const currentWidth = j === columns - 1 ? width - left : pieceWidth;
        const currentHeight = i === rows - 1 ? height - top : pieceHeight;

        try {
          const piece = await image
            .clone()
            .extract({
              left,
              top,
              width: currentWidth,
              height: currentHeight,
            })
            .toBuffer();

          pieces.push(`data:image/${metadata.format};base64,${piece.toString('base64')}`);
        } catch (err) {
          console.error('Error processing piece:', { i, j, err });
          throw err;
        }
      }
    }

    return NextResponse.json({ pieces });
  } catch (error) {
    console.error('Error processing image:', error);

    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
