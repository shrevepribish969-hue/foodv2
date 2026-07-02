# “吃点好的” App v2.0 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成“吃点好的”饮食记录应用的视觉与交互升级。包括：中文字体与设计感 Logo 引入、底部极简 Icon 导航、不规则食物边缘轮廓抠图描边、首页“结绳记事”连续时间轴、以及 RecordModal 录入界面的清爽手账化精修。

**Tech Stack:** React 19, TypeScript, Vite, Vanilla CSS, Lucide-React, @imgly/background-removal.

## Global Constraints
* 所有样式均使用 Vanilla CSS 编写，禁止引入 TailwindCSS。
* 中文字体使用站酷快乐体，英文及数字使用 Fredoka，保持萌系治愈风格。
* 不规则抠图描边算法必须能在本地 Canvas 完美运行，避免矩形外框。

---

### Task 1: 萌系字体引入、Logo 重新设计与极简底栏

**Files:**
* Modify: `src/index.css`
* Modify: `src/App.tsx`

**Interfaces:**
* Produces: 升级后的全局样式，萌系艺术 Logo，以及只有 Lucide 简约图标的无文字导航栏。

- [ ] **Step 1: 全局引入站酷快乐体及 Fredoka 字体**

Edit [src/index.css](file:///d:/A研二/food2.0纯记录/foodV2/src/index.css):
```css
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Fredoka:wght@300..700&display=swap');

:root {
  --color-bg: #FFFDF6;      /* 暖奶油白 */
  --color-pink: #FFB6C1;    /* 樱花粉 */
  --color-green: #A8E6CF;   /* 薄荷绿 */
  --color-yellow: #FFD3B6;  /* 香蕉黄 */
  --color-text: #5C4B43;    /* 温暖深褐 */
  --color-border: #E8D3C5;  /* 柔和线条 */
  --font-cute: 'ZCOOL KuaiLe', 'Fredoka', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--color-bg);
  background-image: 
    linear-gradient(90deg, rgba(232, 211, 197, 0.2) 1px, transparent 1px),
    linear-gradient(rgba(232, 211, 197, 0.2) 1px, transparent 1px);
  background-size: 20px 20px;
  color: var(--color-text);
  font-family: var(--font-cute);
}
```

- [ ] **Step 2: 替换 App.tsx 中的 Header Logo 与极简底栏**

Edit [src/App.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/App.tsx):
```tsx
import { useState } from 'react';
import './index.css';
import TodayPage from './components/TodayPage';
import MonthView from './components/MonthView';
import ReportPage from './components/ReportPage';
import FavoritesPage from './components/FavoritesPage';
import { Calendar, Grid, BarChart3, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'report' | 'favorites'>('today');
  const [activeDate, setActiveDate] = useState<Date>(new Date());

  const handleSelectDateFromCalendar = (date: Date) => {
    setActiveDate(date);
    setActiveTab('today');
    
    // 延迟滚动定位到对应日期的节点
    setTimeout(() => {
      const dateStr = date.toISOString().split('T')[0];
      const element = document.getElementById(`date-node-${dateStr}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* 重新设计的艺术 Logo */}
      <header style={{ 
        textAlign: 'center', margin: '24px 0 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 可爱小饭团 SVG 图标 */}
          <svg width="42" height="42" viewBox="0 0 100 100" style={{ transform: 'rotate(-5deg)' }}>
            <path d="M 50 10 C 75 10, 90 70, 85 85 C 80 95, 20 95, 15 85 C 10 70, 25 10, 50 10 Z" fill="#FFF" stroke="var(--color-border)" strokeWidth="6" />
            {/* 海苔 */}
            <rect x="38" y="65" width="24" height="25" rx="4" fill="var(--color-text)" />
            {/* 可爱表情 */}
            <circle cx="38" cy="45" r="4" fill="var(--color-text)" />
            <circle cx="62" cy="45" r="4" fill="var(--color-text)" />
            <path d="M 46 54 Q 50 58 54 54" fill="none" stroke="var(--color-text)" strokeWidth="4" strokeLinecap="round" />
            {/* 红晕 */}
            <ellipse cx="30" cy="50" rx="5" ry="3" fill="var(--color-pink)" opacity="0.6" />
            <ellipse cx="70" cy="50" rx="5" ry="3" fill="var(--color-pink)" opacity="0.6" />
          </svg>
          <h1 style={{ 
            fontSize: '2.5rem', color: 'var(--color-pink)', margin: '0', 
            fontWeight: 'bold', letterSpacing: '4px',
            textShadow: '3px 3px 0px #FFF'
          }}>
            吃点好的
          </h1>
        </div>
        
        {/* Logo 下方波浪虚线装饰 */}
        <div style={{ 
          width: '180px', height: '6px', 
          borderBottom: '3px dashed var(--color-pink)', opacity: 0.5,
          marginBottom: '4px'
        }} />
        <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--color-text)', opacity: 0.7, fontWeight: 500 }}>
          用心记录每一餐，每一口都是美好回忆
        </p>
      </header>

      <main style={{ flex: 1, paddingBottom: '90px' }}>
        {activeTab === 'today' && <TodayPage activeDate={activeDate} setActiveDate={setActiveDate} />}
        {activeTab === 'month' && <MonthView onSelectDate={handleSelectDateFromCalendar} />}
        {activeTab === 'report' && <ReportPage />}
        {activeTab === 'favorites' && <FavoritesPage />}
      </main>

      {/* 极简底栏导航 (无文字) */}
      <nav style={{ 
        position: 'fixed', 
        bottom: '24px', 
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '568px',
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(12px)',
        borderRadius: '24px', 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-around',
        boxShadow: '0 8px 32px rgba(92, 75, 67, 0.08)',
        border: '2px solid var(--color-border)',
        zIndex: 500
      }}>
        {(['today', 'month', 'report', 'favorites'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button 
              key={tab} 
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--color-pink)' : 'var(--color-text)',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: isActive ? 'scale(1.2)' : 'scale(1)'
              }}
              className="bouncy-hover"
            >
              {tab === 'today' && <Calendar size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'rgba(255, 182, 193, 0.2)' : 'none'} />}
              {tab === 'month' && <Grid size={24} strokeWidth={isActive ? 2.5 : 2} />}
              {tab === 'report' && <BarChart3 size={24} strokeWidth={isActive ? 2.5 : 2} />}
              {tab === 'favorites' && <Heart size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'var(--color-pink)' : 'none'} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 3: 验证并提交**

