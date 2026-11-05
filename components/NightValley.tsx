"use client";

/* eslint-disable @typescript-eslint/no-explicit-any --
 * 本组件整体基于动态 import 的 three.js 实例，编译期拿不到具体类型；
 * 集中用 T 别名标注，比在几十处散落 any 更易读，也便于将来补类型。 */


/**
 * NightValley —— 夜间发光花谷背景（WebGL / three.js）。
 *
 * 目标：还原 Fernhollow「Night Flower Valley」那套质感——
 *   · 真正的 3D 场景：相机在山谷里沿路径飞行，数千朵花以点精灵（point sprite）
 *     铺在谷底与两侧缓坡上，靠近镜头时从小到大「绽放」，远处被深度雾吞掉；
 *   · 后期链：亮部提取 → 两轮高斯模糊（bloom）→ 合成时叠加 split-RGB 色散、
 *     胶片噪点、随速度收紧的暗角；
 *   · 鼠标在**屏幕空间**把每一个点精灵推开（离光标越近推得越开），
 *     离光标最近的点额外发亮，相机同时轻微朝鼠标倾斜；
 *   · 页面滚动 / 滚轮推进一条虚拟路径，静止时缓慢自行前移；
 *   · hover 过渡（搜索框聚焦时由页面调用）：镜头缓停，花群向外散开成漂浮光粒，
 *     松开后反向复原。
 *
 * 为什么不用 Canvas2D 手绘：2D 无法产生真实透视与景深，
 * 点的近大远小、雾的浓度、光轴的体积感都只能近似；用 GPU 跑点精灵才是同一套语言。
 *
 * 场景组织（关键）：
 *   地形高度与路径偏移都是**解析函数**，直接写进 GLSL，地面网格在顶点着色器里
 *   按同一函数位移。于是花与地面永远严丝合缝，且两者都以「绝对世界坐标」锚定，
 *   相机前进时是真正的穿过花海，而不是花跟着相机一起平移。
 *
 *   为了让飞行可以无限延续（页面能滚很久、静止时也会缓慢前移），
 *   走廊长度 CORRIDOR 内的所有周期函数都以它为周期，
 *   花朵按走廊长度做整数倍环绕 —— 越过相机身后即被送到前方，视觉上完全无缝。
 *
 * 性能约束：
 *   · DPR 上限 2（移动端 1.5），bloom 在 1/4 分辨率上做；
 *   · 点数按视口面积自适应，移动端砍到 1/3；
 *   · 标签页隐藏即停帧；prefers-reduced-motion 只画一帧静态画面；
 *   · 连续掉帧会自动降级（关 bloom → 降 DPR）。
 *
 * three 以动态 import 载入：不进首屏 chunk，弱网下先看到深色底也不白屏。
 */

import { useEffect, useRef } from "react";

/**
 * three 以动态 import 载入，运行期才能拿到实例，编译期类型不可用。
 * 这里集中用一个别名标注，避免在几十处散落 `any`。
 */
type T = any;

/* =====================================================================
 * 场景常量（JS 与 GLSL 共用同一套公式，改一处即可）
 * ===================================================================== */

/** 走廊长度：所有 z 方向周期函数都以它为周期，保证环绕无缝 */
const CORRIDOR = 150;
/** 基础角频率：2π / CORRIDOR */
const K = (Math.PI * 2) / CORRIDOR;

/** 路径横向偏移（相机沿谷底蜿蜒） */
const pathXJS = (z: number) => Math.sin(K * z) * 3.4 + Math.sin(K * 3 * z + 1.2) * 1.5;

/** 谷地高度：中央平坦，两侧缓缓抬升成缓坡 */
const terrainJS = (x: number, z: number) => {
  const valley = 20 * Math.pow(Math.abs(x) / 190, 2.0);
  const hills =
    Math.sin(x * 0.045 + K * 3 * z) * 2.4 +
    Math.cos(K * 2 * z - x * 0.011) * 2.0 +
    Math.sin(x * 0.085 + K * 5 * z) * 0.9 +
    Math.sin(x * 0.19 + K * 7 * z) * 0.4;
  return valley + hills - 1.2;
};

/** 与 JS 版本逐字对应的 GLSL 实现 */
const GLSL_WORLD = /* glsl */ `
#define CORRIDOR ${CORRIDOR.toFixed(1)}
#define K ${K.toFixed(8)}

float pathXG(float z) {
  return sin(K * z) * 3.4 + sin(K * 3.0 * z + 1.2) * 1.5;
}

float terrainG(float x, float z) {
  float valley = 20.0 * pow(abs(x) / 190.0, 2.0);
  float hills =
    sin(x * 0.045 + K * 3.0 * z) * 2.4 +
    cos(K * 2.0 * z - x * 0.011) * 2.0 +
    sin(x * 0.085 + K * 5.0 * z) * 0.9 +
    sin(x * 0.19 + K * 7.0 * z) * 0.4;
  return valley + hills - 1.2;
}
`;

