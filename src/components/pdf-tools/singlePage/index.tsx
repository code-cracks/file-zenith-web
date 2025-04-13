import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Page } from 'react-pdf';

import PageToolbar from '../pageToolbar';

import { cn } from '@/utils';

interface SinglePageProps {
  index: number;
  className?: string;
  width?: number;
}

interface SinglePageRef {
  exportImage: (format: string) => void;
}

const baseClassName = 'shadow-lg rounded-lg group overflow-hidden';
const ZOOM_STEP = 0.1; // 10% 缩放步长
const MIN_SCALE = 0.5; // 最小缩放 50%
const MAX_SCALE = 2.0; // 最大缩放 200%

const SinglePage = forwardRef<SinglePageRef, SinglePageProps>(
  ({ index, className, width = 400 }, ref) => {
    const pageNumber = useMemo(() => index + 1, [index]);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef(false);
    const lastPosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
      if (containerRef.current) {
        containerRef.current.style.width = `${width}px`;
      }
    }, [width]);

    // 重置位置当缩放比例为1时
    useEffect(() => {
      if (scale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }, [scale]);

    // 拖拽处理
    const handleMouseDown = (e: React.MouseEvent) => {
      if (scale > 1) {
        isDragging.current = true;
        lastPosition.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging.current && scale > 1) {
        const newX = e.clientX - lastPosition.current.x;
        const newY = e.clientY - lastPosition.current.y;

        // 计算边界
        const container = containerRef.current;

        if (container) {
          const bounds = container.getBoundingClientRect();
          const maxX = ((scale - 1) * bounds.width) / 2;
          const maxY = ((scale - 1) * bounds.height) / 2;

          // 限制拖拽范围
          const boundedX = Math.min(Math.max(newX, -maxX), maxX);
          const boundedY = Math.min(Math.max(newY, -maxY), maxY);

          setPosition({ x: boundedX, y: boundedY });
        }
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // 添加全局鼠标事件监听
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        isDragging.current = false;
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }, []);

    // 缩放控制
    const handleZoomIn = () => {
      setScale((prevScale) => {
        const newScale = Math.min(prevScale + ZOOM_STEP, MAX_SCALE);

        return newScale;
      });
    };

    const handleZoomOut = () => {
      setScale((prevScale) => {
        const newScale = Math.max(prevScale - ZOOM_STEP, MIN_SCALE);

        return newScale;
      });
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const direction = e.deltaY < 0 ? 1 : -1;
        setScale((prevScale) => {
          const newScale = Math.min(
            Math.max(prevScale + direction * ZOOM_STEP, MIN_SCALE),
            MAX_SCALE,
          );

          return newScale;
        });
      }
    };

    useEffect(() => {
      const container = containerRef.current;

      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
          container.removeEventListener('wheel', handleWheel);
        };
      }
    }, []);

    // 更新canvas缩放
    const updateCanvasScale = (newScale: number) => {
      if (canvasRef.current) {
        canvasRef.current.style.transform = `scale(${newScale})`;
      }
    };

    // 当scale变化时更新canvas
    useEffect(() => {
      updateCanvasScale(scale);
    }, [scale]);

    const editCanvas = (canvas: HTMLCanvasElement) => {
      if (canvas) {
        canvasRef.current = canvas;
        canvas.style.imageRendering = 'high-quality';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        canvas.style.transitionProperty = 'transform';
        canvas.style.transitionTimingFunction = 'cubic-bezier(0.4, 0, 0.2, 1)';
        canvas.style.transitionDuration = '150ms';
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'center';
      }
    };

    // 导出图片
    const exportImage = (format: string) => {
      if (canvasRef.current) {
        // 创建一个临时canvas来保存图片
        const tempCanvas = document.createElement('canvas');
        const sourceCanvas = canvasRef.current;

        // 设置临时canvas的尺寸
        tempCanvas.width = sourceCanvas.width;
        tempCanvas.height = sourceCanvas.height;

        // 获取上下文并复制原始canvas的内容
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(sourceCanvas, 0, 0);

          // 创建下载链接
          const link = document.createElement('a');
          link.download = `page-${pageNumber}.${format}`;
          link.href = tempCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.8 : undefined);
          link.click();
        }
      }
    };

    // 复位功能
    const handleReset = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    };

    // 暴露方法给父组件
    useEffect(() => {
      if (ref && typeof ref === 'object') {
        ref.current = {
          exportImage,
        };
      }
    }, [ref]);

    return (
      <div
        ref={containerRef}
        className={cn(baseClassName, 'group', className)}
        style={{
          transition: 'width 300ms ease',
        }}
      >
        <div className="relative">
          <div
            className="overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              cursor: scale > 1 ? 'move' : 'default',
            }}
          >
            <div
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center',
                transition: isDragging.current ? 'none' : 'transform 200ms ease-out',
              }}
            >
              <Page
                pageNumber={pageNumber}
                width={width}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                canvasRef={editCanvas}
                className="transition-transform duration-200 ease-out"
              />
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <PageToolbar
              onExportImage={exportImage}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              scale={scale * 100}
              className="pointer-events-auto"
            />
          </div>
        </div>
        {/* <div className="w-full text-center shrink-0 text-xs italic overflow-hidden text-ellipsis whitespace-nowrap">
          {index + 1}
        </div> */}
      </div>
    );
  },
);

SinglePage.displayName = 'SinglePage';

export default SinglePage;
