import { ReactNode, useState } from 'react';

import { CompressionDialog } from '@/components/pdf-tools/compression-dialog';
import {
  CompressionResult,
  analyzePDFCompression,
  downloadCompressedPDF,
  compressionOptions,
} from '@/utils/pdfCompression';

type CompressionLevel = keyof typeof compressionOptions;

export interface UsePdfCompressionResult {
  isOpen: boolean;
  isLoading: boolean;
  results: Record<string, CompressionResult> | null;
  selectedLevel: CompressionLevel | null;
  openDialog: (buffer: ArrayBuffer, fileName: string) => Promise<void>;
  closeDialog: () => void;
  setSelectedLevel: (level: CompressionLevel) => void;
  downloadPdf: () => void;
  dialog: ReactNode;
}

export function usePdfCompression(): UsePdfCompressionResult {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Record<string, CompressionResult> | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CompressionLevel | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const openDialog = async (buffer: ArrayBuffer, fileName: string) => {
    setIsLoading(true);
    setIsOpen(true);
    setCurrentFileName(fileName);

    try {
      // 创建一个最小延迟的 Promise
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));

      // 并行执行分析和最小延迟
      const [compressionResults] = await Promise.all([analyzePDFCompression(buffer), minDelay]);

      setResults(compressionResults);
      setSelectedLevel('medium');
    } catch (error) {
      console.error('PDF compression analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeDialog = () => {
    setIsOpen(false);
    setResults(null);
    setSelectedLevel(null);
  };

  const downloadPdf = () => {
    if (!results || !selectedLevel || !currentFileName) return;
    downloadCompressedPDF(results[selectedLevel], currentFileName);
  };

  const dialog = (
    <CompressionDialog
      isOpen={isOpen}
      isLoading={isLoading}
      results={results}
      selectedLevel={selectedLevel}
      onClose={closeDialog}
      onLevelSelect={setSelectedLevel}
      onDownload={downloadPdf}
    />
  );

  return {
    isOpen,
    isLoading,
    results,
    selectedLevel,
    openDialog,
    closeDialog,
    setSelectedLevel,
    downloadPdf,
    dialog,
  };
}
