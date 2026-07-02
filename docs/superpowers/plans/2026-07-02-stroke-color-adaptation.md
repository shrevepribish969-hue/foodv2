# 双层贴纸白边与明丽橘黄色描边 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纯食物贴纸效果（背景透明），并在食物边缘向外生成一圈 8px 宽的白色框，并在白框最边缘包裹一圈 3px 宽的橘黄色（#FF9800）连续实线描边。

**Architecture:** 
- 在绘制 Canvas 时，使用两层离屏 Canvas（橘色剪影、白色剪影）。
- 橘色剪影向 16 方向平移 11px（8px 白 + 3px 橘）进行绘制。
- 白色剪影向 16 方向平移 8px 进行绘制，最后中心绘制彩色食物。
- 抠图失败兜底情况下绘制原图并叠加聚光灯，使用明丽橘色 `#FF9800` 圆圈虚线。

**Tech Stack:** React, Canvas API, TypeScript

## Global Constraints

- 抠图成功时，背景保持透明
- 白色扩边厚度为 8px，橘色线厚度为 3px
- 线条必须连续闭合（通过 16 方向平移保证）
- 抠图失败或兜底方案的圆形虚线圈描边颜色修改为 `#FF9800`

---

### Task 1: 实现双层贴纸描边

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Consumes: `imgCutout` Image, `imgOriginal` Image in `RecordModal.tsx`
- Produces: Double-stroke sticker on transparent canvas

- [ ] **Step 1: 重构 renderCanvas 双层贴纸描边逻辑**

修改 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 中的 `renderCanvas` 函数。

具体重构后的 `renderCanvas` 代码：
```typescript
  const renderCanvas = (imgOriginal: HTMLImageElement, imgCutout: HTMLImageElement | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;
    ctx.clearRect(0, 0, 300, 300);

    // 居中稍微缩小绘制，为外部白色及橘色描边留出空间
    const scale = Math.min(220 / imgOriginal.width, 220 / imgOriginal.height);
    const w = imgOriginal.width * scale;
    const h = imgOriginal.height * scale;
    const x = (300 - w) / 2;
    const y = (300 - h) / 2;

    if (imgCutout) {
      try {
        const orangeColor = '#FF9800'; // 明丽橘黄色

        // 1. 创建橘色剪影离屏 canvas
        const orangeSilhouette = document.createElement('canvas');
        orangeSilhouette.width = 300;
        orangeSilhouette.height = 300;
        const oCtx = orangeSilhouette.getContext('2d');
        if (oCtx) {
          oCtx.drawImage(imgCutout, x, y, w, h);
          oCtx.globalCompositeOperation = 'source-in';
          oCtx.fillStyle = orangeColor;
          oCtx.fillRect(0, 0, 300, 300);
        }

        // 2. 创建白色剪影离屏 canvas
        const whiteSilhouette = document.createElement('canvas');
        whiteSilhouette.width = 300;
        whiteSilhouette.height = 300;
        const wCtx = whiteSilhouette.getContext('2d');
        if (wCtx) {
          wCtx.drawImage(imgCutout, x, y, w, h);
          wCtx.globalCompositeOperation = 'source-in';
          wCtx.fillStyle = '#FFFFFF';
          wCtx.fillRect(0, 0, 300, 300);
        }

        // 定义描边线宽
        const whiteBorder = 8;  // 8px 宽的白色底边
        const orangeBorder = 3;  // 3px 宽的橘黄色外圈线
        const totalBorder = whiteBorder + orangeBorder;

        ctx.save();
        // 3. 绘制最外层橘黄色线层 (朝 16 方向偏移以保证 11px 大平移下的平滑连续)
        for (let angle = 0; angle < 360; angle += 22.5) {
          const rad = (angle * Math.PI) / 180;
          const ox = Math.cos(rad) * totalBorder;
          const oy = Math.sin(rad) * totalBorder;
          ctx.drawImage(orangeSilhouette, ox, oy);
        }

        // 4. 绘制白色贴纸底边层 (朝 16 方向偏移 8px)
        for (let angle = 0; angle < 360; angle += 22.5) {
          const rad = (angle * Math.PI) / 180;
          const ox = Math.cos(rad) * whiteBorder;
          const oy = Math.sin(rad) * whiteBorder;
          ctx.drawImage(whiteSilhouette, ox, oy);
        }
        ctx.restore();

        // 5. 正中心绘制彩色的食物本体，覆盖多层剪影得到精致贴纸
        ctx.drawImage(imgCutout, x, y, w, h);
      } catch (e) {
        console.error("双重贴纸描边渲染异常:", e);
        ctx.drawImage(imgCutout, x, y, w, h);
      }
    } else {
      // 6. 抠图失败兜底方案：显示原图并叠加径向压暗，使用明丽橘色画圆圈虚边
      ctx.drawImage(imgOriginal, x, y, w, h);
      ctx.save();
      const grad = ctx.createRadialGradient(150, 150, 20, 150, 150, 100);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); // 中心明亮
      grad.addColorStop(1, 'rgba(92, 75, 67, 0.55)'); // 四周压暗
      
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // 绘制圆形手绘风虚线圈 (使用明丽橘色)
      ctx.beginPath();
      ctx.arc(150, 150, 80, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();
      
      setUseFallback(true);
    }

    canvas.toBlob((b) => {
      if (b) {
        setImageBlob(b);
        setProcessedUrl(URL.createObjectURL(b));
      }
      setProcessing(false);
    }, 'image/png');
  };
```

- [ ] **Step 2: 验证描边与贴纸效果**

手动验证：
1. 刷新页面，上传包含零碎细节的食物图片。
2. 观察生成的缩略图和虚边，确认背景已变成纯透明贴纸效果，食物周围多了一层 8px 的平整白框，最外围是一层 3px 宽的闭合明丽橘黄色轮廓线。
3. 验证抠图失败或兜底情况，确认圆形虚线圈为 `#FF9800`。

- [ ] **Step 3: 提交代码到 Git**

运行：
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: implement double-stroke sticker with white border and bold orange outline"
```
