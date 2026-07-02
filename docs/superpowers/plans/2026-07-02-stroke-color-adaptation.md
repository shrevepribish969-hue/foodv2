# 双层贴纸白边与明丽橘黄色描边 Implementation Plan (去噪抗糊升级)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纯食物贴纸效果（背景透明），在食物边缘外扩 8px 白色层，并包裹 3px 宽的橘黄色（#FF9800）连续实线描边，并通过 Alpha 阈值过滤彻底清除边缘处的半透明糊边与热气噪点。

**Architecture:** 
- 在 `renderCanvas` 中，先将 `imgCutout` 渲染至离屏 Canvas 并通过像素遍历把 Alpha 小于 180 的点清零，大于 180 的点置为 255。这能提供去噪硬化后的 `cleanCanvas` 作为白色与橘色剪影的生成来源；
- 沿用 16 方向偏移绘制底边层的架构。

**Tech Stack:** React, Canvas API, TypeScript

## Global Constraints

- 抠图成功时，背景保持透明
- 白色扩边厚度为 8px，橘色线厚度为 3px
- 对描边源应用 Alpha < 180 像素过滤清零，实现 100% 边缘去噪和硬边化
- 抠图失败或兜底方案的圆形虚线圈描边颜色修改为 `#FF9800`

---

### Task 1: 实现抗糊去噪双层贴纸描边

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Consumes: `imgCutout` Image, `imgOriginal` Image in `RecordModal.tsx`
- Produces: De-noised double-stroke sticker on transparent canvas

- [ ] **Step 1: 重构 renderCanvas 像素去噪与绘制逻辑**

修改 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 中的 `renderCanvas` 函数，在绘制剪影前加入对 `cleanCanvas` 的生成和像素遍历去噪硬化处理。

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

        // 1. 创建去噪硬化离屏 canvas
        const cleanCanvas = document.createElement('canvas');
        cleanCanvas.width = 300;
        cleanCanvas.height = 300;
        const cCtx = cleanCanvas.getContext('2d');
        if (cCtx) {
          cCtx.drawImage(imgCutout, x, y, w, h);
          const imgData = cCtx.getImageData(0, 0, 300, 300);
          const data = imgData.data;
          // 阈值过滤：彻底剔除 Alpha < 180 的半透明热气或抠图背景杂质
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 180) {
              data[i + 3] = 0;
            } else {
              data[i + 3] = 255;
            }
          }
          cCtx.putImageData(imgData, 0, 0);
        }

        // 2. 创建橘色剪影离屏 canvas (源自 cleanCanvas)
        const orangeSilhouette = document.createElement('canvas');
        orangeSilhouette.width = 300;
        orangeSilhouette.height = 300;
        const oCtx = orangeSilhouette.getContext('2d');
        if (oCtx) {
          oCtx.drawImage(cleanCanvas, 0, 0);
          oCtx.globalCompositeOperation = 'source-in';
          oCtx.fillStyle = orangeColor;
          oCtx.fillRect(0, 0, 300, 300);
        }

        // 3. 创建白色剪影离屏 canvas (源自 cleanCanvas)
        const whiteSilhouette = document.createElement('canvas');
        whiteSilhouette.width = 300;
        whiteSilhouette.height = 300;
        const wCtx = whiteSilhouette.getContext('2d');
        if (wCtx) {
          wCtx.drawImage(cleanCanvas, 0, 0);
          wCtx.globalCompositeOperation = 'source-in';
          wCtx.fillStyle = '#FFFFFF';
          wCtx.fillRect(0, 0, 300, 300);
        }

        // 定义描边线宽
        const whiteBorder = 8;  // 8px 宽的白色底边
        const orangeBorder = 3;  // 3px 宽的橘黄色外圈线
        const totalBorder = whiteBorder + orangeBorder;

        ctx.save();
        // 4. 绘制最外层橘黄色线层 (朝 16 方向偏移以保证 11px 大平移下的平滑连续)
        for (let angle = 0; angle < 360; angle += 22.5) {
          const rad = (angle * Math.PI) / 180;
          const ox = Math.cos(rad) * totalBorder;
          const oy = Math.sin(rad) * totalBorder;
          ctx.drawImage(orangeSilhouette, ox, oy);
        }

        // 5. 绘制白色贴纸底边层 (朝 16 方向偏移 8px)
        for (let angle = 0; angle < 360; angle += 22.5) {
          const rad = (angle * Math.PI) / 180;
          const ox = Math.cos(rad) * whiteBorder;
          const oy = Math.sin(rad) * whiteBorder;
          ctx.drawImage(whiteSilhouette, ox, oy);
        }
        ctx.restore();

        // 6. 正中心绘制彩色的食物本体，覆盖多层剪影得到精致贴纸
        ctx.drawImage(imgCutout, x, y, w, h);
      } catch (e) {
        console.error("双重贴纸描边渲染异常:", e);
        ctx.drawImage(imgCutout, x, y, w, h);
      }
    } else {
      // 7. 抠图失败兜底方案：显示原图并叠加径向压暗，使用明丽橘色画圆形虚边
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
1. 刷新页面，上传包含零碎细节及右侧淡色热气/半透明阴影的食物图片。
2. 观察生成的缩略图和虚边，确认背景已变成纯透明贴纸效果，右侧淡色朦胧背景已被 100% 滤除干净，边缘线条平整连续无噪点。
3. 验证抠图失败或兜底情况，确认圆形虚线圈为 `#FF9800`。

- [ ] **Step 3: 提交代码到 Git**

运行：
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: resolve blurry outline by implementing Alpha threshold filtering on sticker base"
```
