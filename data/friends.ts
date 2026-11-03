// 🛡️ 友链数据
export interface Friend { id: string; name: string; url: string; description: string; avatar: string; themeColor: string; }

export const friendsData: Friend[] = [
  {
    "id": "nextjs",
    "name": "Next.js",
    "description": "这个站点的骨架。App Router、静态生成、路由分段，一路顺滑。",
    "avatar": "/media/img-03.webp",
    "url": "https://nextjs.org/",
    "themeColor": "rgba(16, 16, 22, 0.5)"
  },
  {
    "id": "tailwind",
    "name": "Tailwind CSS",
    "description": "配色、间距、响应式都在类名里解决；主题变量救了我一整晚。",
    "avatar": "/media/img-09.webp",
    "url": "https://tailwindcss.com/",
    "themeColor": "rgba(14, 165, 233, 0.5)"
  },
  {
    "id": "motion",
    "name": "Motion",
    "description": "页面转场、卡片轮播、手机端圆盘菜单，都靠它撑着。",
    "avatar": "/media/img-05.webp",
    "url": "https://motion.dev/",
    "themeColor": "rgba(162, 122, 68, 0.5)"
  }
];
