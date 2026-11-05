(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,94909,e=>{"use strict";var t=e.i(17555),a=e.i(90924),i=e.i(79674),r=e.i(31551),o=e.i(20047);e.s(["default",0,function(){let e=(0,a.usePathname)(),{currentSong:n,isPlaying:l,togglePlay:s,nextSong:u,currentLyric:d,isLoading:c}=(0,i.useMusic)(),[f,v]=(0,o.useState)(!1);if((0,o.useEffect)(()=>{v(!0)},[]),!f||c||!n)return null;let m="/"===e;return(0,t.jsx)("div",{className:"fixed bottom-6 right-6 z-[9999]",style:{pointerEvents:"none"},children:(0,t.jsxs)(r.motion.div,{drag:!0,dragMomentum:!1,style:{touchAction:"none"},animate:{opacity:+!m,scale:m?.8:1,pointerEvents:m?"none":"auto"},initial:!1,transition:{duration:.3,ease:"easeInOut"},className:"flex items-center gap-3 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl p-2 pr-4 rounded-full transition-colors duration-700 cursor-grab active:cursor-grabbing",children:[(0,t.jsxs)("div",{className:"w-10 h-10 rounded-full border border-white/50 shadow-sm flex-shrink-0 overflow-hidden relative animate-[spin_6s_linear_infinite] pointer-events-none",style:{animationPlayState:l?"running":"paused"},children:[(0,t.jsx)("img",{src:n.cover,alt:"cover",className:"w-full h-full object-cover"}),(0,t.jsx)("div",{className:"absolute inset-0 bg-black/10"}),(0,t.jsx)("div",{className:"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-inner"})]}),(0,t.jsxs)("div",{className:"flex flex-col w-32 max-w-[120px] overflow-hidden pointer-events-none",children:[(0,t.jsx)("span",{className:"text-sm font-bold text-slate-900 dark:text-white truncate transition-colors duration-700",children:n.title}),(0,t.jsx)("span",{className:"text-[10px] text-slate-500 dark:text-slate-400 truncate transition-colors duration-700",children:d})]}),(0,t.jsxs)("div",{className:"flex items-center gap-2 ml-1",children:[(0,t.jsx)("button",{onClick:e=>{e.stopPropagation(),s()},onPointerDown:e=>e.stopPropagation(),className:"w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer",children:l?(0,t.jsx)("svg",{className:"w-3.5 h-3.5",fill:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}):(0,t.jsx)("svg",{className:"w-3.5 h-3.5 ml-0.5",fill:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{d:"M8 5v14l11-7z"})})}),(0,t.jsx)("button",{onClick:e=>{e.stopPropagation(),u()},onPointerDown:e=>e.stopPropagation(),className:"text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer",children:(0,t.jsx)("svg",{className:"w-5 h-5",fill:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{d:"M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"})})})]})]})})}])},60567,e=>{"use strict";var t=e.i(17555),a=e.i(20047);e.s(["default",0,function(){let e=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=e.current;if(!t)return;let a=t.getContext("2d");if(!a)return;let i=[],r=0,o=!1,n=()=>{t.width=window.innerWidth,t.height=window.innerHeight},l=()=>{if(document.hidden){o=!1,r=0;return}a.clearRect(0,0,t.width,t.height);for(let e=0;e<i.length;e++)i[e].update(),i[e].draw(),i[e].opacity<=0&&(i.splice(e,1),e--);if(0===i.length){a.clearRect(0,0,t.width,t.height),o=!1,r=0;return}r=requestAnimationFrame(l)},s=()=>{o||(o=!0,r=requestAnimationFrame(l))};class u{x;y;r;opacity;velocity;constructor(e,t){this.x=e,this.y=t,this.r=0,this.opacity=.6,this.velocity=2.5}update(){this.r+=this.velocity,this.velocity*=.96,this.opacity-=.015}draw(){a.beginPath(),a.arc(this.x,this.y,this.r,0,2*Math.PI),a.strokeStyle=`rgba(129, 140, 248, ${this.opacity})`,a.lineWidth=2,a.stroke(),a.beginPath(),a.arc(this.x,this.y,.5*this.r,0,2*Math.PI),a.fillStyle=`rgba(129, 140, 248, ${.3*this.opacity})`,a.fill()}}let d=e=>{i.push(new u(e.clientX,e.clientY)),s()},c=()=>{!document.hidden&&i.length>0&&s()};return window.addEventListener("resize",n),window.addEventListener("click",d),document.addEventListener("visibilitychange",c),n(),()=>{window.removeEventListener("resize",n),window.removeEventListener("click",d),document.removeEventListener("visibilitychange",c),r&&cancelAnimationFrame(r)}},[]),(0,t.jsx)("canvas",{ref:e,className:"fixed inset-0 pointer-events-none z-[9999]","aria-hidden":!0})}])},24566,e=>{"use strict";var t=e.i(17555),a=e.i(20047);let i=2*Math.PI/150,r=e=>3.4*Math.sin(i*e)+1.5*Math.sin(3*i*e+1.2),o=(e,t)=>20*Math.pow(Math.abs(e)/190,2)+(2.4*Math.sin(.045*e+3*i*t)+2*Math.cos(2*i*t-.011*e)+.9*Math.sin(.085*e+5*i*t)+.4*Math.sin(.19*e+7*i*t))-1.2,n=`
#define CORRIDOR 150.0
#define K ${i.toFixed(8)}

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
`,l=`
precision highp float;
${n}

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
uniform float uPointScale;   // 透视尺寸衰减：viewportHeight / (2\xb7tan(fov/2))
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
`,s=`
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
`,u=`
precision highp float;
${n}

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
`,d=`
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
`,c=`
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
`,f=`
precision highp float;
varying float vA;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv) * 2.0;
  if (r > 1.0) discard;
  float a = (1.0 - smoothstep(0.0, 1.0, r)) * vA * 0.45;
  gl_FragColor = vec4(vec3(0.97, 0.94, 0.86), a);
}
`,v=`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,m=`
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
`,h=`
precision highp float;
${n}

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
`,p=`
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
`,g=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,x=`
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
`,w=`
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
`,b=`
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
`;function y(e){let t=e>>>0;return function(){t|=0;let e=Math.imul((t=t+0x6d2b79f5|0)^t>>>15,1|t);return(((e=e+Math.imul(e^e>>>7,61|e)^e)^e>>>14)>>>0)/0x100000000}}e.s(["default",0,function({className:i=""}){let n=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t,a=n.current;if(!a)return;let i=!1;return(async()=>{let n,S,k,j,M,A;try{n=await e.A(90563)}catch{return}if(i)return;let T=window.matchMedia("(prefers-reduced-motion: reduce)").matches,P=new n.Color(329996),z=[[.95,.91,.79],[.9,.84,.7],[.82,.89,.86],[.98,.95,.87],[.86,.87,.94]],D=[[.2,.31,.26],[.15,.25,.22],[.26,.36,.29]];try{S=new n.WebGLRenderer({antialias:!1,alpha:!1,powerPreference:"high-performance",stencil:!1,depth:!0})}catch{return}S.setClearColor(198154,1),S.outputColorSpace=n.LinearSRGBColorSpace,a.appendChild(S.domElement),S.domElement.style.width="100%",S.domElement.style.height="100%",S.domElement.style.display="block";let C=new n.Scene,F=new n.PerspectiveCamera(58,1,.4,700);F.position.set(r(0),o(0,0)+4,0);let N=new n.OrthographicCamera(-1,1,1,-1,0,1),B=new n.PlaneGeometry(2,2),R=new n.ShaderMaterial({vertexShader:v,fragmentShader:m,uniforms:{uTime:{value:0}},side:n.BackSide,depthWrite:!1}),E=new n.Mesh(new n.SphereGeometry(450,24,16),R);E.frustumCulled=!1,C.add(E);let O={uFogColor:{value:P},uFogDensity:{value:.0135},uNear:{value:new n.Color(1120026)},uFar:{value:new n.Color(461582)},uTravel:{value:0}},_=new n.ShaderMaterial({vertexShader:h,fragmentShader:p,uniforms:O}),L=new n.PlaneGeometry(460,420,130,150);L.rotateX(-Math.PI/2),L.translate(0,0,-60);let G=new n.Mesh(L,_);G.frustumCulled=!1,C.add(G);let I={uTime:{value:0},uTravel:{value:0},uPixelRatio:{value:1},uPointScale:{value:600},uScatter:{value:0},uPush:{value:0},uPushRadius:{value:.45},uMouse:{value:new n.Vector2(99,99)},uFogColor:{value:P},uFogDensity:{value:.0135}},V=new n.ShaderMaterial({vertexShader:l,fragmentShader:s,uniforms:I,transparent:!0,depthWrite:!1,blending:n.AdditiveBlending}),U={uTime:{value:0},uTravel:{value:0},uPixelRatio:{value:1},uPointScale:{value:600},uScatter:{value:0},uPush:{value:0},uPushRadius:{value:.45},uMouse:{value:new n.Vector2(99,99)},uFogColor:{value:P},uFogDensity:{value:.0135}},W=new n.ShaderMaterial({vertexShader:u,fragmentShader:d,uniforms:U,transparent:!0,depthWrite:!1,blending:n.AdditiveBlending}),X={uTime:{value:0},uPixelRatio:{value:1},uPointScale:{value:600}},H=new n.ShaderMaterial({vertexShader:c,fragmentShader:f,uniforms:X,transparent:!0,depthWrite:!1,blending:n.AdditiveBlending}),$=null,Y=null,K=null,Z=()=>{let e=window.innerWidth<760,t=Math.round(Math.min(26e3,Math.max(6e3,window.innerWidth*window.innerHeight/62e3*(e?7e3:2e4)))),a=Math.round(.45*t),i=e?220:460,r=y(0x134dad5),o=y(778811),l=y(4242),s=new Float32Array(t),u=new Float32Array(t),d=new Float32Array(t),c=new Float32Array(t),f=new Float32Array(t),v=new Float32Array(t),m=new Float32Array(3*t);for(let e=0;e<t;e++){s[e]=150*r();let t=(r()+r()+r()-1.5)/1.5;u[e]=58*t,d[e]=.25+1.7*r(),c[e]=.24+.4*r(),f[e]=r(),v[e]=34+96*r();let a=z[Math.floor(r()*z.length)];m[3*e]=a[0],m[3*e+1]=a[1],m[3*e+2]=a[2]}let h=new n.BufferGeometry;h.setAttribute("position",new n.BufferAttribute(new Float32Array(3*t),3)),h.setAttribute("aZBase",new n.BufferAttribute(s,1)),h.setAttribute("aXOff",new n.BufferAttribute(u,1)),h.setAttribute("aYOff",new n.BufferAttribute(d,1)),h.setAttribute("aSize",new n.BufferAttribute(c,1)),h.setAttribute("aSeed",new n.BufferAttribute(f,1)),h.setAttribute("aOpen",new n.BufferAttribute(v,1)),h.setAttribute("aTint",new n.BufferAttribute(m,3)),$&&($.geometry.dispose(),C.remove($)),($=new n.Points(h,V)).frustumCulled=!1,C.add($);let p=new Float32Array(a),g=new Float32Array(a),x=new Float32Array(a),w=new Float32Array(a),b=new Float32Array(a),S=new Float32Array(3*a);for(let e=0;e<a;e++){p[e]=150*o();let t=(o()+o()+o()-1.5)/1.5;g[e]=64*t,x[e]=.15+1.1*o(),w[e]=.09+.2*o(),b[e]=o();let a=D[Math.floor(o()*D.length)];S[3*e]=a[0],S[3*e+1]=a[1],S[3*e+2]=a[2]}let k=new n.BufferGeometry;k.setAttribute("position",new n.BufferAttribute(new Float32Array(3*a),3)),k.setAttribute("aZBase",new n.BufferAttribute(p,1)),k.setAttribute("aXOff",new n.BufferAttribute(g,1)),k.setAttribute("aYOff",new n.BufferAttribute(x,1)),k.setAttribute("aSize",new n.BufferAttribute(w,1)),k.setAttribute("aSeed",new n.BufferAttribute(b,1)),k.setAttribute("aTint",new n.BufferAttribute(S,3)),Y&&(Y.geometry.dispose(),C.remove(Y)),(Y=new n.Points(k,W)).frustumCulled=!1,C.add(Y);let j=new Float32Array(3*i),M=new Float32Array(i),A=new Float32Array(i);for(let e=0;e<i;e++)j[3*e]=(l()-.5)*52,j[3*e+1]=18*l(),j[3*e+2]=-8+110*l(),M[e]=.025+.075*l(),A[e]=l();let T=new n.BufferGeometry;T.setAttribute("position",new n.BufferAttribute(j,3)),T.setAttribute("aSize",new n.BufferAttribute(M,1)),T.setAttribute("aSeed",new n.BufferAttribute(A,1)),K&&(K.geometry.dispose(),C.remove(K)),(K=new n.Points(T,H)).frustumCulled=!1,C.add(K)},q=((k=document.createElement("canvas")).width=128,k.height=128,(M=(j=k.getContext("2d")).createRadialGradient(64,64,0,64,64,64)).addColorStop(0,"rgba(226,240,214,0.85)"),M.addColorStop(.35,"rgba(190,220,180,0.30)"),M.addColorStop(1,"rgba(160,200,170,0)"),j.fillStyle=M,j.fillRect(0,0,128,128),new n.CanvasTexture(k)),J=[];for(let e=0;e<5;e++){let t=new n.SpriteMaterial({map:q,blending:n.AdditiveBlending,depthWrite:!1,depthTest:!1,opacity:.04,color:0xf0e8d6}),a=new n.Sprite(t);a.scale.set(90,210,1),t.rotation=-.42+(e%2==0?.06:-.06),C.add(a),J.push({sprite:a,phase:1.7*e%6.28,offset:52*e})}let Q=(A=S.extensions).has("EXT_color_buffer_half_float")||A.has("EXT_color_buffer_float")||A.has("EXT_color_buffer_half_float_webgl")?n.HalfFloatType:n.UnsignedByteType,ee=new n.WebGLRenderTarget(2,2,{type:Q,minFilter:n.LinearFilter,magFilter:n.LinearFilter,depthBuffer:!0,stencilBuffer:!1}),et=new n.WebGLRenderTarget(2,2,{type:Q,minFilter:n.LinearFilter,magFilter:n.LinearFilter,depthBuffer:!1,stencilBuffer:!1}),ea=new n.WebGLRenderTarget(2,2,{type:Q,minFilter:n.LinearFilter,magFilter:n.LinearFilter,depthBuffer:!1,stencilBuffer:!1}),ei=new n.ShaderMaterial({vertexShader:g,fragmentShader:x,uniforms:{tDiffuse:{value:ee.texture},uThreshold:{value:.55}},depthTest:!1,depthWrite:!1}),er=new n.ShaderMaterial({vertexShader:g,fragmentShader:w,uniforms:{tDiffuse:{value:et.texture},uDir:{value:new n.Vector2}},depthTest:!1,depthWrite:!1}),eo=new n.ShaderMaterial({vertexShader:g,fragmentShader:b,uniforms:{tScene:{value:ee.texture},tBloom:{value:ea.texture},uBloom:{value:.42},uAberration:{value:.3},uNoise:{value:.02},uVignette:{value:.25},uTime:{value:0},uRes:{value:new n.Vector2(1,1)}},depthTest:!1,depthWrite:!1}),en=new n.Scene,el=new n.Mesh(B,ei);el.frustumCulled=!1,en.add(el);let es=0,eu=0,ed=1,ec=!0,ef=1,ev=()=>{es=window.innerWidth,eu=window.innerHeight,ed=Math.min(window.devicePixelRatio||1,es<760?1.5:2)*ef,S.setPixelRatio(ed),S.setSize(es,eu,!1),F.aspect=es/Math.max(1,eu),F.updateProjectionMatrix();let e=Math.max(2,Math.round(es*ed)),t=Math.max(2,Math.round(eu*ed));ee.setSize(e,t);let a=Math.max(2,Math.round(e/4)),i=Math.max(2,Math.round(t/4));et.setSize(a,i),ea.setSize(a,i),eo.uniforms.uRes.value.set(e,t);let r=.5*t/Math.tan(F.fov*Math.PI/360);I.uPointScale.value=r,U.uPointScale.value=r,X.uPointScale.value=r,I.uPixelRatio.value=ed,U.uPixelRatio.value=ed,X.uPixelRatio.value=ed},em=new n.Vector2(99,99),eh=new n.Vector2(99,99),ep=!1,eg=0,ex=0,ew=0,eb=!1,ey=0,eS=0,ek=0,ej=e=>{eh.set(e.clientX/es*2-1,-(2*(e.clientY/eu))+1),ep=!0},eM=()=>{eh.set(99,99),ep=!1},eA=()=>{let e=window.scrollY,t=e-eS;eS=e,ex+=.42*t,ek=Math.min(1,Math.abs(t)/70)},eT=0,eP=!0,ez=0,eD=16,eC=0,eF=(e,t)=>{el.material=e,S.setRenderTarget(t),S.render(en,N)},eN=e=>{let t,a,i,n,l,s,u;if(!eP)return;let d=Math.min(.05,Math.max(.001,(e-ez)/1e3));ez=e;let c=e/1e3;for(let f of(eD=.92*eD+1e3*d*.08,0===eC&&e>4e3&&eD>30?(eC=1,ec=!1):1===eC&&e>9e3&&eD>34&&(eC=2,ef=.72,ev()),ex+=3.4*!eb*d,eg+=(ex-eg)*Math.min(1,4.5*d),t=Math.min(1,1.25*ek+.1),ek*=Math.pow(.02,d),ew+=(t-ew)*Math.min(1,3.2*d),ey+=(!!eb-ey)*Math.min(1,2.6*d),n=o(i=r(a=eg),a)+4.4,F.position.x=i,F.position.y=n,F.position.z=a,u=o(s=r(l=a+70),l)+1.6,F.lookAt(s,u,l),em.lerp(eh,Math.min(1,5*d)),ep&&(F.rotateY(.045*em.x),F.rotateX(.028*em.y)),E.position.copy(F.position),O.uTravel.value=a,I.uTravel.value=a,U.uTravel.value=a,J)){let e=eg+f.offset+20,t=r(e)+24*Math.sin(.12*c+f.phase);f.sprite.position.set(t,o(t,e)+15+3*Math.sin(.2*c+f.phase),e),f.sprite.material.opacity=.025+.022*(.5+.5*Math.sin(.35*c+f.phase))}K&&K.position.set(F.position.x,F.position.y-3,F.position.z);let f=.05*!!ep;if(I.uTime.value=c,I.uScatter.value=ey,I.uPush.value=f,I.uMouse.value.copy(em),U.uTime.value=c,U.uScatter.value=ey,U.uPush.value=f,U.uMouse.value.copy(em),X.uTime.value=c,R.uniforms.uTime.value=c,eo.uniforms.uTime.value=c,eo.uniforms.uVignette.value=.18+.55*ew+.1*ey,eo.uniforms.uBloom.value=ec?.42+.2*ew:0,eo.uniforms.uAberration.value=.3+.45*ew,S.setRenderTarget(ee),S.render(C,F),ec){ei.uniforms.tDiffuse.value=ee.texture,eF(ei,et);let e=et.width,t=et.height;er.uniforms.tDiffuse.value=et.texture,er.uniforms.uDir.value.set(1/e,0),eF(er,ea),er.uniforms.tDiffuse.value=ea.texture,er.uniforms.uDir.value.set(0,1/t),eF(er,et),er.uniforms.tDiffuse.value=et.texture,er.uniforms.uDir.value.set(2.2/e,0),eF(er,ea),er.uniforms.tDiffuse.value=ea.texture,er.uniforms.uDir.value.set(0,2.2/t),eF(er,et),eo.uniforms.tBloom.value=et.texture}else eo.uniforms.tBloom.value=ee.texture,eo.uniforms.uBloom.value=0;eo.uniforms.tScene.value=ee.texture,S.setRenderTarget(null),eF(eo,null),eT=requestAnimationFrame(eN)};Z(),ev(),eS=window.scrollY;let eB=()=>{T||((eP=!document.hidden)?(ez=performance.now(),eT=requestAnimationFrame(eN)):cancelAnimationFrame(eT))};window.addEventListener("pointermove",ej,{passive:!0}),window.addEventListener("pointerleave",eM,{passive:!0}),window.addEventListener("scroll",eA,{passive:!0}),document.addEventListener("visibilitychange",eB);let eR=0,eE=()=>{window.clearTimeout(eR),eR=window.setTimeout(()=>{ev(),Z()},240)};window.addEventListener("resize",eE),window.__valley={hover:e=>{eb=e}},T?(F.position.set(r(0),o(r(0),0)+4,0),F.lookAt(r(70),o(r(70),70)+.8,70),E.position.copy(F.position),eo.uniforms.uBloom.value=0,eo.uniforms.tBloom.value=ee.texture,S.setRenderTarget(ee),S.render(C,F),S.setRenderTarget(null),eF(eo,null)):(ez=performance.now(),eT=requestAnimationFrame(eN)),t=()=>{eP=!1,cancelAnimationFrame(eT),window.__valley&&delete window.__valley,window.removeEventListener("pointermove",ej),window.removeEventListener("pointerleave",eM),window.removeEventListener("scroll",eA),window.removeEventListener("resize",eE),document.removeEventListener("visibilitychange",eB),window.clearTimeout(eR),$?.geometry.dispose(),Y?.geometry.dispose(),K?.geometry.dispose(),L.dispose(),ee.dispose(),et.dispose(),ea.dispose(),q.dispose(),B.dispose(),S.dispose(),S.domElement.parentNode===a&&a.removeChild(S.domElement)}})(),()=>{i=!0,t?.()}},[]),(0,t.jsx)("div",{ref:n,className:`nv-canvas ${i}`,"aria-hidden":"true"})}])},43173,e=>{"use strict";var t=e.i(17555),a=e.i(20047),i=e.i(31551),r=e.i(61341);let o=[{id:"calc",name:"计算器",icon:"🧮",component:(0,t.jsx)(function(){let[e,r]=(0,a.useState)("0"),[o,n]=(0,a.useState)("");return(0,t.jsxs)(i.motion.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},exit:{opacity:0,x:20},className:"flex flex-col gap-3",children:[(0,t.jsxs)("div",{className:"bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 flex flex-col items-end justify-center h-24 shadow-inner border border-slate-200 dark:border-slate-700",children:[(0,t.jsx)("span",{className:"text-sm text-slate-400 dark:text-slate-500 tracking-wider h-5 mb-1",children:o}),(0,t.jsx)("span",{className:"text-4xl font-black text-slate-800 dark:text-white truncate w-full text-right",children:e})]}),(0,t.jsx)("div",{className:"grid grid-cols-4 gap-2 mt-1",children:["C","(",")","/","7","8","9","*","4","5","6","-","1","2","3","+","0",".","="].map(a=>(0,t.jsx)("button",{onClick:()=>(t=>{if("C"===t){r("0"),n("");return}if("Error"===e)if(["+","-","*","/"].includes(t)||"="===t){r("0"),n("");return}else{r("."===t?"0.":t),n("");return}if("="===t)try{let t=(o+e).replace(/[^-()\d/*+.]/g,""),a=Function("return "+t)();r(String(parseFloat(Number(a).toFixed(6)))),n("")}catch(e){r("Error")}else if(["+","-","*","/"].includes(t))"0"===e&&o&&["+","-","*","/"].includes(o.slice(-1))?n(o.slice(0,-1)+t):(n(o+e+t),r("0"));else{if("."===t&&e.includes("."))return;r("0"===e&&"."!==t?t:e+t)}})(a),className:`h-10 rounded-xl text-sm font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all
              ${"="===a?"col-span-2 bg-indigo-500 text-white hover:bg-indigo-600":["C","(",")","/","*","-","+"].includes(a)?"bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20":"bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600"}
            `,children:a},a))})]})},{})}];e.s(["default",0,function(){let[e,n]=(0,a.useState)(!1),[l,s]=(0,a.useState)(null),u=o.find(e=>e.id===l);return(0,t.jsxs)("div",{className:"fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-3",children:[(0,t.jsx)(r.AnimatePresence,{children:e&&(0,t.jsxs)(i.motion.div,{initial:{opacity:0,y:20,scale:.9,transformOrigin:"bottom left"},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:20,scale:.9},transition:{duration:.3,type:"spring",stiffness:300,damping:25},className:"mb-2 bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-4 w-64 flex flex-col gap-4 overflow-hidden",children:[(0,t.jsx)("div",{className:"flex flex-wrap gap-2 border-b border-slate-300/50 dark:border-slate-700/50 pb-3",children:o.map(e=>(0,t.jsxs)("button",{onClick:()=>s(l===e.id?null:e.id),className:`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${l===e.id?"bg-indigo-500 text-white shadow-md":"bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`,children:[e.icon," ",e.name]},e.id))}),(0,t.jsx)(r.AnimatePresence,{mode:"wait",children:u?(0,t.jsx)("div",{children:u.component},u.id):(0,t.jsxs)(i.motion.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"h-48 flex flex-col items-center justify-center text-slate-400 text-xs font-serif text-center px-4",children:[(0,t.jsx)("svg",{className:"w-8 h-8 mb-2 opacity-50",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.5,d:"M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1z"})}),"点击上方模块",(0,t.jsx)("br",{}),"激活工具"]},"empty")})]})}),(0,t.jsx)("button",{onClick:()=>{n(!e),e||l||s(o[0].id)},className:`w-12 h-12 rounded-full flex items-center justify-center shadow-xl backdrop-blur-xl border border-white/40 dark:border-white/10 transition-all duration-500 hover:scale-110 active:scale-95 z-50
          ${e?"bg-indigo-500 text-white rotate-45":"bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-white"}
        `,children:(0,t.jsx)("svg",{className:"w-6 h-6",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:e?"M12 4v16m8-8H4":"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"})})})]})}],43173)},61452,e=>{"use strict";var t=e.i(17555),a=e.i(20047),i=e.i(31551),r=e.i(61341),o=e.i(72924);e.s(["default",0,function(){let[e,n]=(0,a.useState)(!1),[l,s]=(0,a.useState)(!1);return((0,a.useEffect)(()=>{s(!0);let e=!1;try{e="true"===sessionStorage.getItem("hasSeenSplash")}catch{}if(e)return void document.documentElement.classList.add("splash-skip");n(!0);try{sessionStorage.setItem("hasSeenSplash","true")}catch{}let t=setTimeout(()=>n(!1),2400);return()=>clearTimeout(t)},[]),l)?(0,t.jsx)(r.AnimatePresence,{children:e&&(0,t.jsx)(i.motion.div,{exit:{opacity:0,scale:1.1,filter:"blur(20px)"},transition:{duration:.8,ease:"easeInOut"},className:"fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white dark:bg-slate-950",children:(0,t.jsxs)("div",{className:"relative z-10 flex flex-col items-center",children:[(0,t.jsxs)("div",{className:"relative w-24 h-24 mb-8",children:[(0,t.jsx)(i.motion.div,{animate:{rotate:360},transition:{duration:4,repeat:1/0,ease:"linear"},className:"absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[3px]"}),(0,t.jsx)("div",{className:"relative w-full h-full rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-xl",children:(0,t.jsx)("img",{src:o.siteConfig.avatarUrl,alt:"Avatar",className:"w-full h-full rounded-full object-cover"})})]}),(0,t.jsx)("h1",{className:"text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-[0.2em] uppercase",children:o.siteConfig.authorName}),(0,t.jsx)("p",{className:"text-[10px] font-black text-slate-400 tracking-[0.5em] mb-12",children:"INITIALIZING SYSTEM"}),(0,t.jsx)("div",{className:"w-40 h-[1.5px] bg-slate-200 dark:bg-slate-800 relative",children:(0,t.jsx)(i.motion.div,{initial:{width:"0%"},animate:{width:"100%"},transition:{duration:1.8,ease:"easeInOut"},className:"absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"})})]})},"splash-screen-container")}):null}])},92471,e=>{"use strict";var t=e.i(17555),a=e.i(20047),i=e.i(31551),r=e.i(61341);e.s(["default",0,function(){let[e,o]=(0,a.useState)(!1),[n,l]=(0,a.useState)(null),[s,u]=(0,a.useState)(!1),[d,c]=(0,a.useState)(""),[f,v]=(0,a.useState)(!1),m=(0,a.useRef)(null),h=(e,t=6e3)=>{l(e),m.current&&clearTimeout(m.current),m.current=setTimeout(()=>{l(null)},t)},p=async e=>{if(e.stopPropagation(),!f){u(!1),v(!0),h("嗷呜！真好吃喵！本喵吃饱了要说两句...",6e3);try{let e=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"我刚刚喂了你一条美味的小鱼干！你有什么表示？"})});if(!e.ok)throw Error("API Error");let t=await e.json();h(t.reply,8e3)}catch(e){h("吧唧吧唧... 鱼干好吃，但本喵卡壳了喵...",4e3)}finally{v(!1)}}},g=async e=>{if(e.preventDefault(),d.trim()&&!f){c(""),u(!1),v(!0),h("让本喵想想喵...",1e4);try{let e=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:d})});if(!e.ok)throw Error("API Error");let t=await e.json();h(t.reply,8e3)}catch(e){h("铲屎官的网线被老鼠咬断了吧？喵！",4e3)}finally{v(!1)}}};return(0,a.useEffect)(()=>{let e=["喵呜~ 今天天气真不错喵~","好困哦，想睡觉喵...","铲屎官，快去敲代码！","我的小鱼干藏哪里去了？","怎么没人理本喵..."],t=setInterval(()=>{!n&&!s&&!f&&Math.random()>.8&&h(e[Math.floor(Math.random()*e.length)],4e3)},2e4);return()=>clearInterval(t)},[n,s,f]),(0,t.jsxs)(i.motion.div,{drag:!0,dragConstraints:{left:0,right:0,top:0,bottom:0},dragElastic:.1,whileDrag:{scale:1.1,cursor:"grabbing"},className:"fixed bottom-20 right-20 z-[9999] flex flex-col items-center group cursor-grab active:cursor-grabbing",children:[(0,t.jsx)("div",{className:"relative w-full flex justify-center mb-6",children:(0,t.jsx)(r.AnimatePresence,{children:n&&(0,t.jsxs)(i.motion.div,{initial:{opacity:0,y:10,scale:.9},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,scale:.9,transition:{duration:.2}},className:"absolute bottom-0 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 text-sm max-w-[240px] break-words text-center leading-relaxed",style:{pointerEvents:"none",transformOrigin:"bottom center"},children:[n,(0,t.jsx)("div",{className:"absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-gray-100 dark:border-slate-700 transform rotate-45"})]})})}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsxs)("div",{className:"absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20",children:[(0,t.jsx)("button",{onClick:e=>{e.stopPropagation(),u(!s)},className:"bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-blue-500 hover:text-blue-600 flex items-center justify-center backdrop-blur-sm",title:"聊天",children:(0,t.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor",className:"w-5 h-5",children:(0,t.jsx)("path",{fillRule:"evenodd",d:"M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z",clipRule:"evenodd"})})}),(0,t.jsx)("button",{onClick:p,disabled:f,className:`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${f?"opacity-50 cursor-not-allowed":""}`,title:"喂小鱼干",children:(0,t.jsx)("span",{className:"text-xl leading-none",children:"🐟"})})]}),(0,t.jsxs)("div",{className:"w-[120px] h-[120px] relative cursor-pointer",onClick:()=>{e||(o(!0),h("呼噜噜... 摸得本喵很舒服喵~",2e3),setTimeout(()=>{o(!1)},2e3))},children:[(0,t.jsx)("style",{children:`
            .cat-sprite {
              width: 100%;
              height: 100%;
              background-image: url('/fgrze.stack/siamese-cat.png'); 
              background-size: 300% 300%; 
              background-repeat: no-repeat;
              image-rendering: pixelated; 
            }
            .cat-idle {
              animation: idle-frames 1.2s infinite;
              background-position-y: 0%; 
            }
            .cat-petted {
              animation: pet-frames 0.8s infinite;
              background-position-y: 50%; 
            }
            .cat-thinking {
              animation: idle-frames 0.6s infinite;
              background-position-y: 0%; 
            }
            @keyframes idle-frames {
              0%, 33.32% { background-position-x: 0%; }
              33.33%, 66.65% { background-position-x: 50%; }
              66.66%, 100% { background-position-x: 100%; }
            }
            @keyframes pet-frames {
              0%, 49.99% { background-position-x: 0%; }
              50%, 100% { background-position-x: 50%; }
            }
          `}),(0,t.jsx)("div",{className:`cat-sprite drop-shadow-2xl ${e?"cat-petted":f?"cat-thinking":"cat-idle"}`})]})]}),(0,t.jsx)(r.AnimatePresence,{children:s&&(0,t.jsxs)(i.motion.form,{initial:{opacity:0,y:-10,scale:.9},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:-10,scale:.9},onSubmit:g,className:"absolute -bottom-14 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg flex items-center border border-gray-200 dark:border-slate-700 w-56 z-20",children:[(0,t.jsx)("input",{type:"text",value:d,onChange:e=>c(e.target.value),placeholder:"跟煤球说点啥喵...",className:"bg-transparent border-none outline-none text-sm px-3 py-1 w-full dark:text-white placeholder-gray-400",disabled:f,autoFocus:!0}),(0,t.jsx)("button",{type:"submit",disabled:f||!d.trim(),className:`rounded-full p-1.5 ml-1 flex items-center justify-center transition-colors ${f||!d.trim()?"bg-gray-300 text-gray-500":"bg-blue-500 hover:bg-blue-600 text-white"}`,children:(0,t.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",className:"w-4 h-4",children:(0,t.jsx)("path",{d:"M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z"})})})]})})]})}])},28977,e=>{"use strict";var t=e.i(20047),a=e.i(90924);let i="/api/track";function r(e,t,a=!0){try{let r=JSON.stringify({path:e,event:t,ok:a});navigator.sendBeacon?navigator.sendBeacon(i,new Blob([r],{type:"application/json"})):fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}}e.s(["default",0,function(){let e=(0,a.usePathname)(),i=(0,t.useRef)("");return(0,t.useEffect)(()=>{if(!e||i.current===e)return;i.current=e,r(e,"pageview");let t=t=>{let a=t.detail||{};r(a.path||e,a.event||"api_error",!1)};return window.addEventListener("fgrze:api-error",t),()=>window.removeEventListener("fgrze:api-error",t)},[e]),null}])},15559,e=>{"use strict";var t=e.i(20047);e.s(["default",0,function(){return(0,t.useEffect)(()=>{let e=document.documentElement,t=()=>{document.hidden?e.setAttribute("data-tab-hidden","true"):e.removeAttribute("data-tab-hidden")};return t(),document.addEventListener("visibilitychange",t,{passive:!0}),window.addEventListener("pageshow",t,{passive:!0}),()=>{document.removeEventListener("visibilitychange",t),window.removeEventListener("pageshow",t),e.removeAttribute("data-tab-hidden")}},[]),null}])},38197,e=>{"use strict";var t=e.i(17555),a=e.i(90924),i=e.i(76721);e.s(["default",0,function(){let e=(0,a.useRouter)();return(0,t.jsx)("button",{onClick:()=>e.back(),className:"fixed bottom-24 right-4 z-[90] w-11 h-11 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl rounded-full text-slate-700 dark:text-slate-200 active:scale-90 transition-all",title:"返回上一页",children:(0,t.jsx)(i.ChevronLeft,{size:24})})}])}]);