/* =====================================================================
 * GLSL
 * ===================================================================== */

const VERT = /* glsl */ `
precision highp float;
${GLSL_WORLD}

attribute float aZBase;   // 走廊内的基准 z
attribute float aXOff;    // 相对路径的横向偏移
attribute float aYOff;    // 相对地面的高度
attribute float aSize;
attribute float aSeed;
attribute float aOpen;
attribute vec3  aTint;

uniform float uTime;
uniform float uTravel;    // 相机已飞行的距离（世界 z）
uniform float uPixelRatio;
uniform float uPointScale;   // 透视尺寸衰减：viewportHeight / (2·tan(fov/2))
uniform float uScatter;      // hover 过渡：花群散开成光粒的程度 0..1
uniform float uPush;         // 鼠标排斥强度（NDC）
uniform float uPushRadius;   // 排斥半径（NDC）
uniform vec2  uMouse;        // 鼠标位置（NDC）

varying vec3  vTint;
varying float vGlow;         // 靠近光标的程度
varying float vOpen;         // 绽放程度
varying float vDepth;        // 视空间深度（用于雾）

void main() {
  // ── 走廊环绕：花被相机越过之后送到前方整数倍处，视觉无缝 ──
  float rel = aZBase - uTravel;
  float z = aZBase + (floor(-rel / CORRIDOR) + 1.0) * CORRIDOR;

  float x = pathXG(z) + aXOff;
  float y = terrainG(x, z) + aYOff;

  vec3 pos = vec3(x, y, z);

  // ── hover：花群沿各自方向散开并上浮，变成漂浮的发光粒子 ──
  vec3 dir = normalize(vec3(
    aXOff * 0.12 + (aSeed - 0.5) * 1.2,
    0.35 + aSeed * 0.25,
    (aSeed - 0.5) * 0.9
  ));
  pos += dir * uScatter * (2.5 + aSeed * 9.0);
  pos.y += uScatter * (1.2 + aSeed * 4.0)
         + sin(uTime * 0.7 + aSeed * 24.0) * 0.45 * uScatter;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec4 clip = projectionMatrix * mv;

  // ── 屏幕空间鼠标排斥：把每个点沿「远离光标」的方向推开 ──
  vec2 ndc = clip.xy / max(abs(clip.w), 1e-4);
  vec2 md = ndc - uMouse;
  float d = length(md);
  float infl = 1.0 - smoothstep(0.0, uPushRadius, d);
  ndc += (md / max(d, 1e-4)) * infl * uPush;
  clip.xy = ndc * clip.w;

  gl_Position = clip;

  float dist = max(-mv.z, 0.08);
  // 只有靠近镜头才完全绽放
  float open = 1.0 - smoothstep(aOpen * 0.12, aOpen, dist);
  float atten = uPointScale / dist;
  gl_PointSize = clamp(aSize * atten * (0.30 + open * 0.70), 0.7, 26.0 * uPixelRatio);

  vTint  = aTint;
  vGlow  = infl;
  vOpen  = open;
  vDepth = dist;
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform vec3  uFogColor;
uniform float uFogDensity;
uniform float uScatter;
uniform float uTime;

varying vec3  vTint;
varying float vGlow;
varying float vOpen;
varying float vDepth;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv) * 2.0;
  if (r > 1.0) discard;

  float ang = atan(uv.y, uv.x);
  // 五瓣轮廓：绽放度越高花瓣越清晰
  float petal = 0.34 + 0.07 * cos(5.0 * ang) * vOpen;
  float core  = 1.0 - smoothstep(petal - 0.34, petal, r);
  float glow  = exp(-r * 3.1) * 0.6;
  float a = clamp(core * 0.42 + glow * 0.66, 0.0, 1.0);
  if (a < 0.012) discard;

  vec3 col = mix(vTint, vec3(1.0, 0.985, 0.93), core * 0.62);
  col += vec3(0.80, 0.92, 0.88) * vGlow * 0.95;     // 靠近光标 → 偏冷的高光
  col += vec3(1.0, 0.96, 0.86) * vGlow * vGlow * 0.45;

  // 深度雾：远处融进夜色，近处才亮
  float fog = clamp(1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth), 0.0, 1.0);
  col = mix(col, uFogColor, fog);
  a *= (1.0 - fog * 0.55) * 0.72;

  // 呼吸感：极缓慢的明暗起伏
  a *= 0.80 + 0.20 * sin(uTime * 0.55 + vTint.r * 30.0);

  // hover 散开时颜色更亮更像「光粒」
  col += vec3(0.98, 0.95, 0.85) * uScatter * 0.55;

  gl_FragColor = vec4(col, a);
}
`;

