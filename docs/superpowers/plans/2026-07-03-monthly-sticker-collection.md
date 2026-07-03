# 本月收集贴纸墙实施方案 (Monthly Sticker Collection Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在月视图（MonthView）下方新增“本月收集”Sticker墙，集中以手账歪斜风格展示本月评分最高的前30张抠图透明贴纸，并支持点击刷新时的顺时针旋转和弹性交错弹出动效。

**Architecture:** 
1. 在 `index.css` 中引入 `@keyframes sticker-pop` 弹性弹出和 `@keyframes icon-spin` 图标旋转动画。
2. 在 `MonthView.tsx` 中增加对当月含有抠图的食物记录进行评分和时间降序排序的逻辑，截取前 30 条。
3. 通过 React State 维护贴纸的随机倾斜角度和偏移位移，点击刷新时重置这些随机参数并更新 `refreshKey` 触发 CSS 交错动画的重播。

**Tech Stack:** React, TypeScript, CSS, lucide-react

## Global Constraints

- 贴纸最多是30张，如果数量小于30话，就按照真实数量布局。
- 仅展示包含 `imageBlob` 的用餐记录，无抠图图片时不展示，不进行 Emoji 兜底。
- 点击刷新时，刷新图标产生 360° 旋转，下方所有贴纸重新计算随机偏转角和位置，并触发果冻弹性的交错入场动画。

---

### Task 1: 声明 CSS 动画关键帧与类名

