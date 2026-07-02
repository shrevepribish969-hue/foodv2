# 抠图描边自适应主体加深色与纯贴纸化设计

本设计旨在解决手账风食物记录应用中，食物抠图后的描边虚线在浅色背景上不明显的问题，并对抠图效果进行手账贴纸化改良：
- **纯贴纸化**：抠图成功时，完全丢弃原始大图的背景（使背景变透明），只保留抠出来的食物本体。
- **描边自适应**：描边颜色从固定的纯白色改为根据抠图出的食物主体色自动计算并加深后的颜色。

## 方案设计

### 1. 纯贴纸化与颜色计算

修改 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 的 `renderCanvas` 函数。
原本的绘制逻辑为：先绘制底层原图 -> 叠加压暗遮罩 -> 绘制抠图食物 -> 绘制白色描边。

我们将绘制逻辑修改为：
- **抠图成功时（`imgCutout` 存在）**：
  1. 不绘制底层原图 `imgOriginal`，不绘制压暗遮罩。
  2. 直接在透明画布上绘制 `imgCutout`。
  3. 提取不规则轮廓的前置阶段，对 `tempData`（非背景透明像素）进行遍历，统计透明度 `alpha > 40` 的像素。
  4. 累加其 R, G, B 值，计算平均 RGB 分量。
  5. 将平均 RGB 乘以 `0.4`（等比例等深度加深）获取加深色 `strokeColor`。
  6. 使用 `strokeColor` 绘制不规则手绘风虚线。
- **抠图失败兜底时（`imgCutout` 不存在）**：
  1. 绘制底层原图 `imgOriginal`。
  2. 叠加径向渐变聚光灯（中心亮、四周暗）。
  3. 绘制圆形手绘风虚线圈，描边颜色改为温暖的手账深褐色 `#5C4B43`。

### 2. 代码重构设计

在 `renderCanvas` 中，控制底层原图 `imgOriginal` 的绘制仅在 `!imgCutout` 时生效。
代码结构大致如下：
```typescript
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
      // 1. 直接绘制去背景的食物本体（背景保持完全透明）
      ctx.drawImage(imgCutout, x, y, w, h);

      // 2. 提取轮廓、计算自适应加深描边颜色并绘制
      // ...
    } else {
      // 3. 抠图失败兜底：绘制底层原图 + 径向压暗 + 默认圆形深褐色虚线圈
      ctx.drawImage(imgOriginal, x, y, w, h);
      // ...
    }
```

## 验证计划

- 上传一张食物图片，观察抠图完成后的预览图是否为透明背景的食物贴纸（没有原图背景），且描边颜色自动变为该食物颜色的加深色。
- 测试 WASM 抠图失败时的兜底（圆形虚线）描边，确保原图可见且描边为温暖的深褐色 `#5C4B43`。