const LEAF_VERT = /* glsl */ `
precision highp float;
${GLSL_WORLD}

attribute float aZBase;
attribute float aXOff;
attribute float aYOff;
attribute float aSize;
attribute float aSeed;
attribute vec3  aTint;

uniform float uTime;
uniform float uTravel;
uniform float uPixelRatio;
uniform float uPointScale;
uniform float uScatter;
uniform float uPush;
uniform float uPushRadius;
uniform vec2  uMouse;

varying vec3  vTint;
varying float vDepth;
varying float vGlow;

void main() {
  float rel = aZBase - uTravel;
  float z = aZBase + (floor(-rel / CORRIDOR) + 1.0) * CORRIDOR;

  float x = pathXG(z) + aXOff;
  float y = terrainG(x, z) + aYOff;

  vec3 pos = vec3(x, y, z);
  pos.x += sin(uTime * 0.9 + aSeed * 18.0) * 0.3;
  pos += vec3((aSeed - 0.5), 0.2, (aSeed - 0.5)) * uScatter * 5.0;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec4 clip = projectionMatrix * mv;

  vec2 ndc = clip.xy / max(abs(clip.w), 1e-4);
  vec2 md = ndc - uMouse;
  float d = length(md);
  float infl = 1.0 - smoothstep(0.0, uPushRadius, d);
  ndc += (md / max(d, 1e-4)) * infl * uPush * 0.7;
  clip.xy = ndc * clip.w;

  gl_Position = clip;

  float dist = max(-mv.z, 0.08);
  gl_PointSize = clamp(aSize * (uPointScale / dist) * 0.5, 0.6, 22.0 * uPixelRatio);

  vTint  = aTint;
  vDepth = dist;
  vGlow  = infl;
}
`;

const LEAF_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3  vTint;
varying float vDepth;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  // 细长叶片
  vec2 p = vec2(uv.x * 2.4, uv.y * 0.9);
  float r = length(p) * 2.0;
  if (r > 1.0) discard;
  float a = (1.0 - smoothstep(0.45, 1.0, r)) * 0.45;
  if (a < 0.015) discard;

  vec3 col = vTint + vec3(0.35, 0.6, 0.4) * vGlow * 0.7;
  float fog = clamp(1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth), 0.0, 1.0);
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, a * (1.0 - fog * 0.7));
}
`;

const DUST_VERT = /* glsl */ `
precision highp float;

attribute float aSize;
attribute float aSeed;

uniform float uTime;
uniform float uPixelRatio;
uniform float uPointScale;

varying float vA;

void main() {
  vec3 pos = position;
  pos.y += sin(uTime * 0.35 + aSeed * 30.0) * 1.6;
  pos.x += cos(uTime * 0.27 + aSeed * 21.0) * 1.4;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.1);
  gl_PointSize = clamp(aSize * (uPointScale / dist) * 0.35, 0.5, 18.0 * uPixelRatio);
  vA = 0.35 + 0.65 * abs(sin(uTime * 0.8 + aSeed * 25.0));
}
`;

const DUST_FRAG = /* glsl */ `
precision highp float;
varying float vA;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv) * 2.0;
  if (r > 1.0) discard;
  float a = (1.0 - smoothstep(0.0, 1.0, r)) * vA * 0.45;
  gl_FragColor = vec4(vec3(0.97, 0.94, 0.86), a);
}
`;

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
varying vec3 vDir;
void main() {
  float y = vDir.y;
  vec3 top = vec3(0.004, 0.008, 0.017);
  vec3 mid = vec3(0.008, 0.017, 0.026);
  vec3 low = vec3(0.010, 0.020, 0.022);
  vec3 col = mix(mid, top, clamp(y * 1.6, 0.0, 1.0));
  col = mix(col, low, clamp(-y * 2.2, 0.0, 1.0));
  // 地平线上的冷白辉光
  float glow = exp(-abs(y + 0.01) * 24.0);
  col += vec3(0.062, 0.066, 0.070) * glow * 0.85;
  // 极轻的星尘带
  float band = smoothstep(0.15, 0.6, y) * (1.0 - smoothstep(0.6, 1.0, y));
  col += vec3(0.022, 0.026, 0.030) * band;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* 地面：顶点着色器按同一地形函数位移，与花严丝合缝 */
const GROUND_VERT = /* glsl */ `
precision highp float;
${GLSL_WORLD}

uniform float uTravel;

varying float vDepth;
varying float vUp;

