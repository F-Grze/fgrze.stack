// 🛡️ 相册数据：改这里就能换照片墙
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "id": "graffiti-wall",
    "title": "涂鸦墙",
    "description": "首页背景的那五张稿子，原图在这里",
    "cover": "/bg/1.webp",
    "date": "2026.10",
    "photos": [
      { "url": "/bg/1.webp", "caption": "耳机与报纸墙" },
      { "url": "/bg/2.webp", "caption": "粉色头发" },
      { "url": "/bg/3.webp", "caption": "紫色光斑" },
      { "url": "/bg/4.webp", "caption": "夜里的涂鸦" },
      { "url": "/bg/5.webp", "caption": "银色卷发" }
    ]
  },
  {
    "id": "night-walk",
    "title": "夜行记录",
    "description": "路灯、便利店与没人的街道",
    "cover": "/media/img-05.webp",
    "date": "2025.10",
    "photos": [
      { "url": "/media/img-06.webp", "caption": "古都夕阳" },
      { "url": "/media/img-07.webp", "caption": "青石板小路" },
      { "url": "/media/img-08.webp", "caption": "飞檐翘角" }
    ]
  },
  {
    "id": "illustration",
    "title": "插画收藏",
    "description": "存下来就不舍得删的那些",
    "cover": "/media/img-09.webp",
    "date": "2026.04",
    "photos": [
      { "url": "/media/img-10.webp", "caption": "蓝色调" },
      { "url": "/media/img-11.webp", "caption": "书堆" },
      { "url": "/media/img-09.webp", "caption": "夜色" }
    ]
  }
];
