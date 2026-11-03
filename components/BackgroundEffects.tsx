"use client";
import { useTheme } from './ThemeProvider';
import Fireflies from './Fireflies';
import Sakura from './Sakura';
import WindyGrass from './WindyGrass';

export default function BackgroundEffects() {
  const { isDark } = useTheme();

  return (
    <>
      {/* 只渲染当前主题需要的那一组。
          以前两组同时挂载、靠 opacity 切换 —— 但 opacity: 0 并不会让 CSS 动画停下，
          等于白跑一整套（萤火虫 + 樱花，共 90 个动画）。
          主题切换时的交叉淡入换成了瞬间替换，视觉损失极小。 */}
      {isDark ? <Fireflies /> : <Sakura />}

      {/* 草地一直存在，但它内部会自动改变颜色 */}
      <WindyGrass />
    </>
  );
}