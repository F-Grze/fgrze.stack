/**
 * 高德天气边缘代理（Cloudflare Worker）
 * ============================================
 * 用途：让 GitHub Pages 这类纯静态托管也能安全调用高德天气，
 *       而不必把 Key 写进前端代码。
 *
 * 部署步骤：
 *   1. Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. 粘贴本文件内容 → Deploy
 *   3. Settings → Variables and Secrets → 新增 Secret：
 *        AMAP_KEY = <你的高德 Web 服务 Key>       （务必用 Secret，不要用普通变量）
 *      可选：ALLOWED_ORIGIN = https://f-grze.github.io   （不填则允许所有来源）
 *   4. 构建静态站点时带上：
 *        NEXT_PUBLIC_WEATHER_API_BASE=https://<你的worker>.workers.dev/api/weather
 *
 * 支持的接口（与 Next.js /api/weather 保持一致）：
 *   GET /api/weather?city=310100
 *   GET /api/weather?action=locate&location=120.15,30.27
 *   GET /api/weather?action=ip
 *   GET /api/weather?action=cities
 */

const AMAP_BASE = 'https://restapi.amap.com/v3';
const CACHE_TTL = 480; // 8 分钟

const LIFE_ADVICE = {
  10003: '高德服务权限未开通或日调用量已用尽，请前往开放平台配额管理查看。',
  10004: '高德日调用量已用尽，请明日再试或提升配额。',
  10005: '请求过于频繁，已被高德限流，请稍后再试。',
  10006: '高德日调用量已用尽，请明日再试或提升配额。',
  10008: '高德日调用量已用尽，请明日再试或提升配额。',
  10013: '无效的城市编码（adcode），请重新选择城市。',
  10001: '高德 Key 无效，请检查 AMAP_KEY 是否填写正确。',
  10002: '高德 Key 类型不匹配，请申请「Web服务」类型的 Key。',
  10007: '请求参数不合法，请检查城市编码（adcode）。',
};

