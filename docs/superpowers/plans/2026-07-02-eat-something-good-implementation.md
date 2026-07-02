# “吃点好的” 智能饮食手账 App 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款可爱的、治愈系的离线饮食记录 Web 应用。通过前端 AI 自动去背景生成手账食物贴纸，支持每天一页的日记本式时间轴、日历月视图、以及包含 AI 总结的心情统计月报。

**Architecture:** 纯前端 React 单页面应用，采用 Vite 构建。图片及数据存储于本地的 IndexedDB 数据库内，不依赖后端服务；AI 总结通过前端直接调用 Gemini API 实现（用户本地输入并保存 Key）。

**Tech Stack:** React 19, TypeScript, Vite, Vanilla CSS, Lucide-React (图标), @imgly/background-removal (本地 AI 抠图).

## Global Constraints
* 界面语言必须为中文，风格必须保持可爱、温暖、治愈。
* 所有数据与高清抠图图片均存储在本地浏览器 IndexedDB 中，绝对不能因为图片过大导致 localStorage 溢出。
* CSS 必须采用 Vanilla CSS，避免使用 TailwindCSS。以大圆角、马卡龙粉彩色系、手写风字体、网格纸质感为主。
* 去背景模型加载较慢时，必须有优雅的圆形/心形形状裁剪贴纸作为 fallback 兜底。

---

### Task 1: 项目脚手架搭建与全局样式系统

**Files:**
* Create: `src/index.css`
* Create: `src/main.tsx`
* Create: `src/App.tsx`
* Create: `index.html`

**Interfaces:**
* Produces: 治愈系风格的静态脚手架页面，包含全局 CSS 变量与马卡龙色系主题。

- [ ] **Step 1: 初始化 Vite + React + TS 项目**

Run: `npx -y create-vite@latest ./ --template react-ts --overwrite`
Expected: 完成项目初始化，生成项目结构。

- [ ] **Step 2: 安装必要的依赖**

Run: `npm install lucide-react @imgly/background-removal`
Expected: 依赖安装成功，并在 package.json 中列出。

- [ ] **Step 3: 编写全局治愈系 CSS 样式**

