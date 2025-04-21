'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, RotateCw } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Photo, ExifMetadata, renderPhotoCanvas, renderPreview } from '@/utils/camera';

export type PhotoMetaData = Photo['metadata'] & { photoModel: string };

function joinPhotoModel(metadata: ExifMetadata) {
  const { iso, focalLength, fNumber, exposureTime } = metadata;

  return `${iso} ${focalLength} ${fNumber} ${exposureTime}`;
}

function makePhotoMetaData(metadata: ExifMetadata) {
  const photoModel = joinPhotoModel(metadata);
  const _metadata = {
    ...metadata,
    photoModel,
  };

  return _metadata;
}

function FormInputItem({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div>
  );
}

function Instruction() {
  return (
    <div className="mt-8 bg-gray-50 rounded-lg p-6 dark:bg-gray-800">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">使用说明</h2>
      <ol className="list-decimal pl-5 space-y-2 dark:text-gray-300">
        <li>点击"上传照片"区域或拖拽选择您要添加水印的照片</li>
        <li>图片添加成功后水印设置区域出现照片参数修改区域</li>
        <li>根据需要调整照片参数，对修改结果不满意可进行重置</li>
        <li>完成后，点击"下载图片"按钮保存带水印的照片</li>
      </ol>
    </div>
  );
}

function UploadImagePrompt() {
  return (
    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-300">
      <p className="font-medium">请先上传需要添加水印的照片</p>
    </div>
  );
}

