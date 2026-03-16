import juejinData from '../juejin-data.json'

export interface Post {
  title: string
  date: string
  description: string
  tags: string[]
  link: string
  from?: 'local' | 'juejin'
  juejinUrl?: string
}

const localPosts: Post[] = [
  {
    title: 'Vue 实用技巧',
    date: '2026-03-06',
    description: 'Vue 3 开发中常用的技巧和最佳实践，包括 defineModel、watchEffect、Composables 等',
    tags: ['Vue', 'TypeScript'],
    link: '/tech/vue-tips',
    from: 'local',
  },
  {
    title: 'JavaScript 高频面试题',
    date: '2026-03-05',
    description: '整理前端面试中常见的 JavaScript 问题及解答，涵盖闭包、原型链、事件循环等',
    tags: ['JavaScript', '面试题'],
    link: '/interview/js-questions',
    from: 'local',
  },
  {
    title: '记录生活的第一天',
    date: '2026-03-04',
    description: '生活不止眼前的代码，还有诗和远方。搭建博客，开始记录生活',
    tags: ['生活', '随笔'],
    link: '/life/first-life',
    from: 'local',
  },
]

function getJuejinPosts(): Post[] {
  return ((juejinData.posts as unknown as Post[]) || []).map((p) => ({ ...p, from: 'juejin' as const }))
}

export const juejinAvatarUrl: string = (juejinData.avatarUrl as string) || ''

/** 合并本地文章与掘金文章，按日期降序排列 */
export const posts: Post[] = [...localPosts, ...getJuejinPosts()].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
)
