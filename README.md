# My Blog

基于 VitePress 搭建的个人博客，用于记录生活、技术笔记和面试题。

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build

# 预览构建产物
npm run preview
```

## 项目结构

```
blog/
 ├─ docs/
 │   ├─ index.md              # 首页
 │   ├─ life/                  # 生活随笔
 │   │   └─ first-life.md
 │   ├─ tech/                  # 技术笔记
 │   │   └─ vue-tips.md
 │   ├─ interview/             # 面试题库
 │   │   └─ js-questions.md
 │   └─ about.md               # 关于我
 │
 ├─ docs/.vitepress/
 │   ├─ config.ts              # VitePress 配置
 │   └─ theme/                 # 自定义主题
 │       ├─ index.ts
 │       └─ custom.css
 │
 ├─ package.json
 └─ README.md
```

## 写新文章

1. 在对应分类目录下新建 `.md` 文件
2. 在 `docs/.vitepress/config.ts` 的 `sidebar` 中添加链接
3. 运行 `npm run dev` 预览

## 部署

构建后的静态文件在 `docs/.vitepress/dist` 目录，可部署到任意静态托管平台。

## 技术栈

- [VitePress](https://vitepress.dev/) — 静态站点生成器
- [Vue 3](https://vuejs.org/) — 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) — 类型安全