Edit [src/index.css](file:///d:/A研二/food2.0纯记录/foodV2/src/index.css):
```css
:root {
  --color-bg: #FFFDF6;      /* 暖奶油白 */
  --color-pink: #FFB6C1;    /* 樱花粉 */
  --color-green: #A8E6CF;   /* 薄荷绿 */
  --color-yellow: #FFD3B6;  /* 香蕉黄 */
  --color-text: #5C4B43;    /* 温暖深褐（替代纯黑） */
  --color-border: #E8D3C5;  /* 柔和线条 */
  --font-cute: 'Quicksand', 'Fredoka', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--color-bg);
  background-image: 
    linear-gradient(90deg, rgba(232, 211, 197, 0.2) 1px, transparent 1px),
    linear-gradient(rgba(232, 211, 197, 0.2) 1px, transparent 1px);
  background-size: 20px 20px; /* 手账网格背景 */
  color: var(--color-text);
  font-family: var(--font-cute);
}

.bouncy-hover {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bouncy-hover:hover {
  transform: scale(1.05);
}
```

- [ ] **Step 4: 替换核心入口 App.tsx 提供基础骨架**

Edit [src/App.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/App.tsx):
```tsx
import React, { useState } from 'react';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'report' | 'favorites'>('today');

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ textAlign: 'center', margin: '16px 0' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-pink)', margin: '0', fontWeight: 'bold' }}>吃点好的</h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text)', opacity: 0.8 }}>把每一顿饭，都变成值得收藏的生活回忆</p>
      </header>

      <main style={{ flex: 1 }}>
        {activeTab === 'today' && <div>今天的一页 (开发中...)</div>}
        {activeTab === 'month' && <div>月视图 (开发中...)</div>}
        {activeTab === 'report' && <div>回忆录 (开发中...)</div>}
        {activeTab === 'favorites' && <div>收藏推荐页 (开发中...)</div>}
      </main>

      <nav style={{ 
        position: 'sticky', 
        bottom: '16px', 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(8px)',
        borderRadius: '24px', 
        padding: '12px 24px', 
        display: 'flex', 
        justifyContent: 'space-around',
        boxShadow: '0 8px 32px rgba(92, 75, 67, 0.1)',
        border: '2px solid var(--color-border)'
      }}>
        {(['today', 'month', 'report', 'favorites'] as const).map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--color-pink)' : 'var(--color-text)',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
              outline: 'none'
            }}
          >
            {tab === 'today' && '🌸 今天'}
            {tab === 'month' && '📅 月视图'}
            {tab === 'report' && '📝 回忆录'}
            {tab === 'favorites' && '💖 收藏'}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 5: 验证并提交**

Run: `npm run build`
Expected: 构建成功无 TypeScript 报错。
Commit:
```bash
git add .
git commit -m "chore: initialize project scaffolding and basic styles"
```

---

### Task 2: 本地离线数据库设计与操作接口 (`src/db.ts`)

**Files:**
* Create: `src/db.ts`

**Interfaces:**
* Produces: 完备的 IndexedDB 操作 API，支持增删改查。

- [ ] **Step 1: 编写 IndexedDB 初始化及增删改查接口**

Create [src/db.ts](file:///d:/A研二/food2.0纯记录/foodV2/src/db.ts):
```typescript
export interface FoodRecord {
  id: string;          // 唯一 UUID
  timestamp: number;   // 用餐时间戳
  foodName: string;    // 食物名称
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'tea' | 'night';
  rating: number;      // 1-5 评分
  isNewFood: boolean;  // 是否为新食物
  diningWith?: string; // 和谁吃
  location?: string;   // 在哪里吃
  isFavorited: boolean;// 是否收藏
  note: string;        // 备注日记
  imageBlob?: Blob;    // 抠图去背景后的透明 PNG 数据
}

const DB_NAME = 'EatSomethingGoodDB';
const DB_VERSION = 1;
const STORE_NAME = 'food_records';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addRecord(record: FoodRecord): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRecords(): Promise<FoodRecord[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const records = request.result as FoodRecord[];
      // 按时间戳倒序排列
      records.sort((a, b) => b.timestamp - a.timestamp);
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build`
Expected: 编译通过。
Commit:
```bash
git add src/db.ts
git commit -m "feat: implement local database layer using IndexedDB"
```

---

### Task 3: 饮食记录弹窗与 AI 去背景抠图 (`src/components/RecordModal.tsx`)

**Files:**
* Create: `src/components/RecordModal.tsx`

**Interfaces:**
* Consumes: `addRecord` from `src/db.ts`
* Produces: `<RecordModal />` 交互组件，在上传照片后利用 WebAssembly 本地扣出背景，并绘制白色虚线。

- [ ] **Step 1: 实现支持去背景的图片处理与 Canvas 描边绘制逻辑**

Create [src/components/RecordModal.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/components/RecordModal.tsx):
```tsx
import React, { useState, useRef } from 'react';
import { X, Camera, Star, Heart } from 'lucide-react';
import { FoodRecord, addRecord } from '../db';
import { imglyRemoveBackground } from '@imgly/background-removal';

interface RecordModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialDate?: Date;
}

export default function RecordModal({ onClose, onSaved, initialDate }: RecordModalProps) {
  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState<FoodRecord['mealType']>('breakfast');
  const [rating, setRating] = useState(5);
  const [isNewFood, setIsNewFood] = useState(false);
  const [diningWith, setDiningWith] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setUseFallback(false);
    
    try {
      // 1. 尝试调用 AI 去背景 (WASM 算法)
      const processedBlob = await imglyRemoveBackground(file);
      setImageBlob(processedBlob);
      
      // 2. 绘制描边
      const imgUrl = URL.createObjectURL(processedBlob);
      drawDashedBorder(imgUrl);
    } catch (err) {
      console.warn("WASM去背景加载失败或超时，自动切换至形状裁剪贴纸:", err);
      // 兜底方案：使用原始大图，但在后续渲染时做桃心或圆角裁剪
      setImageBlob(file);
      setProcessedUrl(URL.createObjectURL(file));
      setUseFallback(true);
      setProcessing(false);
    }
  };

  const drawDashedBorder = (imgSrc: string) => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 缩放画布至合适大小
      canvas.width = 300;
      canvas.height = 300;
      ctx.clearRect(0, 0, 300, 300);

      // 居中绘制食物贴纸
      const scale = Math.min(260 / img.width, 260 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (300 - w) / 2;
      const y = (300 - h) / 2;

      ctx.drawImage(img, x, y, w, h);

      // 绘制可爱的白色虚线框（模拟剪纸边界）
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);

      canvas.toBlob((b) => {
        if (b) {
          setImageBlob(b);
          setProcessedUrl(URL.createObjectURL(b));
        }
        setProcessing(false);
      }, 'image/png');
    };
  };

  const handleSave = async () => {
    if (!foodName) return alert('请输入食物名字～');
    
    const record: FoodRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: initialDate ? initialDate.getTime() : Date.now(),
      foodName,
      mealType,
      rating,
      isNewFood,
      diningWith: diningWith.trim() || undefined,
      location: location.trim() || undefined,
      isFavorited,
      note,
      imageBlob: imageBlob || undefined
    };

    await addRecord(record);
    onSaved();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(92, 75, 67, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--color-bg)', border: '3px solid var(--color-border)',
        borderRadius: '32px', width: '100%', maxWidth: '480px', padding: '24px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 48px rgba(92, 75, 67, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: 'var(--color-pink)', margin: 0, fontSize: '1.4rem' }}>记录这顿美味 🍽️</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* 图片上传区域 */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <label style={{
            display: 'block', height: '180px', background: '#F8F1EB',
            border: '2px dashed var(--color-border)', borderRadius: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', position: 'relative'
          }}>
            {processing ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>AI 正在努力去背景...</span>
            ) : processedUrl ? (
              <img src={processedUrl} alt="food preview" style={{ 
                height: '100%', objectFit: 'contain',
                borderRadius: useFallback ? '50%' : '0px', // 兜底裁剪为圆形
                border: useFallback ? '3px dashed var(--color-pink)' : 'none'
              }} />
            ) : (
              <>
                <Camera size={32} color="#AAA" />
                <span style={{ fontSize: '0.85rem', color: '#999', marginTop: '8px' }}>拍照或上传实物照片 (自动生成手账贴纸)</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* 隐藏 Canvas 绘图 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="食物叫什么名字？"
            value={foodName} 
            onChange={(e) => setFoodName(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '16px', border: '2px solid var(--color-border)', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            {(['breakfast', 'lunch', 'dinner', 'tea', 'night'] as const).map((type) => (
              <button 
                key={type} 
                onClick={() => setMealType(type)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '12px', fontSize: '0.8rem',
                  border: '2px solid',
                  borderColor: mealType === type ? 'var(--color-pink)' : 'var(--color-border)',
                  background: mealType === type ? 'var(--color-pink)' : 'transparent',
                  color: mealType === type ? '#FFF' : 'var(--color-text)',
                  cursor: 'pointer'
                }}
              >
                {type === 'breakfast' && '🌸 早餐'}
                {type === 'lunch' && '🌤️ 午餐'}
                {type === 'dinner' && '🌙 晚餐'}
                {type === 'tea' && '🍵 下午茶'}
                {type === 'night' && '🍢 夜宵'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="和谁一起吃？" 
              value={diningWith} 
              onChange={(e) => setDiningWith(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '2px solid var(--color-border)' }}
            />
            <input 
              type="text" 
              placeholder="在哪里吃？" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '2px solid var(--color-border)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isNewFood} onChange={(e) => setIsNewFood(e.target.checked)} />
              第一次尝试新食物！
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.85rem', marginRight: '4px' }}>喜爱评分:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <Heart 
                  key={s} 
                  size={18} 
                  fill={s <= rating ? 'var(--color-pink)' : 'none'} 
                  color="var(--color-pink)" 
                  onClick={() => setRating(s)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>

          <textarea 
            placeholder="写下这顿美食的温馨手账备注吧..."
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '16px', border: '2px solid var(--color-border)', height: '80px', boxSizing: 'border-box', resize: 'none' }}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              onClick={() => setIsFavorited(!isFavorited)}
              style={{
                padding: '12px 18px', borderRadius: '16px', cursor: 'pointer',
                border: '2px solid var(--color-pink)',
                background: isFavorited ? 'var(--color-pink)' : 'transparent',
                color: isFavorited ? '#FFF' : 'var(--color-pink)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Star size={18} fill={isFavorited ? '#FFF' : 'none'} />
              {isFavorited ? '已加入收藏' : '收藏'}
            </button>

            <button 
              onClick={handleSave}
              style={{
                flex: 1, padding: '12px', borderRadius: '16px', cursor: 'pointer',
                border: 'none', background: 'var(--color-green)', color: 'var(--color-text)',
                fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(168,230,207,0.4)'
              }}
            >
              画好了，记录！
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build`
Expected: 编译通过，无模块缺失。
Commit:
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: implement RecordModal with client-side AI background removal"
```

---

### Task 4: 今日饮食页面与日记翻页组件 (`src/components/TodayPage.tsx`)

**Files:**
* Create: `src/components/TodayPage.tsx`

**Interfaces:**
* Consumes: `getAllRecords`, `deleteRecord` from `src/db.ts`
* Produces: `<TodayPage />` 核心页面，支持以日记本单页模式展示特定日期的全天餐卡，且能像看日记一样左右切换日期。

- [ ] **Step 1: 编写日记本视图与垂直虚线时间轴**

Create [src/components/TodayPage.tsx](file:///d:/A研二\food2.0纯记录\foodV2\src/components/TodayPage.tsx):
```tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Heart, Users, MapPin, Star } from 'lucide-react';
import { FoodRecord, getAllRecords, deleteRecord } from '../db';
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

  // 格式化日期为 YYYY-MM-DD
  const formatDateString = (d: Date) => d.toISOString().split('T')[0];

  const currentDayRecords = records.filter(r => formatDateString(new Date(r.timestamp)) === formatDateString(activeDate));

  const changeDate = (days: number) => {
    const nextDate = new Date(activeDate);
    nextDate.setDate(nextDate.getDate() + days);
    setActiveDate(nextDate);
  };

  const handleDelete = async (id: string) => {
    if (confirm('真的要删掉这顿美味的回忆吗？')) {
      await deleteRecord(id);
      fetchRecords();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 顶部日记本翻页导航 */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#FFF', border: '2px solid var(--color-border)', borderRadius: '20px',
        padding: '10px 16px', boxShadow: '0 4px 12px rgba(92, 75, 67, 0.05)'
      }}>
        <button onClick={() => changeDate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
          {activeDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </span>
        <button onClick={() => changeDate(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 饮食列表时间线 */}
      <div style={{ position: 'relative', paddingLeft: '24px', minHeight: '300px' }}>
        {/* 虚线时间轴 */}
        <div style={{
          position: 'absolute', left: '10px', top: '20px', bottom: '20px',
          width: '2px', borderLeft: '2px dashed var(--color-border)'
        }} />

        {currentDayRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>今天还没有记录饮食哦～</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>点击右下角 “➕” 按钮画下你的美食吧！</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {currentDayRecords.map((record) => {
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
                  {/* 时间轴小圆点 */}
                  <div style={{
                    position: 'absolute', left: '-20px', top: '24px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: 'var(--color-pink)', border: '2px solid #FFF'
                  }} />

                  {/* 左侧食物贴纸 */}
                  <div style={{ width: '100px', height: '100px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6F0', borderRadius: '16px', overflow: 'hidden' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={record.foodName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      // 纯文字模式下显示简易小饭团
                      <span style={{ fontSize: '2.5rem' }}>🍙</span>
                    )}
                  </div>

                  {/* 右侧记录详情 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                          <Heart key={s} size={12} fill={s <= record.rating ? 'var(--color-pink)' : 'none'} color="var(--color-pink)" />
                        ))}
                        {record.isFavorited && <Star size={12} fill="gold" color="gold" style={{ marginLeft: '4px' }} />}
                      </div>
                    </div>

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
Expected: 编译正常。
Commit:
```bash
git add src/components/TodayPage.tsx
git commit -m "feat: implement TodayPage diary with page-flip and record feed"
```

---

### Task 5: 日历月视图组件与贴纸墙墙面 (`src/components/MonthView.tsx`)

**Files:**
* Create: `src/components/MonthView.tsx`

**Interfaces:**
* Consumes: `getAllRecords` from `src/db.ts`
* Produces: `<MonthView />` 日历面板，每一天展示该天所吃的食物贴纸墙，点击日期可直接切入该天 Today 日记页。

- [ ] **Step 1: 编写日历格子布局并匹配每天的食物贴纸**

Create [src/components/MonthView.tsx](file:///d:/A研二\food2.0纯记录\foodV2\src/components/MonthView.tsx):
```tsx
import React, { useState, useEffect } from 'react';
import { FoodRecord, getAllRecords } from '../db';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthViewProps {
  onSelectDate: (date: Date) => void;
}

export default function MonthView({ onSelectDate }: MonthViewProps) {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchRecords = async () => {
      const data = await getAllRecords();
      setRecords(data);
    };
    fetchRecords();
  }, []);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(nextMonth);
  };

  // 生成日历格子
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray: (Date | null)[] = [];
  // 填充月初空白
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // 填充正常日期
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(new Date(year, month, d));
  }

  const getDayRecords = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return records.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === dateStr);
  };

  return (
    <div style={{ background: '#FFF', border: '2px solid var(--color-border)', borderRadius: '28px', padding: '16px', boxShadow: '0 6px 18px rgba(92, 75, 67, 0.04)' }}>
      {/* 顶部月份导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft /></button>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </span>
        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight /></button>
      </div>

      {/* 星期标头 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#999', marginBottom: '8px' }}>
        {['日', '一', '二', '三', '四', '五', '六'].map(w => <div key={w}>{w}</div>)}
      </div>

      {/* 日历网格贴纸墙 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {daysArray.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} style={{ height: '70px' }} />;
          
          const dayRecords = getDayRecords(date);
          const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];

          return (
            <button 
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              style={{
                height: '75px', background: isToday ? 'var(--color-yellow)' : '#FFFDF9',
                border: isToday ? '2px solid var(--color-pink)' : '1px solid var(--color-border)',
                borderRadius: '16px', display: 'flex', flexDirection: 'column', 
                justifyContent: 'space-between', padding: '6px', cursor: 'pointer',
                overflow: 'hidden', position: 'relative'
              }}
              className="bouncy-hover"
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isToday ? 'var(--color-pink)' : 'var(--color-text)' }}>
                {date.getDate()}
              </span>

              {/* 贴纸平铺层 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', width: '100%', overflow: 'hidden', height: '36px', alignItems: 'center', justifyContent: 'center' }}>
                {dayRecords.map((r) => {
                  const imgUrl = r.imageBlob ? URL.createObjectURL(r.imageBlob) : null;
                  return (
                    <div key={r.id} style={{ width: '16px', height: '16px', borderRadius: '4px', overflow: 'hidden', background: '#EAEAEA' }}>
                      {imgUrl ? <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🍙'}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build`
Expected: 编译通过。
Commit:
```bash
git add src/components/MonthView.tsx
git commit -m "feat: implement MonthView calendar layout with food sticker wall"
```

---

### Task 6: 收藏推荐页面组件 (`src/components/FavoritesPage.tsx`)

**Files:**
* Create: `src/components/FavoritesPage.tsx`

**Interfaces:**
* Consumes: `getAllRecords` from `src/db.ts`
* Produces: `<FavoritesPage />` 收藏模块，过滤并只渲染用户打上收藏心标的美食卡片。

- [ ] **Step 1: 编写收藏精选卡片墙**

Create [src/components/FavoritesPage.tsx](file:///d:/A研二\food2.0纯记录\foodV2\src/components/FavoritesPage.tsx):
```tsx
import React, { useState, useEffect } from 'react';
import { FoodRecord, getAllRecords } from '../db';
import { Star, MapPin, Users, Heart } from 'lucide-react';

export default function FavoritesPage() {
  const [favRecords, setFavRecords] = useState<FoodRecord[]>([]);

  useEffect(() => {
    const fetchFavs = async () => {
      const data = await getAllRecords();
      setFavRecords(data.filter(r => r.isFavorited));
    };
    fetchFavs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '1.2rem', margin: '0 0 8px', color: 'var(--color-pink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Star fill="var(--color-pink)" color="var(--color-pink)" size={20} />
        我的美食推荐收藏
      </h2>

      {favRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p style={{ margin: 0 }}>还没有收藏任何的美食回忆哦～</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>在记录的时候点击“收藏”按钮即可保存在这里。</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {favRecords.map((record) => {
            const imgUrl = record.imageBlob ? URL.createObjectURL(record.imageBlob) : null;
            return (
              <div key={record.id} style={{ 
                background: '#FFF', border: '2px solid var(--color-border)', borderRadius: '24px',
                padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
                boxShadow: '0 6px 18px rgba(92, 75, 67, 0.04)'
              }}>
                <div style={{ height: '120px', background: '#FAF6F0', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imgUrl ? <img src={imgUrl} alt={record.foodName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '3rem' }}>🍙</span>}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 'bold' }}>{record.foodName}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#888', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.note}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: '#999' }}>
                    {record.diningWith && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Users size={10} /> {record.diningWith}</span>}
                    {record.location && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {record.location}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build`
Expected: 编译通过。
Commit:
```bash
git add src/components/FavoritesPage.tsx
git commit -m "feat: implement FavoritesPage recommended list"
```

---

### Task 7: 月报回忆录页面与 Gemini AI 治愈总结 (`src/components/ReportPage.tsx`)

**Files:**
* Create: `src/components/ReportPage.tsx`

**Interfaces:**
* Consumes: `getAllRecords` from `src/db.ts`
* Produces: `<ReportPage />` 统计分析页，支持前端直接调用 Gemini API 进行温馨情感化的月度总结。

- [ ] **Step 1: 编写指标统计与 AI API 调用逻辑**

Create [src/components/ReportPage.tsx](file:///d:/A研二\food2.0纯记录\foodV2\src/components/ReportPage.tsx):
```tsx
import React, { useState, useEffect } from 'react';
import { FoodRecord, getAllRecords } from '../db';
import { Heart, Sparkles, BookOpen, Key } from 'lucide-react';

export default function ReportPage() {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      const data = await getAllRecords();
      setRecords(data);
    };
    fetchRecords();
    
    // 加载已保存的 API Key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyInput(false);
  };

  // 1. 本月数据统计
  const now = new Date();
  const currentMonthRecords = records.filter(r => {
    const d = new Date(r.timestamp);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const totalMeals = currentMonthRecords.length;
  const newFoodsCount = currentMonthRecords.filter(r => r.isNewFood).length;
  
  // 2. 聚餐与饮品统计
  const friendGatherCount = currentMonthRecords.filter(r => r.diningWith).length;
  const drinksCount = currentMonthRecords.filter(r => {
    const name = r.foodName.toLowerCase();
    return name.includes('咖啡') || name.includes('茶') || name.includes('奶茶') || name.includes('可乐') || name.includes('水') || name.includes('饮品') || name.includes('拿铁');
  }).length;

  // 3. 统计最晚的一餐
  let latestMeal: FoodRecord | null = null;
  let maxMinutes = -1; // 转换为当天的分钟数 (21:00 至 4:00)
  
  currentMonthRecords.forEach(r => {
    const date = new Date(r.timestamp);
    const hour = date.getHours();
    const min = date.getMinutes();
    let absMinutes = hour * 60 + min;
    
    // 如果是凌晨，算作一天的更晚时间
    if (hour >= 0 && hour < 5) {
      absMinutes += 24 * 60;
    }

    if ((hour >= 21 || hour < 5) && absMinutes > maxMinutes) {
      maxMinutes = absMinutes;
      latestMeal = r;
    }
  });

  // 4. 最喜欢 & 最常吃
  const foodFrequency: Record<string, number> = {};
  const highRatedFoods: Record<string, number> = {};
  
  currentMonthRecords.forEach(r => {
    foodFrequency[r.foodName] = (foodFrequency[r.foodName] || 0) + 1;
    if (r.rating === 5) {
      highRatedFoods[r.foodName] = (highRatedFoods[r.foodName] || 0) + 1;
    }
  });

  const mostEaten = Object.entries(foodFrequency).sort((a,b) => b[1]-a[1])[0]?.[0] || '暂无数据';
  const mostLiked = Object.entries(highRatedFoods).sort((a,b) => b[1]-a[1])[0]?.[0] || '暂无数据';

  // 5. 调用 Gemini 进行治愈系总结
  const generateAiSummary = async () => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setLoadingAi(true);
    try {
      // 整理本月饮食摘要文本
      const foodSummaryStr = currentMonthRecords.map(r => 
        `时间:${new Date(r.timestamp).toLocaleDateString()},食物:${r.foodName},餐时:${r.mealType},心情打分:${r.rating}星,和谁吃:${r.diningWith || '自己'},地点:${r.location || '未知'}`
      ).join('\n');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `你是一个温柔、治愈、可爱的心灵饮食心理咨询师。请根据以下用户本月记录的每一顿饭，写一段200字以内的温馨、感性、充满陪伴感的月度情感饮食报告总结。语气要像个朋友在和你对话一样，要提到他们吃的新食物或者和朋友家人聚餐的点滴。
              数据信息如下：\n${foodSummaryStr}`
            }]
          }]
        })
      });

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '生成失败，请确认 API Key 是否正确';
      setAiSummary(rawText);
    } catch (err) {
      console.error(err);
      setAiSummary('AI 总结时开小差啦，请检查网络或 API Key 后重试哦～');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      <div style={{ 
        background: '#FFF', border: '3px solid var(--color-border)', borderRadius: '28px',
        padding: '24px', boxShadow: '0 8px 24px rgba(92, 75, 67, 0.05)',
        backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 0)',
        backgroundSize: '24px 24px' // 精美信纸背景
      }}>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--color-pink)', margin: '0 0 16px', textAlign: 'center', fontWeight: 'bold' }}>
          🍽️ “吃点好的” 月度饮食回忆录
        </h2>

        {/* AI 温馨总结版块 */}
        <div style={{ 
          background: 'rgba(255, 182, 193, 0.1)', border: '2px dashed var(--color-pink)', 
          borderRadius: '20px', padding: '16px', marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-pink)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={16} /> AI 治愈手账寄语
            </span>
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', color: '#999' }}
            >
              <Key size={12} /> 配置 Key
            </button>
          </div>

          {showKeyInput && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="password" 
                placeholder="请输入 Gemini API Key"
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '12px', border: '2px solid var(--color-border)' }}
              />
              <button onClick={() => saveApiKey(apiKey)} style={{ padding: '8px 16px', background: 'var(--color-pink)', color: '#FFF', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>保存</button>
            </div>
          )}

          {loadingAi ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>正在阅读你本月的手账日记，请稍后...</p>
          ) : aiSummary ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: '1.6' }}>{aiSummary}</p>
          ) : (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#888' }}>点击下方按钮，让 AI 读读你这个月的美食日记，为你写下温暖的心情总结～</p>
              <button 
                onClick={generateAiSummary}
                style={{
                  background: 'var(--color-pink)', color: '#FFF', border: 'none',
                  padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                className="bouncy-hover"
              >
                生成我的本月寄语 ✨
              </button>
            </div>
          )}
        </div>

        {/* 趣味统计格子 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🍴 本月聚餐频次</span>
            <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{totalMeals} 顿饭 / {friendGatherCount} 次聚餐</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🥤 享用饮品次数</span>
            <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{drinksCount} 杯饮品</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🆕 尝试新美食</span>
            <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{newFoodsCount} 种新味道</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🌙 最晚深夜食堂</span>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {latestMeal ? `${(latestMeal as FoodRecord).foodName} (${new Date((latestMeal as FoodRecord).timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})` : '无'}
            </p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🔄 最常享用食物</span>
            <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-pink)' }}>{mostEaten}</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>💖 评分最高最爱</span>
            <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 'bold', color: 'gold' }}>{mostLiked}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证并提交**

Run: `npm run build`
Expected: 编译无 TypeScript 报错。
Commit:
```bash
git add src/components/ReportPage.tsx
git commit -m "feat: implement ReportPage statistics and Gemini AI summaries"
```

---

### Task 8: 全局核心挂载与样式精修 (`src/App.tsx`, `src/index.css`)

**Files:**
* Modify: `src/App.tsx`
* Modify: `src/index.css`

**Interfaces:**
* Consumes: `<TodayPage />`, `<MonthView />`, `<ReportPage />`, `<FavoritesPage />`
* Produces: 完整、流畅、交互可爱的“吃点好的”饮食记录主应用。

- [ ] **Step 1: 整合核心 Tab 页面切换**

Edit [src/App.tsx](file:///d:/A研二/food2.0纯记录/foodV2/src/App.tsx):
```tsx
import React, { useState } from 'react';
import './index.css';
import TodayPage from './components/TodayPage';
import MonthView from './components/MonthView';
import ReportPage from './components/ReportPage';
import FavoritesPage from './components/FavoritesPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'report' | 'favorites'>('today');
  const [activeDate, setActiveDate] = useState<Date>(new Date());

  const handleSelectDateFromCalendar = (date: Date) => {
    setActiveDate(date);
    setActiveTab('today');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <header style={{ textAlign: 'center', margin: '12px 0 20px' }}>
        <h1 style={{ 
          fontSize: '2.2rem', color: 'var(--color-pink)', margin: '0', 
          fontWeight: 'bold', letterSpacing: '2px',
          textShadow: '2px 2px 0px #FFF'
        }}>
          吃点好的 ✨
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--color-text)', opacity: 0.7, fontWeight: 500 }}>
          用心记录每一餐，每一口都是美好回忆
        </p>
      </header>

      <main style={{ flex: 1, paddingBottom: '80px' }}>
        {activeTab === 'today' && <TodayPage activeDate={activeDate} setActiveDate={setActiveDate} />}
        {activeTab === 'month' && <MonthView onSelectDate={handleSelectDateFromCalendar} />}
        {activeTab === 'report' && <ReportPage />}
        {activeTab === 'favorites' && <FavoritesPage />}
      </main>

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
        padding: '12px 16px', 
        display: 'flex', 
        justifyContent: 'space-around',
        boxShadow: '0 8px 32px rgba(92, 75, 67, 0.08)',
        border: '2px solid var(--color-border)',
        zIndex: 500
      }}>
        {(['today', 'month', 'report', 'favorites'] as const).map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--color-pink)' : 'var(--color-text)',
              fontWeight: activeTab === tab ? 'bold' : '500',
              cursor: 'pointer',
              fontSize: '0.95rem',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease'
            }}
            className="bouncy-hover"
          >
            <span style={{ fontSize: '1.2rem' }}>
              {tab === 'today' && '🌸'}
              {tab === 'month' && '📅'}
              {tab === 'report' && '📝'}
              {tab === 'favorites' && '💖'}
            </span>
            <span>
              {tab === 'today' && '今天'}
              {tab === 'month' && '月视图'}
              {tab === 'report' && '回忆录'}
              {tab === 'favorites' && '推荐收藏'}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: 验证并运行最后的编译测试**

Run: `npm run build`
Expected: 静态包成功生成，没有任何 TypeScript 警告或 CSS 报错。
Commit:
```bash
git add src/App.tsx src/index.css
git commit -m "feat: complete App integration and CSS details polish"
```
