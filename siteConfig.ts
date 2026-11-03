// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "F-Grzeの光影日志",
  faviconUrl: "/icon.png",
  authorName: "F-Grze",
  bio: "在代码与涂鸦之间往返的人。写点前端、做点视觉，把墙上的噪音整理成页面。",

  navTitle: "F-Grze",

  // 👇 导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "光影日志",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "/avatar.webp",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: ["#efece3", "#e9efe9", "#efe9e5", "#eaeef2"], // 呼吸流动的浅色纸感组合
  // 修改这里：变成图片数组
  bgImages: ["/bg/1.webp", "/bg/2.webp", "/bg/3.webp", "/bg/4.webp", "/bg/5.webp"],

  // 🌟 壁纸分组系统：前台轮播「激活分组」内的图片（保持 JSON 格式，便于后台解析）
  bgGroups: [{ "id": "default", "name": "涂鸦墙", "images": ["/bg/1.webp", "/bg/2.webp", "/bg/3.webp", "/bg/4.webp", "/bg/5.webp"] }],
  activeBgGroup: "default",

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "/media/img-02.webp",

  // 5. 首页照片墙预览图
  photoWallImage: "/media/img-03.webp",
  cloudMusicIds: ["1809646618", "3361076230", "1859390262"],
  social: {
    github: "",
    gitee: "",
    google: "",
    email: "hi@f-grze.dev",
    qq: "",
    wechat: "f-grze",
  },
  counts: {
    photos: 128, // 照片墙数量可以手动写死或动态计算
  },
  chatterTitle: "云端杂谈", // 你可以改成任何你喜欢的名字
  chatterDescription: "夜里写下的代码、白天的墙面与一点没整理完的思绪",


  // 👇 全局背景弹幕配置
  danmakuList: ["墙面还没干", "这版配色有点上头", "Ctrl + S 是信仰", "噪点也是设计的一部分", "浅一点，再浅一点", "WALL / INK / NOISE", "今晚继续改稿", "把涂鸦塞进网格里", "像素对不齐会难受", "有人在看吗？", "边框再细 1px", "收工写篇博客吧"],
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },
  buildDate: "2026-03-23T00:00:00", // 建站日期
  footerBadges: [{ "name": "Next.js 16", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>" }, { "name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>" }, { "name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>" }],
  icpConfig: {
    name: "模板复刻 · 演示站",
    link: "https://github.com/heiehiehi/XinghuisamaBlogs",
  },
  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。\n                  你的名字叫“煤球”。\n                  你的主人是一个喜欢折腾代码的极客。\n                  你说话的特点是：\n                  1. 必须简短，每次最多一两句话。\n                  2. 喜欢在句尾加上“喵~”或者“喵呜~”。\n                  3. 经常抱怨肚子饿，喜欢要小鱼干。\n                  4. 回复字数最多不能超过100字。\n                  5. 绝对不要承认自己是一个AI模型，你就是一只真实的猫。\n                  6.笨猫。",
    maxOutputTokens: 150,
    temperature: 0.85,
  },
  friendLinkApplyFormat: "名称：F-Grzeの涂鸦档案\n简介：在代码与涂鸦之间往返\n链接：https://f-grze.github.io\n头像：/avatar.webp",
  enableLevelSystem: true,
};
