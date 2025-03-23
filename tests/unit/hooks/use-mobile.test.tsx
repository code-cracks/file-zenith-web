import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  const matchMediaMock = vi.fn();
  const addEventListenerMock = vi.fn();
  const removeEventListenerMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // 模拟matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    // 模拟返回的媒体查询对象
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    });
  });

  afterEach(() => {
    // 恢复原始窗口宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
  });

  it('应该在移动设备宽度下返回true', () => {
    // 设置窗口宽度为移动设备宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375, // 移动设备宽度小于768
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('应该在桌面宽度下返回false', () => {
    // 设置窗口宽度为桌面宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024, // 桌面宽度大于768
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('应该为媒体查询添加事件监听器', () => {
    renderHook(() => useIsMobile());

    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)');
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('应该在卸载时清理事件监听器', () => {
    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('应该在媒体查询变化时更新状态', () => {
    // 设置窗口宽度为桌面宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // 模拟媒体查询变化并触发回调
    act(() => {
      // 捕获添加事件监听器时的回调函数
      const callback = addEventListenerMock.mock.calls[0][1];

      // 更改窗口宽度为移动设备宽度
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
      });

      // 调用回调函数
      callback();
    });

    // 验证状态已更新
    expect(result.current).toBe(true);
  });
});
