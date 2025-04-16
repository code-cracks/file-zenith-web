import { load, Tags } from 'exifreader';

export type PhotoMetaData = Photo['metadata'] & { photoModel: string };

export class ExifMetadata {
  public make: string | undefined;
  public model: string | undefined;
  public lensModel: string | undefined;
  public focalLength: string | undefined;
  public fNumber: string | undefined;
  public iso: string | undefined;
  public exposureTime: string | undefined;
  public takenAt: string | undefined;

  constructor(metadata: Tags) {
    console.log(metadata);
    this.make = metadata?.Make?.description;
    this.model = metadata?.Model?.description;
    this.lensModel = this.model
      ? metadata?.LensModel?.description?.replace(this.model, '')?.trim()
      : metadata?.LensModel?.description;
    this.focalLength = metadata?.FocalLength?.description?.replace(' mm', 'mm');
    this.fNumber = metadata?.FNumber?.description?.substring(0, 5)?.replace('f/', 'F');
    this.iso = metadata?.ISOSpeedRatings?.value
      ? 'ISO' + metadata?.ISOSpeedRatings?.value?.toString()
      : undefined;
    this.exposureTime = metadata?.ExposureTime?.description
      ? metadata?.ExposureTime?.description + 's'
      : undefined;

    if (metadata?.DateTimeOriginal?.description) {
      const yyyymmdd = metadata.DateTimeOriginal.description.split(' ')[0].split(':').join('-');
      const hhmmss = metadata.DateTimeOriginal.description.split(' ')[1];
      this.takenAt = `${yyyymmdd} ${hhmmss}`;
    }
  }
}

/**
 * Represents a photo.
 */
export class Photo {
  private constructor() {}

  public file!: File;
  public metadata!: ExifMetadata;
  public image!: HTMLImageElement;
  public imageBase64!: string;

  /**
   * Creates a photo.
   * @param file - The file to create a photo from.
   * @returns The created photo.
   * @example
   * ```typescript
   * const photo = await Photo.create(file);
   * ```
   */
  public static async create(file: File): Promise<Photo> {
    const photo = new Photo();
    photo.file = file;
    photo.metadata = new ExifMetadata(await load(file));
    photo.image = new Image();
    photo.image.src = URL.createObjectURL(file);
    await new Promise((resolve) => (photo.image.onload = resolve));

    photo.imageBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    return photo;
  }

  /**
   * Returns the make of the camera that took the photo.
   * @example 'SONY'
   */
  public get make(): string {
    if (localStorage.getItem('showCameraMaker') === 'false') return '';

    return this.metadata.make || '';
  }

  /**
   * Returns the model of the camera that took the photo.
   * @example 'ILCE-7M3'
   */
  public get model(): string {
    if (localStorage.getItem('showCameraModel') === 'false') return '';

    return this.metadata.model || '';
  }

  /**
   * Returns the lens model of the camera that took the photo.
   * @example 'FE 24-105mm F4 G OSS'
   */
  public get lensModel(): string {
    if (localStorage.getItem('showLensModel') === 'false') return '';

    return this.metadata.lensModel || '';
  }

  /**
   * Returns the focal length of the camera that took the photo.
   * @example '24mm'
   */
  public get focalLength(): string {
    if (localStorage.getItem('focalLengthRatioMode') === 'true') {
      const focalLength = parseFloat(this.metadata?.focalLength?.replace(' mm', '') || '0');

      return (
        (focalLength * parseFloat(localStorage.getItem('focalLengthRatio') || '1')).toFixed(0) +
        'mm'
      );
    }

    return this.metadata.focalLength || '';
  }

  /**
   * Returns the F number of the camera that took the photo.
   * @example 'F4'
   */
  public get fNumber(): string {
    return this.metadata.fNumber || '';
  }

  /**
   * Returns the ISO of the camera that took the photo.
   * @example 'ISO100'
   */
  public get iso(): string {
    return this.metadata.iso || '';
  }

  /**
   * Returns the exposure time of the camera that took the photo.
   * @example '1/100s'
   */
  public get exposureTime(): string {
    return this.metadata.exposureTime || '';
  }

  /**
   * Returns the date the photo was taken.
   * @example '2021-01-01T00:00:00.000+09:00'
   */
  public get takenAt(): string {
    if (!this.metadata.takenAt) return '';

    const takenAt = new Date(this.metadata.takenAt!);

    return `${takenAt.getFullYear()}/${(takenAt.getMonth() + 1).toString().padStart(2, '0')}/${takenAt.getDate().toString().padStart(2, '0')} ${takenAt
      .getHours()
      .toString()
      .padStart(
        2,
        '0',
      )}:${takenAt.getMinutes().toString().padStart(2, '0')}:${takenAt.getSeconds().toString().padStart(2, '0')}`;
  }
}

