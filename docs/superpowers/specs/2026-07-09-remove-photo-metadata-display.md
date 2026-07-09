# 设计文档：移除拍照元数据展示 (Remove Photo Metadata Display)

本设计文档旨在彻底删除拍照上传过程中展示的“运行环境”和“图片规格”元数据。

## 用户审核要求
- **数据残留与清理**：移除 `diagInfo` 和 `imgInfo` state 变量及其对应的 DOM 节点。
- **性能优化**：由于不再需要显示“图片规格”（尺寸与大小），原先在图片压缩后使用 `new Image()` 加载图片计算宽高的逻辑也将彻底移除，避免了额外的内存消耗和计算开销。
- **错误和提示保留**：保留诊断面板底部的 `errorMsg`（错误消息）和 AI 首次加载 88MB 模型缓存的提示说明。

## 方案详情

### 组件：RecordModal

#### [MODIFY] [RecordModal.tsx](file:///d:/A%E7%A0%94%E4%BA%8C/food2.0%E7%BA%AF%E8%AE%B0%E5%BD%95/foodV2/src/components/RecordModal.tsx)

1. **状态变量清理**：
   删除以下 state：
   - `imgInfo`
   - `diagInfo`

2. **核心逻辑清理**：
   - 在 `handleImageUpload` 方法中，删除系统环境与隔离状态的测定代码：
     ```typescript
     // 测定系统环境与隔离状态
     const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
     const hasSAB = typeof SharedArrayBuffer !== 'undefined';
     setDiagInfo(`跨域隔离: ${isIsolated ? '是' : '否'} | 共享内存: ${hasSAB ? '可用' : '不可用'}`);
     ```
   - 删除图片压缩后的尺寸测定逻辑：
     ```typescript
     // 测定压缩后图片尺寸展示
     const tempImg = new Image();
     tempImg.src = URL.createObjectURL(compressedFile);
     tempImg.onload = () => {
       setImgInfo(`${tempImg.width} × ${tempImg.height} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB) [已压]`);
     };
     ```

3. **UI 渲染清理**：
   - 移除包含 `diagInfo` 和 `imgInfo` 变量渲染的 DOM 元素：
     ```tsx
     <div>⚡ 运行环境: {diagInfo}</div>
     <div>🖼️ 图片规格: {imgInfo || '检测中...'}</div>
     ```
   - 调整诊断仪表盘的外观样式，在没有运行环境和规格信息时依然能够优雅展示错误或拉取缓存提示。

## 验证计划

### 手动验证
1. 打开“记录食物”弹窗。
2. 拍照或选择一张图片上传。
3. 检查诊断仪表盘中：
   - 是否已经看不到“⚡ 运行环境”和“🖼️ 图片规格”两行。
   - 首次运行的 AI 模型加载提示依然正常展示。
4. 确保上传、压缩和 AI 背景移除功能正常工作，无控制台报错或 lint 警告。
