'use client';

import React from 'react';

import GifBatchCompressor from './_components/GifBatchCompressor';

const GifCompress = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="w-full">
        {/* 页面标题与简介 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 dark:text-white">GIF批量压缩工具</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            上传多个GIF文件进行批量压缩，可单独调整每个GIF的压缩参数，支持单个下载或打包下载全部处理后的文件。
          </p>
        </div>

        {/* 主工具区域 */}
        <div className="bg-white rounded-lg p-6 dark:bg-gray-800 shadow-md">
          <GifBatchCompressor />
        </div>
      </div>
    </div>
  );
};

export default GifCompress;
