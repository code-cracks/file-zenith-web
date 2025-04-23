'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';

type LayoutMode = 'horizontal' | 'vertical' | 'grid' | 'free';

/**
 * 图片数据类型
 * @typedef {Object} ImageData
 * @property {string} id - 图片唯一标识符
 * @property {string} src - 图片源地址
 * @property {number} width - 图片宽度
 * @property {number} height - 图片高度
 * @property {number} [x] - 图片在拼接后的X坐标位置（可选）
 * @property {number} [y] - 图片在拼接后的Y坐标位置（可选）
 */
interface ImageData {
  id: string;
  src: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

/**
 * 拼接设置类型
 * @typedef {Object} StitchSettings
 * @property {LayoutMode} layout - 布局模式
 * @property {number} spacing - 图片间距
 * @property {string} backgroundColor - 背景颜色
 * @property {number} gridColumns - 网格列数
 * @property {number} outputQuality - 输出质量
 * @property {boolean} autoAdjust - 是否自动调整图片大小
 */
interface StitchSettings {
  layout: LayoutMode;
  spacing: number;
  backgroundColor: string;
  gridColumns: number;
  outputQuality: number;
  autoAdjust: boolean;
}

// 拼接后图片数据类型
/**
 * 拼接后图片数据类型
 * @typedef {Object} StitchedImageData
 * @property {string} id - 图片唯一标识符
 * @property {string} src - 图片源地址
 * @property {number} width - 图片宽度
 * @property {number} height - 图片高度
 */
interface StitchedImageData {
  id: string;
  src: string;
  width: number;
  height: number;
}

let stitchedImages: StitchedImageData = {
  id: Math.random().toString(36).substr(2, 9),
  src: '',
  width: 0,
  height: 0,
};

// 图片拼接预览缩放比例
let scaleX: number = 1;
let scaleY: number = 1;
// 主组件
const ImageStitcher = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [settings, setSettings] = useState<StitchSettings>({
    layout: 'horizontal',
    spacing: 10,
    backgroundColor: '#FFFFFF',
    gridColumns: 2,
    outputQuality: 0.9,
    autoAdjust: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsProcessing(true);

    const loaders = files.map((file) => {
      return new Promise<ImageData>((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          const img = new Image();
          console.log(e, 'e.target');

          img.onload = () => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              src: (e?.target!.result as string) || '',
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          };

          img.src = e?.target!.result as string;
        };

        reader.readAsDataURL(file);
      });
    });

