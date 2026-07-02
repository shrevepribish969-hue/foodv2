# 双层贴纸白边与明丽橘黄色描边 Implementation Plan (贴纸放大升级)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纯食物贴纸效果（背景透明），将限制绘制比例从 220px 提升至 260px，以便让贴纸在 Canvas 中更加大方饱满，并预留足够的描边边距。

**Architecture:** 
- 在 `renderCanvas` 中，修改 `scale` 计算系数，由原先的限制 220 像素修改为限制 260 像素；
- 保持 Alpha < 40 阈值过滤和双重 16 方向偏移描边逻辑。

**Tech Stack:** React, Canvas API, TypeScript

## Global Constraints

- 抠图成功时，背景保持透明
- 白色扩边厚度为 8px，橘色线厚度为 3px
- 缩放限制从 220px 提升为 260px，使面积增加约 40%
- 抠图失败或兜底方案的圆形虚线圈描边颜色修改为 `#FF9800`

---

### Task 1: 实现双层贴纸描边与比例放大

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Consumes: `imgCutout` Image, `imgOriginal` Image in `RecordModal.tsx`
- Produces: Enlarged double-stroke sticker on transparent canvas

- [ ] **Step 1: 修改 renderCanvas 缩放限制**

修改 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 中的 `renderCanvas` 函数，修改 `scale` 计算中的 220 值为 260。

- [ ] **Step 2: 验证放大的贴纸效果**

手动验证：
1. 刷新页面，上传食物图片。
2. 观察生成的卡片，确认贴纸明显变大，且边缘没有被剪切。

- [ ] **Step 3: 提交代码到 Git**

运行：
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: enlarge sticker size limit from 220px to 260px to fill the card beautifully"
```
