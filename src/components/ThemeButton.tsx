'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

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
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md focus:outline-none"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-300" />
      ) : (
        <Moon className="h-5 w-5 text-gray-100" />
      )}
    </button>
  );
}

export default ThemeButton;
