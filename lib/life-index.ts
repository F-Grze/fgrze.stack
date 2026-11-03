/**
 * 生活指数推算（纯函数，前后端共用）
 *
 * 高德天气接口本身不提供生活指数，这里依据实况（气温 / 天气现象 /
 * 湿度 / 风力）推算穿衣、紫外线、洗车、运动、感冒、晨练六项指数。
 */

export interface LifeIndex {
  key: string;
  name: string;
  level: string;
  advice: string;
  icon: string;
}

export interface LifeInput {
  temperature: string | number;
  weather: string;
  humidity: string | number;
  windpower: string;
}

function isWet(weather: string): boolean {
  return /雨|雪|阵雨|雷|冰雹|冻/.test(weather);
}
function isCloudy(weather: string): boolean {
  return /阴|云|雾|霾|沙|尘/.test(weather);
}
function isClear(weather: string): boolean {
  return /晴/.test(weather);
}

/** 按气温推导穿衣指数 */
function clothing(temp: number): [string, string] {
  if (temp >= 32) return ['炎热', '短袖短裤，注意防晒补水'];
  if (temp >= 28) return ['热', '短袖即可，户外注意防暑'];
  if (temp >= 22) return ['舒适', '薄长袖或短袖，早晚可加一件外套'];
  if (temp >= 16) return ['微凉', '长袖衬衫加薄外套'];
  if (temp >= 10) return ['凉', '风衣或薄毛衣，建议加件外套'];
  if (temp >= 4) return ['冷', '夹克加针织衫，早晚温差大'];
  if (temp >= -5) return ['寒冷', '羽绒服或厚外套，注意手脚保暖'];
  return ['严寒', '羽绒、厚帽围巾全副武装'];
}

/** 按天气 + 气温推导紫外线指数 */
function ultraviolet(weather: string, temp: number, month: number): [string, string] {
  const summer = month >= 5 && month <= 8;
  let uv = 0;
  if (isClear(weather)) uv = summer ? 5 : 3;
  else if (/多云/.test(weather)) uv = summer ? 4 : 2;
  else if (isCloudy(weather)) uv = 1;
  if (temp > 33 && uv > 0) uv = Math.min(uv + 1, 5);

  const levels: Array<[string, string]> = [
    ['很弱', '几乎无需防护，正常出行'],
    ['较弱', '长时间户外建议涂 SPF30 防晒'],
    ['中等', '外出请戴帽子、涂防晒霜'],
    ['较强', '减少正午暴晒，防晒霜 SPF50'],
    ['很强', '尽量避开 10-16 点，做好全面防晒'],
  ];
  return levels[uv];
}

/** 洗车指数 */
function carWash(weather: string): [string, string] {
  if (/暴雨|大雨|中雨|雷阵雨|雷雨|冰雹|大雪|中雪/.test(weather)) {
    return ['不宜', '有降水，洗了也白洗'];
  }
  if (isWet(weather)) return ['一般', '有小雨，可观望一天'];
  if (isCloudy(weather)) return ['较宜', '云层多但无降水，可以洗'];
  return ['适宜', '天气不错，适合洗车'];
}

/** 运动指数 */
function sports(weather: string, temp: number, windLevel: number): [string, string] {
  if (/暴雨|雷阵雨|雷雨|冰雹|大雪/.test(weather)) return ['不宜', '天气恶劣，建议室内运动'];
  if (isWet(weather)) return ['较不宜', '有降水，尽量改在室内'];
  if (temp >= 32) return ['较不宜', '高温时段避免剧烈运动'];
  if (temp <= 0) return ['较不宜', '气温过低，注意热身'];
  if (windLevel >= 5) return ['一般', '风力偏大，户外注意安全'];
  return ['适宜', '天气舒适，适合户外运动'];
}