**Files:**
- Modify: [index.css](file:///d:/A研二/food2.0纯记录/foodV2/src/index.css)

**Interfaces:**
- Produces: CSS class `.sticker-animate` and `.icon-spinning` for animation.

- [ ] **Step 1: 修改 index.css，在文件末尾追加动画相关定义**

```css
/* 贴纸弹性弹出动画 */
@keyframes sticker-pop {
  0% {
    transform: scale(0) rotate(var(--rot, 0deg)) translate(var(--ox, 0px), var(--oy, 0px));
    opacity: 0;
  }
  70% {
    transform: scale(1.15) rotate(var(--rot, 0deg)) translate(var(--ox, 0px), var(--oy, 0px));
  }
  100% {
    transform: scale(1) rotate(var(--rot, 0deg)) translate(var(--ox, 0px), var(--oy, 0px));
    opacity: 1;
  }
}

.sticker-animate {
  animation: sticker-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

/* 刷新图标旋转动画 */
@keyframes icon-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.icon-spinning {
  animation: icon-spin 0.5s ease-in-out;
}
```

- [ ] **Step 2: 验证样式构建通过**
- [ ] **Step 3: 提交代码**

```bash
git add src/index.css
git commit -m "style: add css animations for stickers pop and icon spin"
```

---

### Task 2: 在 MonthView.tsx 中开发并装载本月收集贴纸墙

**Files:**
- Modify: [MonthView.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/MonthView.tsx)

- [ ] **Step 1: 引入 RotateCw 刷新图标**

修改文件顶部的 `lucide-react` 导入行：
```typescript
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
```

- [ ] **Step 2: 声明相关的状态和随机参数计算**

在 `MonthView` 组件内部增加以下状态和副作用逻辑：
```typescript
  // 刷新状态与弹性动画触发 Key
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [randomParams, setRandomParams] = useState<{ rot: number; ox: number; oy: number }[]>([]);

  // 1. 过滤出本月有抠图贴纸的全部记录
  const currentMonthRecords = records.filter(r => {
    try {
      const recordDate = new Date(r.timestamp);
      return recordDate.getFullYear() === year && 
             recordDate.getMonth() === month && 
             !!r.imageBlob;
    } catch {
      return false;
    }
  });

  // 2. 排序并截取前30张评分最高且最新的贴纸
  const topStickers = [...currentMonthRecords]
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.timestamp - a.timestamp;
    })
    .slice(0, 30);

  // 3. 当贴纸列表或月份变化时，初始化贴纸的偏转量与旋转角
  useEffect(() => {
    const params = Array.from({ length: topStickers.length }, () => ({
      rot: Math.floor(Math.random() * 21) - 10,  // -10 到 +10 度
      ox: Math.floor(Math.random() * 11) - 5,    // -5 到 +5 像素偏移
      oy: Math.floor(Math.random() * 11) - 5     // -5 到 +5 像素偏移
    }));
    setRandomParams(params);
  }, [topStickers.length, currentMonth]);

  // 4. 处理点击刷新事件
  const handleRefresh = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // 重新生成随机参数以产生位置歪斜的变化
    const params = Array.from({ length: topStickers.length }, () => ({
      rot: Math.floor(Math.random() * 21) - 10,
      ox: Math.floor(Math.random() * 11) - 5,
      oy: Math.floor(Math.random() * 11) - 5
    }));
    setRandomParams(params);
    setRefreshKey(prev => prev + 1);

    setTimeout(() => {
      setIsSpinning(false);
    }, 500);
  };
```

- [ ] **Step 3: 编写贴纸墙卡片与列表的 JSX 渲染结构**

在 `MonthView` 的根元素 `div` 闭合前（即图例 `</div>` 之后，最后一个外层 `</div>` 之前）插入如下 JSX 节点：

```tsx
      {/* 本月 Sticker 墙 */}
      {topStickers.length > 0 && (
        <div style={{ 
          marginTop: '24px', 
          background: '#FAF9F5', 
          border: '1px solid var(--color-border)', 
          borderRadius: '16px', 
          padding: '20px 16px',
          boxShadow: '0 4px 12px rgba(62, 58, 54, 0.03)'
        }}>
          {/* 标题栏与刷新图标 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              color: 'var(--color-text)', 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              本月 Sticker 墙 <span style={{ color: '#E57373', fontSize: '0.9rem' }}>✦</span>
            </h2>
            <button 
              onClick={handleRefresh}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#8A857C', 
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="bouncy-hover"
              title="刷新贴纸排版"
            >
              <RotateCw size={18} className={isSpinning ? 'icon-spinning' : ''} />
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#8A857C', margin: '0 0 16px 0' }}>这个月记录的美味！</p>

          {/* 贴纸流式排版列表 */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: '14px 10px', 
            padding: '8px 4px',
            overflow: 'hidden'
          }}>
            {topStickers.map((record, index) => {
              const imgUrl = record.imageBlob ? URL.createObjectURL(record.imageBlob) : null;
              if (!imgUrl) return null;

              const params = randomParams[index] || { rot: 0, ox: 0, oy: 0 };

              return (
                <div
                  key={`sticker-${refreshKey}-${record.id}`}
                  className="sticker-animate"
                  style={{
                    width: '52px',
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    // 传递自定义 CSS 变量控制旋转和偏移
                    // @ts-ignore
                    '--rot': `${params.rot}deg`,
                    '--ox': `${params.ox}px`,
                    '--oy': `${params.oy}px`,
                    animationDelay: `${index * 25}ms`,
                    filter: 'drop-shadow(0 3px 6px rgba(62, 58, 54, 0.16))',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                  onClick={() => onSelectDate(new Date(record.timestamp))}
                  title={`${record.foodName} (评分: ${record.rating}★)`}
                >
                  <img 
                    src={imgUrl} 
                    alt={record.foodName} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain'
                    }} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
```

- [ ] **Step 4: 运行并验证 MonthView 构建成功**
- [ ] **Step 5: 提交代码**

```bash
git add src/components/MonthView.tsx
git commit -m "feat: implement monthly stickers wall section in MonthView"
```

---

## Verification Plan

### Manual Verification
1. **启动本地开发服务**：
   在工作区根目录下运行开发服务命令，进入应用并切到【月视图】页面。
2. **准备测试数据**：
   - 添加数条无抠图的普通记录，验证它们**不会**出现在贴纸墙上。
   - 添加少于 30 条含有抠图透明贴纸的用餐记录（比如 3 条、5 条），验证贴纸墙上仅显示这几张贴纸，且能自适应流式排版居中排列。
   - 添加多于 30 条带有抠图的记录，设置不同评分（5星、4星等），验证贴纸墙上最多显示 30 张，且 5 星贴纸优先展示。
3. **点击刷新动效验证**：
   - 点击右上角刷新按钮，验证 RotateCw 图标旋转 360°。
   - 验证贴纸以交错延迟入场的方式，做出气泡般弹性弹出的动效。
   - 验证每一次刷新后，每张贴纸倾斜的角度和位置均会发生随机轻微改变。
4. **点击贴纸跳转验证**：
   - 点击贴纸墙上的任意美食贴纸，验证能正确跳转到今天并定位到对应的美食记录节点。
