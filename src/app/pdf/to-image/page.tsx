'use client';

import { useRef } from 'react';

import UploadPdf, { UploadPdfRef } from '@/components/pdf-tools/upload';

const Pdf2Image = () => {
  const pdfUploaderRef = useRef<UploadPdfRef>(null);

  const onFileChange = (file: File) => {
    console.log('onFileChange', file);
  };

  return (
    <div className="flex justify-center h-full">
      <div className="mt-10">
        <UploadPdf ref={pdfUploaderRef} onFileChange={onFileChange}></UploadPdf>
      </div>
    </div>
  );
};

export default Pdf2Image;
