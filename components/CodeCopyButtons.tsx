'use client';

import { useEffect } from 'react';

/**
 * 代码块增强：
 *  - 给每个 <pre> 包一层 .code-block（方便做圆角/阴影）
 *  - 右上角加「复制」按钮，复制纯文本代码
 *  - 悬停代码块时显示行号列
 */
export default function CodeCopyButtons() {
  useEffect(() => {
    const root = document.getElementById('article-content');
    if (!root) return;

    const pres = Array.from(root.querySelectorAll('pre'));
    const cleanups: Array<() => void> = [];

    pres.forEach((pre) => {
      // 已经处理过就跳过
      if (pre.parentElement?.classList.contains('code-block')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', '复制代码');
      btn.innerHTML =
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '<span>复制</span>';

      const onClick = async () => {
        const code = pre.querySelector('code');
        const text = (code?.textContent ?? pre.textContent ?? '').replace(/\n$/, '');
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // 兜底：非安全上下文下 clipboard 不可用
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
          } catch {
            /* ignore */
          }
          document.body.removeChild(ta);
        }
        btn.dataset.copied = 'true';
        const label = btn.querySelector('span');
        if (label) label.textContent = '已复制';
        window.setTimeout(() => {
          btn.dataset.copied = 'false';
          if (label) label.textContent = '复制';
        }, 1800);
      };

      btn.addEventListener('click', onClick);
      wrapper.appendChild(btn);

      cleanups.push(() => {
        btn.removeEventListener('click', onClick);
        // 还原结构，避免热更新时 DOM 混乱
        const parent = wrapper.parentNode;
        if (parent) {
          while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
          parent.removeChild(wrapper);
        }
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
