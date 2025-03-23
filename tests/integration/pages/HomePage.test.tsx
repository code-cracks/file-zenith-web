import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TestProviders } from '../utils/test-providers';

import Home from '@/app/page';
import Header from '@/components/Header';

// 确保vi被正确导入

// 模拟next/link组件
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// 模拟useTheme hook
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

const matchMediaMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // 设置窗口宽度
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: 1024,
  });

  // 模拟 matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMediaMock,
  });

  // 模拟返回的媒体查询对象
  matchMediaMock.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

/**
 * 这是一个集成测试，测试首页与头部的集成
 * 这种模拟的方式更接近真实情况，而不是单元测试中的高度隔离
 */
describe('首页集成测试', () => {
  /**
   * 创建一个模拟的主页，包含 Header 和主页内容
   * 这样可以测试它们之间的交互
   */
  function MockHomePage() {
    return (
      <TestProviders>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Home />
          </main>
        </div>
      </TestProviders>
    );
  }

  it('应该同时渲染 Header 和首页内容', () => {
    render(<MockHomePage />);

    // 检查 Header 中的元素
    expect(screen.getByText('❤️ PDF')).toBeInTheDocument();

    // 检查主页内容
    expect(screen.getByText('欢迎使用 PDF 工具')).toBeInTheDocument();
    expect(screen.getByText(/提供各种 PDF 和图片处理工具/)).toBeInTheDocument();
  });

  it('应该适当地集成主题功能', () => {
    // 在这个测试中不需要更改主题模拟，使用默认的模拟即可
    render(<MockHomePage />);

    // 检查主题切换按钮是否存在
    const themeButton = screen.getByLabelText('Toggle theme');
    expect(themeButton).toBeInTheDocument();

    // 检查页面内容是否正确渲染
    expect(screen.getByText('欢迎使用 PDF 工具')).toBeInTheDocument();
  });

  it('在移动视图下应适当地响应式显示', () => {
    // 设置窗口宽度为移动设备宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    // 模拟媒体查询为移动视图
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<MockHomePage />);

    // 检查移动视图下的菜单按钮存在
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();

    // 确认页面内容在移动视图下仍然渲染
    expect(screen.getByText('欢迎使用 PDF 工具')).toBeInTheDocument();
  });
});
