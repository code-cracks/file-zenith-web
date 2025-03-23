import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Header from '@/components/Header';
import ThemeButton from '@/components/ThemeButton';

// 创建模拟函数
const mockSetTheme = vi.fn();

// 模拟next/link组件
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// 模拟next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    theme: 'light', // 这里指定为light主题
    setTheme: mockSetTheme,
  }),
}));

// 模拟React的useState和useEffect
vi.mock('react', async () => {
  const actual = await vi.importActual('react');

  return {
    ...(actual as object),
    useState: vi.fn().mockImplementation((initialValue) => {
      // 确保ThemeButton中的mounted状态始终为true
      if (initialValue === false) {
        return [true, vi.fn()];
      }

      // 为其他组件返回正常的useState行为
      return [initialValue, vi.fn()];
    }),
  };
});

// matchMedia模拟
const matchMediaMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // 模拟窗口宽度
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: 1024,
  });

  // 模拟matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMediaMock,
  });

  // 设置默认返回值
  matchMediaMock.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

describe('ThemeButton单独测试', () => {
  it('点击按钮时应切换主题', () => {
    render(<ThemeButton />);

    const button = screen.getByLabelText('Toggle theme');
    fireEvent.click(button);

    // 验证setTheme被调用，且参数为dark
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});

describe('Header 与 ThemeButton 集成', () => {
  it('Header 应该包含 ThemeButton 组件', () => {
    render(<Header />);

    const themeButton = screen.getByLabelText('Toggle theme');
    expect(themeButton).toBeInTheDocument();
  });

  it('点击 Header 中的 ThemeButton 应该切换主题', () => {
    render(<Header />);

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

    render(<Header />);

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

    render(<Header />);

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
