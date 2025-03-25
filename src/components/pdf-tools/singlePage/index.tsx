import { memo, FC, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { Page } from 'react-pdf';
import { Loader } from 'lucide-react';

import PageToolbar from '../pageToolbar';

import { cn } from '@/utils';

interface SinglePageProps {
  index: number;
  className?: string;
  scale?: number;
  width?: number;
  style?: React.CSSProperties;
}

const baseClassName = 'shadow-lg rounded-lg overflow-hidden group';

const SinglePage: FC<SinglePageProps> = forwardRef(
  ({ index, className, scale = 1, width }, ref) => {
    const pageNumber = useMemo(() => index + 1, [index]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
        canvas.style.transform = `rotate(${0}deg)`;
        canvas.style.transformOrigin = 'center';

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    // 重绘当前页面
    const redrawPage = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    // 导出图片
    const exportImage = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `page-${pageNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      redrawPage,
    }));

    return (
      <div
        key={`pdf_page_${pageNumber}`}
        className={cn(baseClassName, className)}
        style={{ width }}
      >
        <div className="relative w-full h-full bg-white">
          <Page
            className="size-full relative"
            width={width}
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="absolute inset-0 flex justify-center items-center">
                <Loader className="w-10 h-10 animate-spin" />
              </div>
            }
            canvasBackground="white"
            canvasRef={editCanvas}
            scale={scale}
          />
          <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <PageToolbar onExportImage={exportImage} />
          </div>
        </div>
        <div className="w-full text-center shrink-0 text-xs italic overflow-hidden text-ellipsis whitespace-nowrap">
          {index + 1}
        </div>
      </div>
    );
  },
);

export default memo(SinglePage);
