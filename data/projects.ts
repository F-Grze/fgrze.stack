// 🛡️ 项目数据：改这里就能换「项目」页的卡片

export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = [
  {
    "id": "proj_paper-ink",
    "name": "Paper & Ink 主题包",
    "description": "把深色玻璃主题改造成浅色纸感的整套方案：色板映射、墨线描边、表面透明度与阴影收敛。",
    "githubUrl": "https://github.com/f-grze/paper-ink-theme",
    "icon": "🖋️",
    "tags": ["Tailwind", "Design Tokens"]
  },
  {
    "id": "proj_bg-carousel",
    "name": "Background Carousel",
    "description": "多图背景轮播组件：交叉淡入、Ken Burns 推近、非相邻帧隐藏，移动端不掉帧。",
    "githubUrl": "https://github.com/f-grze/bg-carousel",
    "icon": "🎞️",
    "tags": ["React", "CSS"]
  },
  {
    "id": "proj_md-manager",
    "name": "Markdown Blog Manager",
    "description": "本地写作管理台：文章、说说、相册、友链全部落成 Markdown 与 JSON，零数据库。",
    "githubUrl": "https://github.com/f-grze/md-blog-manager",
    "icon": "🗂️",
    "tags": ["Next.js", "Markdown"]
  }
];
