/**
 * 单元测试四大主要功能
 * 1. 图片上传管理
 * 2. 布局配置选择
 * 3. 可视化预览系统
 * 4. 拼接参数配置
 * 5. 图片生成和下载
 */
// import { useRouter } from 'next/router';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import path from 'path';

import Page from '@/app/image/collage/page';

// 在测试文件中添加以下类型声明和模拟
type ContextMap = {
  '2d': CanvasRenderingContext2D;
  bitmaprenderer: ImageBitmapRenderingContext;
  webgl: WebGLRenderingContext;
  webgl2: WebGL2RenderingContext;
};

const createMockContext = <T extends keyof ContextMap>(type: T): ContextMap[T] | null => {
  const mocks = {
    '2d': {
      __isMock2D: true,
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      // 其他 2D 方法
    } as unknown as CanvasRenderingContext2D,

    bitmaprenderer: {
      __isMockBitmap: true,
      transferFromImageBitmap: vi.fn(),
    } as unknown as ImageBitmapRenderingContext,

    webgl: {
      __isMockWebGL: true,
      // WebGL 方法
    } as unknown as WebGLRenderingContext,

    webgl2: {
      __isMockWebGL2: true,
      // WebGL2 方法
    } as unknown as WebGL2RenderingContext,
  };

  return mocks[type] ?? null;
};

// 类型安全的 getContext 模拟
const mockGetContext = vi.fn(
  <T extends keyof ContextMap>(
    contextId: T,
    // options?: CanvasRenderingContext2DSettings | ImageBitmapRenderingContextSettings | WebGLContextAttributes
  ): ContextMap[T] | null => {
    return createMockContext(contextId);
  },
) as unknown as {
  // 精确映射所有重载类型
  <T extends '2d'>(contextId: T, options?: CanvasRenderingContext2DSettings): ContextMap[T] | null;
  <T extends 'bitmaprenderer'>(
    contextId: T,
    options?: ImageBitmapRenderingContextSettings,
  ): ContextMap[T] | null;
  <T extends 'webgl' | 'webgl2'>(
    contextId: T,
    options?: WebGLContextAttributes,
  ): ContextMap[T] | null;
  (contextId: string): RenderingContext | null;
};

beforeEach(() => {
  // 应用模拟
  global.HTMLCanvasElement.prototype.getContext = mockGetContext;
  // 其他必要模拟
  global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test');
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
});

describe('图片拼接组件', () => {
  describe('1. 图片上传管理', () => {
    it('应正确处理多文件上传', async () => {
      const user = userEvent.setup();

      // 模拟 FileReader 同步返回结果
      class MockFileReader {
        result: any = null;
        onload: any = ({}) => {
          return {
            target: {
              result: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
            },
          };
        };
        readAsDataURL() {
          this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'; // 模拟base64数据
          this.onload?.();
        }
      }

      // 3. 模拟浏览器 API
      global.FileReader = MockFileReader as any;
      global.Image = class {
        onload: any = null;
        src: string = '';
        naturalWidth: number = 100;
        naturalHeight: number = 100;
        constructor() {
          setTimeout(() => this.onload?.()); // 模拟异步加载
        }
      } as any;

      render(<Page />);

      const image1Path = path.resolve(__dirname, '1.jpg');
      const image2Path = path.resolve(__dirname, '2.jpg');
      const image1Buffer = fs.readFileSync(image1Path);
      const image2Buffer = fs.readFileSync(image2Path);

      // 创建包含真实图片数据的 File 对象
      const realImage1 = new File([image1Buffer], '1.jpg', { type: 'image/jpeg' });
      const realImage2 = new File([image2Buffer], '2.jpg', { type: 'image/jpeg' });

      const input = screen.getByTestId('upload-button');
      // console.log('input', input);
      // 使用 upload 方法的数组形式一次性上传多个文件
      await user.upload(input, [realImage1, realImage2]);

      // 显式等待图片渲染
      const images = await screen.findAllByRole('img');
      expect(images).toHaveLength(2);

      // 增加双重等待确保状态更新完成
      await waitFor(() => {
        console.log('等待按钮可用');
        expect(screen.getByTestId('generate-btn')).toBeEnabled();
      }); // 延长超时时间
    });

    it('无图片生成按钮为空', async () => {
      const user = userEvent.setup();
      render(<Page />);

      await user.click(screen.getByTestId('generate-btn'));
      expect(screen.getByTestId('generate-btn')).toBeDisabled();
    });
  });

  describe('2. 布局配置选择', () => {
    it('应正确切换布局模式', async () => {
      const user = userEvent.setup();
      render(<Page />);

      const select = screen.getByLabelText('布局模式');
      await user.selectOptions(select, 'vertical');

      expect(select).toHaveValue('vertical');
      expect(screen.queryByLabelText('网格列数')).toBeNull();

      await user.selectOptions(select, 'grid');
      expect(screen.getByLabelText('网格列数')).toBeInTheDocument();
    });
  });

  describe('3. 可视化预览系统', () => {
    it('应正确计算图片位置', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      render(<Page />);

      const input = screen.getByTestId('upload-button').previousElementSibling!;
      await user.upload(input, [file]);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveStyle({
          left: '0px',
          top: '0px',
        });
      });
    });

    it('应响应容器尺寸变化', async () => {
      const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }));

      // 执行测试...

      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });
  });

  // describe('4. 拼接参数配置', () => {
  //   it('应更新间距参数', async () => {
  //     const user = userEvent.setup();
  //     render(<Page />);

  //     const slider = screen.getByRole('slider', { name: /图片间距/ });
  //     await user.clear(slider);
  //     await user.type(slider, '20');

  //     expect(slider).toHaveValue('20');
  //     expect(screen.getByText('20px')).toBeInTheDocument();
  //   });

  //   it('应限制网格列数输入范围', async () => {
  //     const user = userEvent.setup();
  //     render(<Page />);

  //     await user.selectOptions(screen.getByLabelText('布局模式'), 'grid');

  //     const input = screen.getByLabelText('网格列数');

  //     await user.clear(input);
  //     await user.type(input, '0');
  //     expect(input).toHaveValue('1');

  //     await user.clear(input);
  //     await user.type(input, '7');
  //     expect(input).toHaveValue('6');
  //   });
  // });

  // describe('5. 图片生成和下载', () => {
  //   it('应生成正确尺寸的图片', async () => {
  //     const user = userEvent.setup();
  //     const file = new File(['test'], 'test.png', { type: 'image/png' });
  //     render(<Page />);

  //     const input = screen.getByTestId('upload-button').previousElementSibling!;
  //     await user.upload(input, [file]);

  //     const createElementSpy = vi.spyOn(document, 'createElement');
  //     await user.click(await screen.findByTestId('generate-btn'));

  //     expect(createElementSpy).toHaveBeenCalledWith('canvas');
  //     expect(global.URL.createObjectURL).toHaveBeenCalled();
  //   });

  //   it('应使用配置的质量参数', async () => {
  //     const user = userEvent.setup();
  //     render(<Page />);

  //     const qualityInput = screen.getByRole('spinbutton', { name: /输出质量/ });
  //     await user.clear(qualityInput);
  //     await user.type(qualityInput, '0.8');

  //     // 执行生成操作并验证...
  //   });
  // });
});