const MAX_SIZE = 4096; // Mobile Safari has a maximum canvas size of 4096x4096

interface SandboxOptions {
  backgroundColor: string;
  padding: { top: number; bottom: number; left: number; right: number };
}

const renderPhoto = (image: Photo['image'], options: SandboxOptions): HTMLCanvasElement => {
  const { backgroundColor, padding } = options;
  const { top, bottom, left, right } = padding;

  const canvas = document.createElement('canvas');

  let imageWidth = null;
  let imageHeight = null;

  if (image.width > image.height) {
    imageWidth = MAX_SIZE - left - right;
    imageHeight = (image.height / image.width) * imageWidth;
  } else {
    imageHeight = MAX_SIZE - top - bottom;
    imageWidth = (image.width / image.height) * imageHeight;
  }

  canvas.width = imageWidth + left + right;
  canvas.height = imageHeight + top + bottom;

  const context = canvas.getContext('2d')!;
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, left, top, imageWidth, imageHeight);

  return canvas;
};

const loadLogo = (pathname: string): HTMLImageElement => {
  const image = new Image();
  image.src = pathname;

  return image;
};

const supportLogo = new Map<string, HTMLImageElement>();

const standMap = [
  'APPLE',
  'CANON',
  'CONTAX',
  'DJI',
  'EPSON',
  'FUJI',
  'GOLDSTAR',
  'HASSELBLAD',
  'LEICA',
  'LG',
  'MAMIYA',
  'NIKON',
  'OLYMPUS',
  'OM',
  'PANASONIC',
  'PENTAX',
  'PHASEONE',
  'RICOH',
  'SAMSUNG',
  'SIGMA',
  'SONY',
];

standMap.forEach((stand) => {
  supportLogo.set(`${stand}_LIGHT`, loadLogo(`/camera/light/${stand.toLowerCase()}.png`));
  supportLogo.set(`${stand}_DARK`, loadLogo(`/camera/dark/${stand.toLowerCase()}.png`));
});

export const renderPhotoCanvas = (
  image: Photo['image'],
  metadata: PhotoMetaData | null,
  darkMode: boolean,
) => {
  const PADDING_TOP = 0;
  const PADDING_BOTTOM = 0 + 300;
  const PADDING_LEFT = 0;
  const PADDING_RIGHT = 0;

  const BACKGROUND_COLOR = darkMode ? '#000000' : '#ffffff';

  if (!metadata) {
    return;
  }

  const { photoModel, make, model, takenAt, lensModel } = metadata;
  const text1 = photoModel;
  const text2 = `${make} ${model}`;
  const text3 = takenAt?.toString() || '';
  const text4 = lensModel?.toString() || '';

  const canvas = renderPhoto(image, {
    backgroundColor: BACKGROUND_COLOR,
    padding: {
      top: PADDING_TOP,
      right: PADDING_RIGHT,
      bottom: PADDING_BOTTOM,
      left: PADDING_LEFT,
    },
  });

  return renderBottomInfo(
    canvas,
    { make: make || '', model: model || '', text1, text2, text3, text4 },
    darkMode,
  );
};

