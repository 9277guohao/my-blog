import DefaultTheme from 'vitepress/theme'
import BlogLayout from './components/BlogLayout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: BlogLayout,
}
