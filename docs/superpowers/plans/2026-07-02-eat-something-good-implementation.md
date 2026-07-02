# “吃点好的” App v2.1 Spotlight 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Spotlight 压暗背景的美食高亮功能，保留照片原图的生活感；同时修正不规则轮廓描边的边界漏洞，使虚线只完美围绕食物边缘。

**Tech Stack:** React 19, TypeScript, Vite, Vanilla CSS, Lucide-React, @imgly/background-removal.

## Global Constraints
* 不再做去背景裁剪（即不再把食物外的背景丢弃为透明），而是保留原图但压暗背景以突出食物。
* 不规则虚线必须用 Canvas Moore-Neighbor 提取食物边缘，不能画到画布边界上。

---

### Task 1: Spotlight 聚光灯压暗背景与食物边缘轮廓描边

**Files:**
* Modify: `src/components/RecordModal.tsx`

**Interfaces:**
* Consumes: 原图 Blob 与 AI 去背景抠图 Blob。
* Produces: 背景压暗 45%、食物保持明亮，且边缘围绕白色手账虚线的精致 Spotlight 卡片贴纸。

- [ ] **Step 1: 重写 drawDashedBorder 绘图算法**

重构 [src/components/RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 的 `handleImageUpload` 与 `drawDashedBorder` 方法。
在临时 Canvas 上渲染 AI 抠图以获得干净的 Alpha 数据，并在主 Canvas 上先画原图、再画压暗层、最后叠加明亮的 AI 抠图，再在其外侧做法线方向偏移 8px 的手绘风白色描边。

- [ ] **Step 2: 编写 Fallback 聚光灯渐变**

实现去背景失败时的径向渐变聚光灯（Radial Gradient Vignette）与圆形虚线轮廓。

- [ ] **Step 3: 验证并提交**

Run: `npm run build`
Expected: 编译打包通过，Spotlight 聚光灯及描边正常工作。
Commit:
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: implement Spotlight background dimming and precise contour tracing outline"
```
