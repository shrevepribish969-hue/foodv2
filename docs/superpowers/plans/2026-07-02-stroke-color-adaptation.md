# 抠图描边自适应主体加深色修改 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将食物抠图后的虚线描边由白色修改为该食物主体色的加深色，保证在浅色背景下足够清晰。

**Architecture:** 在绘制 Canvas 轮廓之前，提取抠出食物图像的不透明像素平均 RGB，乘以 0.4 加深。抠图失败兜底情况下使用温暖的手账深褐色 `#5C4B43`。

**Tech Stack:** React, Canvas API, TypeScript

## Global Constraints

- 描边加深使用 RGB 线性等比例加深方案（RGB 平均值乘以 0.4）
- 抠图失败或兜底方案的圆形虚线圈描边颜色修改为 `#5C4B43`

---

### Task 1: 抠图描边逻辑修改

**Files:**
- Modify: `src/components/RecordModal.tsx:162-261`

**Interfaces:**
- Consumes: `imgCutout` Image, `tempData` ImageData from `RecordModal.tsx`
- Produces: `strokeColor` for dynamic strokeStyle

- [ ] **Step 1: 实现颜色提取及描边应用**

修改 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx)。

具体修改内容（替换 lines 162-261 左右的 `renderCanvas` 函数部分）：
```typescript
      // 4. 提取不规则轮廓进行虚线描边 (利用离屏 canvas 确保只对透明 cutout 图像做边缘检测)
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(imgCutout, x, y, w, h);
          const tempImgData = tempCtx.getImageData(0, 0, 300, 300);
          const tempData = tempImgData.data;

          // 统计食物主体色
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
            const darkR = Math.round(avgR * 0.4);
            const darkG = Math.round(avgG * 0.4);
            const darkB = Math.round(avgB * 0.4);
            strokeColor = `rgb(${darkR}, ${darkG}, ${darkB})`;
          }

          // 边缘检测：强制忽略最外层 5px，防止追踪至画布边缘产生矩形框
          const isOpaque = (px: number, py: number) => {
            if (px < 5 || px >= 295 || py < 5 || py >= 295) return false;
            const idx = (py * 300 + px) * 4;
            return tempData[idx + 3] > 40; // 检查 cutout 层的 alpha
          };

          const rawPoints = traceContour(300, 300, isOpaque);

          if (rawPoints.length > 5) {
            // 双重均值滤波平滑与 8px 法线向外扩展
            const smoothed = smoothPoints(rawPoints, 9);
            const offsetPoints: { x: number; y: number }[] = [];
            const offsetDist = 8;
            for (let i = 0; i < smoothed.length; i++) {
              const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length];
              const next = smoothed[(i + 1) % smoothed.length];
              const curr = smoothed[i];

              const tx = next.x - prev.x;
              const ty = next.y - prev.y;
              const len = Math.sqrt(tx * tx + ty * ty);

              if (len > 0.01) {
                // 顺时针外侧法向量: (ty / len, -tx / len)
                const nx = ty / len;
                const ny = -tx / len;
                offsetPoints.push({
                  x: curr.x + nx * offsetDist,
                  y: curr.y + ny * offsetDist
                });
              } else {
                offsetPoints.push(curr);
              }
            }

            const finalPoints = smoothPoints(offsetPoints, 9);

            // 绘制紧贴食物轮廓的加深虚线
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(finalPoints[0].x, finalPoints[0].y);
            for (let i = 1; i < finalPoints.length; i++) {
              ctx.lineTo(finalPoints[i].x, finalPoints[i].y);
            }
            ctx.closePath();

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 6]);
            ctx.shadowColor = 'rgba(92, 75, 67, 0.2)';
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.restore();
          }
        }
      } catch (e) {
        console.error("Spotlight 轮廓描边计算异常:", e);
      }
    } else {
      // 5. 兜底方案：如果没有 cutout，使用径向渐变聚光灯（中心亮、四周暗）
      ctx.save();
      const grad = ctx.createRadialGradient(150, 150, 20, 150, 150, 100);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); // 中心明亮
      grad.addColorStop(1, 'rgba(92, 75, 67, 0.55)'); // 四周压暗
      
      // 限定在图片范围内进行聚光灯大招绘制
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
```

- [ ] **Step 2: 验证描边颜色与效果**

手动验证：
1. 确保开发服务器 `npm run dev` 运行中。
2. 打开浏览器访问本地地址并添加食物记录，上传带有食物的图片。
3. 检查生成的缩略图和虚线，确认描边颜色是否自动匹配食物本身的加深颜色（非白色，如深黄褐色、深绿色等），且非常清晰显眼。
4. 验证抠图失败或兜底情况，确认圆形虚线圈为 `#5C4B43`。

- [ ] **Step 3: 提交更改到 Git**

运行：
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: adapt food cutout stroke color based on subject color"
```