void main() {
  // 平面随相机前移，顶点世界 z = 本地 z + uTravel
  float wz = position.z + uTravel;
  float wx = position.x;

  float e = 1.4;
  float hx = terrainG(wx + e, wz) - terrainG(wx - e, wz);
  float hz = terrainG(wx, wz + e) - terrainG(wx, wz - e);
  vec3 n = normalize(vec3(-hx, 2.0 * e, -hz));

  vec3 pos = vec3(wx, terrainG(wx, wz), wz);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  vDepth = max(-mv.z, 0.08);
  vUp = n.y;
}
`;

const GROUND_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uNear;
uniform vec3 uFar;
varying float vDepth;
varying float vUp;
void main() {
  float fog = clamp(1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth), 0.0, 1.0);
  vec3 col = mix(uNear, uFar, clamp(vDepth / 200.0, 0.0, 1.0));
  col = mix(col, uFogColor, fog * 0.94);
  // 一点点草地的呼吸感
  col += vec3(0.014, 0.015, 0.014) * (1.0 - vUp) * 0.6;
  gl_FragColor = vec4(col, 1.0);
}
`;

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** 亮部提取 */
const BRIGHT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = smoothstep(uThreshold, uThreshold + 0.35, l);
  gl_FragColor = vec4(c * k, 1.0);
}
`;

/** 可分离高斯模糊 */
const BLUR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227027;
  sum += texture2D(tDiffuse, vUv + uDir * 1.3846).rgb * 0.316216;
  sum += texture2D(tDiffuse, vUv - uDir * 1.3846).rgb * 0.316216;
  sum += texture2D(tDiffuse, vUv + uDir * 3.2307).rgb * 0.070270;
  sum += texture2D(tDiffuse, vUv - uDir * 3.2307).rgb * 0.070270;
  gl_FragColor = vec4(sum, 1.0);
}
`;

