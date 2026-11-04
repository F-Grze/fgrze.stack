"use client";

/**
 * NightValley —— 夜色花谷背景。
 *
 * 原站的 3D 花谷是 gladeye 的编译产物（three.js r154 + 自定义 shader + 后期合成），
 * 源码不可得，因此这里用 Canvas2D 复刻它的**观感与行为**，而不是重建它的实现：
 *
 *   · 数千个点精灵组成的发光花田与草叶，按透视散落在谷地上；
 *   · 相机沿路径缓慢前推，花朵由小及大地「靠近」镜头，草叶留在更远处；
 *   · 鼠标在屏幕空间把每个点推开（越近推得越开），靠近光标的点会发亮；
 *   · 快速滚动时暗角收紧、光线拉伸，静止时几乎只剩呼吸；
 *   · startHoverTransition() 让镜头缓停、花群炸散成漂浮光粒，stopHoverTransition() 复原。
 *
 * 性能约束：
 *   · 所有光晕都来自预渲染精灵（64px），不用 filter / shadowBlur 逐帧计算；
 *   · DPR 上限 2，移动端降到 1.5，并按视口宽度削减粒子数；
 *   · 标签页隐藏即停帧；prefers-reduced-motion 下只渲染一帧静态画面。
 */

import { useEffect, useRef } from "react";

type Flower = {
  ox: number; // 归一化横向位置
  oy: number; // 归一化高度偏移
  oz: number; // 深度 0（最近）→ 1（最远）
  r: number; // 尺寸系数
  ph: number; // 闪烁相位
  tint: number; // 取色索引
  sp: number; // 前进速度系数
};

type Blade = { ox: number; oz: number; h: number; lean: number; ph: number; sp: number };
type Mote = { x: number; y: number; r: number; vx: number; vy: number; ph: number };
type Bokeh = { x: number; y: number; r: number; vx: number; vy: number; ph: number };

const TINTS = ["245,239,226", "238,222,190", "208,228,200", "250,246,236"];

