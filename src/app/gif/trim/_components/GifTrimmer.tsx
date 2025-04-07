import React, { useState, useRef, useEffect } from 'react';
import GIF from 'gif.js';
import { parseGIF, decompressFrames } from 'gifuct-js';

// GIF文件信息接口
interface GifFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  frames: number[];
  frameDurations: number[];
  totalDuration: number;
  width: number;
  height: number;
  processedBlob?: Blob;
  isProcessing: boolean;
  isProcessed: boolean;
  error?: string;
  // 剪辑选项
  trimOptions: {
    startFrame: number;
    endFrame: number;
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  };
}

// GIF剪辑组件
export default function GifTrimmer() {
  // 状态管理
  const [gifFile, setGifFile] = useState<GifFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // 添加拖动裁剪框的状态
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);

  // 使用常量而不是状态
  const showFrameThumbnails = true;
  //   const uiTheme = 'pro' as const;

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const frameDataRef = useRef<any[]>([]);
  // 缩略图canvas ref
  const thumbnailCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 初始化缩略图canvas
  useEffect(() => {
    // 创建缩略图canvas
    if (!thumbnailCanvasRef.current) {
      thumbnailCanvasRef.current = document.createElement('canvas');
      thumbnailCanvasRef.current.width = 40;
      thumbnailCanvasRef.current.height = 40;
    }
  }, []);

  // 检查worker文件是否存在
  useEffect(() => {
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

  // 播放/停止预览
  useEffect(() => {
    if (isPlaying && gifFile) {
      playGif();
    } else {
      stopPlayback();
    }

    return () => {
      stopPlayback();
    };
  }, [isPlaying, currentFrameIndex, playbackSpeed, gifFile]);

  // 处理GIF文件上传
  const handleGifUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 只处理第一个文件
    const file = files[0];

    // 验证文件是GIF
    if (!file.type.startsWith('image/gif')) {
      setError('请上传GIF格式的文件');

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 创建预览URL
      const preview = URL.createObjectURL(file);

      // 读取GIF信息和帧数据
      const { frames, frameDurations, width, height, totalDuration, decodedFrames } =
        await getGifInfo(file);

      frameDataRef.current = decodedFrames;

      // 设置默认裁剪为整个图像
      const newGifFile: GifFileInfo = {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        preview,
        frames,
        frameDurations,
        totalDuration,
        width,
        height,
        isProcessing: false,
        isProcessed: false,
        trimOptions: {
          startFrame: 0,
          endFrame: frames.length - 1,
          cropX: 0,
          cropY: 0,
          cropWidth: width,
          cropHeight: height,
        },
      };

      // 更新状态
      setGifFile(newGifFile);
      setCurrentFrameIndex(0);

      // 绘制第一帧
      if (frameDataRef.current.length > 0) {
        drawFrame(0);
      }
    } catch (error) {
      console.error('处理GIF文件时出错:', error);
      setError('无法处理GIF文件: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);

      // 重置文件输入，允许重复选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 获取GIF信息和帧数据
  const getGifInfo = async (
    file: File,
  ): Promise<{
    frames: number[];
    frameDurations: number[];
    totalDuration: number;
    width: number;
    height: number;
    decodedFrames: any[];
  }> => {
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

          // 提取帧延迟时间和总时长
          const frameDurations = frames.map((frame) => frame.delay * 10); // 转为毫秒
          const totalDuration = frameDurations.reduce((sum, delay) => sum + delay, 0);

          // 帧索引数组
          const frameIndices = Array.from({ length: frames.length }, (_, i) => i);

          resolve({
            frames: frameIndices,
            frameDurations,
            totalDuration,
            width: frames[0].dims.width,
            height: frames[0].dims.height,
            decodedFrames: frames,
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

  // 播放GIF
  const playGif = () => {
    if (!gifFile || !frameDataRef.current.length) return;

    stopPlayback();

    const playFrame = () => {
      if (!gifFile) return;

      const { startFrame, endFrame } = gifFile.trimOptions;

      // 当前帧在范围内
      let nextFrameIndex = currentFrameIndex + 1;

      // 如果超出了选定的范围，回到起始帧
      if (nextFrameIndex > endFrame || nextFrameIndex < startFrame) {
        nextFrameIndex = startFrame;
      }

      // 更新帧索引并绘制
      setCurrentFrameIndex(nextFrameIndex);
      drawFrame(nextFrameIndex);

      // 计算下一帧的延迟时间
      const frameDelay = gifFile.frameDurations[nextFrameIndex] / playbackSpeed;

      // 继续播放
      playbackTimerRef.current = window.setTimeout(playFrame, frameDelay);
    };

    // 开始播放
    playFrame();
  };

  // 停止播放
  const stopPlayback = () => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  // 绘制指定帧
  const drawFrame = (frameIndex: number) => {
    if (!canvasRef.current || !gifFile || frameIndex >= frameDataRef.current.length) return;

    const frame = frameDataRef.current[frameIndex];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 设置canvas尺寸
    canvas.width = gifFile.width;
    canvas.height = gifFile.height;

    // 处理透明背景 - 默认为棋盘格
    if (frame.disposalType === 2) {
      // 如果是清除类型的帧，先擦除整个画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 创建ImageData
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height,
    );

    // 将帧绘制到canvas
    ctx.putImageData(imageData, frame.dims.left, frame.dims.top);

    // 绘制裁剪预览
    drawCropPreview();
  };

  // 绘制裁剪预览
  const drawCropPreview = () => {
    if (!canvasRef.current || !previewCanvasRef.current || !gifFile) return;

    const { cropX, cropY, cropWidth, cropHeight } = gifFile.trimOptions;
    const sourceCanvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const previewCtx = previewCanvas.getContext('2d');

    if (!previewCtx) return;

    // 设置预览canvas尺寸
    previewCanvas.width = cropWidth;
    previewCanvas.height = cropHeight;

    // 裁剪并绘制到预览canvas
    previewCtx.drawImage(
      sourceCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );
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

  // 更新裁剪选项
  const updateTrimOptions = (options: Partial<GifFileInfo['trimOptions']>) => {
    if (!gifFile) return;

    setGifFile((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        trimOptions: {
          ...prev.trimOptions,
          ...options,
        },
      };
    });
  };

  // 格式化时间（新格式: 分:秒.毫秒）
  const formatTimeCode = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // 计算当前选择的时间范围
  const calculateSelectedDuration = (): number => {
    if (!gifFile) return 0;

    const { startFrame, endFrame } = gifFile.trimOptions;
    let duration = 0;

    for (let i = startFrame; i <= endFrame; i++) {
      duration += gifFile.frameDurations[i];
    }

    return duration;
  };

  // 创建帧缩略图
  const generateThumbnails = () => {
    if (!gifFile || !frameDataRef.current.length) return null;

    return (
      <div className="flex overflow-x-auto py-1 h-[60px] bg-gray-900 border-t border-b border-gray-800">
        {frameDataRef.current.map((frame, index) => {
          const isSelected =
            index >= gifFile.trimOptions.startFrame && index <= gifFile.trimOptions.endFrame;
          const isCurrent = index === currentFrameIndex;

          // 生成帧缩略图
          const generateFrameThumbnail = () => {
            const thumbCanvas = thumbnailCanvasRef.current;
            if (!thumbCanvas) return null;

            const thumbCtx = thumbCanvas.getContext('2d');
            if (!thumbCtx) return null;

            // 清除画布
            thumbCtx.clearRect(0, 0, 40, 40);

            // 背景网格
            if (index % 2 === 0) {
              thumbCtx.fillStyle = '#1a1a1a';
            } else {
              thumbCtx.fillStyle = '#0a0a0a';
            }

            thumbCtx.fillRect(0, 0, 40, 40);

            // 尝试渲染帧
            try {
              // 创建临时canvas用于帧绘制
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = gifFile.width;
              tempCanvas.height = gifFile.height;

              const tempCtx = tempCanvas.getContext('2d');

              if (tempCtx) {
                // 创建ImageData
                const imageData = new ImageData(
                  new Uint8ClampedArray(frame.patch),
                  frame.dims.width,
                  frame.dims.height,
                );

                // 将帧绘制到临时canvas
                tempCtx.putImageData(imageData, frame.dims.left, frame.dims.top);

                // 缩放到缩略图尺寸
                const scale = Math.min(40 / gifFile.width, 40 / gifFile.height);
                const scaledWidth = gifFile.width * scale;
                const scaledHeight = gifFile.height * scale;
                const x = (40 - scaledWidth) / 2;
                const y = (40 - scaledHeight) / 2;

                thumbCtx.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
              }
            } catch (err) {
              console.log('无法渲染缩略图', err);
            }

            // 获取缩略图数据URL
            return thumbCanvas.toDataURL('image/png');
          };

          // 生成缩略图
          const thumbnail = generateFrameThumbnail();

          return (
            <div
              key={index}
              className={`flex-shrink-0 cursor-pointer relative mx-0.5 ${isSelected ? 'opacity-100' : 'opacity-70'} ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => {
                setCurrentFrameIndex(index);
                drawFrame(index);
              }}
            >
              <div className="w-[40px] h-[40px] relative overflow-hidden bg-black">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={`帧 ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover ${isSelected ? 'border border-blue-400' : ''}`}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 flex items-center justify-center ${isSelected ? 'border border-blue-400' : ''}`}
                    style={{
                      backgroundColor: `hsl(${(index * 10) % 360}, 70%, 20%)`,
                    }}
                  >
                    <span className="text-[10px] text-white font-bold opacity-60">{index + 1}</span>
                  </div>
                )}
              </div>
              <div className="text-[8px] text-center text-gray-400">
                {Math.floor(
                  gifFile.frameDurations.slice(0, index + 1).reduce((sum, d) => sum + d, 0) / 100,
                ) / 10}
                s
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染专业编辑器界面
  const renderProEditor = () => {
    if (!gifFile) return null;

    const { startFrame, endFrame } = gifFile.trimOptions;
    const startTimeMs = gifFile.frameDurations
      .slice(0, startFrame)
      .reduce((sum, delay) => sum + delay, 0);
    const endTimeMs = gifFile.frameDurations
      .slice(0, endFrame + 1)
      .reduce((sum, delay) => sum + delay, 0);

    return (
      <div className="flex flex-col w-full bg-[#0a2040] text-white overflow-hidden rounded-lg">
        {/* 工具栏 */}
        <div className="bg-gray-900 p-2 flex items-center border-b border-gray-800">
          <div className="ml-auto flex items-center">
            <button
              onClick={() => {
                setGifFile(null);
                setCurrentFrameIndex(0);
                setIsPlaying(false);
                stopPlayback();
              }}
              className="text-white bg-transparent p-1 rounded hover:bg-red-700"
            >
              重启
            </button>
            <button className="ml-1 text-white bg-transparent p-1 rounded hover:bg-gray-800">
              ✕
            </button>
          </div>
        </div>

        {/* 文件名显示 */}
        <div className="text-center py-1 text-xs text-gray-400 border-b border-gray-800">
          {gifFile.name}
        </div>

        {/* 编辑预览区域 - 使用网格布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-gray-950">
          {/* 主编辑区 */}
          <div className="flex-1 flex justify-center items-center">
            <div className="relative">
              <div
                className="absolute inset-0 bg-opacity-30"
                style={{
                  backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222),
                                   linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222)`,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px',
                  backgroundColor: '#333',
                }}
              ></div>

              <div className="relative z-10">
                <canvas ref={canvasRef} className="max-w-full max-h-[350px]"></canvas>
              </div>

              <CropBox />

              <div className="absolute bottom-2 left-2 z-30 flex space-x-2 bg-black bg-opacity-50 py-1 px-2 rounded text-xs text-white">
                <span className="font-mono">
                  帧: {currentFrameIndex + 1}/{gifFile.frames.length}
                </span>
                <span className="font-mono">
                  时间:{' '}
                  {formatTimeCode(
                    gifFile.frameDurations
                      .slice(0, currentFrameIndex + 1)
                      .reduce((sum, delay) => sum + delay, 0),
                  )}
                </span>
              </div>

              <div className="absolute top-2 right-2 z-30 bg-black bg-opacity-50 py-1 px-2 rounded text-xs text-white">
                <span className="font-mono">
                  {gifFile.trimOptions.cropWidth} × {gifFile.trimOptions.cropHeight}
                </span>
              </div>
            </div>
          </div>

          {/* 预览区 */}
          <div className="flex flex-col">
            <div className="mb-2 text-sm font-medium">剪辑结果预览</div>
            <div className="flex-1 bg-black rounded overflow-hidden flex items-center justify-center">
              <div className="relative">
                {/* 透明背景棋盘格 */}
                <div
                  className="absolute inset-0 bg-opacity-30"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222),
                                     linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222)`,
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 6px 6px',
                    backgroundColor: '#222',
                  }}
                ></div>

                {/* 预览画布 */}
                <div className="relative z-10">
                  <canvas ref={previewCanvasRef} className="max-w-full max-h-[350px]"></canvas>
                </div>

                {/* 预览信息覆盖层 */}
                <div className="absolute bottom-2 left-2 z-30 flex space-x-2 bg-black bg-opacity-50 py-1 px-2 rounded text-xs text-white">
                  <span className="font-mono">裁剪区域</span>
                </div>

                {gifFile.isProcessed && gifFile.processedBlob && (
                  <div className="absolute top-2 right-2 z-30 bg-green-600 bg-opacity-70 py-1 px-2 rounded text-xs text-white">
                    已处理 ({formatFileSize(gifFile.processedBlob.size)})
                  </div>
                )}
              </div>
            </div>

            {/* 预览控制 */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">裁剪宽度</div>
                <input
                  type="range"
                  min="10"
                  max={gifFile.width}
                  value={gifFile.trimOptions.cropWidth}
                  onChange={(e) => updateTrimOptions({ cropWidth: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 bg-gray-700"
                />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">裁剪高度</div>
                <input
                  type="range"
                  min="10"
                  max={gifFile.height}
                  value={gifFile.trimOptions.cropHeight}
                  onChange={(e) => updateTrimOptions({ cropHeight: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 bg-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 时间轴区域 */}
        <div className="bg-gray-900">
          {/* 时间码显示 */}
          <div className="flex justify-between text-xs px-2 py-1 text-white">
            <div className="bg-gray-800 px-2 py-0.5 rounded">{formatTimeCode(startTimeMs)}</div>
            <div className="bg-gray-800 px-2 py-0.5 rounded">{formatTimeCode(endTimeMs)}</div>
          </div>

          {/* 帧缩略图 */}
          {showFrameThumbnails && generateThumbnails()}

          {/* 时间线滑块 */}
          <div className="px-4 pt-2 pb-3 bg-gray-900">
            <div className="relative">
              <input
                type="range"
                min="0"
                max={gifFile.frames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  setCurrentFrameIndex(index);
                  drawFrame(index);
                }}
                className="w-full accent-blue-500 bg-gray-700"
              />

              {/* 范围选择指示器 */}
              <div
                className="absolute top-0 h-[4px] bg-blue-500/50"
                style={{
                  left: `${(startFrame / (gifFile.frames.length - 1)) * 100}%`,
                  width: `${((endFrame - startFrame) / (gifFile.frames.length - 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-t border-gray-800">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 flex items-center justify-center bg-[#0a2040] hover:bg-blue-700 rounded-full"
              >
                {isPlaying ? '❚❚' : '▶'}
              </button>

              <div className="flex items-center bg-gray-800 rounded px-2">
                <button
                  className="px-1 py-0.5 text-sm"
                  onClick={() => updateTrimOptions({ startFrame: currentFrameIndex })}
                >
                  ◀
                </button>

                <div className="flex space-x-1 items-center px-1">
                  <div className="text-xs font-mono bg-gray-700 px-2 py-0.5 rounded">
                    {formatTimeCode(
                      gifFile.frameDurations
                        .slice(0, currentFrameIndex + 1)
                        .reduce((sum, delay) => sum + delay, 0),
                    )}
                  </div>
                  <span className="text-gray-400">|</span>
                  <div className="text-xs font-mono bg-gray-700 px-2 py-0.5 rounded">
                    {formatTimeCode(calculateSelectedDuration())}
                  </div>
                </div>

                <button
                  className="px-1 py-0.5 text-sm"
                  onClick={() => updateTrimOptions({ endFrame: currentFrameIndex })}
                >
                  ▶
                </button>
              </div>

              {/* 播放速度控制 */}
              <div className="flex items-center space-x-1">
                <span className="text-xs">速度</span>
                <select
                  className="bg-gray-800 text-white text-xs px-1 py-0.5 rounded border border-gray-700"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                >
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {gifFile.isProcessed && gifFile.processedBlob && (
                <button
                  onClick={() => downloadProcessedGif()}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                >
                  下载 ({formatFileSize(gifFile.processedBlob.size)})
                </button>
              )}
              <button
                onClick={trimGif}
                disabled={gifFile.isProcessing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-gray-500"
              >
                {gifFile.isProcessing ? '处理中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 处理GIF剪辑
  const trimGif = async () => {
    if (!gifFile) return;

    setGifFile((prev) => (prev ? { ...prev, isProcessing: true, error: undefined } : null));

    try {
      const { startFrame, endFrame, cropX, cropY, cropWidth, cropHeight } = gifFile.trimOptions;

      // 配置GIF生成器
      const gifJs = new GIF({
        workers: 4,
        quality: 10,
        width: cropWidth,
        height: cropHeight,
        workerScript: '/gif.worker.js',
        dither: false,
      });

      // 创建临时canvas用于裁剪
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;

      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        throw new Error('无法创建Canvas上下文');
      }

      // 处理选定范围内的帧
      for (let i = startFrame; i <= endFrame; i++) {
        // 首先绘制到主canvas
        drawFrame(i);

        // 然后裁剪并添加到GIF
        tempCtx.clearRect(0, 0, cropWidth, cropHeight);
        tempCtx.drawImage(
          canvasRef.current!,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight,
        );

        // 添加到GIF，使用原始帧的延迟
        gifJs.addFrame(tempCanvas, {
          delay: gifFile.frameDurations[i],
          copy: true,
        });
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

      // 更新状态
      setGifFile((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          isProcessing: false,
          isProcessed: true,
          processedBlob: blob,
        };
      });
    } catch (error) {
      console.error('剪辑GIF出错:', error);

      // 更新错误状态
      setGifFile((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          isProcessing: false,
          error: '处理失败：' + (error instanceof Error ? error.message : '未知错误'),
        };
      });
    }
  };

  // 下载处理后的GIF
  const downloadProcessedGif = () => {
    if (!gifFile || !gifFile.processedBlob) return;

    const url = URL.createObjectURL(gifFile.processedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trimmed_${gifFile.name}`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';

    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 计算裁剪区域的外观百分比
  const calculateCropStyles = () => {
    if (!gifFile) return { top: '0%', left: '0%', width: '100%', height: '100%' };

    const { cropX, cropY, cropWidth, cropHeight } = gifFile.trimOptions;

    return {
      top: `${(cropY / gifFile.height) * 100}%`,
      left: `${(cropX / gifFile.width) * 100}%`,
      width: `${(cropWidth / gifFile.width) * 100}%`,
      height: `${(cropHeight / gifFile.height) * 100}%`,
    };
  };

  // 处理裁剪框拖动开始
  const handleCropDragStart = (
    e: React.MouseEvent,
    type: 'move' | 'resize',
    corner?: 'tl' | 'tr' | 'bl' | 'br',
  ) => {
    if (!gifFile || !canvasRef.current) return;

    // 阻止事件冒泡和默认行为
    e.stopPropagation();
    e.preventDefault();

    // 获取画布的边界
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // 计算相对于画布的位置
    const x = ((e.clientX - canvasRect.left) / canvasRect.width) * gifFile.width;
    const y = ((e.clientY - canvasRect.top) / canvasRect.height) * gifFile.height;

    setIsDraggingCrop(true);
    setDragStartPos({ x, y });
    setDragType(type);

    if (type === 'resize' && corner) {
      setResizeCorner(corner);
    }

    // 添加全局鼠标事件监听
    document.addEventListener('mousemove', handleCropDragMove);
    document.addEventListener('mouseup', handleCropDragEnd);
  };

  // 处理裁剪框拖动
  const handleCropDragMove = (e: MouseEvent) => {
    if (!isDraggingCrop || !gifFile || !canvasRef.current) return;

    // 获取画布的边界
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // 计算相对于画布的位置
    const x = Math.max(
      0,
      Math.min(((e.clientX - canvasRect.left) / canvasRect.width) * gifFile.width, gifFile.width),
    );
    const y = Math.max(
      0,
      Math.min(((e.clientY - canvasRect.top) / canvasRect.height) * gifFile.height, gifFile.height),
    );

    // 计算位移
    const deltaX = x - dragStartPos.x;
    const deltaY = y - dragStartPos.y;

    const { cropX, cropY, cropWidth, cropHeight } = gifFile.trimOptions;

    if (dragType === 'move') {
      // 移动裁剪框
      const newX = Math.max(0, Math.min(cropX + deltaX, gifFile.width - cropWidth));
      const newY = Math.max(0, Math.min(cropY + deltaY, gifFile.height - cropHeight));

      updateTrimOptions({
        cropX: Math.round(newX),
        cropY: Math.round(newY),
      });

      // 更新起点位置
      setDragStartPos({ x, y });
    } else if (dragType === 'resize' && resizeCorner) {
      // 调整裁剪框大小
      let newX = cropX;
      let newY = cropY;
      let newWidth = cropWidth;
      let newHeight = cropHeight;

      switch (resizeCorner) {
        case 'tl': // 左上角
          newX = Math.max(0, Math.min(cropX + deltaX, cropX + cropWidth - 10));
          newY = Math.max(0, Math.min(cropY + deltaY, cropY + cropHeight - 10));
          newWidth = cropWidth - deltaX;
          newHeight = cropHeight - deltaY;
          break;
        case 'tr': // 右上角
          newY = Math.max(0, Math.min(cropY + deltaY, cropY + cropHeight - 10));
          newWidth = Math.max(10, cropWidth + deltaX);
          newHeight = cropHeight - deltaY;
          break;
        case 'bl': // 左下角
          newX = Math.max(0, Math.min(cropX + deltaX, cropX + cropWidth - 10));
          newWidth = cropWidth - deltaX;
          newHeight = Math.max(10, cropHeight + deltaY);
          break;
        case 'br': // 右下角
          newWidth = Math.max(10, cropWidth + deltaX);
          newHeight = Math.max(10, cropHeight + deltaY);
          break;
      }

      // 确保不超出图像边界
      if (newX + newWidth > gifFile.width) {
        newWidth = gifFile.width - newX;
      }

      if (newY + newHeight > gifFile.height) {
        newHeight = gifFile.height - newY;
      }

      updateTrimOptions({
        cropX: Math.round(newX),
        cropY: Math.round(newY),
        cropWidth: Math.round(newWidth),
        cropHeight: Math.round(newHeight),
      });

      // 更新起点位置
      setDragStartPos({ x, y });
    }
  };

  // 处理裁剪框拖动结束
  const handleCropDragEnd = () => {
    setIsDraggingCrop(false);
    setDragType(null);
    setResizeCorner(null);

    // 移除全局鼠标事件监听
    document.removeEventListener('mousemove', handleCropDragMove);
    document.removeEventListener('mouseup', handleCropDragEnd);

    // 更新裁剪预览
    drawCropPreview();
  };

  // 裁剪框组件
  const CropBox = () => {
    if (!gifFile) return null;

    // 这些变量仅用于判断是否有有效的裁剪区域
    if (gifFile.trimOptions.cropWidth < 10 || gifFile.trimOptions.cropHeight < 10) {
      return null;
    }

    const cropStyles = calculateCropStyles();

    return (
      <div
        className="absolute z-20 border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-auto cursor-move"
        style={cropStyles}
        onMouseDown={(e) => handleCropDragStart(e, 'move')}
      >
        {/* 调整大小的角落控制点 */}
        <div
          className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-30 transform -translate-x-1/2 -translate-y-1/2"
          onMouseDown={(e) => handleCropDragStart(e, 'resize', 'tl')}
        ></div>
        <div
          className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-30 transform translate-x-1/2 -translate-y-1/2"
          onMouseDown={(e) => handleCropDragStart(e, 'resize', 'tr')}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-30 transform -translate-x-1/2 translate-y-1/2"
          onMouseDown={(e) => handleCropDragStart(e, 'resize', 'bl')}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-30 transform translate-x-1/2 translate-y-1/2"
          onMouseDown={(e) => handleCropDragStart(e, 'resize', 'br')}
        ></div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {/* 文件上传区域 */}
      {!gifFile ? (
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
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mb-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={isLoading}
          >
            选择GIF文件
          </button>
          <p className="text-gray-600 dark:text-gray-300">或将GIF文件拖放到此处</p>

          {isLoading && <div className="mt-3 text-blue-500">正在加载文件，请稍候...</div>}
        </div>
      ) : (
        renderProEditor()
      )}
    </div>
  );
}