const renderBottomInfo = (
  canvas: HTMLCanvasElement,
  {
    make,
    model,
    text1,
    text2,
    text3,
    text4,
  }: { make: string; model: string; text1: string; text2: string; text3: string; text4: string },
  darkMode: boolean = false,
) => {
  const SECONDARY_TEXT_FONT_WEIGHT = 300;
  const PADDING_BOTTOM = 0 + 300;

  const FONT_SIZE = 70;

  const PRIMARY_TEXT_COLOR = darkMode ? '#ffffff' : '#000000';
  const SECONDARY_TEXT_COLOR = darkMode ? '#888888' : '#333333';

  const context = canvas.getContext('2d')!;
  context.textBaseline = 'middle';

  // LEFT FIRST
  context.textAlign = 'left';

  // ISO, Focal Length, F-Number, Exposure Time
  context.font = `normal 500 ${FONT_SIZE}px Barlow`;
  context.fillStyle = PRIMARY_TEXT_COLOR;

  context.fillText(text1, FONT_SIZE, canvas.height - PADDING_BOTTOM / 2 - FONT_SIZE / 2);

  // Shot by
  context.font = `normal ${SECONDARY_TEXT_FONT_WEIGHT} ${FONT_SIZE}px Barlow`;
  context.fillStyle = SECONDARY_TEXT_COLOR;
  context.fillText(text3, FONT_SIZE, canvas.height - PADDING_BOTTOM / 2 + FONT_SIZE / 2);

  // RIGHT SECOND
  context.textAlign = 'right';

  // Maker, Model
  context.fillStyle = PRIMARY_TEXT_COLOR;
  context.font = `normal 500 ${FONT_SIZE}px Barlow`;

  const makerModelText = text2;
  const topWidth = context.measureText(makerModelText).width;
  context.fillText(
    makerModelText,
    canvas.width - FONT_SIZE,
    canvas.height - PADDING_BOTTOM / 2 - FONT_SIZE / 2,
  );

  // Lens Model
  context.fillStyle = SECONDARY_TEXT_COLOR;
  context.font = `normal ${SECONDARY_TEXT_FONT_WEIGHT} ${FONT_SIZE}px Barlow`;

  const lensModelText = text4;
  const bottomWidth = context.measureText(lensModelText).width;
  context.fillText(
    lensModelText,
    canvas.width - FONT_SIZE,
    canvas.height - PADDING_BOTTOM / 2 + FONT_SIZE / 2,
  );

  // DRAW LINE
  context.beginPath();
  context.moveTo(
    canvas.width - Math.max(topWidth, bottomWidth) - FONT_SIZE * 2,
    canvas.height - PADDING_BOTTOM / 2 - FONT_SIZE,
  );
  context.lineTo(
    canvas.width - Math.max(topWidth, bottomWidth) - FONT_SIZE * 2,
    canvas.height - PADDING_BOTTOM / 2 + FONT_SIZE,
  );
  context.strokeStyle = SECONDARY_TEXT_COLOR;
  context.lineWidth = 2;
  context.stroke();

  // DRAW ICON
  let TARGET_LOGO_HEIGHT = FONT_SIZE * 2;
  const TARGET_LOGO_WIDTH = 400;

  let logo: HTMLImageElement | undefined;

  standMap.forEach((stand) => {
    if (make?.toUpperCase().includes(stand) || model?.toUpperCase().includes(stand)) {
      logo = darkMode ? supportLogo.get(`${stand}_DARK`) : supportLogo.get(`${stand}_LIGHT`);
    }
  });

  if (logo) {
    let LOGO_WIDTH = (logo.width / logo.height) * TARGET_LOGO_HEIGHT;

    if (LOGO_WIDTH > TARGET_LOGO_WIDTH) {
      LOGO_WIDTH = TARGET_LOGO_WIDTH;
      TARGET_LOGO_HEIGHT = (logo.height / logo.width) * TARGET_LOGO_WIDTH;
    }

    context.drawImage(
      logo,
      canvas.width - Math.max(topWidth, bottomWidth) - FONT_SIZE * 2 - FONT_SIZE - LOGO_WIDTH,
      canvas.height - PADDING_BOTTOM / 2 - TARGET_LOGO_HEIGHT / 2,
      LOGO_WIDTH,
      TARGET_LOGO_HEIGHT,
    );
  }

  return canvas;
};

const clearCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0;
  canvas.height = 0;
};

export const renderPreview = (preview: HTMLCanvasElement, canvas: HTMLCanvasElement) => {
  const ctx = preview.getContext('2d')!;
  const ratio = canvas.width / canvas.height;

  if (preview.width > preview.height) {
    preview.width = 1000;
    preview.height = 1000 / ratio;
  } else {
    preview.height = 1000;
    preview.width = 1000 * ratio;
  }

  ctx.clearRect(0, 0, preview.width, preview.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, preview.width, preview.height);
  ctx.fillStyle = '#ffffff';
  ctx.drawImage(canvas, 0, 0, preview.width, preview.height);
  clearCanvas(canvas);
};

export const createDownloadFile = (preview: HTMLCanvasElement, canvas: HTMLCanvasElement) => {
  const _canvas = document.createElement('canvas');

  const ctx = _canvas.getContext('2d')!;
  const ratio = canvas.width / canvas.height;

  if (preview.width > preview.height) {
    preview.width = 1000;
    preview.height = 1000 / ratio;
  } else {
    preview.height = 1000;
    preview.width = 1000 * ratio;
  }

  ctx.clearRect(0, 0, preview.width, preview.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, preview.width, preview.height);
  ctx.fillStyle = '#ffffff';
  ctx.drawImage(canvas, 0, 0, preview.width, preview.height);
  clearCanvas(canvas);
};
