"use client";
import { useEffect, useRef } from 'react';

/**
 * 点击涟漪。
 *
 * 性能要点（旧版是本站最主要的卡顿来源之一）：
 *  1. 旧版 `animate()` 无条件自调用 requestAnimationFrame，即使没有任何涟漪，
 *     也在每帧对全屏 canvas 执行 clearRect —— 等于常年白跑 60fps。
 *     现在改为「有涟漪才启动循环，涟漪清空即停止」。
 *  2. 标签页隐藏时直接停止循环。
 *  3. 只在整数像素尺寸下工作，避免每帧的亚像素采样。
 */
export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return;
    // 收窄成非空常量：TS 不会把上面的 guard 带进后面 class 方法的作用域
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    interface RippleInstance {
      x: number;
      y: number;
      r: number;
      opacity: number;
      velocity: number;
      update(): void;
      draw(): void;
    }

    const ripples: RippleInstance[] = [];
    let rafId = 0;
    let running = false;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const loop = () => {
      if (document.hidden) {
        // 后台就停下来，回到前台由 visibilitychange 重新启动
        running = false;
        rafId = 0;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < ripples.length; i++) {
        ripples[i].update();
        ripples[i].draw();
        if (ripples[i].opacity <= 0) {
          ripples.splice(i, 1);
          i--;
        }
      }

      if (ripples.length === 0) {
        // 没有活跃涟漪 → 停止循环，下一次点击再启动
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        running = false;
        rafId = 0;
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    };

    class Ripple implements RippleInstance {
      x: number;
      y: number;
      r: number;
      opacity: number;
      velocity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.r = 0;
        this.opacity = 0.6;
        this.velocity = 2.5;
      }

      update() {
        this.r += this.velocity;
        this.velocity *= 0.96;
        this.opacity -= 0.015;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(129, 140, 248, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${this.opacity * 0.3})`;
        ctx.fill();
      }
    }

    const handleClick = (e: MouseEvent) => {
      ripples.push(new Ripple(e.clientX, e.clientY));
      start();
    };

    const handleVisibility = () => {
      if (!document.hidden && ripples.length > 0) start();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('click', handleClick);
    document.addEventListener('visibilitychange', handleVisibility);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden
    />
  );
}
