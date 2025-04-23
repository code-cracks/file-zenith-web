import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CompressionResult, compressionOptions } from '@/utils/pdfCompression';
import { formatFileSize } from '@/lib/utils';

type CompressionLevel = keyof typeof compressionOptions;

export interface CompressionDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  results: Record<string, CompressionResult> | null;
  selectedLevel: CompressionLevel | null;
  onClose: () => void;
  onLevelSelect: (level: CompressionLevel) => void;
  onDownload: () => void;
}

export function CompressionDialog({
  isOpen,
  isLoading,
  results,
  selectedLevel,
  onClose,
  onLevelSelect,
  onDownload,
}: CompressionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] transition-all duration-200">
        <div className="space-y-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">PDF压缩选项</h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-100 animate-[spin_3s_linear_infinite]" />
                <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 absolute top-0 left-0 animate-[spin_1.5s_linear_infinite]" />
              </div>
              <p className="text-sm text-gray-500">正在分析PDF文件...</p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              {(Object.entries(results) as [CompressionLevel, CompressionResult][]).map(
                ([level, result], index) => (
                  <div
                    key={level}
                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-gray-50 animate-in fade-in slide-in-from-bottom-${index + 1} duration-300 ${
                      selectedLevel === level ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                    onClick={() => onLevelSelect(level)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {compressionOptions[level].name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {compressionOptions[level].description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatFileSize(result.compressedSize)}
                        </div>
                        <div className="text-xs text-gray-500">
                          压缩率: {Math.round(result.compressionRatio)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}

              <div
                className="flex justify-end space-x-3 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: '300ms' }}
              >
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  onClick={onDownload}
                  disabled={!selectedLevel}
                >
                  下载压缩PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 animate-in fade-in duration-300">
              无压缩结果
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
