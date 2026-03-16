import { defineConfig } from 'vitepress'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

function getJuejinSidebar() {
  try {
    const data = require('./juejin-data.json')
    const items = (data.sidebar || []).map((item: { text: string; link: string }) => ({
      text: item.text,
      link: item.link,
    }))
    if (items.length === 0) return []
    return [{ text: '掘金同步', items }]
  } catch {
    return []
  }
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'Guohao\'s Blog',
  description: '记录生活、技术笔记',

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'theme-color', content: '#667eea' }],
  ],

  themeConfig: {
    siteTitle: '长亭晚',

    nav: [
      { text: '主页', link: '/' },
      {
        text: '分类',
        items: [
          { text: '技术笔记', link: '/tech/vue-tips' },
          { text: '面试题库', link: '/interview/js-questions' },
          { text: '生活随笔', link: '/life/first-life' },
          { text: '掘金文章', link: '/juejin/' },
        ],
      },
      { text: '关于', link: '/about' },
    ],

    sidebar: {
      '/juejin/': getJuejinSidebar(),
      '/life/': [
        {
          text: '生活随笔',
          items: [
            { text: '记录生活的第一天', link: '/life/first-life' },
          ],
        },
      ],
      '/tech/': [
        {
          text: '技术笔记',
          items: [
            { text: 'Vue 实用技巧', link: '/tech/vue-tips' },
          ],
        },
      ],
      '/interview/': [
        {
          text: '面试题库',
          items: [
            { text: 'JavaScript 高频面试题', link: '/interview/js-questions' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: '用心记录，用爱生活',
      copyright: `© 2024-${new Date().getFullYear()} Guohao`,
    },

    outline: {
      level: [2, 3],
      label: '目录',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换到深色模式',
    lightModeSwitchTitle: '切换到浅色模式',
  },

  markdown: {
    lineNumbers: true,
    image: { lazyLoading: true },
  },

  lastUpdated: true,
})
