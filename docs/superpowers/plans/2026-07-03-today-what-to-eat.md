# 今天吃什么扭蛋机抽签推荐实施方案 (Today What to Eat Gashapon Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在“收藏”页面（FavoritesPage）的搜索框下方增加“今天吃什么”扭蛋机卡片，点击后弹出一个全屏拟真扭蛋机，以 1/4 到 4/4 进度推荐最近 30 天内吃过的高分美食，第 4 次不服气“换一个”将展开四选一终极汇总面板。

**Architecture:**
1. 在 `index.css` 中增加模态背景模糊淡入、扭蛋机晃动（gashapon-shake）、扭蛋坠落（egg-drop）等动画样式。
2. 修改 `App.tsx`，将 `setActiveTab` 传递给 `FavoritesPage`，以便支持点击“查看全部历史”跳转到“回忆录”页面。
3. 修改 `FavoritesPage.tsx`，引入 `RotateCw`、`Utensils`、`Sparkles`、`ArrowLeft` 等图标，实现扭蛋抽签的核心状态机（ready -> shaking -> revealed -> show-all）。
4. 在 IndexedDB 中获取最近 30 天的饮食数据，按规则过滤出评分 >= 3 且最近 5 天内未吃过的食物作为候选池。若抽中，计算“距离上次吃的天数”并渲染结果。

**Tech Stack:** React, TypeScript, CSS (Vite), lucide-react

## Global Constraints

- **候选池范围**：仅从最近 30 天的历史记录中筛选，排除近 5 天内吃过的食物，且评分必须 >= 3★。
- **排版一致性**：无抠图贴纸（无 `imageBlob`）时，不使用 Emoji 兜底，以 `Utensils` 线条图标替代。
- **按钮限制**：有 3 次“换一个”机会。第四次仍不采纳时，进入汇总卡片，并排展示 4 个历史推荐，点击任意贴纸即可选定并关闭。点击“就它了”直接关闭。

---

### Task 1: 在 index.css 中声明模态模糊与扭蛋机晃动、坠落的动画

