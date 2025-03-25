import { FC } from 'react';
import { Download } from 'lucide-react';

interface PageToolbarProps {
  onExportImage: () => void;
}

const PageToolbar: FC<PageToolbarProps> = ({ onExportImage }) => {
  return (
    <div className="bg-gradient-to-t from-black/30 via-black/20 to-transparent p-2 flex items-center justify-end gap-2">
      <button
        onClick={onExportImage}
        className="bg-blue-100 hover:bg-blue-200 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
        title="导出图片"
      >
        <Download className="w-5 h-5" />
      </button>
      {/* 这里可以添加更多按钮 */}
    </div>
  );
};

export default PageToolbar;
