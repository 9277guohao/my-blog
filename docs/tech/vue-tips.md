# Vue 实用技巧

整理一些 Vue 3 开发中常用的技巧和最佳实践。

## 1. 使用 `defineModel` 简化 v-model

Vue 3.4+ 引入了 `defineModel` 宏，大幅简化了组件双向绑定的写法：

```vue
<script setup lang="ts">
const modelValue = defineModel<string>()
</script>

<template>
  <input v-model="modelValue" />
</template>
```

相比之前需要手动声明 `props` + `emits` 的方式，代码量减少了一半。

## 2. 善用 `watchEffect` 自动追踪依赖

```ts
import { ref, watchEffect } from 'vue'

const count = ref(0)
const doubled = ref(0)

watchEffect(() => {
  doubled.value = count.value * 2
})
```

::: tip
`watchEffect` 会自动收集依赖，不需要像 `watch` 那样手动指定监听源。适合处理多个响应式数据联动的场景。
:::

## 3. 组合式函数（Composables）封装逻辑

将可复用的逻辑抽取为组合式函数：

```ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  function update() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width, height }
}
```

使用时：

```vue
<script setup>
import { useWindowSize } from './composables/useWindowSize'

const { width, height } = useWindowSize()
</script>
```

## 4. 使用 `Suspense` 处理异步组件

```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>
```

## 5. TypeScript 类型标注最佳实践

为 `ref` 和 `reactive` 提供类型：

```ts
import { ref, reactive } from 'vue'

interface User {
  name: string
  age: number
  email?: string
}

const user = ref<User>({ name: '张三', age: 25 })
const users = reactive<User[]>([])
```

为 `defineProps` 提供类型：

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})
</script>
```

::: warning 注意
`defineProps` 的泛型参数目前不支持从外部文件导入类型，需要在同一文件内定义。
:::

---

> 持续更新中，欢迎补充 🚀
