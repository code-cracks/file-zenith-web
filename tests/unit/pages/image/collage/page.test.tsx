import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// import { useRouter } from 'next/router';
import Page from '@/app/image/collage/page';

// 模拟 next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    query: {},
  }),
}));

// 模拟文件读取和图片加载
class MockFileReader {
  result = '';
  onload: ((this: FileReader, ev: ProgressEvent) => void) | null = null;

  readAsDataURL() {
    this.result = 'data:image/png;base64,mock';
    this.onload?.(new ProgressEvent('load'));
  }
}

global.FileReader = MockFileReader as any;

// 模拟 Canvas 上下文
const mockDrawImage = vi.fn();
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  drawImage: mockDrawImage,
  fillStyle: '',
  canvas: {
    toDataURL: vi.fn(() => 'data:image/mock'),
  },
})) as any;

describe('图片拼接页面 (/image/collage)', () => {
  const user = userEvent.setup();
  const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('应正确渲染页面框架', () => {
    render(<Page />);

    // 验证核心 UI 元素
    expect(
      screen.getByRole('heading', {
        name: /图片拼接工具/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('布局模式')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '生成拼接图片' })).toBeDisabled();
  });

  describe('文件上传功能', () => {
    it('应处理多文件上传并显示预览', async () => {
      render(<Page />);

      // 执行文件上传
      const input = screen.getByLabelText(/点击上传图片/) as HTMLInputElement;
      await user.upload(input, [mockFile, mockFile]);

      // 验证加载状态
      expect(screen.getByText('生成中...')).toBeInTheDocument();

      // 验证预览渲染
      await waitFor(() => {
        expect(screen.getAllByAltText(/Image \d/)).toHaveLength(2);
        expect(screen.getByRole('button', { name: '生成拼接图片' })).toBeEnabled();
      });
    });

    it('应处理无效文件类型', async () => {
      render(<Page />);

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await user.upload(screen.getByLabelText(/点击上传图片/), [invalidFile]);

      expect(alertSpy).toHaveBeenCalledWith('仅支持图片文件');
    });
  });

  describe('布局配置功能', () => {
    beforeEach(async () => {
      render(<Page />);
      await user.upload(screen.getByLabelText(/点击上传图片/), [mockFile]);
    });

    it('应正确切换布局模式', async () => {
      const layoutSelect = screen.getByLabelText('布局模式');

      // 测试网格布局
      await user.selectOptions(layoutSelect, 'grid');
      expect(layoutSelect).toHaveValue('grid');
      expect(screen.getByLabelText('网格列数')).toHaveValue('2');

      // 测试垂直布局
      await user.selectOptions(layoutSelect, 'vertical');
      expect(screen.getByAltText(/Image 1/)).toHaveStyle({ top: '0px' });
    });

    it('应正确调整网格列数', async () => {
      await user.selectOptions(screen.getByLabelText('布局模式'), 'grid');

      const columnsInput = screen.getByLabelText('网格列数');

      await user.clear(columnsInput);
      await user.type(columnsInput, '3');

      // 验证图片排列
      await waitFor(() => {
        expect(screen.getByAltText(/Image 1/)).toHaveStyle({
          left: expect.stringMatching(/\d+px/),
        });
      });
    });

    it('应正确应用图片间距', async () => {
      const spacingSlider = screen.getByLabelText('图片间距');
      await user.click(spacingSlider);
      fireEvent.change(spacingSlider, { target: { value: '20' } });

      // 验证样式更新
      expect(screen.getByAltText(/Image 1/)).toHaveStyle({
        margin: '10px', // spacing/2
      });
    });
  });

  describe('图片生成流程', () => {
    beforeEach(async () => {
      render(<Page />);
      await user.upload(screen.getByLabelText(/点击上传图片/), [mockFile]);
    });

    it('应完成完整生成流程', async () => {
      const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

      await user.click(screen.getByRole('button', { name: '生成拼接图片' }));

      // 验证 Canvas 操作
      await waitFor(
        () => {
          expect(mockDrawImage).toHaveBeenCalled();
          expect(linkClickSpy).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });

    it('应处理空文件生成', async () => {
      // 清空已上传文件
      await user.upload(screen.getByLabelText(/点击上传图片/), []);

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      await user.click(screen.getByRole('button', { name: '生成拼接图片' }));

      expect(alertSpy).toHaveBeenCalledWith('请先上传图片');
    });
  });

  describe('响应式布局', () => {
    it('应适配移动端视图', () => {
      // 模拟移动端尺寸
      global.innerWidth = 375;
      fireEvent(window, new Event('resize'));

      render(<Page />);

      expect(screen.getByTestId('preview-container')).toHaveClass('mobile-layout');
    });
  });
});
