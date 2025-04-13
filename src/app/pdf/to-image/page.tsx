'use client';

import { useRef, useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { FileDown } from 'lucide-react';

import UploadPdf, { type UploadPdfRef } from '@/components/pdf-tools/upload';
import SinglePage from '@/components/pdf-tools/singlePage';
import { usePdfCompression } from '@/hooks/usePdfCompression';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const options = {
  cMapUrl: '/cmaps/',
};

const Pdf2Image = () => {
  const pdfUploaderRef = useRef<UploadPdfRef>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number | undefined>(undefined);
  const { openDialog, dialog } = usePdfCompression();

  const onFileChange = (file: File | null, buffer: ArrayBuffer | null) => {
    console.log('onFileChange', file);
    setPdfFile(file);
    setPdfBuffer(buffer);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('onDocumentLoadSuccess', numPages);
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.log('onDocumentLoadError', error);
  };

  const [itemWidth, setItemWidth] = useState(400);

  return (
    <div className="flex justify-center h-full flex-col items-center">
      <div className="mt-10">
        <UploadPdf ref={pdfUploaderRef} onFileChange={onFileChange}></UploadPdf>
      </div>
      {pdfFile && (
        <div>
          <div className="flex gap-2 justify-center mt-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setItemWidth(itemWidth + 100)}
            >
              放大
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setItemWidth(itemWidth - 100)}
            >
              缩小
            </button>
            {pdfBuffer && (
              <button
                onClick={() => openDialog(pdfBuffer, pdfFile.name)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                title="压缩PDF"
              >
                <FileDown className="size-5" />
                压缩
              </button>
            )}
          </div>
          <div className="w-full">
            <Document
              className="flex flex-wrap justify-center gap-4 select-none mt-10"
              file={pdfFile}
              options={options}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div>Loading...</div>}
            >
              {Array.from({ length: numPages || 0 }, (_, index) => (
                <SinglePage
                  key={index}
                  width={itemWidth}
                  index={index}
                  className="aspect-[1/1.414]"
                />
              ))}
            </Document>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
};

export default Pdf2Image;
