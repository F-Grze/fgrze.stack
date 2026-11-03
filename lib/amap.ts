/**
 * 高德开放平台 Web 服务 API 封装
 *
 * 安全约定：
 *  - 所有请求都发生在服务端（Node / Edge Route Handler），
 *    Key 只从环境变量 AMAP_KEY 读取，绝不打进前端 bundle。
 *  - 前端一律通过 /api/weather 代理访问，看不到 Key。
 */

export const AMAP_BASE = 'https://restapi.amap.com/v3';

/** 服务端读取 Key。缺失时返回空串，由调用方转成友好错误。 */
export function getAmapKey(): string {
  return (
    process.env.AMAP_KEY ||
    process.env.AMAP_WEATHER_KEY ||
    process.env.NEXT_PUBLIC_AMAP_KEY ||
    ''
  ).trim();
}

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

export interface AmapLive {
  province: string;
  city: string;
  adcode: string;
  weather: string;
  temperature: string;
  winddirection: string;
  windpower: string;
  humidity: string;
  reporttime: string;
  temperature_float?: string;
  humidity_float?: string;
}

export interface AmapCast {
  date: string;
  week: string;
  dayweather: string;
  nightweather: string;
  daytemp: string;
  nighttemp: string;
  daywind: string;
  nightwind: string;
  daypower: string;
  nightpower: string;
}

export interface AmapForecast {
  city: string;
  adcode: string;
  province: string;
  reporttime: string;
  casts: AmapCast[];
}
export interface AmapWeatherResponse {
  status: string;
  count: string;
  info: string;
  infocode: string;
  /** extensions=base 时返回 */
  lives?: AmapLive[];
  /** extensions=all 时返回（注意高德用的是复数 forecasts） */
  forecasts?: AmapForecast[];
}

/** 高德逆地理编码结果 */
export interface AmapRegeoResult {
  adcode: string;
  city: string;
  province: string;
  district: string;
  township: string;
  formattedAddress: string;
  lng: number;
  lat: number;
}

/* ------------------------------------------------------------------ */
/* 错误处理                                                            */
/* ------------------------------------------------------------------ */

/** 高德 infocode → 面向用户的中文提示 */
const INFOCODE_MESSAGE: Record<string, string> = {
  '10001': '高德 Key 无效，请检查 AMAP_KEY 是否填写正确。',
  '10002': '高德 Key 类型不匹配，请在控制台申请「Web服务」类型的 Key。',
  '10003': '高德服务权限未开通或日调用量已用尽，请前往开放平台配额管理查看。',
  '10004': '高德日调用量已用尽，请明日再试或提升配额。',
  '10005': '高德每秒调用过于频繁，已被限流，请稍后再试。',
  '10006': '高德日调用量已用尽，请明日再试或提升配额。',
  '10007': '请求参数不合法，请检查城市编码（adcode）。',
  '10008': '高德日调用量已用尽，请明日再试或提升配额。',
  '10009': '高德授权失败，请检查 Key 的授权范围。',
  '10010': '用户 ID 无效，请重新申请 Key。',
  '10011': '高德 CSRF 校验失败，请稍后重试。',
  '10012': '无效的服务类型。',
  '10013': '无效的城市编码（adcode），请重新选择城市。',
  '20001': '高德服务暂时不可用，请稍后再试。',
};

export class AmapError extends Error {
  /** 归一化后的 HTTP 状态码 */
  status: number;
  /** 归一化后的机器可读错误码 */
  code: string;

  constructor(message: string, status = 502, code = 'AMAP_ERROR') {
    super(message);
    this.name = 'AmapError';
    this.status = status;
    this.code = code;
  }
}

/** 把高德返回体解析成统一错误 */
function parseAmapError(json: Partial<AmapWeatherResponse>): AmapError {
  const infocode = String(json.infocode || '');
  const raw = json.info || '高德服务返回异常';

  // 10000 是成功码，status=0 时 infocode 通常直接说明原因
  if (infocode === '10005') {
    return new AmapError('请求过于频繁，已被高德限流，请稍等片刻再试。', 429, 'RATE_LIMITED');
  }
  if (infocode === '10003' || infocode === '10004' || infocode === '10006' || infocode === '10008') {
    return new AmapError('高德天气接口调用额度已用尽，请稍后再试。', 429, 'QUOTA_EXHAUSTED');
  }
  if (infocode === '10013' || infocode === '10007') {
    return new AmapError('城市编码无效，请重新选择城市。', 400, 'INVALID_CITY');
  }
  if (infocode === '10001' || infocode === '10002' || infocode === '10009') {
    return new AmapError(INFOCODE_MESSAGE[infocode] || raw, 500, 'INVALID_KEY');
  }

  return new AmapError(INFOCODE_MESSAGE[infocode] || raw, 502, 'AMAP_ERROR');
}

