'use client';

import React from 'react';

import GifTrimmer from './_components/GifTrimmer';

const GifTrim = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="w-full">
        {/* 页面标题与简介 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 dark:text-white">GIF剪辑工具</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            上传GIF文件进行剪辑，可设置起始时间和结束时间、裁剪尺寸，为您的动图精确剪辑。
          </p>
        </div>

        {/* 主工具区域 */}
        <div className="bg-white rounded-lg p-6 dark:bg-gray-800 shadow-md">
          <GifTrimmer />
        </div>
      </div>
    </div>
  );
};

export default GifTrim;