function PhotoWatermark() {
  const { theme } = useTheme();
  // 照片状态管理
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [overrideFormData, setOverrideFormData] = useState<PhotoMetaData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePreview = () => {
    if (photo?.image) {
      const canvas = renderPhotoCanvas(photo.image, overrideFormData, theme === 'dark');
      const preview = document.getElementById('preview') as HTMLCanvasElement;

      if (preview && canvas) {
        renderPreview(preview, canvas);
      }
    }
  };

  // 处理照片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      const photo = await Photo.create(file);

      if (photo?.metadata && Object.values(photo.metadata).every((value) => !value)) {
        setError('无法读取照片信息');

        return;
      }

      setPhoto(photo);
      setOverrideFormData(makePhotoMetaData(photo.metadata));
      updatePreview();
    } catch (e) {
      setIsLoading(false);
      setError('读取文件时出错');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 响应式更新预览图
  useEffect(() => {
    updatePreview();
  }, [theme, overrideFormData]);

  // 触发文件选择
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOverrideFormData((prev) => {
      if (prev) {
        return {
          ...prev,
          [name]: value,
        } as PhotoMetaData;
      }

      return null;
    });
  };

  // 生成文件名
  const generateFilename = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');

    return `watermarked-${dateStr}${timeStr}.jpeg`;
  };

  // 下载照片
  const handleDownload = async () => {
    if (!photo?.image) {
      return;
    }

    const canvas = renderPhotoCanvas(photo.image, overrideFormData, theme === 'dark');

    if (!canvas) {
      return;
    }

    // 导出照片并触发下载
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const filename = generateFilename();
          link.download = filename;
          link.href = url;
          link.click();
          // 清理资源
          setTimeout(() => URL.revokeObjectURL(url), 100);
        } else {
          setError('生成照片失败');
        }

        setIsDownloading(false);
      },
      'image/jpeg',
      0.8,
    );
  };

  const handleResetPhotoInfo = () => {
    setOverrideFormData(photo?.metadata ? makePhotoMetaData(photo?.metadata) : null);
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      try {
        setIsLoading(true);

        const photo = await Photo.create(file);
        setPhoto(photo);
        setOverrideFormData(makePhotoMetaData(photo.metadata));
        updatePreview();
      } catch (e) {
        setIsLoading(false);
        setError('读取文件时出错');
        console.error(e);
      } finally {
        setIsLoading(false);
        setError(null);
      }
    }
  };

  const formItems = [
    { name: 'photoModel', label: '照片参数' },
    { name: 'takenAt', label: '拍摄时间' },
    { name: 'model', label: '相机型号' },
    { name: 'lensModel', label: '镜头参数' },
  ] as const;

  const renderUploadArea = () => {
    return (
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
        ${
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02] dark:border-blue-400 dark:bg-blue-900/20'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="watermark-file-upload"
          className="flex flex-col items-center justify-center py-10 space-y-3 cursor-pointer"
        >
          {isLoading ? (
            <RotateCw className="h-16 w-16 text-blue-500 animate-spin" />
          ) : (
            <Upload
              className={`h-16 w-16 ${
                isDragging ? 'text-blue-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'
              }`}
            />
          )}
          <div>
            {isLoading ? (
              <span className="text-blue-600 font-medium dark:text-blue-400">处理中...</span>
            ) : (
              <>
                <span className="text-blue-600 font-medium dark:text-blue-400">点击上传</span>{' '}
                <span className="text-gray-500 dark:text-gray-400">或拖拽照片到此区域</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            支持 JPEG, PNG, WEBP, GIF, BMP 格式
          </p>
        </label>
      </div>
    );
  };

  const renderPhoto = () => {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800">
        {/* 尺寸信息 */}
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
          {photo?.image && (
            <span>
              尺寸: {photo?.image?.width} x {photo?.image?.height}px
            </span>
          )}
          <button
            onClick={triggerFileInput}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            disabled={isLoading || isDownloading}
          >
            {isLoading ? '处理中...' : '更换照片'}
          </button>
        </div>

        {/* 照片和水印预览 */}
        <div className="flex justify-center mb-4">
          <div className="relative inline-block overflow-hidden border border-gray-300 dark:border-gray-700 max-w-full">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <RotateCw className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
            ) : (
              <canvas
                id="preview"
                className="w-full mx-auto"
                style={{
                  maxWidth: '1000px',
                  backgroundColor: '#ffffff',
                }}
              />
            )}
          </div>
        </div>

        {/* 下载按钮 */}
        <div className="flex justify-center">
          <button
            onClick={handleDownload}
            disabled={isDownloading || isLoading}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors duration-300 disabled:bg-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-green-800"
          >
            {isDownloading ? (
              <>
                <RotateCw className="h-5 w-5 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              '下载带水印照片'
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderEditArea = () => {
    return (
      <div
        className={`rounded bg-gray-50 p-4 dark:bg-gray-800 dark:gray-700 ${isLoading || isDownloading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <div className="grid grid-cols-1 gap-3">
          {formItems.map(({ name, label }) => (
            <FormInputItem
              key={name}
              name={name}
              label={label}
              value={overrideFormData?.[name] || ''}
              onChange={handleFormInputChange}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleResetPhotoInfo}
            disabled={isDownloading || isLoading}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors duration-300 disabled:bg-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-green-800"
          >
            重置
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-3/5">
        <h3 className="text-lg font-medium mb-3 dark:text-gray-200">照片处理区</h3>

        <div className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            id="watermark-file-upload"
          />
          {/* 上传/预览区域整合 */}
          {photo ? renderPhoto() : renderUploadArea()}
        </div>

        {/* 错误信息 */}
        {error && <p className="text-red-500 dark:text-red-400 mt-2">{error}</p>}

        <Instruction />
      </div>

      {/* 右侧：水印设置区域 */}
      <div className="w-full lg:w-2/5">
        {/* 水印设置标题和切换按钮 */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium dark:text-gray-200">水印设置</h3>
        </div>

        {photo ? renderEditArea() : <UploadImagePrompt />}
      </div>
    </div>
  );
}

const PhotoWatermarkPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full">
        {/* 页面标题与简介 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 dark:text-white">照片水印工具</h1>
          <p className="text-gray-600 dark:text-gray-300">
            上传照片并添加自定义水印，保护您的照片版权。支持调整水印文字、位置、颜色和透明度等。
          </p>
        </div>

        {/* 主工具区域 */}
        <div className="bg-white rounded-lg p-6 dark:bg-black">
          <PhotoWatermark />
        </div>
      </div>
    </div>
  );
};

export default PhotoWatermarkPage;
