'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const themeMap = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

type ThemeKey = keyof typeof themeMap;

function ThemeButton() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // 增加客户端状态标记
  useEffect(() => {
    setMounted(true);
  }, []);

  // 服务端渲染时不显示任何内容
  if (!mounted) {
    return null;
  }

  return (
    <div className="p-8 space-y-4">
      {/* 测试文案 */}
      <button onClick={() => setTheme(themeMap[theme as ThemeKey])}>
        {themeMap[theme as ThemeKey]}
      </button>
    </div>
  );
}

export default ThemeButton;