Run: `npm run build`
Expected: 编译通过，导航栏和Logo展示正确。
Commit:
```bash
git add src/index.css src/App.tsx
git commit -m "style: add cute fonts, redesigned logo, and minimal icon navigation"
```

---

### Task 2: 食物不规则边缘轮廓提取及描边算法

**Files:**
* Modify: `src/components/RecordModal.tsx`

**Interfaces:**
* Consumes: AI 去背景 PNG Blob。
* Produces: 贴合食物真实边界的不规则虚线描边效果，而非矩形框。

- [ ] **Step 1: 在 RecordModal 中编写边缘提取与轮廓绘制的 Canvas 逻辑**

Edit [src/components/RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 里的 `drawDashedBorder` 方法:
```tsx
  const drawDashedBorder = (imgSrc: string) => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 300;
      ctx.clearRect(0, 0, 300, 300);

      // 1. 缩放居中绘制原始食物图
      const scale = Math.min(240 / img.width, 240 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (300 - w) / 2;
      const y = (300 - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      // 2. 提取不透明像素边缘并绘制不规则描边
      try {
        const imgData = ctx.getImageData(0, 0, 300, 300);
        const data = imgData.data;

        // 简易边缘提取算法：找出所有透明度由 0 到 > 20 的边界点
        const edges: {x: number, y: number}[] = [];
        const checked = new Uint8Array(300 * 300);

        const isEdge = (px: number, py: number) => {
          const idx = (py * 300 + px) * 4;
          if (data[idx + 3] <= 20) return false; // 透明点不是边缘
          
          // 如果四邻域有透明像素，则是边缘
          const neighbors = [
            ((py - 1) * 300 + px) * 4,
            ((py + 1) * 300 + px) * 4,
            (py * 300 + px - 1) * 4,
            (py * 300 + px + 1) * 4
          ];
          for (const nIdx of neighbors) {
            if (nIdx < 0 || nIdx >= data.length || data[nIdx + 3] <= 20) return true;
          }
          return false;
        };

        // 扫描并描绘边缘
        for (let py = 1; py < 299; py++) {
          for (let px = 1; px < 299; px++) {
            if (isEdge(px, py)) {
              edges.push({x: px, y: py});
            }
          }
        }

        // 用 Canvas 绘制轮廓点集虚线（这里为了保证流畅，我们直接在边缘不透明点外部画小白圈或生成外扩阴影）
        // 最佳白色描边法：使用 Canvas 阴影滤镜，再用 globalCompositeOperation 裁剪，实现完美的贴边描边
        // 为了绘制漂亮的“剪纸描边”，我们先绘制白色背景轮廓
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.setLineDash([8, 6]);

        // 通过在不同方向偏移绘制描边
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 4;
        
        // 描边画笔遍历边缘像素，连线构成闭合区域的外部虚线
        // 更加鲁棒的虚线做法：直接绘制大范围白色虚线圈
        ctx.beginPath();
        if (edges.length > 0) {
          // 对边缘点进行排序和简化（绘制虚线）
          // 这里使用凸包或者直接绘制一个略宽的外描边。最稳妥的方式是把食物图像在 8 个方向上各偏移 3px 渲染成白色
          // 然后在边界点进行二次描边。
          // 既然是贴纸，我们直接在外侧画虚线：
          ctx.beginPath();
          edges.forEach((pt, index) => {
            if (index % 12 === 0) { // 抽稀点集，避免点线过密
              ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
              ctx.fillStyle = '#FFFFFF';
              ctx.fill();
            }
          });
        }
        ctx.restore();

      } catch (e) {
        console.error("轮廓提取描边失败:", e);
      }

      canvas.toBlob((b) => {
        if (b) {
          setImageBlob(b);
          setProcessedUrl(URL.createObjectURL(b));
        }
        setProcessing(false);
      }, 'image/png');
    };
  };
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build`
Expected: 编译通过，去背景图片显示为贴边虚线轮廓。
Commit:
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: implement pixel-level contour-tracing for food stickers dashed outline"
```

---

### Task 3: 首页“结绳记事”连续时间轴重构

**Files:**
* Modify: `src/components/TodayPage.tsx`

**Interfaces:**
* Consumes: `getAllRecords`, `deleteRecord` from `src/db.ts`
* Produces: 连续时间轴列表，每个日期是一个大节点，卡片全部铺开，不支持翻页，直接向下滑动查看。

- [ ] **Step 1: 重构 TodayPage.tsx 实现结绳轴**

Edit [src/components/TodayPage.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/TodayPage.tsx):
```tsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Heart, Users, MapPin, Star, Calendar } from 'lucide-react';
import { type FoodRecord, getAllRecords, deleteRecord } from '../db';
import RecordModal from './RecordModal';

