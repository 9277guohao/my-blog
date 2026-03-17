/**
 * 掘金文章同步脚本
 *
 * 功能：
 *   1. 从掘金 API 拉取指定用户的所有文章列表（标题、摘要、日期、标签）
 *   2. 抓取每篇公开文章的正文 HTML，生成 docs/juejin/{article_id}.md 完整文章页
 *   3. 更新 docs/.vitepress/juejin-data.json（头像、文章列表、侧边栏）
 *
 * 使用方式：
 *   JUEJIN_USER_ID=你的掘金用户ID node scripts/sync-juejin.mjs
 *
 * 如何获取你的掘金用户 ID：
 *   登录掘金 → 点击右上角头像 → 个人主页 → 复制浏览器地址栏中的数字 ID
 *   例如：https://juejin.cn/user/1234567890  →  用户 ID 是 1234567890
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
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
const JUEJIN_WEB = 'https://juejin.cn'
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'Accept-Language': 'zh-CN,zh;q=0.9',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...REQUEST_HEADERS,
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return res.json()
}

async function requestText(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...REQUEST_HEADERS,
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return res.text()
}

/** 获取用户信息（头像、昵称等） */
async function fetchUserInfo() {
  const json = await requestJson(`${JUEJIN_API}/user_api/v1/user/get?user_id=${USER_ID}`)
  if (json.err_no !== 0) throw new Error(`掘金接口错误: ${json.err_msg}`)
  // data 字段直接就是用户信息，没有 user_info 子层
  return json.data
}