/** 最终合成：bloom + split-RGB + 噪点 + 暗角 + gamma */
const COMPOSITE_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uBloom;
uniform float uAberration;
uniform float uNoise;
uniform float uVignette;
uniform float uTime;
uniform vec2  uRes;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vUv;
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);

  // 暗角：随速度收紧
  float vig = 1.0 - smoothstep(0.20, 0.95, r2 * (1.55 + uVignette));

  // split-RGB：边缘处红蓝分离
  float ab = uAberration * (0.4 + r2 * 2.2);
  vec3 col;
  col.r = texture2D(tScene, uv + c * ab * 0.006).r;
  col.g = texture2D(tScene, uv).g;
  col.b = texture2D(tScene, uv - c * ab * 0.006).b;

  col += texture2D(tBloom, uv).rgb * uBloom;

  // 胶片噪点
  float n = hash(uv * uRes + fract(uTime) * 91.7) - 0.5;
  col += n * uNoise;

  col *= vig;

  // 轻微 filmic 收尾，避免高光死白
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);

  // 整条链路跑在线性空间，最后统一 gamma 编码
  col = pow(max(col, vec3(0.0)), vec3(0.4545));

  gl_FragColor = vec4(col, 1.0);
}
`;

/** 可复现的伪随机（重建点位时分布保持一致，不会闪一下） */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function NightValley({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      let THREE: T;
      try {
        THREE = await import("three");
      } catch {
        return;
      }
      if (disposed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* ------------------------------------------------------------------
       * 基础参数
       * ---------------------------------------------------------------- */
      const FOG_COLOR = new THREE.Color(0x05090c);
      const PALETTE = [
        [0.95, 0.91, 0.79],
        [0.90, 0.84, 0.70],
        [0.82, 0.89, 0.86],
        [0.98, 0.95, 0.87],
        [0.86, 0.87, 0.94],
      ];
      const LEAF_TINTS = [
        [0.20, 0.31, 0.26],
        [0.15, 0.25, 0.22],
        [0.26, 0.36, 0.29],
      ];

      /* ------------------------------------------------------------------
       * 渲染器
       * ---------------------------------------------------------------- */
      let renderer: T;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        });
      } catch {
        return; // 无 WebGL → 保留父层的深色底
      }
      renderer.setClearColor(0x03060a, 1);
      // 整条管线自行管理色彩空间：输出保持线性，最后在合成阶段统一 gamma
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      host.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(58, 1, 0.4, 700);
      camera.position.set(pathXJS(0), terrainJS(0, 0) + 4.0, 0);

      const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quadGeo = new THREE.PlaneGeometry(2, 2);

      /* ------------------------------------------------------------------
       * 天空穹顶
       * ---------------------------------------------------------------- */
      const skyMat = new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: { uTime: { value: 0 } },
        side: THREE.BackSide,
        depthWrite: false,
      });
      const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 16), skyMat);
      sky.frustumCulled = false;
      scene.add(sky);

      /* ------------------------------------------------------------------
       * 地面（顶点着色器里按地形函数位移，随相机前移）
       * ---------------------------------------------------------------- */
      const GROUND_SPAN = 420; // 相机前方可见的地面纵深
      const groundUniforms = {
        uFogColor: { value: FOG_COLOR },
        uFogDensity: { value: 0.0135 },
        uNear: { value: new THREE.Color(0x11171a) },
        uFar: { value: new THREE.Color(0x070b0e) },
        uTravel: { value: 0 },
      };
      const groundMat = new THREE.ShaderMaterial({
        vertexShader: GROUND_VERT,
        fragmentShader: GROUND_FRAG,
        uniforms: groundUniforms,
      });
      const groundGeo = new THREE.PlaneGeometry(460, GROUND_SPAN, 130, 150);
      groundGeo.rotateX(-Math.PI / 2);
      groundGeo.translate(0, 0, -60);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.frustumCulled = false;
      scene.add(ground);

      /* ------------------------------------------------------------------
       * 花 / 叶 / 尘埃（点精灵）
       * ---------------------------------------------------------------- */
      const flowerUniforms: T = {
        uTime: { value: 0 },
        uTravel: { value: 0 },
        uPixelRatio: { value: 1 },
        uPointScale: { value: 600 },
        uScatter: { value: 0 },
        uPush: { value: 0 },
        uPushRadius: { value: 0.45 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uFogColor: { value: FOG_COLOR },
        uFogDensity: { value: 0.0135 },
      };
      const flowerMat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: flowerUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const leafUniforms: T = {
        uTime: { value: 0 },
        uTravel: { value: 0 },
        uPixelRatio: { value: 1 },
        uPointScale: { value: 600 },
        uScatter: { value: 0 },
        uPush: { value: 0 },
        uPushRadius: { value: 0.45 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uFogColor: { value: FOG_COLOR },
        uFogDensity: { value: 0.0135 },
      };
      const leafMat = new THREE.ShaderMaterial({
        vertexShader: LEAF_VERT,
        fragmentShader: LEAF_FRAG,
        uniforms: leafUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const dustUniforms: T = {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uPointScale: { value: 600 },
      };
      const dustMat = new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: dustUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      let flowers: T = null;
      let leaves: T = null;
      let dust: T = null;

      const buildPoints = () => {
        const small = window.innerWidth < 760;
        const area = window.innerWidth * window.innerHeight;
        const nFlowers = Math.round(
          Math.min(26000, Math.max(6000, (area / 62000) * (small ? 7000 : 20000))),
        );
        const nLeaves = Math.round(nFlowers * 0.45);
        const nDust = small ? 220 : 460;

        const rf = mulberry32(20241109);
        const rl = mulberry32(778811);
        const rd = mulberry32(4242);

        /* 花：基准 z 铺满整个走廊，横向按幂律集中在谷底 */
        const fz = new Float32Array(nFlowers);
        const fx = new Float32Array(nFlowers);
        const fy = new Float32Array(nFlowers);
        const fs = new Float32Array(nFlowers);
        const fd = new Float32Array(nFlowers);
        const fo = new Float32Array(nFlowers);
        const ft = new Float32Array(nFlowers * 3);
        for (let i = 0; i < nFlowers; i++) {
          fz[i] = rf() * CORRIDOR;
          // 幂律：谷底最密，坡上渐疏
          // 以路径中心为轴的钟形分布：中央最密，两侧渐疏，且不留下空带
          const r = (rf() + rf() + rf() - 1.5) / 1.5; // 近似正态，范围 [-1,1]
          fx[i] = r * 58;
          fy[i] = 0.25 + rf() * 1.7;
          fs[i] = 0.24 + rf() * 0.40;
          fd[i] = rf();
          fo[i] = 34 + rf() * 96;
          const t = PALETTE[Math.floor(rf() * PALETTE.length)];
          ft[i * 3] = t[0];
          ft[i * 3 + 1] = t[1];
          ft[i * 3 + 2] = t[2];
        }
        const fg = new THREE.BufferGeometry();
        fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nFlowers * 3), 3));
        fg.setAttribute("aZBase", new THREE.BufferAttribute(fz, 1));
        fg.setAttribute("aXOff", new THREE.BufferAttribute(fx, 1));
        fg.setAttribute("aYOff", new THREE.BufferAttribute(fy, 1));
        fg.setAttribute("aSize", new THREE.BufferAttribute(fs, 1));
        fg.setAttribute("aSeed", new THREE.BufferAttribute(fd, 1));
        fg.setAttribute("aOpen", new THREE.BufferAttribute(fo, 1));
        fg.setAttribute("aTint", new THREE.BufferAttribute(ft, 3));
        if (flowers) {
          flowers.geometry.dispose();
          scene.remove(flowers);
        }
        flowers = new THREE.Points(fg, flowerMat);
        flowers.frustumCulled = false;
        scene.add(flowers);

        /* 叶：比花更暗更密，铺在花丛之间 */
        const lz = new Float32Array(nLeaves);
        const lx = new Float32Array(nLeaves);
        const ly = new Float32Array(nLeaves);
        const ls = new Float32Array(nLeaves);
        const ld = new Float32Array(nLeaves);
        const lt = new Float32Array(nLeaves * 3);
        for (let i = 0; i < nLeaves; i++) {
          lz[i] = rl() * CORRIDOR;
          const r = (rl() + rl() + rl() - 1.5) / 1.5;
          lx[i] = r * 64;
          ly[i] = 0.15 + rl() * 1.1;
          ls[i] = 0.09 + rl() * 0.20;
          ld[i] = rl();
          const t = LEAF_TINTS[Math.floor(rl() * LEAF_TINTS.length)];
          lt[i * 3] = t[0];
          lt[i * 3 + 1] = t[1];
          lt[i * 3 + 2] = t[2];
        }
        const lg = new THREE.BufferGeometry();
        lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nLeaves * 3), 3));
        lg.setAttribute("aZBase", new THREE.BufferAttribute(lz, 1));
        lg.setAttribute("aXOff", new THREE.BufferAttribute(lx, 1));
        lg.setAttribute("aYOff", new THREE.BufferAttribute(ly, 1));
        lg.setAttribute("aSize", new THREE.BufferAttribute(ls, 1));
        lg.setAttribute("aSeed", new THREE.BufferAttribute(ld, 1));
        lg.setAttribute("aTint", new THREE.BufferAttribute(lt, 3));
        if (leaves) {
          leaves.geometry.dispose();
          scene.remove(leaves);
        }
        leaves = new THREE.Points(lg, leafMat);
        leaves.frustumCulled = false;
        scene.add(leaves);

        /* 尘埃：飘在镜头附近（跟随相机，无需走廊逻辑） */
        const dp = new Float32Array(nDust * 3);
        const ds = new Float32Array(nDust);
        const dd = new Float32Array(nDust);
        for (let i = 0; i < nDust; i++) {
          dp[i * 3] = (rd() - 0.5) * 52;
          dp[i * 3 + 1] = rd() * 18;
          dp[i * 3 + 2] = -8 + rd() * 110;
          ds[i] = 0.025 + rd() * 0.075;
          dd[i] = rd();
        }
        const dg = new THREE.BufferGeometry();
        dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
        dg.setAttribute("aSize", new THREE.BufferAttribute(ds, 1));
        dg.setAttribute("aSeed", new THREE.BufferAttribute(dd, 1));
        if (dust) {
          dust.geometry.dispose();
          scene.remove(dust);
        }
        dust = new THREE.Points(dg, dustMat);
        dust.frustumCulled = false;
        scene.add(dust);
      };

      /* ------------------------------------------------------------------
       * 光轴（light ray sprites）
       * ---------------------------------------------------------------- */
      const rayTex = (() => {
        const S = 128;
        const c = document.createElement("canvas");
        c.width = S;
        c.height = S;
        const g = c.getContext("2d")!;
        const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
        grad.addColorStop(0, "rgba(226,240,214,0.85)");
        grad.addColorStop(0.35, "rgba(190,220,180,0.30)");
        grad.addColorStop(1, "rgba(160,200,170,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, S, S);
        return new THREE.CanvasTexture(c);
      })();

      const rays: T[] = [];
      for (let i = 0; i < 5; i++) {
        const mat = new THREE.SpriteMaterial({
          map: rayTex,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          opacity: 0.04,
          color: 0xf0e8d6,
        });
        const s = new THREE.Sprite(mat);
        s.scale.set(90, 210, 1);
        mat.rotation = -0.42 + (i % 2 === 0 ? 0.06 : -0.06);
        scene.add(s);
        rays.push({ sprite: s, phase: (i * 1.7) % 6.28, offset: i * 52 });
      }

      /* ------------------------------------------------------------------
       * 后期链：Scene → Bright → Blur ×2 → Composite
       * ---------------------------------------------------------------- */
      const rtType = (() => {
        const ext = renderer.extensions;
        const ok =
          ext.has("EXT_color_buffer_half_float") ||
          ext.has("EXT_color_buffer_float") ||
          ext.has("EXT_color_buffer_half_float_webgl");
        return ok ? THREE.HalfFloatType : THREE.UnsignedByteType;
      })();

      const rtScene = new THREE.WebGLRenderTarget(2, 2, {
        type: rtType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: false,
      });
      const rtA = new THREE.WebGLRenderTarget(2, 2, {
        type: rtType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      });
      const rtB = new THREE.WebGLRenderTarget(2, 2, {
        type: rtType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      });

      const brightMat = new THREE.ShaderMaterial({
        vertexShader: FS_VERT,
        fragmentShader: BRIGHT_FRAG,
        uniforms: {
          tDiffuse: { value: rtScene.texture },
          uThreshold: { value: 0.55 },
        },
        depthTest: false,
        depthWrite: false,
      });
      const blurMat = new THREE.ShaderMaterial({
        vertexShader: FS_VERT,
        fragmentShader: BLUR_FRAG,
        uniforms: { tDiffuse: { value: rtA.texture }, uDir: { value: new THREE.Vector2() } },
        depthTest: false,
        depthWrite: false,
      });
      const compositeMat = new THREE.ShaderMaterial({
        vertexShader: FS_VERT,
        fragmentShader: COMPOSITE_FRAG,
        uniforms: {
          tScene: { value: rtScene.texture },
          tBloom: { value: rtB.texture },
          uBloom: { value: 0.42 },
          uAberration: { value: 0.3 },
          uNoise: { value: 0.02 },
          uVignette: { value: 0.25 },
          uTime: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
        },
        depthTest: false,
        depthWrite: false,
      });

      const quadScene = new THREE.Scene();
      const quad = new THREE.Mesh(quadGeo, brightMat);
      quad.frustumCulled = false;
      quadScene.add(quad);

      /* ------------------------------------------------------------------
       * 尺寸
       * ---------------------------------------------------------------- */
      let W = 0;
      let H = 0;
      let dpr = 1;
      const bloomScale = 4;
      let bloomOn = true;
      let quality = 1;

      const resize = () => {
        W = window.innerWidth;
        H = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, W < 760 ? 1.5 : 2) * quality;

        renderer.setPixelRatio(dpr);
        renderer.setSize(W, H, false);

        camera.aspect = W / Math.max(1, H);
        camera.updateProjectionMatrix();

        const pw = Math.max(2, Math.round(W * dpr));
        const ph = Math.max(2, Math.round(H * dpr));
        rtScene.setSize(pw, ph);
        const bw = Math.max(2, Math.round(pw / bloomScale));
        const bh = Math.max(2, Math.round(ph / bloomScale));
        rtA.setSize(bw, bh);
        rtB.setSize(bw, bh);

        compositeMat.uniforms.uRes.value.set(pw, ph);

        // 透视尺寸衰减：viewportHeight / (2·tan(fov/2))
        const scale = (ph * 0.5) / Math.tan((camera.fov * Math.PI) / 360);
        flowerUniforms.uPointScale.value = scale;
        leafUniforms.uPointScale.value = scale;
        dustUniforms.uPointScale.value = scale;
        flowerUniforms.uPixelRatio.value = dpr;
        leafUniforms.uPixelRatio.value = dpr;
        dustUniforms.uPixelRatio.value = dpr;
      };

      /* ------------------------------------------------------------------
       * 交互状态
       * ---------------------------------------------------------------- */
      const mouseNdc = new THREE.Vector2(99, 99);
      const mouseTarget = new THREE.Vector2(99, 99);
      let mouseActive = false;

      let travel = 0; // 相机已飞行的距离（世界 z）
      let targetTravel = 0;
      let speedSmooth = 0;

      let hoverOn = false;
      let hover = 0;

      let lastScrollY = 0;
      let scrollVel = 0;

      const onPointer = (e: PointerEvent) => {
        mouseTarget.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
        mouseActive = true;
      };
      const onPointerLeave = () => {
        mouseTarget.set(99, 99);
        mouseActive = false;
      };
      const onScroll = () => {
        const y = window.scrollY;
        const d = y - lastScrollY;
        lastScrollY = y;
        // 页面滚动 → 推进虚拟路径（触摸时浏览器惯性同样走 scroll 事件）
        targetTravel += d * 0.42;
        scrollVel = Math.min(1, Math.abs(d) / 70);
      };

      /* ------------------------------------------------------------------
       * 帧循环
       * ---------------------------------------------------------------- */
      let raf = 0;
      let running = true;
      let last = 0;
      let ema = 16;
      let degraded = 0;

      const renderQuad = (mat: T, target: T) => {
        quad.material = mat;
        renderer.setRenderTarget(target);
        renderer.render(quadScene, quadCam);
      };

      const updateCamera = (dt: number) => {
        // 怠速自行前移
        const idleDrift = hoverOn ? 0 : 3.4;
        targetTravel += dt * idleDrift;
        travel += (targetTravel - travel) * Math.min(1, dt * 4.5);

        const targetSpeed = Math.min(1, scrollVel * 1.25 + 0.1);
        scrollVel *= Math.pow(0.02, dt);
        speedSmooth += (targetSpeed - speedSmooth) * Math.min(1, dt * 3.2);

        hover += ((hoverOn ? 1 : 0) - hover) * Math.min(1, dt * 2.6);

        const z = travel;
        const px = pathXJS(z);
        const py = terrainJS(px, z) + 4.4;
        camera.position.x = px;
        camera.position.y = py;
        camera.position.z = z;

        const lookZ = z + 70;
        const lookX = pathXJS(lookZ);
        const lookY = terrainJS(lookX, lookZ) + 1.6;
        camera.lookAt(lookX, lookY, lookZ);

        // 鼠标牵引：相机轻微朝光标倾斜
        mouseNdc.lerp(mouseTarget, Math.min(1, dt * 5));
        if (mouseActive) {
          camera.rotateY(mouseNdc.x * 0.045);
          camera.rotateX(mouseNdc.y * 0.028);
        }

        sky.position.copy(camera.position);
        groundUniforms.uTravel.value = z;
        flowerUniforms.uTravel.value = z;
        leafUniforms.uTravel.value = z;
      };

      const frame = (now: number) => {
        if (!running) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
        last = now;
        const t = now / 1000;

        /* --- 自适应降级 --- */
        ema = ema * 0.92 + dt * 1000 * 0.08;
        if (degraded === 0 && now > 4000 && ema > 30) {
          degraded = 1;
          bloomOn = false;
        } else if (degraded === 1 && now > 9000 && ema > 34) {
          degraded = 2;
          quality = 0.72;
          resize();
        }

        updateCamera(dt);

        /* --- 光轴 --- */
        for (const r of rays) {
          const rz = travel + r.offset + 20;
          const rx = pathXJS(rz) + Math.sin(t * 0.12 + r.phase) * 24;
          r.sprite.position.set(rx, terrainJS(rx, rz) + 15 + Math.sin(t * 0.2 + r.phase) * 3, rz);
          r.sprite.material.opacity =
            0.025 + 0.022 * (0.5 + 0.5 * Math.sin(t * 0.35 + r.phase));
        }

        /* --- 尘埃跟随镜头 --- */
        if (dust) dust.position.set(camera.position.x, camera.position.y - 3, camera.position.z);

        /* --- uniform --- */
        const push = mouseActive ? 0.05 : 0;
        flowerUniforms.uTime.value = t;
        flowerUniforms.uScatter.value = hover;
        flowerUniforms.uPush.value = push;
        flowerUniforms.uMouse.value.copy(mouseNdc);
        leafUniforms.uTime.value = t;
        leafUniforms.uScatter.value = hover;
        leafUniforms.uPush.value = push;
        leafUniforms.uMouse.value.copy(mouseNdc);
        dustUniforms.uTime.value = t;
        skyMat.uniforms.uTime.value = t;

        compositeMat.uniforms.uTime.value = t;
        compositeMat.uniforms.uVignette.value = 0.18 + speedSmooth * 0.55 + hover * 0.1;
        compositeMat.uniforms.uBloom.value = bloomOn ? 0.42 + speedSmooth * 0.2 : 0;
        compositeMat.uniforms.uAberration.value = 0.3 + speedSmooth * 0.45;

        /* --- 渲染 --- */
        renderer.setRenderTarget(rtScene);
        renderer.render(scene, camera);

        if (bloomOn) {
          brightMat.uniforms.tDiffuse.value = rtScene.texture;
          renderQuad(brightMat, rtA);

          const bw = rtA.width;
          const bh = rtA.height;
          blurMat.uniforms.tDiffuse.value = rtA.texture;
          blurMat.uniforms.uDir.value.set(1 / bw, 0);
          renderQuad(blurMat, rtB);
          blurMat.uniforms.tDiffuse.value = rtB.texture;
          blurMat.uniforms.uDir.value.set(0, 1 / bh);
          renderQuad(blurMat, rtA);
          // 第二轮：更宽的光晕
          blurMat.uniforms.tDiffuse.value = rtA.texture;
          blurMat.uniforms.uDir.value.set(2.2 / bw, 0);
          renderQuad(blurMat, rtB);
          blurMat.uniforms.tDiffuse.value = rtB.texture;
          blurMat.uniforms.uDir.value.set(0, 2.2 / bh);
          renderQuad(blurMat, rtA);
          compositeMat.uniforms.tBloom.value = rtA.texture;
        } else {
          compositeMat.uniforms.tBloom.value = rtScene.texture;
          compositeMat.uniforms.uBloom.value = 0;
        }

        compositeMat.uniforms.tScene.value = rtScene.texture;
        renderer.setRenderTarget(null);
        renderQuad(compositeMat, null);

        raf = requestAnimationFrame(frame);
      };

      /* ------------------------------------------------------------------
       * 尺寸与事件
       * ---------------------------------------------------------------- */
      buildPoints();
      resize();
      lastScrollY = window.scrollY;

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

      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          resize();
          buildPoints();
        }, 240);
      };
      window.addEventListener("resize", onResize);

      /* 暴露给页面其它组件（搜索框聚焦 → 镜头缓停 + 花群散开） */
      (window as any).__valley = {
        hover: (on: boolean) => {
          hoverOn = on;
        },
      };

      if (reduced) {
        // 静态一帧
        const z = 0;
        camera.position.set(pathXJS(z), terrainJS(pathXJS(z), z) + 4.0, z);
        camera.lookAt(
          pathXJS(z + 70),
          terrainJS(pathXJS(z + 70), z + 70) + 0.8,
          z + 70,
        );
        sky.position.copy(camera.position);
        compositeMat.uniforms.uBloom.value = 0;
        compositeMat.uniforms.tBloom.value = rtScene.texture;
        renderer.setRenderTarget(rtScene);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderQuad(compositeMat, null);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }

      cleanup = () => {
        running = false;
        cancelAnimationFrame(raf);
        if ((window as any).__valley) delete (window as any).__valley;
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        window.clearTimeout(resizeTimer);
        flowers?.geometry.dispose();
        leaves?.geometry.dispose();
        dust?.geometry.dispose();
        groundGeo.dispose();
        rtScene.dispose();
        rtA.dispose();
        rtB.dispose();
        rayTex.dispose();
        quadGeo.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className={`nv-canvas ${className}`} aria-hidden="true" />;
}
