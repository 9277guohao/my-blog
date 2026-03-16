/**
 * 掘金文章同步脚本
 *
 * 功能：
 *   1. 从掘金 API 拉取指定用户的所有文章列表（标题、摘要、日期、标签）
 *   2. 为每篇文章生成一个 docs/juejin/{article_id}.md 跳转页
 *   3. 更新 docs/.vitepress/juejin-data.json（头像、文章列表、侧边栏）
 *
 * 使用方式：
 *   JUEJIN_USER_ID=你的掘金用户ID node scripts/sync-juejin.mjs
 *
 * 如何获取你的掘金用户 ID：
 *   登录掘金 → 点击右上角头像 → 个人主页 → 复制浏览器地址栏中的数字 ID
 *   例如：https://juejin.cn/user/1234567890  →  用户 ID 是 1234567890
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const USER_ID = process.env.JUEJIN_USER_ID

if (!USER_ID) {
  console.error('❌ 请设置环境变量 JUEJIN_USER_ID')
  console.error('   示例：JUEJIN_USER_ID=123456 node scripts/sync-juejin.mjs')
  console.error('   获取方式：登录掘金 → 个人主页 → 复制 URL 中的数字 ID')
  process.exit(1)
}

const JUEJIN_API = 'https://api.juejin.cn'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 获取用户信息（头像、昵称等） */
async function fetchUserInfo() {
  const res = await fetch(`${JUEJIN_API}/user_api/v1/user/get?user_id=${USER_ID}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) throw new Error(`获取用户信息失败: HTTP ${res.status}`)
  const json = await res.json()
  if (json.err_no !== 0) throw new Error(`掘金接口错误: ${json.err_msg}`)
  // data 字段直接就是用户信息，没有 user_info 子层
  return json.data
}

/** 获取用户全部文章（自动翻页） */
async function fetchAllArticles() {
  const articles = []
  let cursor = '0'

  while (true) {
    const res = await fetch(`${JUEJIN_API}/content_api/v1/article/query_list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ user_id: USER_ID, sort_type: 2, cursor, limit: 100 }),
    })
    if (!res.ok) throw new Error(`获取文章列表失败: HTTP ${res.status}`)
    const json = await res.json()
    if (json.err_no !== 0) throw new Error(`掘金接口错误: ${json.err_msg}`)

    const items = json.data || []
    if (items.length === 0) break
    articles.push(...items)
    if (!json.has_more) break
    cursor = json.cursor
    await sleep(300)
  }

  return articles
}

/** 将时间戳转为 YYYY-MM-DD */
function formatDate(ctime) {
  return new Date(Number(ctime) * 1000).toISOString().split('T')[0]
}

/** 对字符串做 YAML 安全转义 */
function yamlStr(str) {
  return JSON.stringify(str || '')
}

async function main() {
  console.log(`\n🚀 开始同步掘金用户 ${USER_ID} 的文章...\n`)

  // ── 1. 获取用户信息 ──────────────────────────────────────────────
  let avatarUrl = ''
  let username = ''
  try {
    const userInfo = await fetchUserInfo()
    // 正确路径：data.avatar_large（无 user_info 子层）
    avatarUrl = userInfo?.avatar_large || userInfo?.avatar_medium || userInfo?.avatar_small || ''
    username = userInfo?.user_name || ''
    console.log(`👤 用户：${username}`)
    console.log(`🖼  头像：${avatarUrl}\n`)
  } catch (e) {
    console.warn(`⚠️  获取用户信息失败（跳过头像同步）：${e.message}\n`)
  }

  // ── 2. 获取文章列表 ───────────────────────────────────────────────
  const articles = await fetchAllArticles()
  console.log(`📚 共找到 ${articles.length} 篇文章\n`)

  // ── 3. 确保 docs/juejin/ 目录存在 ────────────────────────────────
  const juejinDir = join(ROOT, 'docs', 'juejin')
  mkdirSync(juejinDir, { recursive: true })

  // ── 4. 为每篇文章生成跳转页 ──────────────────────────────────────
  const posts = []
  const sidebarItems = []

  for (const article of articles) {
    const { article_id, article_info, tags = [] } = article
    const { title, brief_content, ctime } = article_info
    const date = formatDate(ctime)
    const juejinUrl = `https://juejin.cn/post/${article_id}`
    const link = `/juejin/${article_id}`
    const tagNames = tags.map((t) => t.tag_name).filter(Boolean)

    // 生成一个简单的跳转/摘要页，正文点击链接跳掘金原文
    const mdContent = [
      '---',
      `title: ${yamlStr(title)}`,
      `date: ${date}`,
      `description: ${yamlStr(brief_content)}`,
      `tags: [${tagNames.map(yamlStr).join(', ')}]`,
      `juejin_id: "${article_id}"`,
      `juejin_url: "${juejinUrl}"`,
      '---',
      '',
      `# ${title}`,
      '',
      `> 本文发布于掘金，点击阅读全文 → [${title}](${juejinUrl})`,
      '',
      `**发布时间：** ${date}`,
      '',
      tagNames.length ? `**标签：** ${tagNames.map((t) => `\`${t}\``).join(' · ')}` : '',
      '',
      brief_content ? `## 文章简介\n\n${brief_content}` : '',
      '',
      `---`,
      '',
      `[→ 在掘金查看完整文章](${juejinUrl})`,
    ].filter((line) => line !== undefined).join('\n')

    writeFileSync(join(juejinDir, `${article_id}.md`), mdContent, 'utf-8')

    posts.push({
      title,
      date,
      description: brief_content || '',
      tags: tagNames,
      link,
      from: 'juejin',
      juejinUrl,
    })

    sidebarItems.push({ text: title, link })
    console.log(`  ✓ ${title}`)
  }

  // ── 5. 写入 juejin-data.json ──────────────────────────────────────
  const juejinData = {
    avatarUrl,
    username,
    updatedAt: new Date().toISOString(),
    posts: posts.sort((a, b) => new Date(b.date) - new Date(a.date)),
    sidebar: sidebarItems,
  }

  writeFileSync(
    join(ROOT, 'docs', '.vitepress', 'juejin-data.json'),
    JSON.stringify(juejinData, null, 2),
    'utf-8',
  )

  console.log(`\n✅ 同步完成！共同步 ${posts.length} 篇文章`)
  console.log(`📄 数据已写入 docs/.vitepress/juejin-data.json\n`)
}

main().catch((err) => {
  console.error('\n❌ 同步失败：', err.message)
  process.exit(1)
})

