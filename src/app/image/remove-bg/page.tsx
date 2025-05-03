'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Download as DownloadIcon } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

const RemoveBgPage = () => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);

    if (!e.target.files?.length) {
      setError('未选择文件');

      return;
    }

    const file = e.target.files[0];

    // 文件类型过滤
    if (!file.type.startsWith('image/')) {
      setError('仅支持图片文件');

      return;
    }

    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }

    const newOriginalImageUrl = URL.createObjectURL(file);
    setOriginalImageUrl(newOriginalImageUrl);
  };

  // 处理拖拽事件
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(undefined);

    if (!e.dataTransfer.files.length) {
      setError('未选择文件');

      return;
    }

    const file = e.dataTransfer.files[0];

    if (!file.type.startsWith('image/')) {
      setError('仅支持图片文件');

      return;
    }

    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }

    // 获取原图 URL
    const newOriginalImageUrl = URL.createObjectURL(file);
    setOriginalImageUrl(newOriginalImageUrl);
  };

  // 处理清除按钮
  const handleClear = () => {
    setError(undefined);

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(undefined);
    }

    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
      setOriginalImageUrl(undefined);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理下载按钮
  const handleDownload = () => {
    if (!imageUrl) {
      return;
    }

    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'processed-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 去除背景
  const handleRemoveBackground = async () => {
    setError(undefined);

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    try {
      setLoading(true);

      const imageBlob = await removeBackground(originalImageUrl, {
        device: 'gpu',
      });
      const processedUrl = URL.createObjectURL(imageBlob);
      setImageUrl(processedUrl);
      setLoading(false);
    } catch (error) {
      console.error('Error removing background:', error);
      setError('抠图失败，请重试');
      handleClear();
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // 清除 URL 对象
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }

      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white text-center mb-3">智能抠图工具</h1>
        <p className="text-gray-600 dark:text-gray-300">
          轻松实现抠图效果，支持多种图片格式，快速处理，提升工作效率。
        </p>
      </div>
      {error && <div className="mb-4 text-center text-red-500 font-medium">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[600px]">
        {originalImageUrl ? (
          <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg p-8 border-gray-300 relative flex-col min-h-[300px] md:min-h-0">
            <img src={originalImageUrl} />
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 flex flex-col justify-center min-h-[300px] md:min-h-0
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              id="remove-bg"
            />
            <label
              htmlFor="remove-bg"
              className="cursor-pointer flex flex-col items-center justify-center p-6 space-y-3 h-full"
            >
              <Upload
                className={`h-16 w-16 ${
                  isDragging ? 'text-blue-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <div>
                <span className="text-blue-600">点击上传</span>
                <span className="text-gray-600">或拖拽文件到此区域</span>
              </div>
            </label>
          </div>
        )}

        <div className="border-2 border-dashed rounded-lg p-8 border-gray-300 flex items-center justify-center relative flex-col min-h-[300px] md:min-h-0">
          {imageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={imageUrl}
                style={{
                  backgroundColor: '#fff',
                  backgroundImage: `
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%)
          `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>
          ) : (
            <div className="text-gray-500 w-full h-full flex items-center justify-center relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
                  <span className="text-lg text-blue-600 animate-pulse">正在处理...</span>
                </div>
              )}
              <span>图片预览</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-end mt-6 md:space-x-4 space-y-4 md:space-y-0">
        <button
          onClick={handleClear}
          className={`px-6 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors duration-150 disabled:bg-gray-300 flex items-center justify-center md:justify-end gap-2 ${
            originalImageUrl && !loading ? 'cursor-pointer' : 'cursor-not-allowed'
          }`}
          disabled={!originalImageUrl || loading}
        >
          <Trash2 className="w-4 h-4" />
          清除图片
        </button>
        <button
          onClick={handleRemoveBackground}
          disabled={!originalImageUrl || loading}
          className={`px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-150 disabled:bg-blue-300 flex items-center justify-center md:justify-end gap-2 ${
            originalImageUrl && !loading ? 'cursor-pointer' : 'cursor-not-allowed'
          }`}
        >
          <Upload className="w-4 h-4" />
          去除背景
        </button>
        <button
          onClick={handleDownload}
          className={`px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-150 disabled:bg-blue-300 flex items-center justify-center md:justify-end gap-2 ${
            imageUrl ? 'cursor-pointer' : 'cursor-not-allowed'
          }`}
          disabled={!imageUrl}
        >
          <DownloadIcon className="w-4 h-4" />
          下载
        </button>
      </div>
    </div>
  );
};

export default RemoveBgPage;
