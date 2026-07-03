# 今日美味贴纸袋横向撕裂推荐实施方案 (Today Sticker Bag Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在“收藏”页面（FavoritesPage）的搜索框下方增加“今天吃什么”卡片入口，点击后弹出一个全屏拟真贴纸包袋。用户按住滑块向右滑动，横向“撕开”顶部的虚线拉条，撕开后 4 张最近 30 天内吃过的高分美食贴纸向上滑出。点击任一贴纸选定并关闭。

**Architecture:**
1. 在 `index.css` 中增加贴纸向上滑出（`sticker-slide-up`）以及呼吸动效的定义，并清除已无用的扭蛋机动画。
2. 在 `FavoritesPage.tsx` 中编写贴纸袋的 SVG 组件（支持撕开拉线、撕开程度的进度控制）和向右滑动手势逻辑（支持鼠标和触摸移动）。
3. 实现自适应 4 重数据推荐筛选逻辑，确保全新用户和老用户都能一次性成功推荐 4 张高分贴纸。

---

### Task 1: 声明 CSS 动画关键帧与类名 (index.css)

- Modify: [index.css](file:///d:/A研二/food2.0纯记录/foodV2/src/index.css)

- [ ] **Step 1: 清理之前追加的扭蛋机 CSS，替换为贴纸袋撕开及滑出动画**

```css
/* 全屏模态背景模糊淡入 */
.gashapon-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(62, 58, 54, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 0.25s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 贴纸从纸袋开口向上滑出 */
@keyframes sticker-slide-up {
  0% {
    transform: translateY(60px) scale(0.85);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.sticker-slide-active {
  animation: sticker-slide-up 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

/* 纸袋轻微呼吸动效 */
@keyframes bag-breathing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.bag-pulse {
  animation: bag-breathing 2s ease-in-out infinite;
}

/* 星星微光旋转 */
@keyframes sparkle-rotate {
  0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; }
  50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
  100% { transform: rotate(360deg) scale(0.8); opacity: 0.5; }
}

.sparkle-animate {
  animation: sparkle-rotate 3s linear infinite;
}
```

---

### Task 2: 在 FavoritesPage.tsx 中实现贴纸袋横向撕拉逻辑与 UI 界面

- Modify: [FavoritesPage.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/FavoritesPage.tsx)

- [ ] **Step 1: 编写手绘风格贴纸袋 SVG (StickerBagSVG)**
  - 支持 `progress`（0 到 100）作为裁剪或平移参数。
  - 通过 CSS `clipPath: inset(0 0 0 ${progress}%)` 表现从左至右撕开。

- [ ] **Step 2: 实现拖拽手势 (Drag gesture) 逻辑**
  - 使用鼠标/触摸事件追踪移动距离并映射为进度。
  - 在进度达到 >= 95% 时触发撕裂完成，袋子两部分滑开并显示 4 张贴纸。

- [ ] **Step 3: 优化数据装载逻辑，一次性抽取 4 张符合条件的历史美食**
  - 实现四重兜底逻辑，确保 100% 抽满 4 个不同的菜品。
