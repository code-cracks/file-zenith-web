import { PDFDocument } from 'pdf-lib';

// 压缩方案配置
export const compressionOptions = {
  light: {
    name: '轻度压缩',
    description: '保持较高质量，压缩率较低',
    options: {
      useObjectStreams: true,
      addDefaultPage: false,
      objectsStack: false,
      updateMetadata: true,
    },
  },
  medium: {
    name: '中度压缩',
    description: '平衡质量和大小',
    options: {
      useObjectStreams: true,
      addDefaultPage: false,
      objectsStack: true,
      updateMetadata: true,
    },
  },
  high: {
    name: '高度压缩',
    description: '最大压缩率，可能影响质量',
    options: {
      useObjectStreams: true,
      addDefaultPage: false,
      objectsStack: true,
      updateMetadata: true,
    },
  },
};

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  data: Uint8Array;
}

// 分析PDF压缩效果
export async function analyzePDFCompression(
  pdfBuffer: ArrayBuffer,
): Promise<Record<string, CompressionResult>> {
  const originalSize = pdfBuffer.byteLength;
  const results: Record<string, CompressionResult> = {};

  for (const [level, config] of Object.entries(compressionOptions)) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const compressedBytes = await pdfDoc.save(config.options);

    const compressedSize = compressedBytes.byteLength;
    const compressionRatio = (1 - compressedSize / originalSize) * 100;

    results[level] = {
      originalSize,
      compressedSize,
      compressionRatio,
      data: compressedBytes,
    };
  }

  return results;
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';

  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 下载压缩后的PDF
export function downloadCompressedPDF(result: CompressionResult, fileName: string): void {
  const blob = new Blob([result.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