export default function NightValley({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let horizon = 0;
    let cx = 0;

    let flowers: Flower[] = [];
    let blades: Blade[] = [];
    let motes: Mote[] = [];
    let bokeh: Bokeh[] = [];

    /* ---------------- 预渲染精灵 ---------------- */

    const makeCanvas = (size: number) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      return c;
    };

    /** 发光花：中心亮核 + 五瓣柔光 + 外层光晕 */
    const flowerSprite = (color: string) => {
      const S = 64;
      const c = makeCanvas(S);
      const g = c.getContext("2d")!;
      const m = S / 2;

      const halo = g.createRadialGradient(m, m, 0, m, m, m);
      halo.addColorStop(0, `rgba(${color},0.95)`);
      halo.addColorStop(0.18, `rgba(${color},0.42)`);
      halo.addColorStop(0.55, `rgba(${color},0.10)`);
      halo.addColorStop(1, `rgba(${color},0)`);
      g.fillStyle = halo;
      g.fillRect(0, 0, S, S);

      // 花瓣：五个小光斑，让近景的花有轮廓而不只是一团雾
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = m + Math.cos(a) * 7.5;
        const py = m + Math.sin(a) * 7.5;
        const petal = g.createRadialGradient(px, py, 0, px, py, 9);
        petal.addColorStop(0, `rgba(255,253,246,0.5)`);
        petal.addColorStop(0.5, `rgba(${color},0.34)`);
        petal.addColorStop(1, `rgba(${color},0)`);
        g.fillStyle = petal;
        g.beginPath();
        g.arc(px, py, 8, 0, Math.PI * 2);
        g.fill();
      }

      const core = g.createRadialGradient(m, m, 0, m, m, 7);
      core.addColorStop(0, "rgba(255,255,250,1)");
      core.addColorStop(0.45, "rgba(255,250,232,0.9)");
      core.addColorStop(1, "rgba(255,250,232,0)");
      g.fillStyle = core;
      g.beginPath();
      g.arc(m, m, 7, 0, Math.PI * 2);
      g.fill();

      return c;
    };

    const flowerSprites = TINTS.map(flowerSprite);

    /* ---------------- 场景生成 ---------------- */

    const build = () => {
      const small = W < 760;
      const nFlowers = small ? 280 : 780;
      const nBlades = small ? 190 : 460;
      const nMotes = small ? 55 : 110;

      flowers = Array.from({ length: nFlowers }, () => ({
        ox: rand(-1, 1),
        oy: rand(-1, 1),
        oz: Math.random(),
        r: rand(0.55, 1.5),
        ph: Math.random() * Math.PI * 2,
        tint: Math.random() < 0.68 ? 0 : Math.random() < 0.5 ? 1 : Math.random() < 0.6 ? 2 : 3,
        sp: rand(0.7, 1.45),
      }));

      blades = Array.from({ length: nBlades }, () => ({
        ox: rand(-1, 1),
        oz: 0.25 + Math.random() * 0.75,
        h: rand(0.5, 1.9),
        lean: rand(-1, 1),
        ph: Math.random() * Math.PI * 2,
        sp: rand(0.4, 0.9),
      }));

      // 空中漂浮的光斑：让页面上半部（天空区）也有呼吸感，
      // 否则内容遮住花田后，顶部只剩一片死黑。
      bokeh = Array.from({ length: small ? 9 : 18 }, () => ({
        x: rand(-1, 1),
        y: rand(0, 1),
        r: rand(6, 18),
        vx: rand(-0.008, 0.008),
        vy: rand(-0.014, -0.002),
        ph: Math.random() * Math.PI * 2,
      }));

      motes = Array.from({ length: nMotes }, () => ({
        x: rand(-1, 1),
        y: rand(0, 1),
        r: rand(0.4, 2.2),
        vx: rand(-0.012, 0.012),
        vy: rand(-0.02, -0.004),
        ph: Math.random() * Math.PI * 2,
      }));
    };

    /* ---------------- 山脊剪影 ---------------- */

    type Ridge = { path: Path2D; fill: string; depth: number; rim: string };
    let ridges: Ridge[] = [];

    const buildRidges = () => {
      const layers = [
        { base: 0.40, amp: 0.075, fill: "#0e1c16", rim: "none", depth: 0.25 },
        { base: 0.50, amp: 0.055, fill: "#0a1611", rim: "none", depth: 0.55 },
        { base: 0.62, amp: 0.038, fill: "#06100c", rim: "none", depth: 0.95 },
      ];
      const pad = W * 0.12;
      ridges = layers.map((L, li) => {
        const path = new Path2D();
        const steps = 26;
        const y = (i: number) => {
          const t = i / steps;
          return (
            horizon +
            H *
              (L.base +
                Math.sin(t * 5.1 + li * 2.1) * L.amp +
                Math.sin(t * 11.3 + li * 4.7) * L.amp * 0.45 +
                Math.sin(t * 23.7 + li * 1.3) * L.amp * 0.18)
          );
        };
        path.moveTo(-pad, H + 10);
        for (let i = 0; i <= steps; i++) path.lineTo(-pad + ((W + pad * 2) * i) / steps, y(i));
        path.lineTo(W + pad, H + 10);
        path.closePath();
        return { path, fill: L.fill, rim: L.rim, depth: L.depth };
      });
    };

    /* ---------------- 尺寸 ---------------- */

    let vignette: HTMLCanvasElement | null = null;
    let skyLayer: HTMLCanvasElement | null = null;
    let raysLayer: HTMLCanvasElement | null = null;
    let mistGrad: CanvasGradient | null = null;

    let lastW = 0;
    let lastH = 0;

    const resize = () => {
      if (window.innerWidth === lastW && window.innerHeight === lastH) return;
      W = window.innerWidth;
      H = window.innerHeight;
      lastW = W;
      lastH = H;
      dpr = Math.min(window.devicePixelRatio || 1, W < 760 ? 1.5 : 2);

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";

      cx = W / 2;
      horizon = H * 0.42;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* 天空 + 地平线光晕 + 光束都是「静态」图层，烘焙到离屏画布上，
         每帧只做一次 drawImage。全屏渐变填充在软件光栅化下非常贵，
         之前每帧要铺 5 次全屏渐变，占了一半以上的绘制时间。 */
      skyLayer = document.createElement("canvas");
      skyLayer.width = Math.round(W);
      skyLayer.height = Math.round(H);
      const sg = skyLayer.getContext("2d")!;

      const sky = sg.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#03050a");
      sky.addColorStop(0.38, "#050a0b");
      sky.addColorStop(0.52, "#08110f");
      sky.addColorStop(0.72, "#060b09");
      sky.addColorStop(1, "#040705");
      sg.fillStyle = sky;
      sg.fillRect(0, 0, W, H);

      const glowR = Math.max(W, H) * 0.6;
      const glow = sg.createRadialGradient(cx, horizon, 0, cx, horizon, glowR);
      glow.addColorStop(0, "rgba(120,150,110,0.12)");
      glow.addColorStop(0.35, "rgba(70,100,80,0.05)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      sg.fillStyle = glow;
      sg.fillRect(0, 0, W, H);

      // 光束：椭圆径向渐变，边缘完全羽化
      raysLayer = document.createElement("canvas");
      raysLayer.width = Math.round(W);
      raysLayer.height = Math.round(H);
      const rg2 = raysLayer.getContext("2d")!;
      rg2.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        const a = -0.34 + i * 0.2;
        const ox = cx + (i - 1) * W * 0.26;
        rg2.save();
        rg2.translate(ox, horizon - H * 0.02);
        rg2.rotate(a);
        rg2.scale(1, 3.4);
        const g2 = rg2.createRadialGradient(0, 0, 0, 0, 0, H * 0.4);
        g2.addColorStop(0, "rgba(198,224,188,0.085)");
        g2.addColorStop(0.42, "rgba(170,205,175,0.03)");
        g2.addColorStop(1, "rgba(150,190,160,0)");
        rg2.fillStyle = g2;
        rg2.beginPath();
        rg2.arc(0, 0, H * 0.4, 0, Math.PI * 2);
        rg2.fill();
        rg2.restore();
      }

      const mist = ctx.createLinearGradient(0, horizon - H * 0.08, 0, horizon + H * 0.3);
      mist.addColorStop(0, "rgba(6,11,9,0)");
      mist.addColorStop(0.3, "rgba(7,13,10,0.40)");
      mist.addColorStop(1, "rgba(5,9,7,0)");
      mistGrad = mist;

      // 暗角：低分辨率离屏画一次，之后每帧只做一次拉伸绘制
      const vw = Math.max(2, Math.round(W / 3));
      const vh = Math.max(2, Math.round(H / 3));
      vignette = document.createElement("canvas");
      vignette.width = vw;
      vignette.height = vh;
      const vg = vignette.getContext("2d")!;
      const r = vg.createRadialGradient(
        vw / 2,
        vh * 0.46,
        Math.min(vw, vh) * 0.16,
        vw / 2,
        vh / 2,
        Math.max(vw, vh) * 0.78,
      );
      r.addColorStop(0, "rgba(0,0,0,0)");
      r.addColorStop(0.55, "rgba(0,0,0,0.18)");
      r.addColorStop(0.82, "rgba(2,4,3,0.62)");
      r.addColorStop(1, "rgba(1,2,2,0.92)");
      vg.fillStyle = r;
      vg.fillRect(0, 0, vw, vh);

      build();
      buildRidges();
    };

    /* ---------------- 交互状态 ---------------- */

    let mx = -9999;
    let my = -9999;
    let targetMx = 0;
    let targetMy = 0;
    let tiltX = 0;
    let tiltY = 0;

    let speed = 0.16; // 0.12 怠速 → 1 冲刺
    let targetSpeed = 0;
    let travel = 0;

    let hover = 0; // 0 → 1，接近过渡的插值
    let hoverOn = false;

    let lastScroll = 0;
    let scrollPulse = 0;

    let raf = 0;
    let last = 0;
    let running = true;

    // 低端设备的兜底：连续掉帧就把粒子密度砍半（只做一次，避免画面反复跳动）
    let ema = 16;
    let thinned = false;

    const onPointer = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      targetMx = (e.clientX / W - 0.5) * 2;
      targetMy = (e.clientY / H - 0.5) * 2;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
      targetMx = 0;
      targetMy = 0;
    };
    const onScroll = () => {
      const y = window.scrollY;
      scrollPulse = Math.min(1, Math.abs(y - lastScroll) / 90);
      lastScroll = y;
    };
    const onVisibility = () => {
      if (reduced) return;
      running = !document.hidden;
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    };

    /* ---------------- 绘制 ---------------- */

    const draw = (t: number, dt: number) => {
      // 速度：怠速漂移 + 滚动脉冲 + hover 归零
      targetSpeed = 0.16 + scrollPulse * 0.9;
      if (hoverOn) targetSpeed = 0;
      speed += (targetSpeed - speed) * Math.min(1, dt * (hoverOn ? 2.2 : 3.4));
      scrollPulse *= 0.9;

      hover += ((hoverOn ? 1 : 0) - hover) * Math.min(1, dt * 2.4);

      travel += dt * speed * 34;

      tiltX += (targetMx * 16 - tiltX) * Math.min(1, dt * 2.2);
      tiltY += (targetMy * 10 - tiltY) * Math.min(1, dt * 2.2);

      // --- 天空 + 地平线光晕（烘焙层，一次 blit） ---
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (skyLayer) ctx.drawImage(skyLayer, 0, 0, W, H);

      // --- 星点 ---
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 120; i++) {
        const sx = ((i * 197.3) % W) + Math.sin(i * 3.1) * 6;
        const sy = ((i * 83.7) % (horizon * 0.92)) + 4;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0004 + i));
        ctx.globalAlpha = tw * 0.5;
        ctx.fillStyle = "#e9e4d6";
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;

      // --- 山脊剪影 ---
      ctx.globalCompositeOperation = "source-over";
      for (const rd of ridges) {
        const off = -travel * rd.depth * 0.35 + tiltX * (1 - rd.depth) * 2.2;
        ctx.save();
        ctx.translate(off, tiltY * (1 - rd.depth) * 1.2);
        ctx.fillStyle = rd.fill;
        ctx.fill(rd.path);
        ctx.restore();
      }

      // --- 谷地薄雾：把山脊与花田在视觉上分层，避免出现一条生硬的花墙 ---
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = mistGrad!;
      ctx.fillRect(0, horizon - H * 0.08, W, H * 0.38);

      // --- 草叶（远景） ---
      // 逐根 stroke 是这里最贵的操作（每次都要建路径 + 光栅化），
      // 按远近分成两档，各拼成一条 Path2D 一次描边。
      const bladesFar = new Path2D();
      const bladesNear = new Path2D();
      for (const b of blades) {
        let z = b.oz - dt * (0.035 + speed * 0.28) * b.sp;
        if (z <= 0.06) {
          z = 1;
          b.ox = rand(-1, 1);
        }
        b.oz = z;

        const p = 1 - z;
        const spread = W * 0.16 + p * p * W * 0.7;
        let sx = cx + b.ox * spread + tiltX * (0.4 + p);
        sx += Math.sin(t * 0.0008 + b.ph) * (1.5 + p * 5) + b.lean * p * 8;
        const sy = horizon + (H - horizon) * Math.pow(p, 1.6) + 6;

        const hgt = (7 + p * p * 34) * b.h;
        if (sy - hgt > H + 40) continue;

        const bend = b.lean * (2 + p * 12);
        const path = p < 0.42 ? bladesFar : bladesNear;
        path.moveTo(sx, sy);
        path.quadraticCurveTo(sx + bend * 0.3, sy - hgt * 0.6, sx + bend, sy - hgt);
      }
      ctx.globalAlpha = 1 - hover * 0.55;
      ctx.strokeStyle = "rgba(146,198,158,0.055)";
      ctx.lineWidth = 0.7;
      ctx.stroke(bladesFar);
      ctx.strokeStyle = "rgba(152,204,164,0.12)";
      ctx.lineWidth = 1.4;
      ctx.stroke(bladesNear);

      // --- 花田 ---
      for (const f of flowers) {
        let z = f.oz - dt * (0.05 + speed * 0.42) * f.sp;
        if (z <= 0.015) {
          z = 1;
          f.ox = rand(-1, 1);
          f.oy = rand(-1, 1);
          f.r = rand(0.55, 1.5);
          f.tint = Math.random() < 0.68 ? 0 : Math.random() < 0.5 ? 1 : Math.random() < 0.6 ? 2 : 3;
        }
        f.oz = z;

        const p = 1 - z;
        const spread = W * 0.13 + p * p * W * 0.78;
        let sx = cx + f.ox * spread + tiltX * (0.5 + p * 2.4);
        let sy =
          horizon + (H - horizon) * Math.pow(p, 1.38) + f.oy * (3 + p * 30) + tiltY * (0.4 + p * 1.6);

        // 鼠标排斥：越靠近光标推得越远，同时点亮
        let lit = 0;
        const dx = sx - mx;
        const dy = sy - my;
        const d2 = dx * dx + dy * dy;
        const R = 210;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const k = 1 - d / R;
          const push = k * k * (26 + p * 40);
          sx += (dx / d) * push;
          sy += (dy / d) * push * 0.75;
          lit = k;
        }

        // hover 过渡：花群沿径向散开成漂浮光粒
        if (hover > 0.001) {
          const ox = sx - cx;
          const oy = sy - horizon;
          const len = Math.hypot(ox, oy) || 1;
          const drift = hover * (22 + p * 74);
          sx += (ox / len) * drift + Math.sin(t * 0.0011 + f.ph) * hover * 14;
          sy += (oy / len) * drift * 0.7 - hover * p * 30;
        }

        const size = (1.1 + Math.pow(p, 2.05) * 40) * f.r * (1 - hover * 0.18);
        let alpha = (0.15 + p * p * 1.28) * (1 - p * 0.16);
        if (p > 0.95) alpha *= Math.max(0, (1 - p) / 0.05);
        alpha = Math.min(1, alpha * (1 + lit * 1.6) * (1 - hover * 0.12));
        if (alpha <= 0.012) continue;

        const sprite = flowerSprites[f.tint];
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, sx - size / 2, sy - size / 2, size, size);

        if (p > 0.68) {
          ctx.globalAlpha = alpha * 0.18;
          const halo = size * 2.6;
          ctx.drawImage(sprite, sx - halo / 2, sy - halo / 2, halo, halo);
        }

        if (lit > 0.25) {
          ctx.globalAlpha = lit * 0.35;
          const big = size * 3.2;
          ctx.drawImage(sprite, sx - big / 2, sy - big / 2, big, big);
        }
      }

      // --- 空中光斑（虚焦的漂浮花粉） ---
      ctx.globalCompositeOperation = "lighter";
      for (const k of bokeh) {
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        if (k.y < -0.12) {
          k.y = 1.12;
          k.x = rand(-1, 1);
        }
        const sx = cx + k.x * W * 0.62 + Math.sin(t * 0.00035 + k.ph) * 18 + tiltX * 4;
        const sy = k.y * H + Math.cos(t * 0.00028 + k.ph) * 14 + tiltY * 3;
        const size = k.r * 2.6;
        ctx.globalAlpha = (0.11 + 0.15 * Math.abs(Math.sin(t * 0.0005 + k.ph))) * (1 - hover * 0.3);
        const sp = flowerSprites[Math.abs(Math.floor(k.ph)) % 4];
        ctx.drawImage(sp, sx - size / 2, sy - size / 2, size, size);
      }

      // --- 尘埃 / 孢子的漂浮光点 ---
      ctx.globalAlpha = 1;
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < -0.05) {
          m.y = 1.05;
          m.x = rand(-1, 1);
        }
        let sx = cx + m.x * W * 0.6 + Math.sin(t * 0.0006 + m.ph) * 12 + tiltX * 3;
        let sy = m.y * H;

        const dx = sx - mx;
        const dy = sy - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) {
          const d = Math.sqrt(d2) || 1;
          const k = 1 - d / 120;
          sx += (dx / d) * k * 26;
          sy += (dy / d) * k * 26;
        }

        ctx.globalAlpha = 0.12 + 0.3 * Math.abs(Math.sin(t * 0.0009 + m.ph));
        ctx.fillStyle = "#f2ead8";
        ctx.beginPath();
        ctx.arc(sx, sy, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 光束（烘焙层） ---
      if (raysLayer) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1;
        ctx.drawImage(raysLayer, 0, 0, W, H);
      }

      // --- 暗角：速度越快收得越紧 ---
      ctx.globalCompositeOperation = "source-over";
      if (vignette) {
        ctx.globalAlpha = 0.42 + speed * 0.34 + hover * 0.12;
        ctx.drawImage(vignette, 0, 0, W, H);
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)) || 0.016;
      last = now;

      ema = ema * 0.9 + dt * 1000 * 0.1;
      if (!thinned && now > 5000 && ema > 26) {
        thinned = true;
        flowers = flowers.filter((_, i) => i % 2 === 0);
        blades = blades.filter((_, i) => i % 2 === 0);
        bokeh = bokeh.filter((_, i) => i % 3 !== 0);
        motes = motes.filter((_, i) => i % 2 === 0);
      }
      draw(now, dt);
      raf = requestAnimationFrame(frame);
    };

    /* ---------------- 启动 ---------------- */

    resize();

    /* 暴露给页面上其它组件：任意元素悬停时可以让花谷缓停并散开 */
    (window as any).__valley = {
      hover: (on: boolean) => {
        hoverOn = on;
      },
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 220);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      // 静态一帧：保留画面质感，不跑动画
      lastScroll = window.scrollY;
      draw(performance.now(), 0.016);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if ((window as any).__valley) delete (window as any).__valley;
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={`nv-canvas ${className}`} aria-hidden="true" />;
}
