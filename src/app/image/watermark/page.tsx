'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, RotateCw } from 'lucide-react';

// 水印位置类型
type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'full';

// 水印设置接口
interface WatermarkSettings {
  text: string;
  position: WatermarkPosition;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  fontFamily: string;
  textShadow: boolean;
  fullScreenSpacing: number;
}

interface ImageWatermarkToolProps {
  initialSrc?: string;
  alt?: string;
  defaultWatermarkText?: string;
  width?: number;
  height?: number;
  onImageUpload?: (file: File) => void;
  allowCustomization?: boolean;
}

const positionClasses: Record<WatermarkPosition, string> = {
  'top-left': 'top-2.5 left-2.5',
  'top-right': 'top-2.5 right-2.5',
  'bottom-left': 'bottom-2.5 left-2.5',
  'bottom-right': 'bottom-2.5 right-2.5',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  full: 'inset-0',
};

function ImageWatermarkTool({
  initialSrc,
  alt = '上传的图片',
  defaultWatermarkText = 'File Zenith',
  width = 300,
  height = 200,
  onImageUpload,
  allowCustomization = true,
}: ImageWatermarkToolProps) {
  // 图片状态管理
  const [imageSrc, setImageSrc] = useState<string | null>(initialSrc || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 图片尺寸管理
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width, height });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width,
    height,
  });

  // 水印设置状态
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    text: defaultWatermarkText,
    position: 'bottom-right',
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.5,
    rotation: 0,
    fontFamily: 'Arial',
    textShadow: false,
    fullScreenSpacing: 150,
  });

  // 设置面板显示状态
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 暗色模式检测
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 检测系统颜色方案
  useEffect(() => {
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 图片加载调整尺寸
  useEffect(() => {
    if (imageSrc && imageRef.current) {
      const img = new Image();

      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // 保存原始尺寸
        setImageSize({ width: naturalWidth, height: naturalHeight });

        // 计算容器尺寸，保持原始宽高比
        let containerWidth = width;
        let containerHeight = height;

        // 如果提供了初始尺寸约束，根据图片比例调整
        if (width && height) {
          const maxWidth = Math.min(1200, window.innerWidth - 80);
          const maxHeight = 800;

          // 根据宽高比调整尺寸
          const aspectRatio = naturalWidth / naturalHeight;

          if (naturalWidth > naturalHeight) {
            // 横向图片
            containerWidth = Math.min(maxWidth, naturalWidth);
            containerHeight = containerWidth / aspectRatio;

            if (containerHeight > maxHeight) {
              containerHeight = maxHeight;
              containerWidth = containerHeight * aspectRatio;
            }
          } else {
            // 纵向图片
            containerHeight = Math.min(maxHeight, naturalHeight);
            containerWidth = containerHeight * aspectRatio;

            if (containerWidth > maxWidth) {
              containerWidth = maxWidth;
              containerHeight = containerWidth / aspectRatio;
            }
          }

          // 确保尺寸至少为100px
          containerWidth = Math.max(100, Math.round(containerWidth));
          containerHeight = Math.max(100, Math.round(containerHeight));
        }

        // 设置容器尺寸
        setContainerSize({ width: containerWidth, height: containerHeight });
      };

      img.src = imageSrc;
    } else {
      setContainerSize({ width, height });
    }
  }, [imageSrc, width, height]);

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      setIsLoading(false);

      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      setIsLoading(false);

      if (onImageUpload) {
        onImageUpload(file);
      }
    };

    reader.onerror = () => {
      setError('读取文件时出错');
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // 触发文件选择
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 处理水印设置变更
  const handleWatermarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWatermarkSettings((prev) => ({
      ...prev,
      [name]:
        name === 'opacity'
          ? parseFloat(value)
          : name === 'fontSize' || name === 'rotation' || name === 'fullScreenSpacing'
            ? parseInt(value)
            : value,
    }));
  };

  // 处理图片下载
  const handleDownload = () => {
    if (!imageSrc) return;
    setIsDownloading(true);

    try {
      // 创建Canvas绘制水印图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setError('浏览器不支持Canvas，无法生成图片');
        setIsDownloading(false);

        return;
      }

      // 使用原始图片尺寸
      canvas.width = imageSize.width;
      canvas.height = imageSize.height;

      // 加载图片
      const img = new Image();

      img.onload = () => {
        // 绘制原始图片
        ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);

        // 计算缩放因子 - 保证水印在原图上的比例与预览一致
        const imageRatio = imageSize.width / imageSize.height;
        const containerRatio = containerSize.width / containerSize.height;

        let scaleFactor;

        if (imageRatio > containerRatio) {
          scaleFactor = imageSize.width / containerSize.width;
        } else {
          scaleFactor = imageSize.height / containerSize.height;
        }

        // 设置字体大小并计算尺寸
        const scaledFontSize = Math.max(Math.round(watermarkSettings.fontSize * scaleFactor), 8);
        const fontFamily =
          watermarkSettings.fontFamily === 'Default' ? 'Arial' : watermarkSettings.fontFamily;
        ctx.font = `${scaledFontSize}px ${fontFamily}`;

        const textWidth = ctx.measureText(watermarkSettings.text).width;
        const textHeight = scaledFontSize;

        // 根据水印模式绘制水印
        if (watermarkSettings.position === 'full') {
          // 绘制多个水印 (全画面模式)
          drawFullScreenWatermarks(ctx, scaledFontSize, textWidth, textHeight, scaleFactor);
        } else {
          // 绘制单个水印 (定位模式)
          drawSingleWatermark(ctx, scaledFontSize, textWidth, textHeight);
        }

        // 导出图片并触发下载
        canvas.toBlob((blob) => {
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
            setError('生成图片失败');
          }

          setIsDownloading(false);
        }, 'image/png');
      };

      img.onerror = () => {
        setError('图片加载失败');
        setIsDownloading(false);
      };

      img.src = imageSrc;
    } catch (error) {
      console.error('下载失败:', error);
      setError('图片下载失败，请重试');
      setIsDownloading(false);
    }
  };

  // 绘制单个水印
  const drawSingleWatermark = (
    ctx: CanvasRenderingContext2D,
    scaledFontSize: number,
    textWidth: number,
    textHeight: number,
  ) => {
    // 根据位置计算坐标
    let x, y;
    const margin = 20; // 边缘留出的空间

    switch (watermarkSettings.position) {
      case 'top-left':
        x = margin;
        y = textHeight + margin;
        break;
      case 'top-right':
        x = imageSize.width - textWidth - margin;
        y = textHeight + margin;
        break;
      case 'bottom-left':
        x = margin;
        y = imageSize.height - margin;
        break;
      case 'bottom-right':
        x = imageSize.width - textWidth - margin;
        y = imageSize.height - margin;
        break;
      case 'center':
        x = (imageSize.width - textWidth) / 2;
        y = imageSize.height / 2 + textHeight / 2;
        break;
      default:
        x = imageSize.width - textWidth - margin;
        y = imageSize.height - margin;
    }

    // 绘制流程
    ctx.save(); // 保存当前状态

    // 应用旋转变换
    if (watermarkSettings.rotation !== 0) {
      const centerX = x + textWidth / 2;
      const centerY = y - textHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((watermarkSettings.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // 应用文字样式
    ctx.globalAlpha = watermarkSettings.opacity;
    ctx.fillStyle = watermarkSettings.color;

    // 添加文字阴影
    if (watermarkSettings.textShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = scaledFontSize / 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    // 绘制文本
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(watermarkSettings.text, x, y);

    ctx.restore(); // 恢复状态
  };

  // 绘制全屏水印
  const drawFullScreenWatermarks = (
    ctx: CanvasRenderingContext2D,
    scaledFontSize: number,
    textWidth: number,
    textHeight: number,
    scaleFactor: number,
  ) => {
    // 计算水印间距
    const scaledSpacing = Math.round(watermarkSettings.fullScreenSpacing * scaleFactor);

    ctx.save(); // 保存状态

    // 应用水印样式
    ctx.globalAlpha = watermarkSettings.opacity;
    ctx.fillStyle = watermarkSettings.color;

    // 文字阴影
    if (watermarkSettings.textShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = scaledFontSize / 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    ctx.textBaseline = 'middle';

    // 计算水印网格
    const rows = Math.ceil(imageSize.height / scaledSpacing);
    const cols = Math.ceil(imageSize.width / scaledSpacing);

    // 居中整个水印网格
    const offsetX = (imageSize.width - (cols - 1) * scaledSpacing) / 2;
    const offsetY = (imageSize.height - (rows - 1) * scaledSpacing) / 2;

    // 绘制网格水印
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * scaledSpacing;
        const y = offsetY + row * scaledSpacing;

        ctx.save();

        // 应用旋转
        ctx.translate(x, y);
        ctx.rotate((watermarkSettings.rotation * Math.PI) / 180);

        // 居中绘制文本
        ctx.fillText(watermarkSettings.text, -textWidth / 2, 0);

        ctx.restore(); // 恢复旋转前状态
      }
    }

    ctx.restore(); // 恢复初始状态
  };

  // 生成文件名
  const generateFilename = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');

    return `watermarked-${dateStr}${timeStr}.png`;
  };

  // 渲染全屏水印
  const renderFullScreenWatermark = () => {
    // 计算网格
    const { width, height } = containerSize;
    const gridSize = watermarkSettings.fullScreenSpacing;

    // 计算行列数并确保水印正确对齐
    const rows = Math.ceil(height / gridSize);
    const cols = Math.ceil(width / gridSize);

    // 计算实际使用的网格宽度和高度
    const gridWidth = cols * gridSize;
    const gridHeight = rows * gridSize;

    // 计算水印网格居中偏移量
    const offsetX = (width - gridWidth) / 2 + gridSize / 2;
    const offsetY = (height - gridHeight) / 2 + gridSize / 2;

    const watermarkElements = [];

    // 创建水印元素网格
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 使用更精确的定位方式，防止换行问题
        const left = offsetX + col * gridSize;
        const top = offsetY + row * gridSize;

        watermarkElements.push(
          <div
            key={`watermark-${row}-${col}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              color:
                isDarkMode && watermarkSettings.color === '#FFFFFF'
                  ? '#CCCCCC'
                  : watermarkSettings.color,
              fontSize: `${watermarkSettings.fontSize}px`,
              opacity: watermarkSettings.opacity,
              fontFamily:
                watermarkSettings.fontFamily === 'Default' ? 'Arial' : watermarkSettings.fontFamily,
              transform: `translate(-50%, -50%) rotate(${watermarkSettings.rotation}deg)`,
              textShadow: watermarkSettings.textShadow
                ? isDarkMode
                  ? '0px 0px 3px rgba(0,0,0,0.8)'
                  : '0px 0px 2px rgba(0,0,0,0.5)'
                : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {watermarkSettings.text}
          </div>,
        );
      }
    }

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {watermarkElements}
      </div>
    );
  };

  // 切换设置面板显示状态
  const toggleSettings = () => {
    setShowSettings((prev) => !prev);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setIsLoading(true);
      setError(null);

      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageSrc(result);
        setIsLoading(false);

        if (onImageUpload) {
          onImageUpload(file);
        }
      };

      reader.onerror = () => {
        setError('读取文件时出错');
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } else {
      setError('请上传图片文件');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* 左侧：图片上传与预览整合区域 */}
      <div className="w-full lg:w-3/5">
        <h3 className="text-lg font-medium mb-3 dark:text-gray-200">图片处理区</h3>

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
          {!imageSrc ? (
            /* 拖拽上传区域 */
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
                      isDragging
                        ? 'text-blue-500 animate-pulse'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                )}
                <div>
                  {isLoading ? (
                    <span className="text-blue-600 font-medium dark:text-blue-400">处理中...</span>
                  ) : (
                    <>
                      <span className="text-blue-600 font-medium dark:text-blue-400">点击上传</span>{' '}
                      <span className="text-gray-500 dark:text-gray-400">或拖拽图片到此区域</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  支持 JPEG, PNG, WEBP, GIF, BMP 格式
                </p>
              </label>
            </div>
          ) : (
            /* 图片预览与水印效果 */
            <div className="p-4 bg-gray-50 dark:bg-gray-800">
              {/* 尺寸信息 */}
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
                <span>
                  尺寸: {imageSize.width} x {imageSize.height}px
                </span>
                <button
                  onClick={triggerFileInput}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  disabled={isLoading || isDownloading}
                >
                  {isLoading ? '处理中...' : '更换图片'}
                </button>
              </div>

              {/* 图片和水印预览 */}
              <div className="flex justify-center mb-4">
                <div className="inline-block overflow-hidden bg-black border border-gray-300 dark:border-gray-700 max-w-full">
                  {isLoading ? (
                    <div
                      className="flex items-center justify-center"
                      style={{ width: containerSize.width, height: containerSize.height }}
                    >
                      <RotateCw className="h-10 w-10 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <img
                        ref={imageRef}
                        src={imageSrc}
                        alt={alt}
                        className="w-full h-full object-contain"
                      />

                      {/* 水印预览 */}
                      {watermarkSettings.position === 'full' ? (
                        renderFullScreenWatermark()
                      ) : (
                        <div
                          className={`absolute ${positionClasses[watermarkSettings.position]}`}
                          style={{
                            fontSize: `${watermarkSettings.fontSize}px`,
                            color:
                              isDarkMode && watermarkSettings.color === '#FFFFFF'
                                ? '#CCCCCC'
                                : watermarkSettings.color,
                            opacity: watermarkSettings.opacity,
                            fontFamily:
                              watermarkSettings.fontFamily === 'Default'
                                ? 'Arial'
                                : watermarkSettings.fontFamily,
                            lineHeight: 'normal',
                            whiteSpace: 'nowrap',
                            textShadow: watermarkSettings.textShadow
                              ? isDarkMode
                                ? '0px 0px 3px rgba(0,0,0,0.8)'
                                : '0px 0px 2px rgba(0,0,0,0.5)'
                              : undefined,
                            transform:
                              watermarkSettings.rotation !== 0
                                ? `rotate(${watermarkSettings.rotation}deg)`
                                : undefined,
                            transformOrigin: 'center',
                          }}
                        >
                          {watermarkSettings.text}
                        </div>
                      )}
                    </>
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
                    '下载带水印图片'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {error && <p className="text-red-500 dark:text-red-400 mt-2">{error}</p>}

        {/* 使用说明区 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">使用说明</h2>
          <ol className="list-decimal pl-5 space-y-2 dark:text-gray-300">
            <li>点击"上传图片"按钮选择您要添加水印的图片</li>
            <li>点击"显示设置"按钮展开水印设置面板</li>
            <li>根据需要调整水印文本、位置、颜色、间距、透明度、旋转角度等属性</li>
            <li>完成后，点击"下载图片"按钮保存带水印的图片</li>
          </ol>
        </div>
      </div>

      {/* 右侧：水印设置区域 */}
      <div className="w-full lg:w-2/5">
        {/* 水印设置标题和切换按钮 */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium dark:text-gray-200">水印设置</h3>

          {allowCustomization && (
            <button
              onClick={toggleSettings}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors duration-300 dark:bg-gray-600 dark:hover:bg-gray-700"
              type="button"
              disabled={isLoading || isDownloading}
            >
              {showSettings ? '隐藏设置' : '显示设置'}
            </button>
          )}
        </div>

        {/* 水印设置面板 - 在加载或下载时禁用所有输入 */}
        {allowCustomization && showSettings && (
          <div
            className={`rounded bg-gray-50 p-4 dark:bg-gray-800 dark:gray-700 ${isLoading || isDownloading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <div className="grid grid-cols-1 gap-3">
              {/* 水印文本设置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  水印文本
                </label>
                <input
                  type="text"
                  name="text"
                  value={watermarkSettings.text}
                  onChange={handleWatermarkChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* 水印位置选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  位置
                </label>
                <select
                  name="position"
                  value={watermarkSettings.position}
                  onChange={handleWatermarkChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="top-left">左上</option>
                  <option value="top-right">右上</option>
                  <option value="bottom-left">左下</option>
                  <option value="bottom-right">右下</option>
                  <option value="center">居中</option>
                  <option value="full">全画面</option>
                </select>
              </div>

              {/* 全屏水印间距 - 仅在全屏模式时显示 */}
              {watermarkSettings.position === 'full' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    水印间距: {watermarkSettings.fullScreenSpacing}px
                  </label>
                  <input
                    type="range"
                    name="fullScreenSpacing"
                    min="50"
                    max="300"
                    step="10"
                    value={watermarkSettings.fullScreenSpacing}
                    onChange={handleWatermarkChange}
                    className="w-full dark:accent-blue-500"
                  />
                </div>
              )}

              {/* 文字颜色选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  文字颜色
                </label>
                <input
                  type="color"
                  name="color"
                  value={watermarkSettings.color}
                  onChange={handleWatermarkChange}
                  className="w-full h-10"
                />
              </div>

              {/* 透明度调整 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  透明度: {watermarkSettings.opacity.toFixed(1)}
                </label>
                <input
                  type="range"
                  name="opacity"
                  min="0"
                  max="1"
                  step="0.1"
                  value={watermarkSettings.opacity}
                  onChange={handleWatermarkChange}
                  className="w-full dark:accent-blue-500"
                />
              </div>

              {/* 字体大小调整 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  字体大小: {watermarkSettings.fontSize}px
                </label>
                <input
                  type="range"
                  name="fontSize"
                  min="8"
                  max="36"
                  step="1"
                  value={watermarkSettings.fontSize}
                  onChange={handleWatermarkChange}
                  className="w-full dark:accent-blue-500"
                />
              </div>

              {/* 旋转角度调整 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  旋转角度: {watermarkSettings.rotation}°
                </label>
                <input
                  type="range"
                  name="rotation"
                  min="-180"
                  max="180"
                  step="5"
                  value={watermarkSettings.rotation}
                  onChange={handleWatermarkChange}
                  className="w-full dark:accent-blue-500"
                />
              </div>

              {/* 字体选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  字体
                </label>
                <select
                  name="fontFamily"
                  value={watermarkSettings.fontFamily}
                  onChange={handleWatermarkChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="Default">默认</option>
                  <option value="Arial">Arial</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Palatino">Palatino</option>
                  <option value="Garamond">Garamond</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Impact">Impact</option>
                </select>
              </div>

              {/* 文字阴影开关 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="textShadow"
                  name="textShadow"
                  checked={watermarkSettings.textShadow}
                  onChange={(e) =>
                    setWatermarkSettings((prev) => ({ ...prev, textShadow: e.target.checked }))
                  }
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label
                  htmlFor="textShadow"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  启用文字阴影
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 预览与下载说明 */}
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-300">
          <p className="font-medium">预览与下载说明：</p>
          <p className="mt-1">
            预览图是缩放后的效果，下载的图片会保持原始分辨率。某些差异（如文字位置）在下载的图片中会得到优化。
          </p>
        </div>
      </div>
    </div>
  );
}

const WatermarkPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full">
        {/* 页面标题与简介 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 dark:text-white">图片水印工具</h1>
          <p className="text-gray-600 dark:text-gray-300">
            上传图片并添加自定义水印，保护您的图片版权。支持调整水印文字、位置、颜色和透明度等。
          </p>
        </div>

        {/* 主工具区域 */}
        <div className="bg-white rounded-lg p-6 dark:bg-black">
          <ImageWatermarkTool width={400} height={300} />
        </div>
      </div>
    </div>
  );
};

export default WatermarkPage;
