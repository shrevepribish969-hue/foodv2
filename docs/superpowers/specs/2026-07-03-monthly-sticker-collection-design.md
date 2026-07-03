# 月视图【本月收集】贴纸墙设计规格书

本设计旨在为月视图页面（MonthView）的下方新增一个名为“本月收集”的贴纸墙功能。该功能将当前选中月份的优质美食贴纸集中起来，以倾斜、无序的拟真手账风格进行排版，并支持灵动的刷新入场动画。

## 需求背景与功能设计

1. **贴纸收集逻辑**：
   - 数据范围：当前选中月份的全部用餐记录。
   - 筛选逻辑：按评分（`rating`）降序、时间戳（`timestamp`）降序排列，取前 30 张贴纸。
   - 图片获取：优先展示裁剪后的抠图透明贴纸（`imageBlob`），无图片时以可爱的圆形 Emoji 贴纸兜底。
2. **手账拟真排版**：
   - 采用 Flex 流式自适应布局。
   - 每个贴纸在渲染时被赋予微小的随机旋转角（`-10deg` 到 `10deg`）与随机方向微移（`-5px` 到 `5px`），呈现手账本上手工贴贴纸的效果。
   - 使用 CSS `filter: drop-shadow` 为不规则贴纸边缘添加自然立体的投影。
3. **刷新动效**：
   - 右上角设有一个旋转刷新按钮。
   - 点击时，刷新图标产生 360° 旋转反馈。
   - 下方所有贴纸重新计算随机偏转量与旋转角，并触发果冻弹性的交错入场动画（Staggered Pop）。

## 技术实现方案

### 1. 样式定义 ([index.css](file:///d:/A研二/food2.0纯记录/foodV2/src/index.css))

新增控制弹性弹出关键帧动画与刷新图标旋转的样式：

```css
@keyframes sticker-pop {
  0% {
    transform: scale(0) rotate(var(--rot, 0deg)) translate(var(--ox, 0px), var(--oy, 0px));
    opacity: 0;
  }
  70% {
    transform: scale(1.15) rotate(var(--rot, 0deg)) translate(var(--ox, 0px), var(--oy, 0px));
  }
  100% {
    transform: scale(1) rotate(var(--rot, 0deg)) translate(var(--ox, 0px), var(--oy, 0px));
    opacity: 1;
  }
}

.sticker-animate {
  animation: sticker-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes icon-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.icon-spinning {
  animation: icon-spin 0.5s ease-in-out;
}
```

### 2. 贴纸墙组件开发与嵌入 ([MonthView.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/MonthView.tsx))

在 `MonthView.tsx` 组件内：

- **状态定义**：
  - `refreshKey`: 触发贴纸动画重播的计数器状态。
  - `isSpinning`: 标识刷新图标是否正在旋转。
  - `randomParams`: 数组，存放每张贴纸的 `rot`、`ox`、`oy` 偏移状态。
- **数据获取**：
  - 在 `useEffect` 重新计算当前月份的 records。
  - 过滤出当年当月的记录：`recordDate.getFullYear() === year && recordDate.getMonth() === month`。
  - 排序并切片：`records.sort((a,b) => b.rating - a.rating || b.timestamp - a.timestamp).slice(0, 30)`。
- **参数生成函数**：
  - `generateRandomParams(count: number)`：返回大小为 count 的对象数组，包含随机的 `angle` (-10 到 10) 和 `offsetX`/`offsetY` (-5 到 5)。
- **页面渲染**：
  - 在日历及图例下方，新增“本月收集”卡片结构。
  - 右上角放置 `RotateCw` 刷新按钮，点击时调用 `handleRefresh`：
    1. 激活 `isSpinning` 状态。
    2. 生成新的随机参数数组，并递增 `refreshKey`。
    3. 在 `500ms` 后将 `isSpinning` 设回 `false`。

## 验证与验收标准

1. **数据准确性**：
   - 切换月份时，下方的贴纸墙能同步更新并只展示所选月份的贴纸，最多展示 30 张，且评分最高的排在前面。
2. **样式表现**：
   - 贴纸在容器中紧密排列但高低错落、角度不一，极具手账氛围。
   - 透明抠图贴纸带有精美的轮廓边缘投影，非抠图记录展示可爱的圆形 emoji 贴纸。
3. **交互与动效**：
   - 点击右上角刷新按钮时，图标快速旋转 360°，贴纸墙以波浪般交错的弹性特效从无到有弹出，且每次刷新的偏转角度和位置都发生改变。