/* ------------------------------------------------------------------ */
/* 请求封装                                                            */
/* ------------------------------------------------------------------ */

async function amapFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = getAmapKey();
  if (!key) {
    throw new AmapError(
      '尚未配置高德天气 Key，请在服务端环境变量中设置 AMAP_KEY。',
      500,
      'KEY_MISSING',
    );
  }

  const url = new URL(`${AMAP_BASE}/${path}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'F-Grze-Blog-Weather/1.0 (+https://f-grze.github.io)',
      },
      // 天气接口自己做了缓存，这里禁掉 Next 的数据缓存，由我们在路由层控制 TTL
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new AmapError('连接高德天气服务超时，请检查网络后重试。', 504, 'TIMEOUT');
    }
    throw new AmapError('无法连接高德天气服务，请检查网络后重试。', 502, 'NETWORK_ERROR');
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new AmapError('请求过于频繁，已被高德限流，请稍后再试。', 429, 'RATE_LIMITED');
    }
    throw new AmapError(`高德天气服务返回 HTTP ${res.status}。`, 502, 'AMAP_ERROR');
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new AmapError('高德天气服务返回了无法解析的数据。', 502, 'BAD_PAYLOAD');
  }

  if (String(json.status) !== '1') {
    throw parseAmapError(json);
  }

  return json as T;
}

/* ------------------------------------------------------------------ */
/* 业务方法                                                            */
/* ------------------------------------------------------------------ */

/** 按 adcode 查询天气。extensions=base 实况，all 预报 */
export async function fetchAmapWeather(
  adcode: string,
  extensions: 'base' | 'all' = 'all',
): Promise<AmapWeatherResponse> {
  return amapFetch<AmapWeatherResponse>('weather/weatherInfo', {
    city: adcode,
    extensions,
    output: 'JSON',
  });
}

/** 经纬度 → 行政区划（取 adcode 用于查天气） */
export async function fetchAmapRegeo(lng: number, lat: number): Promise<AmapRegeoResult> {
  const json = await amapFetch<any>('geocode/regeo', {
    location: `${lng},${lat}`,
  });

  const ac = json.regeocode?.addressComponent || {};
  const adcode = String(ac.adcode || '');
  if (!adcode) {
    throw new AmapError('该位置暂时解析不到所属城市，请手动选择城市。', 404, 'LOCATION_NOT_FOUND');
  }

  // 高德返回的 city 有时是 []（直辖市/省辖市），做一次兜底
  const city = Array.isArray(ac.city) ? '' : ac.city || '';
  const province = Array.isArray(ac.province) ? '' : ac.province || '';
  const district = Array.isArray(ac.district) ? '' : ac.district || '';
  const township = Array.isArray(ac.township) ? '' : ac.township || '';

  return {
    adcode,
    city: city || district || township,
    province,
    district,
    township,
    formattedAddress: json.regeocode?.formatted_address || '',
    lng,
    lat,
  };
}

/** IP 定位（浏览器拒绝定位时的兜底，仅对国内 IP 有效） */
export async function fetchAmapIpLocation(): Promise<AmapRegeoResult | null> {
  const json = await amapFetch<any>('ip', {});
  const adcode = Array.isArray(json.adcode) ? '' : String(json.adcode || '');
  if (!adcode) return null;
  const city = Array.isArray(json.city) ? '' : json.city;
  const province = Array.isArray(json.province) ? '' : json.province;
  return {
    adcode,
    city: city || province,
    province,
    district: '',
    township: '',
    formattedAddress: `${province}${city}`,
    lng: 0,
    lat: 0,
  };
}

/* ------------------------------------------------------------------ */
/* 城市表（与客户端共用，单独成模块避免把服务端逻辑打进前端 bundle）    */
/* ------------------------------------------------------------------ */

export { CITY_TABLE, type CityEntry } from './cities';

/* ------------------------------------------------------------------ */
/* 生活指数                                                            */
/* ------------------------------------------------------------------ */

// 实现在 lib/life-index.ts（前后端共用），这里只做转发
export { buildLifeIndices } from './life-index';
export type { LifeIndex } from './life-index';
