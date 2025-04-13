'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { File, Plus, X } from 'lucide-react';

import { formatFileSize } from '@/utils/sizeComputer';

export interface UploadPdfRef {
  file: File | null;
  pdfBuffer: ArrayBuffer | null;
  removePdfFile: () => void;
}

interface UploadPdfProps {
  onFileChange: (file: File | null, buffer: ArrayBuffer | null) => void;
}

const UploadPdf = forwardRef<UploadPdfRef, UploadPdfProps>(({ onFileChange }, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      try {
        const buffer = await selectedFile.arrayBuffer();
        setPdfBuffer(buffer);
        onFileChange(selectedFile, buffer);
      } catch (error) {
        console.error('Error reading file:', error);
        setFile(null);
        setPdfBuffer(null);
        onFileChange(null, null);
      }
    }
  };

  const removePdfFile = () => {
    setFile(null);
    setPdfBuffer(null);
    onFileChange(null, null);
  };

  useImperativeHandle(ref, () => ({
    file,
    pdfBuffer,
    removePdfFile,
  }));

  return (
    <div>
      {!file ? (
        <div className="h-[350px] relative text-center w-[275px]">
          <input
            type="file"
            className="cursor-pointer hidden"
            id="input-file-upload"
            accept=".pdf"
            onChange={uploadFile}
          />
          <label
            className="h-full flex items-center justify-center border-2 rounded-lg transition-all border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/30"
            htmlFor="input-file-upload"
          >
            <div className="cursor-pointer flex flex-col items-center space-y-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Plus className="size-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="pointer-events-none font-medium text-base text-gray-700">
                  点击上传或拖拽PDF文件
                </p>
                <p className="text-sm text-gray-500">支持单个PDF文件上传</p>
              </div>
            </div>
          </label>
        </div>
      ) : (
        <div className="w-[275px] p-4 border border-gray-200 rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out transform scale-100 opacity-100 animate-[fadeIn_0.3s_ease-in-out]">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-lg p-2">
              <File className="size-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={removePdfFile}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="size-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UploadPdf.displayName = 'UploadPdf';

export default UploadPdf;
