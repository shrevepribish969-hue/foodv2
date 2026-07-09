# 收藏页【今天吃什么】扭蛋机抽签推荐设计规格书

本设计旨在为收藏页面（FavoritesPage）的搜索框下方新增一个名为“今天吃什么”的卡片功能。该功能以扭蛋机的形式，解决用户吃饭纠结的问题，提供有限次数的美味推荐以及四选一终极汇总面板。

## 需求背景与功能设计

1. **入口卡片**：
   - 位置：[FavoritesPage.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/FavoritesPage.tsx) 搜索框正下方。
   - 样式：采用暖色底色卡片（MUJI风格），左侧展示标题“今天吃什么？”、副标题“不知道吃什么？摇一摇试试运气吧～”和“开始抽签”按钮；右侧展示一个精致可爱的手绘矢量扭蛋机（SVG格式，符合项目整体线条风）。
2. **推荐数据与算法**：
   - **时间范围**：仅从**最近 30 天**的饮食记录中进行筛选。
   - **过滤条件**：
     - 评分（`rating`）低于 3 分的记录一律排除。
     - 最近 5 天内吃过的食物（即 `daysAgo < 5`）一律排除，确保推荐新鲜度。
   - **好久没吃算法**：对于抽中的美味，如果距离上次吃已经超过 20 天（即 `20 <= daysAgo <= 30`），则展示高亮的 **“💡 好久没吃了”** 标识。
   - **样式一致性**：对于没有上传抠图贴纸（无 `imageBlob`）的用餐记录，**不使用 Emoji 兜底**，而是展示一个优雅统一的 `Utensils` 刀叉线条图标（卡其色）作为 fallback。
3. **抽取限额与汇总交互**：
   - **次数限制与进度标识**：页面左上角显示当前抽取阶段（`1/4` 到 `4/4`）：
     - **第 1 阶段 (1/4)**：静态扭蛋机状态。提示“摇一摇，抽出今天的灵感美食吧✨”，底部文案为“今日已推荐 0/4 次”。
     - **第 2 阶段 (2/4)**：展示第 1 次抽出的食物贴纸。提示“距离上次吃：X 天前”，有 `[ 换一个 ]` 和 `[ 就它了 ]` 按钮。
     - **第 3 阶段 (3/4)**：展示第 2 次抽出的食物贴纸。提示“距离上次吃：Y 天前”，有 `[ 换一个 ]` 和 `[ 就它了 ]` 按钮。
     - **第 4 阶段 (4/4)**：展示第 3 次抽出的食物贴纸。提示“距离上次吃：Z 天前”，有 `[ 换一个 ]` 和 `[ 就它了 ]` 按钮。
   - **终极汇总卡片 (纠结终结者)**：如果在第 4 阶段 (4/4) 页面点击了 `[ 换一个 ]`，系统会自动抽出第 4 个食物，并立刻跳转到“本次推荐”终极汇总页面：
     - 左侧显示扭蛋机：“本次推荐已用完啦~ 挑一个你最想吃的吧！(｡• ᵕ •｡)✦”。
     - 右侧以并排/矩阵形式展示本次推荐的全部 4 个美食贴纸（包含照片/ fallback、名称、评分、吃过的时间）。
     - 用户点击其中任意一餐贴纸，即代表选定它并立刻关闭弹窗。
     - 汇总页面底部额外提供一个可选按钮 `[ 查看全部历史 ]`，点击可跳转到回忆录列表页面。


## 技术实现方案

### 1. 样式定义 ([index.css](file:///d:/A研二/food2.0纯记录/foodV2/src/index.css))

追加扭蛋机晃动（shake）、蛋坠落（gashapon-drop）和开蛋（egg-crack）的 CSS 动画：

```css
/* 扭蛋机晃动动画 */
@keyframes gashapon-shake {
  0%, 100% { transform: rotate(0deg); }
  20%, 60% { transform: rotate(-5deg) translate(-2px, 0); }
  40%, 80% { transform: rotate(5deg) translate(2px, 0); }
}

.gashapon-active {
  animation: gashapon-shake 0.8s ease-in-out;
}

/* 扭蛋坠落弹出动画 */
@keyframes egg-drop {
  0% { transform: translateY(-50px) scale(0.3); opacity: 0; }
  50% { transform: translateY(10px) scale(1.1); opacity: 1; }
  75% { transform: translateY(-5px) scale(0.95); }
  100% { transform: translateY(0) scale(1); }
}

.egg-falling {
  animation: egg-drop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

/* 全屏模态背景模糊淡入 */
.gashapon-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(62, 58, 54, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justifyContent: center;
  z-index: 1000;
  animation: fade-in 0.3s ease-out;
}
```

### 2. 状态机逻辑定义

在扭蛋机弹窗中，通过以下状态控制展示：
- `gashaponState`: `'ready' | 'shaking' | 'revealed' | 'show-all'`
- `drawnHistory`: `FoodRecord[]` (记录本轮抽取到的 1-4 个食物对象)
- `currentSelection`: `FoodRecord | null` (当前展示的食物)

### 3. 跳转支持设计

在 `App.tsx` 中向 `FavoritesPage` 传入 `onSelectDate` 回调：
```tsx
{activeTab === 'favorites' && <FavoritesPage onSelectDate={handleSelectDateFromCalendar} />}
```
虽然本次去掉了直接的“去记录”跳转，但保留 `onSelectDate` 能为后续扩展收藏页面详情做基础。

## 验收与测试标准

1. **范围正确性**：
   - 扭蛋机候选池必须严格在最近 30 天内筛选，且必须排除近 5 天内吃过的食物，且评分必须大于等于 3。
2. **交互限制**：
   - 第 1、2、3、4 次推荐均有 `[ 换一个 ]` 按钮。
   - 第 4 次推荐不服气点击 `[ 换一个 ]` 后，必须平滑渲染出包含全部 4 个已推荐美食的并排列表。
   - 点击汇总列表中任意一餐，页面必须立刻关闭返回收藏页面。
3. **视觉要求**：
   - 扭蛋机和 fallback 占位图必须使用纯线条矢量设计，不出现任何彩色 emoji。
