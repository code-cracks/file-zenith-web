import { describe, it, expect } from 'vitest';

import { cn } from '@/utils/cn';

describe('cn utility function', () => {
  it('应该合并多个类名字符串', () => {
    const result = cn('text-red-500', 'bg-blue-500', 'p-4');
    expect(result).toBe('text-red-500 bg-blue-500 p-4');
  });

  it('应该处理条件类名', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class', !isActive && 'inactive-class');
    expect(result).toBe('base-class active-class');
  });

  it('应该通过tailwind-merge解决类名冲突', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('应该正确处理对象形式的类名', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-500': false,
      'p-4': true,
    });
    expect(result).toBe('text-red-500 p-4');
  });

  it('应该处理数组形式的类名', () => {
    const result = cn(['text-red-500', 'p-4'], 'bg-blue-500');
    expect(result).toBe('text-red-500 p-4 bg-blue-500');
  });

  it('应该忽略null、undefined和false值', () => {
    const result = cn('text-red-500', null, undefined, false, 'p-4');
    expect(result).toBe('text-red-500 p-4');
  });
});