const CITY_TABLE = [
  { adcode: '110100', name: '北京', province: '北京市' },
  { adcode: '310100', name: '上海', province: '上海市' },
  { adcode: '440100', name: '广州', province: '广东省' },
  { adcode: '440300', name: '深圳', province: '广东省' },
  { adcode: '330100', name: '杭州', province: '浙江省' },
  { adcode: '320100', name: '南京', province: '江苏省' },
  { adcode: '320500', name: '苏州', province: '江苏省' },
  { adcode: '120100', name: '天津', province: '天津市' },
  { adcode: '500100', name: '重庆', province: '重庆市' },
  { adcode: '510100', name: '成都', province: '四川省' },
  { adcode: '420100', name: '武汉', province: '湖北省' },
  { adcode: '610100', name: '西安', province: '陕西省' },
  { adcode: '430100', name: '长沙', province: '湖南省' },
  { adcode: '370200', name: '青岛', province: '山东省' },
  { adcode: '410100', name: '郑州', province: '河南省' },
  { adcode: '370100', name: '济南', province: '山东省' },
  { adcode: '340100', name: '合肥', province: '安徽省' },
  { adcode: '350100', name: '福州', province: '福建省' },
  { adcode: '350200', name: '厦门', province: '福建省' },
  { adcode: '530100', name: '昆明', province: '云南省' },
  { adcode: '450100', name: '南宁', province: '广西' },
  { adcode: '520100', name: '贵阳', province: '贵州省' },
  { adcode: '210100', name: '沈阳', province: '辽宁省' },
  { adcode: '210200', name: '大连', province: '辽宁省' },
  { adcode: '230100', name: '哈尔滨', province: '黑龙江省' },
  { adcode: '220100', name: '长春', province: '吉林省' },
  { adcode: '130100', name: '石家庄', province: '河北省' },
  { adcode: '140100', name: '太原', province: '山西省' },
  { adcode: '620100', name: '兰州', province: '甘肃省' },
  { adcode: '650100', name: '乌鲁木齐', province: '新疆' },
  { adcode: '360100', name: '南昌', province: '江西省' },
  { adcode: '330200', name: '宁波', province: '浙江省' },
  { adcode: '320200', name: '无锡', province: '江苏省' },
  { adcode: '330300', name: '温州', province: '浙江省' },
  { adcode: '440400', name: '珠海', province: '广东省' },
  { adcode: '440600', name: '佛山', province: '广东省' },
  { adcode: '441900', name: '东莞', province: '广东省' },
  { adcode: '442000', name: '中山', province: '广东省' },
  { adcode: '441300', name: '惠州', province: '广东省' },
  { adcode: '440500', name: '汕头', province: '广东省' },
  { adcode: '440800', name: '湛江', province: '广东省' },
  { adcode: '350500', name: '泉州', province: '福建省' },
  { adcode: '320300', name: '徐州', province: '江苏省' },
  { adcode: '320400', name: '常州', province: '江苏省' },
  { adcode: '320600', name: '南通', province: '江苏省' },
  { adcode: '321000', name: '扬州', province: '江苏省' },
  { adcode: '410300', name: '洛阳', province: '河南省' },
  { adcode: '370600', name: '烟台', province: '山东省' },
  { adcode: '370700', name: '潍坊', province: '山东省' },
  { adcode: '371300', name: '临沂', province: '山东省' },
  { adcode: '130200', name: '唐山', province: '河北省' },
  { adcode: '130300', name: '秦皇岛', province: '河北省' },
  { adcode: '130600', name: '保定', province: '河北省' },
  { adcode: '131000', name: '廊坊', province: '河北省' },
  { adcode: '340200', name: '芜湖', province: '安徽省' },
  { adcode: '340300', name: '蚌埠', province: '安徽省' },
  { adcode: '610400', name: '咸阳', province: '陕西省' },
  { adcode: '610300', name: '宝鸡', province: '陕西省' },
  { adcode: '150100', name: '呼和浩特', province: '内蒙古' },
  { adcode: '150200', name: '包头', province: '内蒙古' },
  { adcode: '460100', name: '海口', province: '海南省' },
  { adcode: '460200', name: '三亚', province: '海南省' },
  { adcode: '450300', name: '桂林', province: '广西' },
  { adcode: '450200', name: '柳州', province: '广西' },
  { adcode: '540100', name: '拉萨', province: '西藏' },
  { adcode: '630100', name: '西宁', province: '青海' },
  { adcode: '640100', name: '银川', province: '宁夏' },
];

function corsHeaders(request, env) {
  const origin = env.ALLOWED_ORIGIN || request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(request, env, payload, status = 200, extra = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=480, stale-while-revalidate=600',
      ...corsHeaders(request, env),
      ...extra,
    },
  });
}