    // 读取所有图片
    Promise.all(loaders).then((loadedImages) => {
      // setImages((prev) => [...prev, ...loadedImages]);
      arrangeImages([...images, ...loadedImages]);
      setIsProcessing(false);
    });
  };

  // 监听 images 变化执行排列
  useEffect(() => {
    if (images.length > 0) {
      arrangeImages(images);
    }
  }, [settings]); // 依赖 images 变化

  // 自动排列图片
  const arrangeImages = (imgs: ImageData[]) => {
    console.log(imgs, 'arrangeImages', settings.layout);

    if (settings.autoAdjust) {
      const adjustedImages = adjustImageSize(imgs); // 先调整尺寸
      imgs = adjustedImages; // 更新 imgs 为调整后的图片
    }

    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    let x = 0,
      y = 0;
    let lastX: number = 0;

    // 根据布局模式计算缩放比例
    switch (settings.layout) {
      case 'horizontal':
        let totalWidth =
          imgs.reduce((acc, img) => acc + img.width, 0) + (imgs.length - 1) * settings.spacing;
        let totalHeight = Math.max(...imgs.map((img) => img.height)) + settings.spacing;
        scaleX = containerWidth / totalWidth;
        scaleY = containerHeight / totalHeight;

        break;
      case 'vertical':
        let totalHeightV =
          imgs.reduce((acc, img) => acc + img.height, 0) + (imgs.length - 1) * settings.spacing;
        let totalWidthV = Math.max(...imgs.map((img) => img.width)) + settings.spacing;
        scaleX = containerWidth / totalWidthV;
        scaleY = containerHeight / totalHeightV;
        break;
      case 'grid':
        let totalHeightGrid = 0;
        let totalWidthGrid = 0;
        let currentRowMaxHeight = 0;
        let currentRowWidth = 0;
        let currentRowMaxWidth = 0;
        let itemsInCurrentRow = 0;

        images.forEach((image) => {
          currentRowMaxHeight = Math.max(currentRowMaxHeight, image.height);
          currentRowWidth = currentRowWidth + image.width;
          totalWidthGrid = Math.max(totalWidthGrid, currentRowWidth);
          itemsInCurrentRow++;

          // 当一行填满时，累加高度并重置
          if (itemsInCurrentRow === settings.gridColumns) {
            totalHeightGrid += currentRowMaxHeight + settings.spacing * (settings.gridColumns - 1);
            currentRowMaxHeight = 0;
            currentRowWidth = 0;
            itemsInCurrentRow = 0;
          }

          // 最后一行处理
          if (image === images[images.length - 1]) {
            totalHeightGrid += currentRowMaxHeight + settings.spacing * (settings.gridColumns - 1);
            totalWidthGrid += currentRowMaxWidth + settings.spacing * (settings.gridColumns - 1);
          }
        });
        scaleX = containerWidth / totalWidthGrid;
        scaleY = containerHeight / totalHeightGrid;
        console.log(totalWidthGrid, 'totalWidthGrid', scaleX, containerWidth);
        stitchedImages.width = totalWidthGrid;
        stitchedImages.height = totalHeightGrid;
      default:
    }

    let currentRowMaxHeight = 0;
    const arranged = imgs.map((img, index) => {
      // 根据布局模式计算位置
      switch (settings.layout) {
        case 'horizontal':
          lastX = x + img.width + settings.spacing;

          let tempHorizontal = { ...img, x: x, y: 0 };
          x = lastX;

          return tempHorizontal;
        case 'vertical':
          let tempVertical = { ...img, x: 0, y: y };
          y += img.height + settings.spacing;

          return tempVertical;
        case 'grid':
          const col = index % settings.gridColumns;
          currentRowMaxHeight = Math.max(currentRowMaxHeight, img.height);

          let tempGrid = { ...img, x: x, y: y };
          x = x + img.width + settings.spacing;

          if (col === settings.gridColumns - 1) {
            x = 0;
            y += currentRowMaxHeight + settings.spacing;
            currentRowMaxHeight = 0;
          }

          return tempGrid;
        default:
          return img;
      }
    });

    setImages(arranged);
  };

  // 生成拼接后的图片
  const generateStitchedImage = async () => {
    // 新增校验
    if (images.length === 0) {
      alert('请先上传图片');

      return;
    }

    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    console.log(images, 'generateStitchedImage');

    // 计算总画布尺寸
    const { totalWidth, totalHeight } = images.reduce(
      (acc, img) => {
        if (settings.layout === 'horizontal') {
          acc.totalWidth += img.width + settings.spacing;
          acc.totalHeight = Math.max(acc.totalHeight, img.height);
        } else if (settings.layout === 'vertical') {
          acc.totalWidth = Math.max(acc.totalWidth, img.width);
          acc.totalHeight += img.height + settings.spacing;
        } else if (settings.layout === 'grid') {
          acc.totalWidth = stitchedImages.width;
          acc.totalHeight = stitchedImages.height;
        }

        return acc;
      },
      { totalWidth: 0, totalHeight: 0 },
    );

    canvas.width = totalWidth;
    canvas.height = totalHeight;
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // 绘制所有图片
    let drawX = 0,
      drawY = 0;

    for (const img of images) {
      const image = await loadImage(img.src);

      if (settings.layout === 'horizontal') {
        ctx.drawImage(image, drawX, 0, img.width, img.height);
        drawX += img.width + settings.spacing;
      } else if (settings.layout === 'vertical') {
        ctx.drawImage(image, 0, drawY, img.width, img.height);
        drawY += img.height + settings.spacing;
      } else if (settings.layout === 'grid') {
        console.log(img, 'img');
        ctx.drawImage(image, img.x ?? 0, img.y ?? 0, img.width, img.height);
      }
    }

    // 触发下载
    const link = document.createElement('a');
    link.download = `stitched-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', settings.outputQuality);
    link.click();
    setIsProcessing(false);
  };

  // 加载图片
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  };

  // 将图片根据布局模式进行大小的调整
  // 1. 当横向排列就让图片宽度等于容器宽度/特定值，保持高度不变/特定值
  // 2. 当纵向排列就让图片高度等于容器高度/特定值，保持宽度不变/特定值
  // 3. 当网格排列就让图片宽度等于特定值/第一张图片宽高
  const adjustImageSize = (imgs: ImageData[]): ImageData[] => {
    if (!containerRef.current) return imgs;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    switch (settings.layout) {
      case 'horizontal': {
        // 横向布局：等比例缩放图片高度到容器高度
        const targetHeight = containerHeight - settings.spacing * 2;

        return imgs.map((img) => {
          const aspectRatio = img.width / img.height;

          return {
            ...img,
            width: targetHeight * aspectRatio,
            height: targetHeight,
          };
        });
      }

      case 'vertical': {
        // 纵向布局：等比例缩放图片宽度到容器宽度
        const targetWidth = containerWidth - settings.spacing * 2;

        return imgs.map((img) => {
          const aspectRatio = img.height / img.width;

          return {
            ...img,
            width: targetWidth,
            height: targetWidth * aspectRatio,
          };
        });
      }

      case 'grid': {
        // 网格布局：等比例缩放图片宽度到网格单元格
        // 使用第一张图片的尺寸作为基准
        const baseWidth = imgs[0].width;
        const baseHeight = imgs[0].height;

        // 或使用特定值（例如300x300）
        // const baseWidth = 300;
        // const baseHeight = 300;

        return imgs.map((img) => {
          // 计算保持宽高比的缩放比例
          const widthRatio = baseWidth / img.width;
          const heightRatio = baseHeight / img.height;
          const scale = Math.min(widthRatio, heightRatio);

          return {
            ...img,
            width: img.width * scale,
            height: img.height * scale,
          };
        });
      }

      default:
        return imgs;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-6">
        {/* 左侧操作面板 */}
        <div className="w-1/4 bg-gray-50 p-4 rounded-lg">
          <div className="mb-6">
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="stitch-upload"
              data-testid="upload-button"
            />
            <label
              htmlFor="stitch-upload"
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <span className="text-sm">点击上传图片</span>
              <span className="text-xs text-gray-500">支持多选</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="layout-mode" className="block text-sm font-medium mb-2">
                布局模式
              </label>
              <select
                value={settings.layout}
                id="layout-mode"
                onChange={(e) =>
                  setSettings((s) => ({ ...s, layout: e.target.value as LayoutMode }))
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="horizontal" aria-labelledby="layout-mode">
                  横向拼接
                </option>
                <option value="vertical" aria-labelledby="layout-mode">
                  纵向拼接
                </option>
                <option value="grid" aria-labelledby="layout-mode">
                  网格布局
                </option>
              </select>
            </div>

            {settings.layout === 'grid' && (
              <div>
                <label htmlFor="grid-columns" className="block text-sm font-medium mb-2">
                  网格列数
                </label>
                <input
                  id="grid-columns"
                  type="number"
                  value={settings.gridColumns}
                  onChange={(e) => setSettings((s) => ({ ...s, gridColumns: +e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  min="1"
                  max="6"
                />
              </div>
            )}
            {/* 自动调整开关 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">自动尺寸调整</span>
              <button
                onClick={() => setSettings((s) => ({ ...s, autoAdjust: !s.autoAdjust }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
        ${settings.autoAdjust ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform 
        ${settings.autoAdjust ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">图片间距</label>
              <input
                type="range"
                value={settings.spacing}
                onChange={(e) => setSettings((s) => ({ ...s, spacing: +e.target.value }))}
                min="0"
                max="50"
                className="w-full"
              />
              <span className="text-xs text-gray-500">{settings.spacing}px</span>
            </div>
            <button
              data-testid="generate-btn"
              onClick={generateStitchedImage}
              disabled={isProcessing || !images.length}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {isProcessing ? '生成中...' : '生成拼接图片'}
            </button>
          </div>
        </div>

        {/* 右侧预览区域 */}
        <div className="flex-1 bg-white  rounded-lg border">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{
              width: '100%',
              height: '1200px',
              backgroundColor: settings.backgroundColor,
            }}
          >
            {images.map((img, index) => (
              <img
                key={img.id}
                src={img.src}
                className="absolute object-contain shadow-lg"
                style={{
                  left: (img.x ?? 0) * scaleX,
                  top: (img.y ?? 0) * scaleY,
                  width: img.width * scaleX,
                  height: img.height * scaleY,
                }}
                alt={`Image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageStitcher;
