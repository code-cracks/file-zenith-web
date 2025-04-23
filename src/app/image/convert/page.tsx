'use client';

import { useState, useRef } from 'react';
import { Upload, Download, RotateCw, Trash2, FileImage } from 'lucide-react';
import JSZip from 'jszip';

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
  {
    name: 'WebP',
    mimeType: 'image/webp',
    extension: '.webp',
    tips: '现代格式，较小文件大小，支持透明和动画',
  },
  { name: 'BMP', mimeType: 'image/bmp', extension: '.bmp', tips: '无损格式，文件较大，不支持透明' },
];

export default function ImageConvert() {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(SUPPORTED_FORMATS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [output, setOutput] = useState<{ name: string; url: string }[]>([]);

  const formatNameList = SUPPORTED_FORMATS.map((format) => format.name);

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
      setOutput([]);
    }
  };

  // 删除选定的文件
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // 清空所有文件
  const clearFiles = () => {
    setFiles([]);
    setOutput([]);
  };

  // 转换图片格式
  const convertImages = async () => {
    if (!files.length) return;

    setConverting(true);

    const convertedFiles: { name: string; url: string }[] = [];

    try {
      for (const file of files) {
        // 检查是否需要转换（如果源文件已经是目标格式则跳过转换）
        const originalExt = file.name.split('.').pop()?.toLowerCase();
        const targetExt = selectedFormat.extension.substring(1);

        if (originalExt === targetExt) {
          // 如果源文件已经是目标格式，只需创建一个URL
          const url = URL.createObjectURL(file);
          convertedFiles.push({
            name: file.name,
            url: url,
          });
          continue;
        }

        // 创建一个canvas来进行图片转换
        const img = document.createElement('img');
        const imgLoaded = new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });

        img.src = URL.createObjectURL(file);
        await imgLoaded;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('无法创建canvas上下文');
        }

        // 设置canvas尺寸为图片尺寸
        canvas.width = img.width;
        canvas.height = img.height;

        // 在canvas上绘制图片
        ctx.drawImage(img, 0, 0);

        // 将canvas转换为Blob对象
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else throw new Error('转换失败');
          }, selectedFormat.mimeType);
        });

        // 创建一个URL来表示转换后的图片
        const url = URL.createObjectURL(blob);

        // 生成新的文件名
        const fileName = file.name.split('.');
        fileName.pop(); // 移除原始扩展名

        const newFileName = `${fileName.join('.')}${selectedFormat.extension}`;

        convertedFiles.push({
          name: newFileName,
          url: url,
        });
      }

      setOutput(convertedFiles);
    } catch (error) {
      console.error('转换过程中出错:', error);
      alert('转换过程中出错，请重试');
    } finally {
      setConverting(false);
    }
  };

  // 下载单个文件
  const downloadFile = (file: { name: string; url: string }) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 批量下载所有转换后的文件
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
      a.download = `转换后的图片_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error('下载文件时出错:', error);
      alert('下载文件时出错，请重试');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">图片格式转换</h1>

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
            <span className="text-blue-600 font-medium">点击上传</span>
            <span className="text-gray-500">或拖拽文件到此区域</span>
          </div>
          <p className="text-sm text-gray-400">
            支持 {formatNameList.join(', ')} 格式（单次最多20个文件）
          </p>
        </label>
      </div>

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="mt-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">已上传的文件 ({files.length})</h2>
            <button
              onClick={clearFiles}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span>清空全部</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="group relative rounded-lg overflow-hidden mb-2 h-40 bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="truncate max-w-[70%]" title={file.name}>
                    {file.name}
                  </p>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 格式选择和转换按钮 */}
      {files.length > 0 && (
        <div className="mt-8 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold mb-2">选择转换格式</h2>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_FORMATS.map((format) => (
                  <button
                    key={format.name}
                    onClick={() => setSelectedFormat(format)}
                    className={`
                      px-4 py-2 rounded-md border transition-colors
                      ${
                        selectedFormat.name === format.name
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:border-blue-300'
                      }
                    `}
                  >
                    {format.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={convertImages}
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
                  转换中...
                </>
              ) : (
                <>
                  <RotateCw className="h-5 w-5 mr-2" />
                  转换为 {selectedFormat.name}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 转换结果 */}
      {output.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">转换结果 ({output.length})</h2>
            <button
              onClick={downloadAllFiles}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <Download className="h-4 w-4 mr-1" />
              <span>{output.length > 1 ? '下载全部 (ZIP)' : '下载'}</span>
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
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-2 bg-white rounded-full"
                      title="下载"
                    >
                      <Download className="h-5 w-5 text-blue-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate max-w-[70%]" title={file.name}>
                    {file.name}
                  </p>
                  <span className="text-sm text-gray-500">
                    {
                      SUPPORTED_FORMATS.find(
                        (format) => format.extension === '.' + file.name.split('.').pop(),
                      )?.name
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-16 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileImage className="h-5 w-5 mr-2" />
          图片格式转换说明
        </h2>
        <div className="space-y-4">
          <p>
            本工具支持将图片在 {formatNameList.slice(0, -1).join('、')} 和{' '}
            {formatNameList[formatNameList.length - 1]} 格式之间相互转换。
          </p>
          <div>
            <h3 className="font-medium mb-2">格式特点：</h3>
            <ul className="list-disc pl-6 space-y-1">
              {SUPPORTED_FORMATS.map((format) => (
                <li key={format.name}>
                  <strong>{format.name}：</strong>
                  {format.tips}
                </li>
              ))}
            </ul>
          </div>
          <p>
            <strong>注意：</strong>{' '}
            从透明背景格式(如PNG)转换到不支持透明的格式(如JPG)时，透明区域会变为白色背景。
          </p>
        </div>
      </div>
    </div>
  );
}
