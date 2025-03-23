import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { TestProviders } from '../utils/test-providers';

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

// 创建模拟的setTheme函数
const mockSetTheme = vi.fn();

// 模拟useTheme hook
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

const matchMediaMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // 设置窗口宽度为桌面
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: 1024,
  });

  // 模拟matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMediaMock,
  });

  // 默认为桌面视图
  matchMediaMock.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

describe('Header 与 ThemeButton 集成', () => {
  it('Header 应该包含 ThemeButton 组件', () => {
    render(
      <TestProviders>
        <Header />
      </TestProviders>,
    );

    const themeButton = screen.getByLabelText('Toggle theme');
    expect(themeButton).toBeInTheDocument();
  });

  it('点击 ThemeButton 应该切换主题', () => {
    render(
      <TestProviders>
        <Header />
      </TestProviders>,
    );

    const themeButton = screen.getByLabelText('Toggle theme');
    fireEvent.click(themeButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('在移动视图中应展示菜单按钮', () => {
    // 设置窗口宽度为移动设备
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    // 设置媒体查询为移动视图
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(
      <TestProviders>
        <Header />
      </TestProviders>,
    );

    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('点击移动菜单按钮应打开移动导航', () => {
    // 设置窗口宽度为移动设备
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    // 设置媒体查询为移动视图
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(
      <TestProviders>
        <Header />
      </TestProviders>,
    );

    // 获取菜单按钮
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();

    // 点击打开菜单
    fireEvent.click(menuButton);

    // 移动菜单应该可见
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).toBeInTheDocument();
    expect(mobileMenu).toHaveClass('translate-x-0');
  });
});
