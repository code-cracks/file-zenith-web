import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// 创建一个模拟的 ThemeProvider
const MockThemeProvider: React.FC<{
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
}> = ({ children }) => {
  return <>{children}</>;
};

// 模拟next-themes库
vi.mock('next-themes', () => ({
  ThemeProvider: MockThemeProvider,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

/**
 * 组合多个 Provider 以用于测试
 */
interface TestProvidersProps {
  children: React.ReactNode;
  /** 初始主题，默认为light */
  initialTheme?: string;
}

/**
 * 为测试提供必要的上下文提供者
 * 这里我们使用模拟的ThemeProvider，以便测试能够顺利运行
 */
export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialTheme = 'light',
}) => {
  return (
    <MockThemeProvider attribute="class" defaultTheme={initialTheme} enableSystem={false}>
      {children}
    </MockThemeProvider>
  );
};

/**
 * 使用所有必要的提供者渲染UI
 * @param ui 要渲染的React组件
 * @param options 渲染选项
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    ...options,
  });
}
