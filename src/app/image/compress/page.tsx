'use client';

import { useState, useRef } from 'react';
import { Upload, Download, RotateCw, Trash2, FileImage, SlidersHorizontal } from 'lucide-react';
import JSZip from 'jszip';
import clsx from 'clsx';

import { DEFAULT_COMPRESS_QUALITY, imageCompressConfigs } from '@/utils/image-compress';
import { formatFileSize } from '@/lib/utils';
import { downloadFileByUrl } from '@/utils/download-file';

export default function ImageCompress() {
  const [files, setFiles] = useState<File[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const [quality, setQuality] = useState(DEFAULT_COMPRESS_QUALITY);
  const [output, setOutput] = useState<
    { name: string; url: string; originalSize: number; compressedSize: number }[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportMimeType = Object.values(imageCompressConfigs).reduce(
    (a: string[], c) => [...a, ...c.mimeType],
    [],
  );

  const supportFileName = Object.values(imageCompressConfigs)
    .map((c) => c.name)
    .join('、');

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const newFiles = Array.from(e.target.files).filter((file) =>
      supportMimeType.includes(file.type),
    );

    setFiles((prev) => [...prev, ...newFiles]);
    setOutput([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理文件拖拽
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      supportMimeType.includes(file.type),
    );

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
      setOutput([]);
    }
  };

  // 删除选定的文件
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // 清空所有文件
  const clearFiles = () => {
    setFiles([]);
    setOutput([]);
  };

  // 压缩图片
  const compressImages = async () => {
    if (!files.length) return;

    setCompressing(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('quality', quality.toString());

      const response = await fetch('/api/compress-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('压缩失败');
      }

      const result = await response.json();
      setOutput(result);
    } catch (error) {
      console.error('压缩过程中出错:', error);
      alert('压缩过程中出错，请重试');
    } finally {
      setCompressing(false);
    }
  };

  // 批量下载所有压缩后的文件
  const downloadAllFiles = async () => {
    if (!output.length) return;

    if (output.length === 1) {
      downloadFileByUrl(output[0]);

      return;
    }

    const zip = new JSZip();

    try {
      for (const file of output) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(content);

      downloadFileByUrl({ url: zipUrl, name: '压缩图片.zip' });

      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error('下载文件时出错:', error);
      alert('下载文件时出错，请重试');
    }
  };

  // 计算压缩率
  const calculateCompressionRate = (original: number, compressed: number) => {
    return Math.round((compressed / original - 1) * 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 ">
      <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">图片压缩</h1>

      {/* 上传区域 */}
      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          {
            'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-[1.02]': isDragging,
            'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800':
              !isDragging,
          },
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept={supportMimeType.join(',')}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
        >
          <Upload
            className={clsx(
              'h-12 w-12 animate-pulse',
              isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500',
            )}
          />
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">点击上传</span>
            <span className="text-gray-500 dark:text-gray-400">或拖拽文件到此区域</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            支持 {supportFileName} 格式（单次最多20个文件）
          </p>
        </label>
      </div>

      {/* 压缩设置 */}
      {files.length > 0 && (
        <div className="mt-8 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold mb-2 flex items-center dark:text-white">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                压缩设置
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  压缩质量：{quality}%
                </span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-48"
                />
              </div>
            </div>

            <button
              onClick={compressImages}
              disabled={compressing || !files.length}
              className={clsx({
                'flex items-center px-6 py-3 rounded-md text-white': true,
                'bg-gray-400 dark:bg-gray-600 cursor-not-allowed': compressing || !files.length,
                'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700':
                  !compressing && files.length,
              })}
            >
              <RotateCw
                className={clsx({
                  'h-5 w-5 mr-2': true,
                  'animate-spin': compressing,
                })}
              />
              {compressing ? '压缩中...' : '开始压缩'}
            </button>
          </div>
        </div>
      )}

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="mt-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold dark:text-white">已上传的文件 ({files.length})</h2>
            <button
              onClick={clearFiles}
              className="flex items-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span>清空全部</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative border dark:border-gray-700 rounded-2xl overflow-hidden p-4 bg-white dark:bg-gray-800"
              >
                <div className="relative aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate dark:text-gray-200" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    title="删除"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 压缩结果 */}
      {output.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold dark:text-white">压缩结果 ({output.length})</h2>
            <button
              onClick={downloadAllFiles}
              className="flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Download className="h-4 w-4 mr-1" />
              <span>{output.length > 1 ? '下载全部 (ZIP)' : '下载'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {output.map((file, index) => {
              const compressionRate = calculateCompressionRate(
                file.originalSize,
                file.compressedSize,
              );

              return (
                <div
                  key={index}
                  className="relative border dark:border-gray-700 rounded-2xl overflow-hidden p-4 bg-white dark:bg-gray-800"
                >
                  <div className="relative aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden group">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadFileByUrl(file)}
                        className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors"
                        title="下载"
                      >
                        <Download className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm truncate flex-1 dark:text-gray-200" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 justify-between">
                      <span>{formatFileSize(file.originalSize)}</span>
                      <span>→</span>
                      <div className="flex items-center">
                        <span>{formatFileSize(file.compressedSize)}</span>
                        <span
                          className={clsx({
                            'ml-2 text-green-500 font-bold': true,
                            'text-red-500': compressionRate > 0,
                          })}
                        >
                          {compressionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-16 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center dark:text-white">
          <FileImage className="h-5 w-5 mr-2" />
          图片压缩说明
        </h2>
        <div className="space-y-4 dark:text-gray-300">
          <p>
            本工具支持压缩 {supportFileName} 格式的图片，通过调整压缩质量来平衡图片大小和清晰度。
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>压缩质量越高，图片越清晰，但文件大小也越大</li>
            <li>压缩质量越低，文件越小，但可能会影响图片清晰度</li>
            <li>建议根据实际需求调整压缩质量</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