async function amap(env, path, params) {
  const key = env.AMAP_KEY;
  if (!key) throw Object.assign(new Error('尚未配置 AMAP_KEY Secret。'), { status: 500, code: 'KEY_MISSING' });

  const url = new URL(`${AMAP_BASE}/${path}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  const data = await res.json();
  if (String(data.status) !== '1') {
    const infocode = String(data.infocode || '');
    const status =
      infocode === '10005' ? 429
      : infocode === '10003' || infocode === '10004' || infocode === '10006' || infocode === '10008' ? 429
      : infocode === '10013' || infocode === '10007' ? 400
      : 502;
    const message = LIFE_ADVICE[infocode] || data.info || '高德服务返回异常';
    throw Object.assign(new Error(message), { status, code: infocode });
  }
  return data;
}

/* ---------------- 生活指数推算（与 lib/amap.ts 保持一致） ---------------- */
function isWet(w) { return /雨|雪|阵雨|雷|冰雹|冻/.test(w); }
function isCloudy(w) { return /阴|云|雾|霾|沙|尘/.test(w); }
function isClear(w) { return /晴/.test(w); }

function clothing(t) {
  if (t >= 32) return ['炎热', '短袖短裤，注意防晒补水'];
  if (t >= 28) return ['热', '短袖即可，户外注意防暑'];
  if (t >= 22) return ['舒适', '薄长袖或短袖，早晚可加一件外套'];
  if (t >= 16) return ['微凉', '长袖衬衫加薄外套'];
  if (t >= 10) return ['凉', '风衣或薄毛衣，建议加件外套'];
  if (t >= 4) return ['冷', '夹克加针织衫，早晚温差大'];
  if (t >= -5) return ['寒冷', '羽绒服或厚外套，注意手脚保暖'];
  return ['严寒', '羽绒、厚帽围巾全副武装'];
}
function ultraviolet(w, t, m) {
  const summer = m >= 5 && m <= 8;
  let uv = 0;
  if (isClear(w)) uv = summer ? 5 : 3;
  else if (/多云/.test(w)) uv = summer ? 4 : 2;
  else if (isCloudy(w)) uv = 1;
  if (t > 33 && uv > 0) uv = Math.min(uv + 1, 5);
  const L = [
    ['很弱', '几乎无需防护，正常出行'],
    ['较弱', '长时间户外建议涂 SPF30 防晒'],
    ['中等', '外出请戴帽子、涂防晒霜'],
    ['较强', '减少正午暴晒，防晒霜 SPF50'],
    ['很强', '尽量避开 10-16 点，做好全面防晒'],
  ];
  return L[uv];
}
function buildLife(live) {
  const t = Number(live.temperature) || 0;
  const h = Number(live.humidity) || 0;
  const w = live.weather || '';
  const m = new Date().getMonth() + 1;
  const wind = Number(String(live.windpower || '').replace(/[^\d]/g, '')) || 0;

  const [cLvl, cAdv] = clothing(t);
  const [uLvl, uAdv] = ultraviolet(w, t, m);

  let carLvl, carAdv;
  if (/暴雨|大雨|中雨|雷阵雨|雷雨|冰雹|大雪|中雪/.test(w)) { carLvl = '不宜'; carAdv = '有降水，洗了也白洗'; }
  else if (isWet(w)) { carLvl = '一般'; carAdv = '有小雨，可观望一天'; }
  else if (isCloudy(w)) { carLvl = '较宜'; carAdv = '云层多但无降水，可以洗'; }
  else { carLvl = '适宜'; carAdv = '天气不错，适合洗车'; }

  let spLvl, spAdv;
  if (/暴雨|雷阵雨|雷雨|冰雹|大雪/.test(w)) { spLvl = '不宜'; spAdv = '天气恶劣，建议室内运动'; }
  else if (isWet(w)) { spLvl = '较不宜'; spAdv = '有降水，尽量改在室内'; }
  else if (t >= 32) { spLvl = '较不宜'; spAdv = '高温时段避免剧烈运动'; }
  else if (t <= 0) { spLvl = '较不宜'; spAdv = '气温过低，注意热身'; }
  else if (wind >= 5) { spLvl = '一般'; spAdv = '风力偏大，户外注意安全'; }
  else { spLvl = '适宜'; spAdv = '天气舒适，适合户外运动'; }

  let score = 0;
  if (t <= 5) score += 3; else if (t <= 12) score += 2; else if (t <= 18) score += 1;
  if (h >= 80) score += 1;
  if (wind >= 4) score += 1;
  const [cdLvl, cdAdv] = score >= 4 ? ['易发', '温差大，注意添衣保暖']
    : score >= 2 ? ['较易发', '早晚温差较大，带件外套']
    : ['少发', '天气舒适，较为舒适'];

  let mgLvl, mgAdv;
  if (/雾|霾|沙|尘/.test(w)) { mgLvl = '不宜'; mgAdv = '空气质量不佳，建议室内运动'; }
  else if (isWet(w)) { mgLvl = '较不宜'; mgAdv = '有降水，注意防滑'; }
  else if (t <= 0) { mgLvl = '较不宜'; mgAdv = '气温过低，建议推迟'; }
  else { mgLvl = '适宜'; mgAdv = '天气不错，适合晨练'; }

  return [
    { key: 'clothes', name: '穿衣', level: cLvl, advice: cAdv, icon: '🧥' },
    { key: 'uv', name: '紫外线', level: uLvl, advice: uAdv, icon: '🕶️' },
    { key: 'car', name: '洗车', level: carLvl, advice: carAdv, icon: '🚗' },
    { key: 'sport', name: '运动', level: spLvl, advice: spAdv, icon: '🏃' },
    { key: 'cold', name: '感冒', level: cdLvl, advice: cdAdv, icon: '🤧' },
    { key: 'morning', name: '晨练', level: mgLvl, advice: mgAdv, icon: '🌅' },
  ];
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    // 允许 /api/weather 与 / 两种路径挂载
    const action = url.searchParams.get('action') || 'weather';

    try {
      if (action === 'cities') {
        return json(request, env, { ok: true, cities: CITY_TABLE });
      }

      if (action === 'locate') {
        const raw = url.searchParams.get('location') || '';
        const [lng, lat] = raw.split(',').map(Number);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          return json(request, env, { ok: false, code: 'INVALID_LOCATION', message: '经纬度格式不正确。' }, 400);
        }
        const cache = caches.default;
        const cacheKey = new Request(`https://worker.local/regeo/${lng.toFixed(3)},${lat.toFixed(3)}`);
        const hit = await cache.match(cacheKey);
        if (hit) return hit;

        const data = await amap(env, 'geocode/regeo', { location: `${lng},${lat}` });
        const ac = data.regeocode?.addressComponent || {};
        const adcode = String(ac.adcode || '');
        if (!adcode) {
          return json(request, env, { ok: false, code: 'LOCATION_NOT_FOUND', message: '该位置暂时解析不到所属城市，请手动选择城市。' }, 404);
        }
        const city = Array.isArray(ac.city) ? '' : ac.city || '';
        const province = Array.isArray(ac.province) ? '' : ac.province || '';
        const payload = {
          ok: true,
          location: {
            adcode, city: city || province, province,
            district: Array.isArray(ac.district) ? '' : ac.district || '',
            township: Array.isArray(ac.township) ? '' : ac.township || '',
            formattedAddress: data.regeocode?.formatted_address || '',
            lng, lat,
          },
        };
        const res = json(request, env, payload);
        if (env.AMAP_WORKER_CACHE !== 'off') {
          ctx_waitUntil(cache.put(cacheKey, res.clone()));
        }
        return res;
      }

      if (action === 'ip') {
        const data = await amap(env, 'ip', {});
        const adcode = Array.isArray(data.adcode) ? '' : String(data.adcode || '');
        if (!adcode) {
          return json(request, env, { ok: false, code: 'IP_LOCATION_UNAVAILABLE', message: '暂时无法通过网络定位判断所在城市，请手动选择。' }, 404);
        }
        const city = Array.isArray(data.city) ? '' : data.city;
        const province = Array.isArray(data.province) ? '' : data.province;
        return json(request, env, {
          ok: true,
          location: { adcode, city: city || province, province, district: '', township: '', formattedAddress: `${province}${city}`, lng: 0, lat: 0 },
        });
      }

      const city = (url.searchParams.get('city') || '').trim();
      if (!/^\d{6}$/.test(city)) {
        return json(request, env, { ok: false, code: 'INVALID_CITY', message: '城市编码格式不正确，应为 6 位 adcode。' }, 400);
      }

      const [base, all] = await Promise.all([
        amap(env, 'weather/weatherInfo', { city, extensions: 'base', output: 'JSON' }),
        amap(env, 'weather/weatherInfo', { city, extensions: 'all', output: 'JSON' }),
      ]);

      const lives = base.lives || [];
      if (!lives.length) {
        return json(request, env, { ok: false, code: 'CITY_NOT_FOUND', message: '没有查询到该城市的天气数据，请更换城市试试。' }, 404);
      }
      const live = lives[0];
      const forecast = (all.forecasts || [])[0] || null;

      return json(request, env, {
        ok: true,
        live,
        forecast,
        life: buildLife(live),
        source: 'amap',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      const status = err.status || 502;
      const code = err.code || 'AMAP_ERROR';
      const message = err.message || '高德服务异常';
      return json(request, env, { ok: false, code, message }, status, { 'Cache-Control': 'no-store' });
    }
  },
};

/* waitUntil 兼容包装（module worker 里 ctx 不存在时降级） */
function ctx_waitUntil(promise) {
  try {
    if (typeof ctx !== 'undefined' && ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(promise);
  } catch (_) {}
  return promise;
}
