'use client';

import { useState, useRef } from 'react';

const GridCutPage = () => {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [image, setImage] = useState<string | null>(null);
  const [splitImages, setSplitImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');

      return;
    }

    // 先重置状态
    setImage(null);
    setSplitImages([]);
    setImageLoaded(false);

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };

    reader.readAsDataURL(file);
  };

  // 修改图片加载完成的处理函数
  const handleImageLoad = () => {
    console.log('Image loaded'); // 添加日志以便调试
    setImageLoaded(true);
  };

  // 渲染切割辅助线
  const renderGuideLines = () => {
    if (!image || !imageRef.current || !imageLoaded) return null;

    const commonLineStyles = 'bg-blue-500/50 absolute pointer-events-none';
    const imgRect = imageRef.current.getBoundingClientRect();
    const containerRect = imageRef.current.parentElement?.getBoundingClientRect();

    if (!containerRect) return null;

    const imgStyle = {
      left: `${imgRect.left - containerRect.left}px`,
      top: `${imgRect.top - containerRect.top}px`,
      width: `${imgRect.width}px`,
      height: `${imgRect.height}px`,
    };

    return (
      <div className="absolute pointer-events-none" style={imgStyle}>
        {/* 垂直线 */}
        {Array.from({ length: Math.max(0, columns - 1) }).map((_, i) => (
          <div
            key={`v-${i}`}
            className={`${commonLineStyles} top-0 bottom-0 w-[1px] md:w-[2px] backdrop-blur-sm`}
            style={{
              left: `${((i + 1) * 100) / columns}%`,
              transform: 'translateX(-50%)',
            }}
          />
        ))}
        {/* 水平线 */}
        {Array.from({ length: Math.max(0, rows - 1) }).map((_, i) => (
          <div
            key={`h-${i}`}
            className={`${commonLineStyles} left-0 right-0 h-[1px] md:h-[2px] backdrop-blur-sm`}
            style={{
              top: `${((i + 1) * 100) / rows}%`,
              transform: 'translateY(-50%)',
            }}
          />
        ))}
      </div>
    );
  };

  // 处理图片切割
  const handleSplitImage = async () => {
    if (!image) return;

    setIsProcessing(true);

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('rows', rows.toString());
      formData.append('columns', columns.toString());

      const res = await fetch('/api/split-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSplitImages(data.pieces);
    } catch (error) {
      console.error('Failed to split image:', error);
      alert('图片切割失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 添加下载单个图片的函数
  const handleDownloadSingle = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `piece_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  // 添加打包下载所有图片的函数
  const handleDownloadAll = async () => {
    try {
      // 如果没有 JSZip，需要先动态导入
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // 添加所有图片到 zip
      const promises = splitImages.map(async (imageUrl, index) => {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        zip.file(`piece_${index + 1}.png`, blob);
      });

      await Promise.all(promises);

      // 生成并下载 zip 文件
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'split_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('打包下载失败:', error);
      alert('打包下载失败，请重试');
    }
  };

  // 修改预览区域的渲染函数
  const renderPreview = () => {
    if (!image) {
      return <p className="text-gray-400">切割后的图片预览</p>;
    }

    if (isProcessing) {
      return <p className="text-gray-400">正在处理中...</p>;
    }

    if (splitImages.length > 0) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className="grid gap-[3px] bg-[#242c3e]"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              width: imageRef.current?.width || '100%',
              height: imageRef.current?.height || '100%',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            {splitImages.map((src, index) => (
              <div key={index} className="relative group">
                <img src={src} alt={`切片 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDownloadSingle(src, index)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <p className="text-gray-400">点击切割按钮开始处理</p>;
  };

  return (
    <>
      <div className="fixed inset-0 -z-10" />
      <main className="min-h-screen w-full py-8 px-4">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* 标题区域 */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-center mb-3">
              <span className="text-3xl font-bold mb-3 dark:text-white">图片九宫格切割工具</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              上传一张图片，快速将其切割成网格布局，支持自定义行列数。
            </p>
          </div>

          {/* 图片区域 - 调整高度和响应式布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
            {/* 上传区域 - 调整高度 */}
            <div
              className="relative h-[400px] md:h-[500px] lg:h-[600px] border-2 border-dashed rounded-lg rounded-xl overflow-hidden
            border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-gray-800/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                id="imageUpload"
              />
              <label
                htmlFor="imageUpload"
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
              >
                {image ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      ref={imageRef}
                      src={image}
                      alt="上传的图片"
                      className="max-w-full max-h-full object-contain"
                      onLoad={handleImageLoad}
                      key={image}
                    />
                    {renderGuideLines()}
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-400">点击或拖拽图片到这里上传</p>
                  </>
                )}
              </label>
            </div>

            {/* 预览区域 - 调整高度 */}
            <div
              className="h-[400px] md:h-[500px] lg:h-[600px] rounded-xl flex items-center justify-center
                        border-gray-300 dark:border-gray-700 border-2 border-dashed
            "
            >
              {renderPreview()}
            </div>
          </div>

          {/* 控制器 - 添加上下边距的容器 */}
          <div className="py-4 md:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="bg-gray-50 rounded-xl px-5 py-2.5 flex items-center gap-4 border-2 border-dashed w-full sm:w-auto border-gray-300">
                  <span className="text-gray-400 font-medium min-w-[40px]">行数</span>
                  <div className="flex items-center gap-2 rounded-lg p-1 flex-1 sm:flex-none justify-center">
                    <button
                      className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg hover:bg-[#242c3e] hover:text-white transition-colors"
                      onClick={() => setRows(Math.max(1, rows - 1))}
                    >
                      -
                    </button>
                    <span className="text-gray-400 min-w-[32px] text-center font-medium">
                      {rows}
                    </span>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg hover:bg-[#242c3e] hover:text-white transition-colors"
                      onClick={() => setRows(rows + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-5 py-2.5 flex items-center gap-4 border-2 border-dashed w-full sm:w-auto border-gray-300">
                  <span className="text-gray-400 font-medium min-w-[40px]">列数</span>
                  <div className="flex items-center gap-2 rounded-lg p-1 flex-1 sm:flex-none justify-center">
                    <button
                      className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg hover:bg-[#242c3e] hover:text-white transition-colors"
                      onClick={() => setColumns(Math.max(1, columns - 1))}
                    >
                      -
                    </button>
                    <span className="text-gray-400 min-w-[32px] text-center font-medium">
                      {columns}
                    </span>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg hover:bg-[#242c3e] hover:text-white transition-colors"
                      onClick={() => setColumns(columns + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="px-5 py-2.5 text-gray-400 rounded-xl hover:bg-[#242c3e] hover:text-white transition-all font-medium border w-full sm:w-auto"
                  onClick={() => {
                    setRows(3);
                    setColumns(3);
                  }}
                >
                  重置
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/20 w-full sm:w-auto"
                  disabled={!image || isProcessing}
                  onClick={handleSplitImage}
                >
                  {isProcessing ? '处理中...' : '切割图片'}
                </button>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-red-500/20 w-full sm:w-auto"
                  onClick={() => {
                    setImage(null);
                    setSplitImages([]);
                    setImageLoaded(false);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={!image}
                >
                  清除
                </button>
              </div>

              {/* 下载按钮 */}
              {splitImages.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  打包下载
                </button>
              )}
            </div>
          </div>

          {/* 底部留白 */}
          <div className="h-16 md:h-20"></div>
        </div>
      </main>
    </>
  );
};

export default GridCutPage;
