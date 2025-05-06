'use client';

import { RotateCw, Trash2, Upload, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import { removeBackground } from '@imgly/background-removal';
import JSZip from 'jszip';

//证件照制作
const IDPhotoPage = () => {
  // 支持的图片格式
  const SUPPORTED_FORMATS = [
    {
      name: 'JPG',
      mimeType: 'image/jpeg',
      extension: '.jpg',
      tips: '适合照片，有损压缩，不支持透明背景',
    },
    {
      name: 'PNG',
      mimeType: 'image/png',
      extension: '.png',
      tips: '支持透明背景，无损压缩，文件较大',
    },
  ];
  // 证件照标准尺寸配置
  const STANDARD_SIZES = [
    { label: '一寸', width: 25, height: 35 }, // 实际为 25mm×35mm
    { label: '二寸', width: 35, height: 45 },
    { label: '小二寸', width: 33, height: 48 },
  ];
  //背景颜色配置
  const STANDARD_COLORS = [
    { label: '白色', color: '#ffffff' },
    { label: '黑色', color: '#000000' },
    { label: '红色', color: '#ff0000' },
    { label: '绿色', color: '#00ff00' },
    { label: '蓝色', color: '#0000ff' },
    { label: '紫色', color: '#800080' },
    { label: '黄色', color: '#ffff00' },
  ];
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [converting, setConverting] = useState(false);
  const [output, setOutput] = useState<{ name: string; url: string }[]>([]);
  const [selectedFormat, setSelectedFormat] = useState(STANDARD_SIZES[0]);
  const [selectedColor, setSelectedColor] = useState(STANDARD_COLORS[0]);
  const formatNameList = SUPPORTED_FORMATS.map((format) => format.name);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // console.log(e.target.files);
    if (!e.target.files?.length) return;

    const newFiles = Array.from(e.target.files).filter((file) => file.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...newFiles]);
    setOutput([]);

    // 清空文件输入，以便可以再次选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // 处理文件拖拽
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
      setOutput([]);
    }
  };
  // 清空所有文件
  const clearFiles = () => {
    setFiles([]);
    setOutput([]);
  };
  // 删除选定的文件
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  const handleConvert = async () => {
    if (!files.length) return;
    setConverting(true);

    try {
      const convertedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            // 1. 先进行背景移除
            const processedBlob = await removeBackground(file);
            console.log(processedBlob);

            const processedUrl = URL.createObjectURL(processedBlob);

            // 2. 创建处理后的图片对象
            const img = new Image();
            img.src = processedUrl;
            await new Promise((resolve) => (img.onload = resolve));

            // 3. 创建画布并设置尺寸
            const canvas = document.createElement('canvas');
            const dpi = 300; // 标准证件照分辨率
            const mmToInch = 25.4;
            canvas.width = (selectedFormat.width / mmToInch) * dpi;
            canvas.height = (selectedFormat.height / mmToInch) * dpi;

            const ctx = canvas.getContext('2d')!;

            // 4. 先填充背景色
            ctx.fillStyle = selectedColor.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 5. 计算图片缩放和位置
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;

            // 6. 绘制处理后的透明背景图片
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // 7. 转换为目标格式
            const format = SUPPORTED_FORMATS.find((f) => f.name === 'PNG')!; // 默认使用PNG保持透明度
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, format.mimeType),
            );

            return {
              name: `${file.name.split('.')[0]}_${selectedFormat.label}${format.extension}`,
              url: URL.createObjectURL(blob!),
            };
          } catch (error) {
            console.error(`处理文件 ${file.name} 失败:`, error);

            return null;
          }
        }),
      );
      setOutput(convertedFiles.filter(Boolean) as { name: string; url: string }[]);
    } catch (error) {
      console.error('转换失败:', error);
    } finally {
      setConverting(false);
    }
  };
  const downloadFile = (file: { name: string; url: string }) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllFiles = async () => {
    if (!output.length) return;

    if (output.length === 1) {
      // 只有一个文件，直接下载
      downloadFile(output[0]);

      return;
    }

    // 多个文件，创建zip压缩包
    const zip = new JSZip();

    try {
      for (const file of output) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(content);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `证件照_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error('创建压缩包失败:', error);
      alert('下载文件时出错，请重试');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">证件照制作</h1>
      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
         ${
           isDragging
             ? 'border-blue-500 bg-blue-50 scale-[1.02]'
             : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
         }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept="image/*"
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
        >
          <Upload
            className={`h-12 w-12 ${isDragging ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}
          />
          <div>
            <span className="text-blue-500 font-medium">点击上传</span>
            <span className="text-gray-500">或拖拽文件到此区域</span>
          </div>
          <p className="text-sm text-gray-400">
            支持 {formatNameList.join(', ')} 格式（单次最多10个文件）
          </p>
        </label>
      </div>
      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="mt-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">已上传的文件 ({files.length})</h2>
            <button
              onClick={clearFiles}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span>清空全部</span>
            </button>
          </div>
          <div className="grid gird-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative p-4 border rounded-lg  hover:shadow-md transition-shadow"
              >
                <div className="group relative rounded-lg overflow-hidden mb-2 h-40 bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-center mt-2">
                  <p className="truncate max-w-[70%]" title={file.name}>
                    {file.name}
                  </p>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-700"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 证件照标准尺寸配置和转换按钮 */}
      {files.length > 0 && (
        <div className="mt-8 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold mb-2">证件照标准尺寸</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {STANDARD_SIZES.map((format) => (
                  <button
                    key={format.label}
                    onClick={() => setSelectedFormat(format)}
                    className={`
                      px-4 py-2 rounded-md border transition-colors
                      ${
                        selectedFormat.label === format.label
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:border-blue-300'
                      }
                    `}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {STANDARD_COLORS.map((color) => (
                  <button
                    key={color.label}
                    onClick={() => setSelectedColor(color)}
                    className={`p-1 rounded-full border-2 ${
                      selectedColor.label === color.label
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200'
                    }`}
                    title={color.label}
                  >
                    <div
                      className="w-6 h-6 rounded-full "
                      style={{ backgroundColor: color.color }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleConvert}
              disabled={converting || !files.length}
              className={`
                flex items-center px-6 py-3 rounded-md text-white
                ${
                  converting || !files.length
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }
              `}
            >
              {converting ? (
                <>
                  <RotateCw className="h-5 w-5 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <RotateCw className="h-5 w-5 mr-2" />
                  生成 {selectedFormat.label}
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {/* 生成结果 */}
      {output.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">转换结果</h2>
            <button
              onClick={downloadAllFiles}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <Download className="w-5 h-5 mr-2" />
              <span>{output.length > 1 ? '下载全部（ZIP）' : '下载'}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {output.map((file, index) => (
              <div
                key={index}
                className="relative p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="group relative rounded-lg overflow-hidden mb-2 h-40 bg-gray-100">
                  <img src={file.url} alt={file.name} className="h-full w-full object-contain" />
                  <div className="absolute inset-0   bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-2 bg-white rounded-full"
                      title="下载"
                    >
                      {' '}
                      <Download className="h-5 w-5 text-blue-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate max-w-[70%]" title={file.name}>
                    {file.name}
                  </p>
                  <span className="text-sm text-gray-500">
                    {STANDARD_SIZES.find((format) => format.label === file.name)?.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IDPhotoPage;
