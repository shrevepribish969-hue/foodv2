# 双层贴纸白边与明丽橘黄色描边 Implementation Plan (包围盒裁剪升级)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纯食物贴纸效果（背景透明），自动计算食物主体的 Bounding Box 进行图像剪裁，剔除外部大片透明留白，放大并呈现贴纸效果，同时保持 8px 白边与 3px 橘色线描边。

**Architecture:** 
- 在 `renderCanvas` 中，先绘制 `imgCutout` 到离屏 `boxCanvas`。
- 遍历像素以确定 `[minX, minY, maxX, maxY]` 有效不透明边界。
- 将有效区域裁剪绘制到 `cleanCanvas`，且执行 Alpha < 40 过滤。
- 对裁剪后的食物大小以 260px 阈值进行缩放并居中绘制，从而消除原照片外围透明空白的影响。

**Tech Stack:** React, Canvas API, TypeScript

## Global Constraints

- 抠图成功时，背景保持透明
- 白色扩边厚度为 8px，橘色线厚度为 3px
- 对裁剪图源应用 Bounding Box 最小包围盒扫描
- 缩放限制基于裁剪后尺寸的 260px 计算
- 抠图失败或兜底方案的圆形虚线圈描边颜色修改为 `#FF9800`

---

### Task 1: 实现包围盒裁剪与双层贴纸描边

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Consumes: `imgCutout` Image, `imgOriginal` Image in `RecordModal.tsx`
- Produces: Tight-crop double-stroke sticker on transparent canvas

- [ ] **Step 1: 重构 renderCanvas Bounding Box 裁剪逻辑**

修改 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 中的 `renderCanvas` 函数，按新的包围盒扫描及裁剪代码重构。

- [ ] **Step 2: 验证贴纸饱满度**

手动验证：
1. 刷新页面，上传包含大片外部背景的食物照片。
2. 观察生成的卡片，确认贴纸大方饱满，再无照片周围剔除背景留下的大块透明空白。

- [ ] **Step 3: 提交代码到 Git**

运行：
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: implement Bounding Box Crop to discard transparent outer margins and maximize food sticker scale"
```
