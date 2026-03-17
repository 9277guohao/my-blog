<script setup lang="ts">
import { withBase } from 'vitepress'
import { posts, juejinAvatarUrl } from '../posts'

const year = new Date().getFullYear()

// 如果掘金有头像则优先使用，否则回落到本地 SVG
const avatarSrc = juejinAvatarUrl || withBase('/avatar.svg')

function resolveLink(link: string) {
  if (/^(https?:)?\/\//.test(link)) return link
  return withBase(link)
}
</script>

<template>
  <div class="blog-home">
    <div class="blog-container">
      <!-- 左侧个人信息卡片 -->
      <aside class="profile-card">
        <div class="profile-card-inner">
          <div class="avatar">
            <img :src="avatarSrc" alt="avatar" class="avatar-img" />
          </div>
          <h2 class="nickname">长亭晚</h2>
          <p class="email">2892043562@qq.com</p>
          <nav class="profile-nav">
            <a :href="resolveLink('/tech/vue-tips')" class="profile-nav-item">
              <span class="nav-icon">💻</span>
              <span>技术笔记</span>
            </a>
            <a :href="resolveLink('/interview/js-questions')" class="profile-nav-item">
              <span class="nav-icon">📝</span>
              <span>面试题库</span>
            </a>
            <a :href="resolveLink('/life/first-life')" class="profile-nav-item">
              <span class="nav-icon">🌿</span>
              <span>生活随笔</span>
            </a>
            <a :href="resolveLink('/about')" class="profile-nav-item">
              <span class="nav-icon">👤</span>
              <span>关于我</span>
            </a>
          </nav>
        </div>
      </aside>

      <!-- 右侧文章列表 -->
      <main class="post-list">
        <h3 class="section-title">最近更新</h3>
        <div class="posts">
          <a
            v-for="post in posts"
            :key="post.link"
            :href="resolveLink(post.link)"
            class="post-card"
          >
            <div class="post-date">{{ post.date }}</div>
            <h3 class="post-title">
              {{ post.title }}
              <span v-if="post.from === 'juejin'" class="juejin-badge">掘金</span>
            </h3>
            <div class="post-tags">
              <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <p class="post-desc">{{ post.description }}</p>
          </a>
        </div>
      </main>
    </div>

    <!-- 底部 -->
    <footer class="blog-footer">
      <p>用心记录，用爱生活 &copy; 2024-{{ year }} Guohao</p>
    </footer>
  </div>
</template>

<style scoped>
.blog-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 0;
  min-height: calc(100vh - var(--vp-nav-height));
  display: flex;
  flex-direction: column;
}

.blog-container {
  display: flex;
  gap: 24px;
  flex: 1;
  align-items: flex-start;
}

/* ===== 左侧个人卡片 ===== */
.profile-card {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--vp-nav-height) + 24px);
}

.profile-card-inner {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  transition: box-shadow 0.3s ease;
}

.profile-card-inner:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.dark .profile-card-inner:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.avatar {
  margin: 0 auto 16px;
  width: 96px;
  height: 96px;
}

.avatar-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--vp-c-divider);
  transition: transform 0.4s ease, border-color 0.3s ease;
}

.avatar-img:hover {
  transform: rotate(360deg);
  border-color: var(--vp-c-brand-1);
}

.nickname {
  font-size: 20px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.motto {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0 0 8px;
}

.email {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin: 0 0 24px;
}

.profile-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.profile-nav-item:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

/* ===== 右侧文章列表 ===== */
.post-list {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  display: block;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px 24px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.dark .post-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.post-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 10px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 8px;
}

.juejin-badge {
  flex-shrink: 0;
  display: inline-block;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #1e80ff;
  border-radius: 20px;
  line-height: 1.8;
  vertical-align: middle;
}

.post-card:hover .post-title {
  color: var(--vp-c-brand-1);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 20px;
  line-height: 1.8;
}

.post-desc {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== 底部 ===== */
.blog-footer {
  text-align: center;
  padding: 32px 0;
  margin-top: 48px;
  border-top: 1px solid var(--vp-c-divider);
}

.blog-footer p {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .blog-container {
    flex-direction: column;
  }

  .profile-card {
    width: 100%;
    position: static;
  }

  .profile-card-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    text-align: left;
  }

  .avatar {
    margin: 0;
    width: 64px;
    height: 64px;
  }

  .avatar-img {
    width: 64px;
    height: 64px;
  }

  .profile-card-inner .nickname {
    margin: 0;
    font-size: 18px;
  }

  .profile-card-inner .motto {
    margin: 0;
    width: 100%;
    flex-basis: 100%;
    margin-top: -8px;
  }

  .email {
    display: none;
  }

  .profile-nav {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    gap: 4px;
  }

  .profile-nav-item {
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .blog-home {
    padding: 16px 16px 0;
  }

  .post-card {
    padding: 16px;
  }

  .post-title {
    font-size: 16px;
  }
}
</style>
