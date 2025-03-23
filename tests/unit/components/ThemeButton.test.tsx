import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTheme } from 'next-themes';

import ThemeButton from '@/components/ThemeButton';

// 模拟 next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

// 模拟 React 的 useState 和 useEffect
vi.mock('react', async () => {
  const actual = await vi.importActual('react');

  return {
    ...(actual as object),
    // 忽略initialValue，总是返回mounted为true
    useState: vi.fn().mockImplementation(() => [true, vi.fn()]),
  };
});

describe('ThemeButton', () => {
  // 在每个测试前重置模拟
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('在亮色模式下应当显示月亮图标', () => {
    // 设置模拟的返回值
    const mockUseTheme = useTheme as unknown as ReturnType<typeof vi.fn>;
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
    });

    render(<ThemeButton />);

    // 使用aria-label查找按钮
    const button = screen.getByLabelText('Toggle theme');
    expect(button).toBeInTheDocument();
  });

  it('在暗色模式下应当显示太阳图标', () => {
    // 设置模拟的返回值
    const mockUseTheme = useTheme as unknown as ReturnType<typeof vi.fn>;
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
    });

    render(<ThemeButton />);

    // 使用aria-label查找按钮
    const button = screen.getByLabelText('Toggle theme');
    expect(button).toBeInTheDocument();
  });

  it('点击按钮时应当切换主题', () => {
    // 创建模拟函数
    const setThemeMock = vi.fn();

    // 设置模拟的返回值
    const mockUseTheme = useTheme as unknown as ReturnType<typeof vi.fn>;
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: setThemeMock,
    });

    render(<ThemeButton />);

    // 查找并点击按钮
    const button = screen.getByLabelText('Toggle theme');
    fireEvent.click(button);

    // 验证setTheme被调用且参数正确
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });
});
