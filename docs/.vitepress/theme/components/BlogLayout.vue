<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import BlogHome from './BlogHome.vue'
import SakuraEffect from './SakuraEffect.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <template #home-hero-before>
      <BlogHome v-if="frontmatter.layout === 'home'" />
    </template>
    <template #layout-bottom>
      <SakuraEffect />
    </template>
  </Layout>
</template>
