import { FileImage, FileOutput, Video, Film } from 'lucide-react';

export interface ToolItem {
  title: string;
  href: string;
}

export interface ToolCategory {
  title: string;
  icon: any; // Lucide icon component type
  children: ToolItem[];
}

export const tools: ToolCategory[] = [
  {
    title: '图片工具',
    icon: FileImage,
    children: [
      // 基础处理
      { title: '图片压缩', href: '/image/compress' },
      { title: '格式转换', href: '/image/convert' },
      { title: '调整尺寸', href: '/image/resize' },

      // 智能编辑
      { title: '智能抠图', href: '/image/remove-bg' },
      { title: '证件照制作', href: '/image/id-photo' },
      { title: '水印处理', href: '/image/watermark' },
      { title: '相机水印', href: '/image/camera-watermark' },
      // 创意编辑
      { title: '图片拼图', href: '/image/collage' },
      { title: '九宫格切图', href: '/image/grid-cut' },
      { title: '长图切割', href: '/image/split' },

      // 美化工具
      { title: '滤镜美化', href: '/image/filter' },
      { title: '文字装饰', href: '/image/text' },
      { title: '边框美化', href: '/image/border' },
    ],
  },
  {
    title: 'PDF工具',
    icon: FileOutput,
    children: [
      { title: 'PDF工具', href: '/pdf' },
      // { title: 'PDF转Word', href: '/pdf/to-word' },
      // { title: 'PDF转图片', href: '/pdf/to-image' },
      // { title: '拆分PDF', href: '/pdf/split' },
      // { title: '压缩PDF', href: '/pdf/compress' },
    ],
  },
  {
    title: '视频工具',
    icon: Video,
    children: [
      { title: '视频压缩', href: '/video/compress' },
      { title: '视频转GIF', href: '/video/to-gif' },
      { title: '视频剪辑', href: '/video/trim' },
    ],
  },
  {
    title: 'GIF工具',
    icon: Film,
    children: [
      { title: 'GIF压缩', href: '/gif/compress' },
      { title: 'GIF剪辑', href: '/gif/trim' },
    ],
  },
];