**Files:**
- Modify: [index.css](file:///d:/A研二/food2.0纯记录/foodV2/src/index.css)

**Interfaces:**
- Produces: CSS class `.gashapon-overlay`, `.gashapon-active`, and `.egg-falling` for UI animation.

- [ ] **Step 1: 修改 index.css，在文件末尾追加动画相关定义**

```css
/* 全屏模态背景模糊淡入 */
.gashapon-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(62, 58, 54, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 0.25s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 扭蛋机晃动动画 */
@keyframes gashapon-shake {
  0%, 100% { transform: rotate(0deg); }
  20%, 60% { transform: rotate(-5deg) translate(-2px, 0); }
  40%, 80% { transform: rotate(5deg) translate(2px, 0); }
}

.gashapon-active {
  animation: gashapon-shake 0.8s ease-in-out;
}

/* 扭蛋坠落弹出动画 */
@keyframes egg-drop {
  0% { transform: translateY(-70px) scale(0.3); opacity: 0; }
  50% { transform: translateY(12px) scale(1.15); opacity: 1; }
  75% { transform: translateY(-6px) scale(0.95); }
  100% { transform: translateY(0) scale(1); }
}

.egg-falling {
  animation: egg-drop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

/* 星星微光旋转 */
@keyframes sparkle-rotate {
  0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; }
  50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
  100% { transform: rotate(360deg) scale(0.8); opacity: 0.5; }
}

.sparkle-animate {
  animation: sparkle-rotate 3s linear infinite;
}
```

- [ ] **Step 2: 验证样式构建通过**
- [ ] **Step 3: 提交代码**

```bash
git add src/index.css
git commit -m "style: add css animations for gashapon machine shake, egg drop and sparkles"
```

---

### Task 2: 修改 App.tsx 将 tab 切换回调传入 FavoritesPage

**Files:**
- Modify: [App.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/App.tsx)

- [ ] **Step 1: 修改 FavoritesPage 装载行，传入 setActiveTab 回调**

修改 `App.tsx` 中第 33 行的渲染：
```tsx
{activeTab === 'favorites' && (
  <FavoritesPage 
    onSelectDate={handleSelectDateFromCalendar} 
    setActiveTab={setActiveTab} 
  />
)}
```

- [ ] **Step 2: 验证构建没有 TypeScript 报错**
- [ ] **Step 3: 提交代码**

```bash
git add src/App.tsx
git commit -m "refactor: pass setActiveTab to FavoritesPage for tab navigation"
```

---

### Task 3: 在 FavoritesPage.tsx 中实现今天吃什么扭蛋机核心逻辑与 UI 界面

**Files:**
- Modify: [FavoritesPage.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/FavoritesPage.tsx)

- [ ] **Step 1: 引入必要的图标和 React Hooks**

在 `FavoritesPage.tsx` 顶部导入所需的 lucide-react 图标：
```typescript
import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { MapPin, Users, Heart, Clock, Search, Utensils, Sparkles, ArrowLeft, RotateCw } from 'lucide-react';
```

- [ ] **Step 2: 完善 FavoritesPageProps 接口定义并解构 props**

修改 `FavoritesPage` 定义：
```typescript
interface FavoritesPageProps {
  onSelectDate?: (date: Date) => void;
  setActiveTab?: (tab: 'today' | 'month' | 'report' | 'favorites') => void;
}

export default function FavoritesPage({ onSelectDate, setActiveTab }: FavoritesPageProps) {
```

- [ ] **Step 3: 添加扭蛋机状态变量与数据推荐算法**

在 `FavoritesPage` 函数开头，紧接在 `searchQuery` 的 state 后面添加以下状态和推荐候选池计算逻辑：
```typescript
  // 扭蛋机相关状态
  const [showGashapon, setShowGashapon] = useState(false);
  const [gashaponState, setGashaponState] = useState<'ready' | 'shaking' | 'revealed' | 'show-all'>('ready');
  const [candidates, setCandidates] = useState<FoodRecord[]>([]);
  const [drawnHistory, setDrawnHistory] = useState<FoodRecord[]>([]);
  const [currentSelection, setCurrentSelection] = useState<FoodRecord | null>(null);

  // 1. 获取近30天内符合推荐标准的食物作为候选池
  useEffect(() => {
    const fetchCandidates = async () => {
      const allRecords = await getAllRecords();
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

      // 过滤出最近 30 天且评分 >= 3 的记录
      const recentRecords = allRecords.filter(r => {
        return (now - r.timestamp) <= thirtyDaysMs && r.rating >= 3;
      });

      // 按食物名称分组，找出每种食物的最新用餐时间
      const foodGroups: { [name: string]: FoodRecord } = {};
      recentRecords.forEach(r => {
        const name = r.foodName.trim();
        if (!foodGroups[name] || r.timestamp > foodGroups[name].timestamp) {
          foodGroups[name] = r;
        }
      });

      // 过滤掉最近 5 天内吃过的食物（即最新时间戳距离现在 < 5天）
      const validCandidates = Object.values(foodGroups).filter(r => {
        return (now - r.timestamp) >= fiveDaysMs;
      });

      setCandidates(validCandidates);
    };

    if (showGashapon) {
      fetchCandidates();
    }
  }, [showGashapon]);

  // 2. 触发扭蛋抽取事件
  const triggerDraw = () => {
    if (candidates.length === 0) return;
    setGashaponState('shaking');

    // 过滤掉当前会话中已经抽出来的食物
    let available = candidates.filter(
      c => !drawnHistory.some(h => h.foodName === c.foodName)
    );
    // 兜底逻辑：若候选池抽空了则直接从完整候选池中抽取
    if (available.length === 0) {
      available = candidates;
    }

    // 随机抽选一个
    const randomIndex = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndex];

    // 播放 1.2 秒的扭动与震动动画，然后进入显示页面
    setTimeout(() => {
      setDrawnHistory(prev => [...prev, chosen]);
      setCurrentSelection(chosen);
      setGashaponState('revealed');
    }, 1200);
  };

  // 3. 处理“换一个”点击事件
  const handleNextDraw = () => {
    // 如果已经抽了 3 个（当前在 4/4 状态），再点击“换一个”将自动抽出第 4 个，并跳转到汇总页面
    if (drawnHistory.length === 3) {
      let available = candidates.filter(
        c => !drawnHistory.some(h => h.foodName === c.foodName)
      );
      if (available.length === 0) available = candidates;

      const randomIndex = Math.floor(Math.random() * available.length);
      const chosen = available[randomIndex];

      setDrawnHistory(prev => [...prev, chosen]);
      setGashaponState('show-all');
    } else {
      triggerDraw();
    }
  };

  // 4. 选择完成关闭弹窗
  const handleAccept = () => {
    setShowGashapon(false);
    // 重置抽签状态
    setDrawnHistory([]);
    setCurrentSelection(null);
    setGashaponState('ready');
  };

  // 5. 计算距离上次吃的天数
  const getDaysAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };
```

- [ ] **Step 4: 编写矢量扭蛋机组件 (GashaponMachineSVG)**

在 `FavoritesPage` 组件同级（文件内顶层）定义一个矢量扭蛋机的 SVG 组件：

```tsx
function GashaponMachineSVG({ active }: { active: boolean }) {
  return (
    <svg 
      width="140" 
      height="160" 
      viewBox="0 0 100 110" 
      fill="none" 
      className={active ? "gashapon-active" : ""}
      style={{ overflow: 'visible', transition: 'transform 0.3s ease' }}
    >
      {/* 玻璃球顶盖 */}
      <circle cx="50" cy="40" r="32" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="2.5" />
      <path d="M26 23 C36 15, 64 15, 74 23 Z" fill="#E57373" stroke="#3E3A36" strokeWidth="2.5" />
      <circle cx="50" cy="14" r="3" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="2" />
      
      {/* 玻璃球内的彩色扭蛋 */}
      <circle cx="34" cy="48" r="5" fill="#E57373" stroke="#3E3A36" strokeWidth="1" />
      <circle cx="45" cy="54" r="5" fill="#8B7D6C" stroke="#3E3A36" strokeWidth="1" />
      <circle cx="56" cy="50" r="5" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="1" />
      <circle cx="65" cy="43" r="5" fill="#E57373" stroke="#3E3A36" strokeWidth="1" />
      <circle cx="50" cy="38" r="5" fill="#8B7D6C" stroke="#3E3A36" strokeWidth="1" />
      <circle cx="38" cy="37" r="5" fill="#E57373" stroke="#3E3A36" strokeWidth="1" />
      <circle cx="58" cy="33" r="5" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="1" />
      <circle cx="47" cy="27" r="5" fill="#8B7D6C" stroke="#3E3A36" strokeWidth="1" />

      {/* 扭蛋机基座 */}
      <path d="M20 70 L80 70 L75 100 L25 100 Z" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="2.5" />
      <rect x="25" y="70" width="50" height="6" fill="#8B7D6C" stroke="#3E3A36" strokeWidth="2" />
      
      {/* 出蛋口与旋钮 */}
      <circle cx="50" cy="83" r="7" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="2" />
      <line x1="50" y1="79" x2="50" y2="87" stroke="#3E3A36" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="83" x2="54" y2="83" stroke="#3E3A36" strokeWidth="2" strokeLinecap="round" />
      <rect x="42" y="93" width="16" height="7" rx="2.5" fill="#3E3A36" />
    </svg>
  );
}
```

- [ ] **Step 5: 编写卡片入口与 Gashapon 模态弹窗的 JSX**

修改 `FavoritesPage` 的 `return` 结构。在 `My Favorites` 标题与搜索框模块下方（即 `<div style={{ position: 'relative', width: '100%' }}>` 的父层闭合之后，在 `filteredFavs.length === 0` 等主列表展示前），插入入口卡片与 Modal 的代码：

```tsx
      {/* 扭蛋机“今天吃什么”卡片入口 */}
      <div style={{
        background: 'linear-gradient(135deg, #F2EFE7 0%, #FAF9F5 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(62, 58, 54, 0.03)',
        marginTop: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ flex: 1, zIndex: 2 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            今天吃什么？ <Sparkles size={16} className="sparkle-animate" style={{ color: '#E57373' }} />
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8A857C', margin: '0 0 16px 0', maxWidth: '80%' }}>不知道吃什么？摇一摇试试运气吧～</p>
          <button 
            type="button"
            onClick={() => {
              setShowGashapon(true);
              setGashaponState('ready');
              setDrawnHistory([]);
            }}
            style={{ 
              background: 'var(--color-green)', 
              border: 'none', 
              borderRadius: '20px', 
              padding: '8px 24px', 
              color: '#FFF', 
              fontSize: '0.8rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(139, 125, 108, 0.2)'
            }} 
            className="bouncy-hover"
          >
            开始抽签
          </button>
        </div>
        <div style={{ zIndex: 1, marginRight: '-10px', transform: 'scale(0.85)' }}>
          <GashaponMachineSVG active={false} />
        </div>
      </div>

      {/* 扭蛋抽签全屏遮罩弹窗 */}
      {showGashapon && (
        <div className="gashapon-overlay">
          <div style={{
            width: '90%',
            maxWidth: '420px',
            background: '#FAF9F5',
            borderRadius: '24px',
            border: '1px solid var(--color-border)',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(62, 58, 54, 0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}>
            {/* 顶部控制栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
              <button 
                onClick={handleAccept}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A857C', display: 'flex', alignItems: 'center', padding: 0 }}
                className="bouncy-hover"
              >
                <ArrowLeft size={20} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#8A857C', background: '#F2EFE7', padding: '3px 10px', borderRadius: '12px' }}>
                {gashaponState === 'show-all' ? '本次推荐' : `${drawnHistory.length + (gashaponState === 'ready' || gashaponState === 'shaking' ? 0 : 0) + 1}/4`}
              </span>
            </div>

            {/* 1. 准备/晃动状态面 */}
            {(gashaponState === 'ready' || gashaponState === 'shaking') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
                <GashaponMachineSVG active={gashaponState === 'shaking'} />
                
                {/* 扭蛋掉落轨迹 */}
                {gashaponState === 'shaking' && (
                  <div className="egg-falling" style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: ['#E57373', '#8B7D6C', '#FFF'][Math.floor(Math.random() * 3)],
                    border: '2px solid #3E3A36',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    marginTop: '-24px',
                    zIndex: 20
                  }} />
                )}

                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-text)' }}>摇一摇</h3>
                  <p style={{ fontSize: '0.75rem', color: '#8A857C', margin: 0 }}>抽出今天的灵感美食吧✨</p>
                </div>

                {gashaponState === 'ready' && (
                  <button 
                    onClick={triggerDraw}
                    disabled={candidates.length === 0}
                    style={{
                      background: candidates.length === 0 ? '#E3DFD5' : 'var(--color-green)',
                      color: '#FFF', border: 'none', borderRadius: '20px',
                      padding: '10px 32px', fontSize: '0.85rem', fontWeight: 'bold',
                      cursor: candidates.length === 0 ? 'not-allowed' : 'pointer',
                      marginTop: '10px'
                    }}
                    className="bouncy-hover"
                  >
                    {candidates.length === 0 ? '无可抽取美味' : '摇动旋钮'}
                  </button>
                )}
                
                <span style={{ fontSize: '0.65rem', color: '#8A857C', marginTop: '10px' }}>
                  今日已推荐 {drawnHistory.length}/4 次
                </span>
              </div>
            )}

            {/* 2. 抽中结果单卡状态面 */}
            {gashaponState === 'revealed' && currentSelection && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '10px 0' }}>
                {/* 贴纸展示 */}
                <div style={{
                  width: '180px', height: '180px',
                  background: '#FFF', border: '2px solid #FFF',
                  borderRadius: '16px',
                  boxShadow: '0 6px 20px rgba(62, 58, 54, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', marginBottom: '24px'
                }}>
                  {/* 好久没吃标记 */}
                  {getDaysAgo(currentSelection.timestamp) >= 20 && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: '#FFF', border: '1px solid #FF9800',
                      color: '#FF9800', fontSize: '0.55rem', fontWeight: 'bold',
                      padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px',
                      boxShadow: '0 1px 3px rgba(255,152,0,0.1)'
                    }}>
                      🔥 好久没吃了
                    </span>
                  )}
                  {currentSelection.imageBlob ? (
                    <img 
                      src={URL.createObjectURL(currentSelection.imageBlob)} 
                      alt={currentSelection.foodName} 
                      style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.1))' }} 
                    />
                  ) : (
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: '#FAF9F5', border: '1.5px dashed var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A857C'
                    }}>
                      <Utensils size={28} />
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
                  {currentSelection.foodName}
                </h3>

                {/* 评分心心 */}
                <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Heart 
                      key={s} size={14} 
                      fill={s <= currentSelection.rating ? 'var(--color-pink)' : 'none'} 
                      color="var(--color-pink)" 
                    />
                  ))}
                  <span style={{ fontSize: '0.75rem', color: '#8A857C', marginLeft: '6px', fontWeight: 'bold' }}>
                    {currentSelection.rating.toFixed(1)}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#8A857C', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> 距离上次吃：{getDaysAgo(currentSelection.timestamp)} 天前
                </p>

                {/* 控制按钮 */}
                <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                  <button 
                    onClick={handleNextDraw}
                    style={{
                      flex: 1, background: '#FAF9F5', border: '1px solid var(--color-border)',
                      borderRadius: '20px', padding: '10px 0', fontSize: '0.85rem',
                      fontWeight: 'bold', color: 'var(--color-text)', cursor: 'pointer'
                    }}
                    className="bouncy-hover"
                  >
                    换一个
                  </button>
                  <button 
                    onClick={handleAccept}
                    style={{
                      flex: 1, background: 'var(--color-green)', border: 'none',
                      borderRadius: '20px', padding: '10px 0', fontSize: '0.85rem',
                      fontWeight: 'bold', color: '#FFF', cursor: 'pointer'
                    }}
                    className="bouncy-hover"
                  >
                    就它了
                  </button>
                </div>
              </div>
            )}

            {/* 3. 终极四选一汇总状态面 */}
            {gashaponState === 'show-all' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#E57373', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    ✨ 本次推荐 ✨
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#8A857C', margin: 0 }}>本次推荐已用完啦~ 挑一个你最想吃的吧！</p>
                </div>

                {/* 四个卡片网格排布 */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                  width: '100%', marginBottom: '24px', boxSizing: 'border-box'
                }}>
                  {drawnHistory.map((record) => {
                    const isOld = getDaysAgo(record.timestamp) >= 20;
                    return (
                      <div 
                        key={record.id}
                        onClick={() => {
                          // 点击任意一张完成选择并关闭
                          handleAccept();
                        }}
                        style={{
                          background: '#FAF9F5', border: '1px solid var(--color-border)',
                          borderRadius: '12px', padding: '10px', display: 'flex',
                          flexDirection: 'column', alignItems: 'center', gap: '6px',
                          cursor: 'pointer', position: 'relative', boxShadow: '0 2px 8px rgba(62,58,54,0.02)'
                        }}
                        className="bouncy-hover"
                      >
                        {isOld && (
                          <span style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: '#FFF', border: '1px solid #FF9800',
                            color: '#FF9800', fontSize: '0.45rem', fontWeight: 'bold',
                            padding: '1px 3px', borderRadius: '3px'
                          }}>
                            💡 好久没吃
                          </span>
                        )}
                        <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {record.imageBlob ? (
                            <img 
                              src={URL.createObjectURL(record.imageBlob)} 
                              alt={record.foodName} 
                              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }} 
                            />
                          ) : (
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: '#FAF9F5', border: '1px dashed var(--color-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A857C'
                            }}>
                              <Utensils size={18} />
                            </div>
                          )}
                        </div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: '4px 0 2px 0', color: 'var(--color-text)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                          {record.foodName}
                        </h4>
                        <div style={{ display: 'flex', gap: '1px', transform: 'scale(0.85)' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Heart 
                              key={s} size={8} 
                              fill={s <= record.rating ? 'var(--color-pink)' : 'none'} 
                              color="var(--color-pink)" 
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.6rem', color: '#8A857C' }}>
                          {getDaysAgo(record.timestamp)}天前吃过
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 底部跳转全部历史选项 */}
                {setActiveTab && (
                  <button 
                    onClick={() => {
                      handleAccept(); // 关闭弹窗
                      setActiveTab('report'); // 跳转回忆录
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#8A857C',
                      fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px'
                    }}
                    className="bouncy-hover"
                  >
                    查看全部历史记录
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 6: 验证在不同的数据范围（有记录/无记录）下 FavoritesPage 能正常编译和渲染**
- [ ] **Step 7: 提交代码**

```bash
git add src/components/FavoritesPage.tsx
git commit -m "feat: complete FavoritesPage today-what-to-eat gashapon logic and UI"
```

---

## Verification Plan

### Manual Verification
1. **测试卡片入口展示**：
   - 切换到【收藏】页面，验证在搜索框正下方成功渲染出“今天吃什么”卡片，且卡片右侧包含手绘线条风格的扭蛋机 SVG 图标。
2. **测试数据候选池过滤**：
   - 如果最近 30 天没有任何评分 >= 3★ 且吃过的时间 >= 5 天前的记录，点击“开始抽签”后，验证弹窗中按钮显示为“无可抽取美味”且无法点击。
   - 录入符合条件的测试数据，验证候选美味能正确加载到候选池。
3. **测试扭蛋抽签动效与 4 个进度状态**：
   - 点击“摇动旋钮”，验证扭蛋机图片产生 1.2 秒的摇晃动画，且彩色小球平滑从出蛋口滚落。
   - 弹出美食 D1 推荐单卡，左上角标头显示为 `2/4`（因为准备阶段是 1/4）。
   - 点击“换一个”，验证再次产生摇晃和掉蛋，展现 D2 推荐单卡，左上角显示 `3/4`。
   - 再次点击“换一个”，展示 D3 推荐单卡，左上角显示 `4/4`。
   - 再次点击“换一个”，验证扭蛋机立刻转换为“本次推荐”终极汇总页。
4. **测试“本次推荐”终极汇总**：
   - 页面应该展示全部 4 个先前抽取出来的食物卡片。
   - 验证没有 imageBlob 的卡片使用 Utensils 刀叉矢量图标兜底，没有使用 Emoji。
   - 点击这 4 个卡片中的任意一个，验证弹窗立即关闭，且没有多余的气泡提示。
   - 点击汇总底部的“查看全部历史记录”链接，验证弹窗关闭并成功自动切到底部栏的【回忆录】选项卡。
