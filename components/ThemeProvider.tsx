"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 默认夜色（花谷主题）。首帧的 html.dark 由布局 head 里的内联脚本同步加上，
  // 这里保持同样的默认值，避免 hydration 后出现一次「闪白」。
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem('blog-theme');
    // 只有明确选过浅色才切走，其余（未设置 / dark）都留在夜色
    const isDarkMode = savedTheme !== 'light';
    setIsDark(isDarkMode);

    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
  }, []);

  // 监听 isDark 状态，只要它变了，立刻强制更新 html 标签，防止路由切换丢失
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark, mounted]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('blog-theme', newDark ? 'dark' : 'light');
  };

  // 不再在挂载前隐藏内容。
  // 早期版本用 `invisible` 等 hydration，脚本一慢整页就是空白 —— 与「内容默认可见」
  // 的渐进增强原则冲突。主题只影响 html 上的类名，不存在结构差异，可以直接渲染。
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
