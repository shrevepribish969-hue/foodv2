# 抠图贴纸自适应紧贴描边修改 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纯食物抠图贴纸效果（背景透明），并在食物边缘生成一圈紧贴食物边界、宽度为 3px 的自适应主体加深色实线轮廓，抠图失败时自动走深褐色圆形虚线圈兜底。

**Architecture:** 
- 在绘制 Canvas 轮廓之前，如果抠图 `imgCutout` 存在，则不绘制原图，在透明画布上通过 8 偏移方向绘制纯色剪影以形成自适应实线描边，然后正中覆盖绘制 `imgCutout`；
- 删除 `RecordModal.tsx` 中已废弃的 Moore-Neighbor 边缘追踪相关算法函数 `traceContour` 和 `smoothPoints`。

**Tech Stack:** React, Canvas API, TypeScript

## Global Constraints

- 抠图成功时，背景保持透明，无原图背景
- 描边线宽度为 3px，呈实线，紧贴食物轮廓，颜色为食物平均色乘以 0.4
- 抠图失败或兜底方案的圆形虚线圈描边颜色修改为 `#5C4B43`

---

### Task 1: 移除废弃算法与重构 Canvas 渲染

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Consumes: `imgOriginal` Image, `imgCutout` Image in `RecordModal.tsx`
- Produces: Transparent background canvas with offset outline stroke

- [ ] **Step 1: 移除废弃的几何边缘追踪函数**

从 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 中完全删除 `traceContour` 函数 (lines 6-52) 和 `smoothPoints` 函数 (lines 55-69)。

- [ ] **Step 2: 重构 renderCanvas 绘制与描边逻辑**

修改 `RecordModal.tsx` 中的 `renderCanvas` 函数，使用离屏 canvas 纯色剪影与 8 方向偏移法进行 3px 的自适应实线描边。

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

    // 居中稍微缩小绘制，为外部虚线留出空间
    const scale = Math.min(220 / imgOriginal.width, 220 / imgOriginal.height);
    const w = imgOriginal.width * scale;
    const h = imgOriginal.height * scale;
    const x = (300 - w) / 2;
    const y = (300 - h) / 2;

    if (imgCutout) {
      // 1. 提取不规则轮廓的前置步骤：计算平均主体色
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(imgCutout, x, y, w, h);
          const tempImgData = tempCtx.getImageData(0, 0, 300, 300);
          const tempData = tempImgData.data;

          // 统计食物主体色平均 RGB
          let totalR = 0, totalG = 0, totalB = 0, count = 0;
          for (let i = 0; i < tempData.length; i += 4) {
            const r = tempData[i];
            const g = tempData[i + 1];
            const b = tempData[i + 2];
            const a = tempData[i + 3];
            if (a > 40) {
              totalR += r;
              totalG += g;
              totalB += b;
              count++;
            }
          }

          let strokeColor = '#5C4B43'; // 默认暖深褐兜底
          if (count > 0) {
            const avgR = totalR / count;
            const avgG = totalG / count;
            const avgB = totalB / count;
            // 线性等比例加深（乘以 0.4）
            const darkR = Math.round(avgR * 0.4);
            const darkG = Math.round(avgG * 0.4);
            const darkB = Math.round(avgB * 0.4);
            strokeColor = `rgb(${darkR}, ${darkG}, ${darkB})`;
          }

          // 2. 创建纯色剪影离屏 canvas
          const silhouetteCanvas = document.createElement('canvas');
          silhouetteCanvas.width = 300;
          silhouetteCanvas.height = 300;
          const sCtx = silhouetteCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(imgCutout, x, y, w, h);
            sCtx.globalCompositeOperation = 'source-in';
            sCtx.fillStyle = strokeColor;
            sCtx.fillRect(0, 0, 300, 300);
          }

          // 3. 在主 canvas 上朝 8 个偏移方向绘制剪影，形成 3px 宽的紧贴轮廓线
          const strokeWidth = 3;
          ctx.save();
          for (let angle = 0; angle < 360; angle += 45) {
            const rad = (angle * Math.PI) / 180;
            const ox = Math.cos(rad) * strokeWidth;
            const oy = Math.sin(rad) * strokeWidth;
            ctx.drawImage(silhouetteCanvas, ox, oy);
          }
          ctx.restore();

          // 4. 正中心绘制彩色的食物本体，遮盖并呈现完美的描边边缘
          ctx.drawImage(imgCutout, x, y, w, h);
        }
      } catch (e) {
        console.error("偏移剪影描边渲染异常:", e);
        // 发生异常时，直接绘制原彩色食物作为最低保障
        ctx.drawImage(imgCutout, x, y, w, h);
      }
    } else {
      // 5. 抠图失败兜底方案：显示原图并叠加径向压暗，并用暖褐色画圆圈虚线
      ctx.drawImage(imgOriginal, x, y, w, h);
      ctx.save();
      const grad = ctx.createRadialGradient(150, 150, 20, 150, 150, 100);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); // 中心明亮
      grad.addColorStop(1, 'rgba(92, 75, 67, 0.55)'); // 四周压暗
      
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // 绘制圆形手绘风虚线圈 (使用暖深褐描边)
      ctx.beginPath();
      ctx.arc(150, 150, 80, 0, Math.PI * 2);
      ctx.strokeStyle = '#5C4B43';
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

- [ ] **Step 3: 验证描边与抠图效果**

手动验证：
1. 本地项目刷新，上传食物图片。
2. 观察生成的缩略图和虚线，确认背景已变成纯透明贴纸效果。
3. 食物边缘应包含一圈厚度为 3px 且高度契合、绝对不发生偏离、无锯齿和破损的加深色实线描边。
4. 测试抠图失败或兜底情况，确认圆形虚线圈为 `#5C4B43`。

- [ ] **Step 4: 提交代码到 Git**

运行：
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: implement precise offset silhouette outlining and remove obsolete algorithms"
```
