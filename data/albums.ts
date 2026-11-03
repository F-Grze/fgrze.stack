// 🛡️ 相册数据：改这里就能换照片墙
export interface Exif {
  camera?: string;
  lens?: string;
  focal?: string;      // 焦距
  aperture?: string;   // 光圈
  shutter?: string;    // 快门
  iso?: string;        // 感光度
}

export interface Photo {
  url: string;
  caption?: string;
  /** 相机参数，鼠标悬停 / 灯箱中展示 */
  exif?: Exif;
  /** 拍摄地点 */
  location?: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  /** 顶层分组，便于按题材筛选 */
  group?: '记录' | '涂鸦' | '泰拉' | '收藏';
  photos: Photo[];
}

export const albums: Album[] = [
  {
    id: 'terra-journey',
    title: '泰拉大陆纪行',
    description: '罗德岛停靠站的落日、舰桥的午后，还有那些在雨里走过的长街',
    cover: '/media/img-12.webp',
    date: '2026.10',
    group: '泰拉',
    photos: [
      {
        url: '/media/img-12.webp',
        caption: '黄昏的罗德岛内港',
        location: '罗德岛 · 移动舰桥',
        exif: { camera: 'Fujifilm X-T5', lens: 'XF 35mm F1.4 R', focal: '35mm', aperture: 'f/1.4', shutter: '1/800s', iso: '125' },
      },
      {
        url: '/media/img-13.webp',
        caption: '雨中的甲板走廊',
        location: '罗德岛 · B区甲板',
        exif: { camera: 'Fujifilm X-T5', lens: 'XF 23mm F1.4 R', focal: '23mm', aperture: 'f/2', shutter: '1/125s', iso: '640' },
      },
      {
        url: '/media/img-14.webp',
        caption: '午后的休息室',
        location: '罗德岛 · 生活区',
        exif: { camera: 'SONY ILCE-7M4', lens: 'FE 50mm F1.8', focal: '50mm', aperture: 'f/1.8', shutter: '1/250s', iso: '400' },
      },
      {
        url: '/media/img-15.webp',
        caption: '窗边的终端机',
        location: '罗德岛 · 战术预备室',
        exif: { camera: 'SONY ILCE-7M4', lens: 'FE 85mm F1.8', focal: '85mm', aperture: 'f/2.2', shutter: '1/160s', iso: '800' },
      },
      {
        url: '/media/img-16.webp',
        caption: '被风吹起的旗子',
        location: '罗德岛 · 上层甲板',
        exif: { camera: 'Fujifilm X-T5', lens: 'XF 56mm F1.2 R', focal: '56mm', aperture: 'f/2.8', shutter: '1/1000s', iso: '200' },
      },
      {
        url: '/media/img-17.webp',
        caption: '夜航时的引擎声',
        location: '罗德岛 · 动力舱',
        exif: { camera: 'SONY ILCE-7M4', lens: 'FE 24-70mm F2.8 GM', focal: '35mm', aperture: 'f/2.8', shutter: '1/60s', iso: '1600' },
      },
      {
        url: '/media/img-18.webp',
        caption: '被涂鸦覆盖的走廊',
        location: '凯尔希的走廊',
        exif: { camera: 'RICOH GR III', lens: 'GR 28mm F2.8', focal: '28mm', aperture: 'f/2.8', shutter: '1/40s', iso: '1000' },
      },
      {
        url: '/media/img-19.webp',
        caption: '源石灯塔下',
        location: '莱塔尼亚 · 灯塔',
        exif: { camera: 'RICOH GR III', lens: 'GR 28mm F2.8', focal: '28mm', aperture: 'f/5.6', shutter: '1/320s', iso: '200' },
      },
      {
        url: '/media/img-20.webp',
        caption: '荒原上的信号弹',
        location: '卡拉彼丘荒野',
        exif: { camera: 'RICOH GR III', lens: 'GR 28mm F2.8', focal: '28mm', aperture: 'f/2', shutter: '1/200s', iso: '1600' },
      },
      {
        url: '/media/img-21.webp',
        caption: '归途的列车',
        location: '龙门 · 轨交 7 号线',
        exif: { camera: 'Fujifilm X-T5', lens: 'XF 23mm F1.4 R', focal: '23mm', aperture: 'f/1.4', shutter: '1/30s', iso: '1250' },
      },
      {
        url: '/media/img-22.webp',
        caption: '雨后霓虹',
        location: '龙门 · 旧城区',
        exif: { camera: 'SONY ILCE-7M4', lens: 'FE 35mm F1.4 GM', focal: '35mm', aperture: 'f/1.4', shutter: '1/125s', iso: '800' },
      },
      {
        url: '/media/img-23.webp',
        caption: '深夜的自动贩卖机',
        location: '龙门 · 便利店门口',
        exif: { camera: 'RICOH GR III', lens: 'GR 28mm F2.8', focal: '28mm', aperture: 'f/2', shutter: '1/60s', iso: '3200' },
      },
    ],
  },
  {
    id: 'graffiti-wall',
    title: '涂鸦墙',
    description: '首页背景的那五张稿子，原图在这里',
    cover: '/bg/1.webp',
    date: '2026.10',
    group: '涂鸦',
    photos: [
      { url: '/bg/1.webp', caption: '耳机与报纸墙' },
      { url: '/bg/2.webp', caption: '粉色头发' },
      { url: '/bg/3.webp', caption: '紫色光斑' },
      { url: '/bg/4.webp', caption: '夜里的涂鸦' },
      { url: '/bg/5.webp', caption: '银色卷发' },
    ],
  },
  {
    id: 'night-walk',
    title: '夜行记录',
    description: '路灯、便利店与没人的街道',
    cover: '/media/img-05.webp',
    date: '2025.10',
    group: '记录',
    photos: [
      { url: '/media/img-06.webp', caption: '古都夕阳', location: '南京 · 夫子庙' },
      { url: '/media/img-07.webp', caption: '青石板小路', location: '苏州 · 平江路' },
      { url: '/media/img-08.webp', caption: '飞檐翘角', location: '苏州 · 寒山寺' },
    ],
  },
  {
    id: 'illustration',
    title: '插画收藏',
    description: '存下来就不舍得删的那些',
    cover: '/media/img-09.webp',
    date: '2026.04',
    group: '收藏',
    photos: [
      { url: '/media/img-10.webp', caption: '蓝色调' },
      { url: '/media/img-11.webp', caption: '书堆' },
      { url: '/media/img-09.webp', caption: '夜色' },
    ],
  },
  {
    id: 'workshop',
    title: '工作室',
    description: '画板、颜料罐和一堆画到一半的稿',
    cover: '/media/img-03.webp',
    date: '2026.08',
    group: '记录',
    photos: [
      { url: '/media/img-03.webp', caption: '画板上的半成品' },
      { url: '/media/img-04.webp', caption: '摊了一桌的颜料' },
      { url: '/media/img-01.webp', caption: '贴满便利贴的墙' },
      { url: '/media/img-24.webp', caption: '窗台上的机械零件' },
    ],
  },
];

/** 全部照片（带所属相册名），用于搜索与灯箱 */
export function allPhotos() {
  return albums.flatMap((album) =>
    album.photos.map((p) => ({ ...p, albumName: album.title, albumId: album.id })),
  );
}