/** 获取用户全部文章（自动翻页） */
async function fetchAllArticles() {
  const articles = []
  let cursor = '0'

  while (true) {
    const json = await requestJson(`${JUEJIN_API}/content_api/v1/article/query_list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: USER_ID, sort_type: 2, cursor, limit: 100 }),
    })
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
  const date = new Date(Number(ctime) * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 对字符串做 YAML 安全转义 */
function yamlStr(str) {
  return JSON.stringify(str || '')
}

function escapeHtmlText(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function jsString(str) {
  return JSON.stringify(str || '')
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripHtmlTags(str) {
  return decodeHtmlEntities(str.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeMarkdownLinkText(str) {
  return String(str || '').replace(/[\[\]\\]/g, '\\$&')
}

function rewriteAbsoluteUrls(html) {
  return html
    .replace(/\shref=(['"])\/\/([^'"]+)\1/gi, (_, quote, path) => ` href=${quote}https://${path}${quote}`)
    .replace(/\ssrc=(['"])\/\/([^'"]+)\1/gi, (_, quote, path) => ` src=${quote}https://${path}${quote}`)
    .replace(/\shref=(['"])\/(?!\/)([^'"]*)\1/gi, (_, quote, path) => ` href=${quote}${JUEJIN_WEB}/${path}${quote}`)
    .replace(/\ssrc=(['"])\/(?!\/)([^'"]*)\1/gi, (_, quote, path) => ` src=${quote}${JUEJIN_WEB}/${path}${quote}`)
}

function extractCodeLanguage(attrs) {
  const langAttr = attrs.match(/\slang=(['"])(.*?)\1/i)?.[2]
  const classAttr = attrs.match(/\sclass=(['"])(.*?)\1/i)?.[2]
  const classLang = classAttr?.match(/language-([^\s"']+)/i)?.[1]
  const rawLang = decodeHtmlEntities(langAttr || classLang || '')
  const normalized = rawLang.replace(/[^\w.+-]+/g, '-').replace(/^-+|-+$/g, '')

  return normalized || 'text'
}

function normalizeCodeBlocks(html) {
  return html.replace(/<pre>\s*<code\b((?:[^>"']+|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/code>\s*<\/pre>/gi, (full, attrs, codeHtml) => {
    const code = decodeHtmlEntities(codeHtml.replace(/<[^>]+>/g, ''))
    const language = extractCodeLanguage(attrs)
    return `<pre><code class="language-${language}">${escapeHtmlText(code)}</code></pre>`
  })
}

function extractDivInnerHtml(html, startIndex) {
  const openTagRegex = /<div\b[^>]*>/gi
  openTagRegex.lastIndex = startIndex
  const firstTag = openTagRegex.exec(html)

  if (!firstTag || firstTag.index !== startIndex) {
    throw new Error('正文容器起始标签解析失败')
  }

  const tagRegex = /<\/?div\b[^>]*>/gi
  tagRegex.lastIndex = startIndex

  let depth = 0
  let contentStart = 0
  let match

  while ((match = tagRegex.exec(html))) {
    const tag = match[0]
    if (match.index === startIndex) {
      depth = 1
      contentStart = match.index + tag.length
      continue
    }

    if (tag.startsWith('</')) {
      depth -= 1
      if (depth === 0) {
        return html.slice(contentStart, match.index)
      }
      continue
    }

    depth += 1
  }

  throw new Error('正文容器闭合标签解析失败')
}

function injectHeadingIds(html) {
  const usedIds = new Set()
  let headingIndex = 0

  return html.replace(/<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, innerHtml) => {
    if (/\sid=["'][^"']+["']/.test(attrs)) return full

    const dataIdMatch = attrs.match(/\sdata-id=["']([^"']+)["']/i)
    let headingId = dataIdMatch?.[1] || `section-${++headingIndex}`

    while (usedIds.has(headingId)) {
      headingId = `${headingId}-${headingIndex++}`
    }
    usedIds.add(headingId)

    return `<${tag}${attrs} id="${headingId}">${innerHtml}</${tag}>`
  })
}

function buildTableOfContents(articleHtml) {
  const items = []

  for (const match of articleHtml.matchAll(/<(h2)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const attrs = match[2] || ''
    const id = attrs.match(/\sid=["']([^"']+)["']/i)?.[1]
    const text = stripHtmlTags(match[3] || '')

    if (!id || !text) continue

    items.push(`- [${escapeMarkdownLinkText(text)}](#${id})`)
  }

  if (items.length === 0) return ''

  return ['## 目录', '', ...items].join('\n')
}

function extractArticleContentHtml(pageHtml) {
  const rootIndex = pageHtml.indexOf('id="article-root"')
  if (rootIndex === -1) {
    throw new Error('未找到 article-root 容器')
  }

  const contentIndex = pageHtml.indexOf('<div class="article-viewer', rootIndex)
  if (contentIndex === -1) {
    throw new Error('未找到文章正文容器')
  }

  let contentHtml = extractDivInnerHtml(pageHtml, contentIndex)
  contentHtml = contentHtml.replace(/<style[\s\S]*?<\/style>/gi, '')
  contentHtml = contentHtml.replace(/\sdata-v-[^=\s]+(?:=(['"]).*?\1)?/gi, '')
  contentHtml = rewriteAbsoluteUrls(contentHtml)
  contentHtml = normalizeCodeBlocks(contentHtml)
  contentHtml = injectHeadingIds(contentHtml)

  return contentHtml.trim()
}

async function fetchArticleContentHtml(articleId) {
  const pageHtml = await requestText(`${JUEJIN_WEB}/post/${articleId}`)
  const contentHtml = extractArticleContentHtml(pageHtml)

  if (!contentHtml) {
    throw new Error('正文提取结果为空')
  }

  return contentHtml
}

function buildSourceNote({ title, date, juejinUrl, tagNames }) {
  const meta = [`发布时间：${date}`]
  if (tagNames.length > 0) {
    meta.push(`标签：${tagNames.join(' · ')}`)
  }

  return [
    '<div class="juejin-sync-note">',
    `<p>本文已从掘金同步到本站，原文地址：<a href="${juejinUrl}" target="_blank" rel="noreferrer">${escapeHtmlText(title)}</a></p>`,
    `<p>${escapeHtmlText(meta.join(' ｜ '))}</p>`,
    '</div>',
  ].join('\n')
}

function buildFullArticlePage({ articleId, title, briefContent, date, tagNames, juejinUrl, articleHtml }) {
  const toc = buildTableOfContents(articleHtml)

  return [
    '---',
    `title: ${yamlStr(title)}`,
    `date: ${date}`,
    `description: ${yamlStr(briefContent)}`,
    `tags: [${tagNames.map(yamlStr).join(', ')}]`,
    'aside: false',
    'outline: false',
    `juejin_id: "${articleId}"`,
    `juejin_url: "${juejinUrl}"`,
    '---',
    '',
    '<script setup>',
    `const juejinArticleHtml = ${jsString(articleHtml)}`,
    '</script>',
    '',
    `# ${title}`,
    '',
    buildSourceNote({ title, date, juejinUrl, tagNames }),
    '',
    briefContent ? `> ${briefContent}` : '',
    '',
    toc,
    `<div class="juejin-article-content" v-html="juejinArticleHtml"></div>`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

function buildFallbackArticlePage({ articleId, title, briefContent, date, tagNames, juejinUrl }) {
  return [
    '---',
    `title: ${yamlStr(title)}`,
    `date: ${date}`,
    `description: ${yamlStr(briefContent)}`,
    `tags: [${tagNames.map(yamlStr).join(', ')}]`,
    'aside: false',
    'outline: false',
    `juejin_id: "${articleId}"`,
    `juejin_url: "${juejinUrl}"`,
    '---',
    '',
    `# ${title}`,
    '',
    buildSourceNote({ title, date, juejinUrl, tagNames }),
    '',
    briefContent ? `## 文章简介\n\n${briefContent}` : '',
    '',
    '> 本次同步未能成功提取正文，请点击上方原文链接查看完整内容。',
    '',
    `[→ 在掘金查看完整文章](${juejinUrl})`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
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
    const juejinUrl = `${JUEJIN_WEB}/post/${article_id}`
    const link = `/juejin/${article_id}`
    const tagNames = tags.map((t) => t.tag_name).filter(Boolean)
    const articlePath = join(juejinDir, `${article_id}.md`)
    let mdContent = ''

    try {
      const articleHtml = await fetchArticleContentHtml(article_id)
      mdContent = buildFullArticlePage({
        articleId: article_id,
        title,
        briefContent: brief_content || '',
        date,
        tagNames,
        juejinUrl,
        articleHtml,
      })
    } catch (error) {
      if (existsSync(articlePath)) {
        mdContent = readFileSync(articlePath, 'utf-8')
        console.warn(`  ⚠ 正文抓取失败，保留现有页面：${title} (${error.message})`)
      } else {
        mdContent = buildFallbackArticlePage({
          articleId: article_id,
          title,
          briefContent: brief_content || '',
          date,
          tagNames,
          juejinUrl,
        })
        console.warn(`  ⚠ 正文抓取失败，回退为原文跳转页：${title} (${error.message})`)
      }
    }

    writeFileSync(articlePath, mdContent, 'utf-8')

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
    await sleep(300)
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
