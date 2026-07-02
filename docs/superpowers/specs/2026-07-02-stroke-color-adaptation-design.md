# 抠图描边自适应主体加深色设计

本设计旨在解决手账风食物记录应用中，食物抠图后的白色虚线描边在白色或浅色背景上不明显的问题。我们将描边颜色从固定的纯白色改为根据抠图出的食物主体色自动计算并加深后的颜色。

## 方案设计

### 1. 颜色计算与提取

修改 [RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 的 `renderCanvas` 函数。
在提取不规则轮廓的前置阶段，当 `imgCutout` 图像被绘制到临时离屏 Canvas 之后，我们提取其 `tempData`（ImageData 的 `data` 数组），过滤出透明度 `Alpha > 40` 的像素：
- 累加其 R, G, B 值，并计算平均值。
- 将平均 RGB 各乘以 `0.4` 进行线性等比例加深。
- 若无不透明像素，则兜底使用温暖的手账深褐色 `#5C4B43`。

### 2. 应用至不规则轮廓描边

将绘制不规则虚线的颜色从 `ctx.strokeStyle = '#FFFFFF'` 改为 `ctx.strokeStyle = strokeColor`。

### 3. 应用至抠图失败（圆形虚线）兜底描边

在 `else` 分支中，将绘制圆形虚线的颜色从 `ctx.strokeStyle = '#FFFFFF'` 改为 `ctx.strokeStyle = '#5C4B43'`。

## 验证计划

- 上传一张食物图片，观察抠图完成后的描边颜色是否自动变为该食物颜色的加深色（如炸鸡为深褐色，西兰花为深绿色等）。
- 测试 WASM 抠图失败时的兜底（圆形虚线）描边，确保其颜色为温暖的深褐色 `#5C4B43`。
