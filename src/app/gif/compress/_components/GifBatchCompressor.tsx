import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import GIF from 'gif.js';
import { parseGIF, decompressFrames } from 'gifuct-js';

// GIF文件信息接口
interface GifFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  frames: number;
  duration: number;
  width: number;
  height: number;
  processedBlob?: Blob;
  isProcessing: boolean;
  isProcessed: boolean;
  error?: string;
  compressionRate?: number;
  // 压缩选项
  options: {
    quality: number;
    scale: number;
    speed: number;
  };
}

// GIF批量压缩组件
export default function GifBatchCompressor() {
  // 状态管理
  const [gifFiles, setGifFiles] = useState<GifFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // 默认压缩选项
  const defaultOptions = {
    quality: 10, // 1-30, 数值越低质量越高
    scale: 1, // 缩放比例
    speed: 1, // 动画速度
  };

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查worker文件是否存在
  useEffect(() => {
    // 检查是否已经复制worker文件
    fetch('/gif.worker.js')
      .then((response) => {
        if (!response.ok) {
          console.warn('gif.worker.js未找到，部分功能可能无法正常工作');
          setError('缺少必要的worker文件，请确保已将gif.worker.js复制到public目录');
        }
      })
      .catch(() => {
        console.warn('无法检查gif.worker.js是否存在');
      });
  }, []);

  // 处理GIF文件上传
  const handleGifUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    // 处理每个文件
    const filePromises = Array.from(files).map(async (file) => {
      // 验证文件是GIF
      if (!file.type.startsWith('image/gif')) {
        return null; // 跳过非GIF文件
      }

      try {
        // 创建预览URL
        const preview = URL.createObjectURL(file);

        // 读取GIF信息
        const gifInfo = await getGifInfo(file);

        return {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          preview,
          frames: gifInfo.frames,
          duration: gifInfo.duration,
          width: gifInfo.width,
          height: gifInfo.height,
          isProcessing: false,
          isProcessed: false,
          options: { ...defaultOptions },
        };
      } catch (error) {
        console.error(`处理文件 ${file.name} 时出错:`, error);

        return null;
      }
    });

    const newFiles = (await Promise.all(filePromises)).filter(
      (file): file is GifFileInfo => file !== null,
    );

    setGifFiles((prev) => [...prev, ...newFiles]);
    setIsLoading(false);

    // 重置文件输入，允许重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 获取GIF信息
  const getGifInfo = async (
    file: File,
  ): Promise<{ frames: number; duration: number; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const gif = parseGIF(arrayBuffer);
          const frames = decompressFrames(gif, true);

          if (frames.length === 0) {
            reject(new Error('无法解析GIF帧'));

            return;
          }

          // 计算总时长
          const duration = frames.reduce((sum, frame) => sum + frame.delay, 0) * 10; // 转为毫秒

          resolve({
            frames: frames.length,
            duration,
            width: frames[0].dims.width,
            height: frames[0].dims.height,
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  // 生成唯一ID
  const generateId = () => {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  };

  // 删除GIF文件
  const removeFile = (id: string) => {
    setGifFiles((prev) => {
      const newFiles = prev.filter((file) => file.id !== id);
      // 释放预览URL
      const fileToRemove = prev.find((file) => file.id === id);

      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);

        if (fileToRemove.processedBlob) {
          URL.revokeObjectURL(URL.createObjectURL(fileToRemove.processedBlob));
        }
      }

      return newFiles;
    });
  };

  // 压缩单个GIF
  const compressGif = async (id: string) => {
    const gifFile = gifFiles.find((file) => file.id === id);
    if (!gifFile) return;

    setGifFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, isProcessing: true, error: undefined } : file,
      ),
    );

    try {
      // 获取文件的ArrayBuffer
      const arrayBuffer = await gifFile.file.arrayBuffer();

      // 解析GIF
      const gif = parseGIF(arrayBuffer);
      const frames = decompressFrames(gif, true);

      // 配置GIF生成器
      const gifJs = new GIF({
        workers: 4,
        quality: gifFile.options.quality,
        width: Math.round(gifFile.width * gifFile.options.scale),
        height: Math.round(gifFile.height * gifFile.options.scale),
        workerScript: '/gif.worker.js', // 需要从node_modules复制到public目录
        dither: false,
      });

      // 创建临时canvas用于绘制帧
      const canvas = document.createElement('canvas');
      canvas.width = gifFile.width;
      canvas.height = gifFile.height;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }

      // 创建用于缩放的canvas
      const scaleCanvas = document.createElement('canvas');
      scaleCanvas.width = Math.round(gifFile.width * gifFile.options.scale);
      scaleCanvas.height = Math.round(gifFile.height * gifFile.options.scale);

      const scaleCtx = scaleCanvas.getContext('2d');

      if (!scaleCtx) {
        throw new Error('无法创建缩放Canvas上下文');
      }

      // 处理每一帧
      for (const frame of frames) {
        // 创建ImageData
        const imageData = new ImageData(
          new Uint8ClampedArray(frame.patch),
          frame.dims.width,
          frame.dims.height,
        );

        // 清空canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 将帧绘制到canvas
        ctx.putImageData(imageData, frame.dims.left, frame.dims.top);

        // 清空缩放canvas
        scaleCtx.clearRect(0, 0, scaleCanvas.width, scaleCanvas.height);

        // 缩放绘制
        scaleCtx.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          canvas.height,
          0,
          0,
          scaleCanvas.width,
          scaleCanvas.height,
        );

        // 计算帧延迟时间（考虑速度因子）
        const delay = Math.round((frame.delay * 10) / gifFile.options.speed);

        // 添加到GIF
        gifJs.addFrame(scaleCanvas, { delay, copy: true });
      }

      // 生成GIF
      const blob = await new Promise<Blob>((resolve, reject) => {
        gifJs.on('finished', (blob) => {
          resolve(blob);
        });

        gifJs.on('error', (error) => {
          reject(error);
        });

        gifJs.render();
      });

      // 计算压缩率
      const compressionRate = Math.round((1 - blob.size / gifFile.size) * 100);

      // 更新状态
      setGifFiles((prev) =>
        prev.map((file) =>
          file.id === id
            ? {
                ...file,
                isProcessing: false,
                isProcessed: true,
                processedBlob: blob,
                compressionRate,
              }
            : file,
        ),
      );
    } catch (error) {
      console.error('压缩GIF出错:', error);

      // 更新错误状态
      setGifFiles((prev) =>
        prev.map((file) =>
          file.id === id
            ? {
                ...file,
                isProcessing: false,
                error: '处理失败：' + (error instanceof Error ? error.message : '未知错误'),
              }
            : file,
        ),
      );
    }
  };

  // 批量压缩所有GIF
  const compressAllGifs = async () => {
    setIsProcessingAll(true);

    const unprocessedFiles = gifFiles.filter((file) => !file.isProcessed && !file.isProcessing);

    // 并行处理多个文件，但限制并发数
    const concurrencyLimit = 2;
    const chunks = [];

    for (let i = 0; i < unprocessedFiles.length; i += concurrencyLimit) {
      chunks.push(unprocessedFiles.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map((file) => compressGif(file.id)));
    }

    setIsProcessingAll(false);
  };

  // 打包下载所有处理后的GIF
  const downloadAllProcessed = async () => {
    const processedFiles = gifFiles.filter((file) => file.isProcessed && file.processedBlob);

    if (processedFiles.length === 0) {
      setError('没有已处理完成的文件');

      return;
    }

    setIsZipping(true);

    try {
      const zip = new JSZip();

      // 添加所有处理后的文件到zip
      processedFiles.forEach((file) => {
        if (file.processedBlob) {
          // 使用原始文件名
          zip.file(file.name, file.processedBlob);
        }
      });

      // 生成zip
      const content = await zip.generateAsync({ type: 'blob' });

      // 下载zip
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_gifs_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();

      // 清理URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('创建ZIP文件出错:', error);
      setError('打包文件失败');
    }

    setIsZipping(false);
  };

  // 下载单个处理后的GIF
  const downloadSingleGif = (id: string) => {
    const file = gifFiles.find((file) => file.id === id);

    if (!file || !file.processedBlob) {
      return;
    }

    const url = URL.createObjectURL(file.processedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_${file.name}`;
    link.click();

    // 清理URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;

    if (files.length > 0) {
      const fakeEvent = {
        target: {
          files,
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await handleGifUpload(fakeEvent);
    }
  };

  // 更新单个GIF的选项
  const updateGifOptions = (id: string, options: Partial<GifFileInfo['options']>) => {
    setGifFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, options: { ...file.options, ...options } } : file,
      ),
    );
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';

    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 格式化时间
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;

    return `${seconds}.${milliseconds.toString().padStart(3, '0')}秒`;
  };

  // 返回组件UI
  return (
    <div className="w-full">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {/* 文件上传区域 */}
      <div
        className={`border-2 border-dashed p-6 rounded-lg mb-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleGifUpload}
          accept="image/gif"
          multiple
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mb-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          选择GIF文件
        </button>
        <p className="text-gray-600 dark:text-gray-300">或将GIF文件拖放到此处</p>
      </div>

      {/* 批量操作按钮 */}
      {gifFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={compressAllGifs}
            disabled={isProcessingAll || gifFiles.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {isProcessingAll ? '处理中...' : '批量压缩所有'}
          </button>
          <button
            onClick={downloadAllProcessed}
            disabled={isZipping || gifFiles.filter((f) => f.isProcessed).length === 0}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400"
          >
            {isZipping ? '打包中...' : '打包下载全部'}
          </button>
        </div>
      )}

      {/* 处理中提示 */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">正在加载文件，请稍候...</div>
      )}

      {/* 文件列表 */}
      <div className="space-y-4">
        {gifFiles.map((file) => (
          <div key={file.id} className="border rounded-lg p-4 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              {/* 文件信息 */}
              <div className="flex-1 min-w-[300px]">
                <h3 className="font-medium text-lg mb-2 dark:text-white">{file.name}</h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <p>
                    尺寸: {file.width} x {file.height}px
                  </p>
                  <p>帧数: {file.frames}</p>
                  <p>时长: {formatDuration(file.duration)}</p>
                  <p>大小: {formatFileSize(file.size)}</p>
                  {file.compressionRate !== undefined && <p>压缩率: {file.compressionRate}%</p>}
                </div>
              </div>

              {/* 参数调整 */}
              <div className="flex-1 min-w-[300px]">
                <h4 className="font-medium mb-2 dark:text-white">压缩参数</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 dark:text-gray-300">
                      质量 ({file.options.quality})
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={file.options.quality}
                      onChange={(e) =>
                        updateGifOptions(file.id, { quality: parseInt(e.target.value) })
                      }
                      disabled={file.isProcessing}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 dark:text-gray-300">
                      缩放 ({file.options.scale.toFixed(2)})
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.05"
                      value={file.options.scale}
                      onChange={(e) =>
                        updateGifOptions(file.id, { scale: parseFloat(e.target.value) })
                      }
                      disabled={file.isProcessing}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 dark:text-gray-300">
                      速度 ({file.options.speed.toFixed(1)}x)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={file.options.speed}
                      onChange={(e) =>
                        updateGifOptions(file.id, { speed: parseFloat(e.target.value) })
                      }
                      disabled={file.isProcessing}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col justify-between min-w-[120px]">
                <div className="space-y-2">
                  <button
                    onClick={() => compressGif(file.id)}
                    disabled={file.isProcessing}
                    className="w-full px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {file.isProcessing ? '处理中...' : file.isProcessed ? '重新压缩' : '压缩'}
                  </button>
                  {file.isProcessed && (
                    <button
                      onClick={() => downloadSingleGif(file.id)}
                      className="w-full px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      下载
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="w-full px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>

            {/* 错误信息 */}
            {file.error && (
              <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                {file.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