/** 感冒指数 */
function coldRisk(temp: number, humidity: number, windLevel: number): [string, string] {
  let score = 0;
  if (temp <= 5) score += 3;
  else if (temp <= 12) score += 2;
  else if (temp <= 18) score += 1;
  if (humidity >= 80) score += 1;
  if (windLevel >= 4) score += 1;

  if (score >= 4) return ['易发', '温差大，注意添衣保暖'];
  if (score >= 2) return ['较易发', '早晚温差较大，带件外套'];
  return ['少发', '天气舒适，较为舒适'];
}

/** 晨练指数 */
function morningExercise(weather: string, temp: number): [string, string] {
  if (/雾|霾|沙|尘/.test(weather)) return ['不宜', '空气质量不佳，建议室内运动'];
  if (isWet(weather)) return ['较不宜', '有降水，注意防滑'];
  if (temp <= 0) return ['较不宜', '气温过低，建议推迟'];
  return ['适宜', '天气不错，适合晨练'];
}

/** 依据实况推算全套生活指数 */
export function buildLifeIndices(live: LifeInput): LifeIndex[] {
  const temp = Number(live.temperature) || 0;
  const humidity = Number(live.humidity) || 0;
  const weather = live.weather || '';
  const month = new Date().getMonth() + 1;
  const windLevel = Number(String(live.windpower || '').replace(/[^\d]/g, '')) || 0;

  const [cLvl, cAdv] = clothing(temp);
  const [uLvl, uAdv] = ultraviolet(weather, temp, month);
  const [carLvl, carAdv] = carWash(weather);
  const [spLvl, spAdv] = sports(weather, temp, windLevel);
  const [cdLvl, cdAdv] = coldRisk(temp, humidity, windLevel);
  const [mgLvl, mgAdv] = morningExercise(weather, temp);

  return [
    { key: 'clothes', name: '穿衣', level: cLvl, advice: cAdv, icon: '🧥' },
    { key: 'uv', name: '紫外线', level: uLvl, advice: uAdv, icon: '🕶️' },
    { key: 'car', name: '洗车', level: carLvl, advice: carAdv, icon: '🚗' },
    { key: 'sport', name: '运动', level: spLvl, advice: spAdv, icon: '🏃' },
    { key: 'cold', name: '感冒', level: cdLvl, advice: cdAdv, icon: '🤧' },
    { key: 'morning', name: '晨练', level: mgLvl, advice: mgAdv, icon: '🌅' },
  ];
}

/* ------------------------------------------------------------------ */
/* Open-Meteo（WMO 天气代码）辅助                                       */
/* ------------------------------------------------------------------ */

const WMO: Array<[number, string]> = [
  [0, '晴'],
  [1, '大部晴朗'],
  [2, '多云'],
  [3, '阴'],
  [45, '有雾'],
  [48, '雾凇'],
  [51, '小毛毛雨'],
  [53, '毛毛雨'],
  [55, '浓毛毛雨'],
  [56, '冻毛毛雨'],
  [57, '强冻毛毛雨'],
  [61, '小雨'],
  [63, '中雨'],
  [65, '大雨'],
  [66, '冻雨'],
  [67, '强冻雨'],
  [71, '小雪'],
  [73, '中雪'],
  [75, '大雪'],
  [77, '雪粒'],
  [80, '阵雨'],
  [81, '强阵雨'],
  [82, '暴雨'],
  [85, '阵雪'],
  [86, '强阵雪'],
  [95, '雷阵雨'],
  [96, '雷雨伴冰雹'],
  [99, '强雷雨伴冰雹'],
];

/** WMO 天气代码 → 中文描述 */
export function openMeteoText(code: number | undefined): string {
  if (code === undefined || code === null) return '未知天气';
  const hit = WMO.find(([c]) => c === code);
  return hit ? hit[1] : '未知天气';
}

/** 角度 → 风向描述 */
export function windDir(deg: number | undefined): string {
  if (deg === undefined || deg === null || Number.isNaN(deg)) return '微风';
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}
