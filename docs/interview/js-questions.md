# JavaScript 高频面试题

整理前端面试中常见的 JavaScript 问题及解答。

## 1. `var`、`let`、`const` 的区别

| 特性 | var | let | const |
|------|-----|-----|-------|
| 作用域 | 函数作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 是 | 否（暂时性死区） | 否（暂时性死区） |
| 重复声明 | 允许 | 不允许 | 不允许 |
| 重新赋值 | 允许 | 允许 | 不允许 |

```js
// 经典面试题：循环中的闭包
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100) // 输出: 3, 3, 3
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100) // 输出: 0, 1, 2
}
```

## 2. 说说你对闭包的理解

闭包是指一个函数能够访问其词法作用域外部的变量，即使该函数在其词法作用域之外执行。

```js
function createCounter() {
  let count = 0
  return {
    increment: () => ++count,
    getCount: () => count,
  }
}

const counter = createCounter()
counter.increment()
counter.increment()
console.log(counter.getCount()) // 2
```

::: details 闭包的应用场景
- 数据私有化
- 函数柯里化
- 防抖与节流
- 模块模式
:::

## 3. 深拷贝与浅拷贝

```js
// 浅拷贝
const shallowCopy = { ...original }
const shallowCopy2 = Object.assign({}, original)

// 深拷贝 —— 简单场景
const deepCopy = JSON.parse(JSON.stringify(original))

// 深拷贝 —— 完整实现
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj
  if (map.has(obj)) return map.get(obj)

  const clone = Array.isArray(obj) ? [] : {}
  map.set(obj, clone)

  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], map)
  }
  return clone
}
```

::: warning JSON.parse(JSON.stringify()) 的局限性
- 无法处理 `undefined`、`Symbol`、函数
- 无法处理循环引用
- `Date` 对象会变成字符串
- `RegExp`、`Map`、`Set` 会丢失
:::

## 4. 事件循环（Event Loop）

```js
console.log('1')

setTimeout(() => {
  console.log('2')
}, 0)

Promise.resolve().then(() => {
  console.log('3')
})

console.log('4')

// 输出顺序: 1, 4, 3, 2
```

**执行顺序：**
1. 同步代码先执行 → 输出 `1`、`4`
2. 微任务（Promise.then）→ 输出 `3`
3. 宏任务（setTimeout）→ 输出 `2`

## 5. `this` 指向问题

```js
const obj = {
  name: 'Alice',
  greet() {
    console.log(this.name)
  },
  greetArrow: () => {
    console.log(this.name)
  },
}

obj.greet()       // 'Alice' — this 指向 obj
obj.greetArrow()  // undefined — 箭头函数的 this 继承外层

const greet = obj.greet
greet()           // undefined — this 指向全局（严格模式下报错）
```

::: tip this 绑定规则优先级
`new` 绑定 > 显式绑定（call/apply/bind）> 隐式绑定（对象调用）> 默认绑定（全局/undefined）
:::

---

> 持续更新中，祝面试顺利！