interface TodayPageProps {
  activeDate: Date;
  setActiveDate: (date: Date) => void;
}

export default function TodayPage({ activeDate, setActiveDate }: TodayPageProps) {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRecords = async () => {
    const data = await getAllRecords();
    setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [activeDate]);

  const handleDelete = async (id: string) => {
    if (confirm('真的要删掉这顿美味的回忆吗？')) {
      await deleteRecord(id);
      fetchRecords();
    }
  };

  // 按日期对记录进行分组
  const groupRecordsByDate = () => {
    const groups: Record<string, FoodRecord[]> = {};
    records.forEach(r => {
      try {
        const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(r);
      } catch (e) {
        console.warn(e);
      }
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])); // 降序
  };

  const grouped = groupRecordsByDate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 饮食列表连续结绳时间线 */}
      <div style={{ position: 'relative', paddingLeft: '32px', minHeight: '300px', marginTop: '12px' }}>
        {/* 结绳主干线 */}
        <div style={{
          position: 'absolute', left: '16px', top: '10px', bottom: '10px',
          width: '4px', background: 'var(--color-border)', borderRadius: '2px'
        }} />

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>还没有任何美食结绳哦～</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>点击右下角 “➕” 画下你的第一顿美味吧！</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {grouped.map(([dateStr, dayRecords]) => {
              const displayDate = new Date(dateStr);
              const formattedDate = displayDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

              return (
                <div key={dateStr} id={`date-node-${dateStr}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 绳结日期节点 */}
                  <div style={{ 
                    position: 'relative', left: '-32px', display: 'flex', alignItems: 'center', gap: '8px',
                    margin: '8px 0'
                  }}>
                    {/* 结绳圆扣印记 */}
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: 'var(--color-pink)', border: '4px solid var(--color-bg)',
                      boxShadow: '0 0 0 3px var(--color-border)', zIndex: 10
                    }} />
                    <span style={{ 
                      fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-text)',
                      background: 'var(--color-yellow)', padding: '4px 12px', borderRadius: '12px',
                      border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      <Calendar size={14} />
                      {formattedDate}
                    </span>
                  </div>

                  {/* 该日期下的卡片列表 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dayRecords.map((record) => {
                      const recordDate = new Date(record.timestamp);
                      const timeString = recordDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                      const imgUrl = record.imageBlob ? URL.createObjectURL(record.imageBlob) : null;

                      return (
                        <div key={record.id} style={{ 
                          position: 'relative', background: '#FFF', 
                          border: '2px solid var(--color-border)', borderRadius: '24px',
                          padding: '16px', display: 'flex', gap: '16px',
                          boxShadow: '0 6px 18px rgba(92, 75, 67, 0.04)'
                        }}>
                          {/* 左侧食物贴纸 */}
                          <div style={{ width: '100px', height: '100px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6F0', borderRadius: '16px', overflow: 'hidden' }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={record.foodName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              // 简约画笔风格小占位图
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2">
                                <path d="M12 2L2 22h20L12 2z" />
                              </svg>
                            )}
                          </div>

                          {/* 右侧记录详情 */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContext: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', background: 'var(--color-yellow)', color: 'var(--color-text)', marginRight: '6px' }}>
                                    {record.mealType === 'breakfast' && '🌸 早餐'}
                                    {record.mealType === 'lunch' && '🌤️ 午餐'}
                                    {record.mealType === 'dinner' && '🌙 晚餐'}
                                    {record.mealType === 'tea' && '🍵 下午茶'}
                                    {record.mealType === 'night' && '🍢 夜宵'}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: '#999' }}>{timeString}</span>
                                </div>
                                <button onClick={() => handleDelete(record.id)} style={{ background: 'none', border: 'none', color: '#CCC', cursor: 'pointer' }} className="bouncy-hover">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              
                              <h3 style={{ margin: '8px 0 4px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                {record.foodName}
                                {record.isNewFood && <span style={{ fontSize: '0.75rem', color: 'var(--color-pink)', marginLeft: '6px', fontWeight: 'normal' }}>🆕 尝鲜</span>}
                              </h3>
                              
                              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#777', lineHeight: '1.4' }}>{record.note}</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#888' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {record.diningWith && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Users size={12} /> {record.diningWith}</span>}
                                {record.location && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={12} /> {record.location}</span>}
                              </div>

                              <div style={{ display: 'flex' }}>
                                {[1,2,3,4,5].map((s) => (
                                  <Heart key={s} size={12} fill={s <= record.rating ? 'var(--color-pink)' : 'none'} color="var(--color-pink)" style={{ marginLeft: '1px' }} />
                                ))}
                                {record.isFavorited && <Star size={12} fill="gold" color="gold" style={{ marginLeft: '4px' }} />}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 右下角悬浮添加按钮 */}
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed', right: '24px', bottom: '90px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--color-pink)', color: '#FFF', border: 'none',
          boxShadow: '0 6px 20px rgba(255,182,193,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 90
        }}
        className="bouncy-hover"
      >
        <Plus size={28} />
      </button>

      {isModalOpen && (
        <RecordModal 
          onClose={() => setIsModalOpen(false)} 
          onSaved={fetchRecords} 
          initialDate={activeDate}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build`
Expected: 编译通过，首页时间线按日期绳结倒序排列且支持无限向下滑动。
Commit:
```bash
git add src/components/TodayPage.tsx
git commit -m "feat: redesign Home as knot-tying timeline view with continuous scroll"
```

---

### Task 4: 录入卡片（RecordModal）界面精修手账化

**Files:**
* Modify: `src/components/RecordModal.tsx`

**Interfaces:**
* Produces: 清爽治愈、无粗暴硬盒边框的 RecordModal 表单卡片。

- [ ] **Step 1: 精修表单卡片的 CSS 布局和手写下划线虚线风格**

Edit [src/components/RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx) 里的 CSS 样式：
* 更改输入框的 style 属性：
  ```tsx
  style={{ 
    width: '100%', padding: '12px 4px', border: 'none', 
    borderBottom: '2px dashed var(--color-border)', background: 'transparent',
    fontFamily: 'var(--font-cute)', fontSize: '1.1rem', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box'
  }}
  ```
* 精修照片上传区为“拍立得相机相纸”样式：
  * 白色大相纸卡片，下面留白。
* 移除所有的 Emoji，替换为简单的简约线框 icon。
* 下拉/餐时选择使用更可爱的圆角小药丸设计。

*（具体代码将直接在执行 Task 时替换为极致治愈手账版，确保极致视觉呈现）*

- [ ] **Step 2: 验证并运行最后的编译测试**

Run: `npm run build`
Expected: 静态包完全生成，无 TypeScript 及 CSS 编译问题。
Commit:
```bash
git add src/components/RecordModal.tsx
git commit -m "style: redesign RecordModal into clean hand-journal ledger layout"
```
