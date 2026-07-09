# 移除拍照元数据展示 (Remove Photo Metadata Display) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除记录食物弹窗中显示运行环境和图片规格的逻辑，并清理后台冗余图像加载及系统环境检测代码，提升性能并精简页面。

**Architecture:** 从 `RecordModal.tsx` 中移除 `imgInfo` 和 `diagInfo` 的状态声明、计算逻辑，清理相关的组件渲染节点。

**Tech Stack:** React, TypeScript, Vite

## Global Constraints

- 移除 `diagInfo` 和 `imgInfo` 两个 state 变量，不要在未清理 state 之前直接删除 UI 节点，防止产生“未使用变量”的编译报错。
- 保留 `errorMsg` 渲染和 88MB 模型缓存拉取的说明提示。
- 保证最终项目能顺利进行 `npm run build`。

---

### Task 1: 清理状态变量与逻辑代码 (Cleanup state & computational logic)

**Files:**
- Modify: [RecordModal.tsx](file:///d:/A%E7%A0%94%E4%BA%8C/food2.0%E7%BA%AF%E8%AE%B0%E5%BD%95/foodV2/src/components/RecordModal.tsx)

**Interfaces:**
- Consumes: `RecordModal.tsx`
- Produces: 干净的 `RecordModal` 状态和组件逻辑。

- [ ] **Step 1: 删除状态声明**

  移除 `RecordModal.tsx` 中的 `imgInfo` 和 `diagInfo` 状态。
  
  ```diff
  -  const [imgInfo, setImgInfo] = useState('');
  -  const [diagInfo, setDiagInfo] = useState('');
  ```

- [ ] **Step 2: 删除系统环境测定逻辑**

  在 `handleImageUpload` 内部，移除跨域隔离和共享内存测定代码。
  
  ```diff
  -    // 测定系统环境与隔离状态
  -    const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
  -    const hasSAB = typeof SharedArrayBuffer !== 'undefined';
  -    setDiagInfo(`跨域隔离: ${isIsolated ? '是' : '否'} | 共享内存: ${hasSAB ? '可用' : '不可用'}`);
  ```

- [ ] **Step 3: 删除压缩后图片尺寸检测逻辑**

  在 `handleImageUpload` 内部，删除 `tempImg` 尺寸计算和 `setImgInfo` 调用。
  
  ```diff
  -    // 测定压缩后图片尺寸展示
  -    const tempImg = new Image();
  -    tempImg.src = URL.createObjectURL(compressedFile);
  -    tempImg.onload = () => {
  -      setImgInfo(`${tempImg.width} × ${tempImg.height} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB) [已压]`);
  -    };
  ```

- [ ] **Step 4: 编译检查**

  在命令行运行：`npm run build`
  确认没有因上述 state 或变量未定义而产生的编译错误。

- [ ] **Step 5: 提交更改**

  ```bash
  git add src/components/RecordModal.tsx
  git commit -m "refactor: remove diagInfo and imgInfo states and computation logic"
  ```

---

### Task 2: 清理 UI 渲染节点 (Cleanup UI rendering)

**Files:**
- Modify: [RecordModal.tsx](file:///d:/A%E7%A0%94%E4%BA%8C/food2.0%E7%BA%AF%E8%AE%B0%E5%BD%95/foodV2/src/components/RecordModal.tsx)

**Interfaces:**
- Consumes: 清理了逻辑后的 `RecordModal.tsx`。
- Produces: 移除了相关界面的组件 UI。

- [ ] **Step 1: 移除渲染行**

  在渲染诊断仪表盘的 JSX 块中，移除环境和规格显示的两个 `div`。
  
  ```diff
                    <div style={{
                      background: '#F4EFE6', borderRadius: '8px', padding: '6px 10px', 
                      fontSize: '0.62rem', color: '#6E6A63', textAlign: 'left',
                      width: '100%', maxWidth: '220px', display: 'flex', flexDirection: 'column', gap: '3px'
                    }}>
  -                    <div>⚡ 运行环境: {diagInfo}</div>
  -                    <div>🖼️ 图片规格: {imgInfo || '检测中...'}</div>
                      {errorMsg && <div style={{ color: '#FF5722', fontWeight: 'bold', marginTop: '2px', borderTop: '1px dashed #FFCDD2', paddingTop: '2px' }}>❌ 错误: {errorMsg}</div>}
  ```

- [ ] **Step 2: 编译检查**

  运行编译命令：`npm run build`
  确认没有任何 lint 错误或编译阻碍。

- [ ] **Step 3: 提交更改**

  ```bash
  git add src/components/RecordModal.tsx
  git commit -m "style: remove environment and image resolution rows from RecordModal UI"
  ```

---

### Task 3: 部署与提交到 GitHub (Deploy & Push to GitHub)

**Files:**
- Modify: N/A

**Interfaces:**
- Consumes: 本地已提交的修改。
- Produces: 远程 GitHub 仓库已更新的分支。

- [ ] **Step 1: 推送提交到 GitHub**

  运行以下命令将当前所有本地提交推送至 remote 的 `main` 分支。
  
  ```bash
  git push origin main
  ```
