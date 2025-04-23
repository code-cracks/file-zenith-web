import { FC, useState } from 'react';
import {
  Download,
  Image as ImageIcon,
  FileImage,
  File,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';

interface PageToolbarProps {
  onExportImage: (format: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  scale?: number;
  className?: string;
}

const imageFormats = [
  {
    value: 'png',
    label: 'PNG',
    description: '高质量',
    icon: <ImageIcon className="w-3 h-3" />,
    color: 'bg-emerald-100/90 text-emerald-600 hover:bg-emerald-100',
  },
  {
    value: 'jpeg',
    label: 'JPEG',
    description: '小体积',
    icon: <FileImage className="w-3 h-3" />,
    color: 'bg-blue-100/90 text-blue-600 hover:bg-blue-100',
  },
  {
    value: 'webp',
    label: 'WebP',
    description: '现代格式',
    icon: <File className="w-3 h-3" />,
    color: 'bg-purple-100/90 text-purple-600 hover:bg-purple-100',
  },
];

const PageToolbar: FC<PageToolbarProps> = ({
  onExportImage,
  onZoomIn,
  onZoomOut,
  onReset,
  scale = 100,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 via-black/20 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className || ''}`}
      >
        <div className="flex items-center gap-2 bg-black/40 rounded-full p-1 backdrop-blur-sm">
          <button
            onClick={onZoomOut}
            className="w-7 h-7 rounded-full bg-white/90 text-gray-700 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
            title="缩小 (10%)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-white/90 text-sm font-medium px-1 select-none">
            {Math.round(scale)}%
          </span>
          <button
            onClick={onZoomIn}
            className="w-7 h-7 rounded-full bg-white/90 text-gray-700 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
            title="放大 (10%)"
          >
            <Plus className="w-4 h-4" />
          </button>
          {scale !== 100 && (
            <button
              onClick={onReset}
              className="w-7 h-7 rounded-full bg-white/90 text-gray-700 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
              title="复位 (100%)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div
          className="relative flex gap-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            className="bg-blue-100 hover:bg-blue-200 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer focus:outline-none relative z-10"
            title="导出图片"
          >
            <Download className="w-5 h-5" />
          </button>

          <div
            className="absolute bottom-[120%] right-0 flex flex-row-reverse gap-1.5 p-1.5"
            style={{
              perspective: '1000px',
              zIndex: 20,
              minWidth: '200px',
              transform: `translateY(${isHovered ? '0' : '10px'})`,
              opacity: isHovered ? 1 : 0,
              transition: 'all 0.3s ease',
            }}
          >
            {imageFormats.map((format, index) => (
              <button
                key={format.value}
                onClick={() => onExportImage(format.value)}
                className={`group flex-col h-12 w-12 rounded-full ${format.color} border-2 border-transparent hover:border-current/30 hover:scale-105 transition-all duration-200 p-0 shadow-lg focus:outline-none`}
                style={{
                  transform: isHovered
                    ? `translateY(0) rotateX(0) scale(1)`
                    : `translateY(20px) rotateX(-45deg) scale(0.8)`,
                  opacity: isHovered ? 1 : 0,
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                  transitionDelay: `${index * 60}ms`,
                  pointerEvents: isHovered ? 'auto' : 'none',
                }}
              >
                <div className="flex flex-col items-center justify-center w-full h-full relative">
                  <div
                    className="flex flex-col items-center"
                    style={{
                      transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
                      opacity: isHovered ? 1 : 0,
                      transition: 'all 0.3s ease',
                      transitionDelay: `${index * 60 + 100}ms`,
                    }}
                  >
                    {format.icon}
                    <span className="text-[10px] font-medium mt-0.5">{format.label}</span>
                    <span className="text-[8px] text-current/70">{format.description}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PageToolbar;
