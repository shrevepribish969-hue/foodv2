# Record Input Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the record input flow by supporting camera directly, adding price, dynamic tags, and a quick text-only note via long press.

**Architecture:** We will update `FoodRecord` interface, create a new `QuickNoteModal` component, and modify `RecordModal` and `TodayPage` to integrate these features using `localStorage` for dynamic tags.

**Tech Stack:** React, TypeScript, Vite

## Global Constraints
- Icons must strictly use `lucide-react`
- Keep the minimalist aesthetic

---

### Task 1: Update Database Schema

**Files:**
- Modify: `src/db.ts`

**Interfaces:**
- Produces: `FoodRecord` interface with optional `price` field.

- [ ] **Step 1: Write type updates**
```typescript
// In src/db.ts, update FoodRecord:
export interface FoodRecord {
  id: string;          // 唯一 UUID
  timestamp: number;   // 用餐时间戳
  foodName: string;    // 食物名称
  mealType: string;    // 食物名称 (改为 string 兼容自定义标签)
  price?: number;      // 价格
// ... keep others unchanged
```

- [ ] **Step 2: Verify type checks pass**
Run: `npm run build`
Expected: Passes type checking

- [ ] **Step 3: Commit**
```bash
git add src/db.ts
git commit -m "feat: add price to FoodRecord and change mealType to string"
```

---

### Task 2: Create QuickNoteModal

**Files:**
- Create: `src/components/QuickNoteModal.tsx`

**Interfaces:**
- Consumes: `FoodRecord`, `addRecord` from `../db`
- Produces: `QuickNoteModal` component

- [ ] **Step 1: Implement QuickNoteModal component**
```tsx
import { useState } from 'react';
import { type FoodRecord, addRecord } from '../db';

interface QuickNoteModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialDate?: Date;
}

export default function QuickNoteModal({ onClose, onSaved, initialDate }: QuickNoteModalProps) {
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!note.trim()) {
      alert('请输入内容');
      return;
    }
    const record: FoodRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: initialDate ? initialDate.getTime() : Date.now(),
      foodName: '闪念笔记',
      mealType: '闪念',
      rating: 5,
      isNewFood: false,
      isFavorited: false,
      note: note.trim(),
    };
    await addRecord(record);
    onSaved();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(62, 58, 54, 0.4)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#FAF9F5', borderRadius: '16px', width: '100%', maxWidth: '320px', padding: '24px',
        boxShadow: '0 8px 30px rgba(62, 58, 54, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontWeight: 'bold' }}>闪念笔记</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8A857C' }}>取消</button>
        </div>
        <textarea
          placeholder="此刻的想法..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
          style={{
            width: '100%', height: '120px', padding: '12px', background: '#FAF6EE', 
            borderRadius: '12px', border: 'none', resize: 'none', outline: 'none', boxSizing: 'border-box'
          }}
        />
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '12px', marginTop: '16px', borderRadius: '12px',
            background: 'var(--color-green)', color: '#FFF', border: 'none', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          保存
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type checks**
Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/components/QuickNoteModal.tsx
git commit -m "feat: add QuickNoteModal component"
```

---

### Task 3: Support Long Press in TodayPage

**Files:**
- Modify: `src/components/TodayPage.tsx`

**Interfaces:**
- Consumes: `QuickNoteModal`

- [ ] **Step 1: Import QuickNoteModal and add states/handlers**
```tsx
// 1. Add import:
import QuickNoteModal from './QuickNoteModal';

// 2. Add states in TodayPage:
const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

// 3. Add pointer handlers:
const handlePointerDown = () => {
  const timer = setTimeout(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    setIsQuickNoteOpen(true);
  }, 500);
  setPressTimer(timer);
};
const handlePointerUp = () => {
  if (pressTimer) clearTimeout(pressTimer);
  setPressTimer(null);
};
```

- [ ] **Step 2: Update the Floating Plus Button and render QuickNoteModal**
```tsx
// 1. Update button props:
<button 
  onClick={() => { if (!isQuickNoteOpen) setIsModalOpen(true); }}
  onPointerDown={handlePointerDown}
  onPointerUp={handlePointerUp}
  onPointerLeave={handlePointerUp}
  style={{ /* ... existing styles ... */ }}
>
  <Plus size={26} strokeWidth={2.5} />
</button>

// 2. Below RecordModal rendering, add QuickNoteModal:
{isQuickNoteOpen && (
  <QuickNoteModal 
    onClose={() => setIsQuickNoteOpen(false)}
    onSaved={() => { fetchRecords(); }}
    initialDate={activeDate}
  />
)}
```

- [ ] **Step 3: Verify and Commit**
Run: `npm run build`
```bash
git add src/components/TodayPage.tsx
git commit -m "feat: add long press to plus button for quick note"
```

---

### Task 4: Camera and Album separation in RecordModal

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Consumes: `lucide-react` icons (Camera, Image)

- [ ] **Step 1: Modify File Inputs and Placeholder UI**
```tsx
// In RecordModal.tsx, replace the single fileInputRef with two refs (or just one and handle capture based on click):
// Wait, we can keep fileInputRef for camera and add albumInputRef for album.

const albumInputRef = useRef<HTMLInputElement>(null);

// In the placeholder UI (when not processedUrl and not processing):
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
  <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
    <Camera size={28} color="#B5A58E" />
    <span style={{ fontSize: '0.75rem', color: '#8A857C', marginTop: '6px' }}>点击拍照记录食物</span>
  </div>
</div>

// Add Album button at absolute bottom-right of the placeholder:
<button 
  type="button"
  onClick={(e) => { e.stopPropagation(); albumInputRef.current?.click(); }}
  style={{
    position: 'absolute', right: '12px', bottom: '12px',
    width: '32px', height: '32px', borderRadius: '50%',
    background: '#FFF', border: '1px solid var(--color-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 20
  }}
>
  <Image size={14} color="#8B7D6C" />
</button>

// Replace existing input with:
<input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
<input ref={albumInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />

// Remember to import Image from 'lucide-react'
```

- [ ] **Step 2: Verify and Commit**
Run: `npm run build`
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: split camera and album upload in RecordModal"
```

---

### Task 5: Add Price Field in RecordModal

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Uses the `price` field we added to `FoodRecord`

- [ ] **Step 1: Add Price State and Save logic**
```tsx
const [price, setPrice] = useState<string>(recordToEdit?.price !== undefined ? recordToEdit.price.toString() : '');

// In handleSave, add price:
const record: FoodRecord = {
  // ... other fields
  price: price ? parseFloat(price) : undefined,
};
```

- [ ] **Step 2: Render Price Input Field**
```tsx
// Insert below "在哪里吃" block:
<div style={{ 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
  borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' 
}}>
  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>价格</span>
  <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: '4px' }}>
    <span style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>¥</span>
    <input 
      type="number" 
      placeholder="0.00"
      value={price} 
      onChange={(e) => setPrice(e.target.value)}
      style={{ 
        border: 'none', background: 'transparent', textAlign: 'right',
        fontFamily: 'var(--font-cute)', fontSize: '0.9rem', color: 'var(--color-text)',
        outline: 'none', width: '80px'
      }}
    />
  </div>
</div>
```

- [ ] **Step 3: Verify and Commit**
Run: `npm run build`
```bash
git add src/components/RecordModal.tsx
git commit -m "feat: add price field in RecordModal"
```

---

### Task 6: Dynamic Tags in RecordModal

**Files:**
- Modify: `src/components/RecordModal.tsx`

**Interfaces:**
- Modifies `mealType` logic to handle custom `localStorage` tags.

- [ ] **Step 1: Define Tags State and Edit Mode**
```tsx
// At the top of RecordModal:
const DEFAULT_TAGS = ['早餐', '午餐', '晚餐', '饮品'];
const loadTags = () => {
  const stored = localStorage.getItem('food_tags');
  return stored ? JSON.parse(stored) : DEFAULT_TAGS;
};

// In component state:
const [tags, setTags] = useState<string[]>(loadTags());
const [isEditingTags, setIsEditingTags] = useState(false);

const saveTags = (newTags: string[]) => {
  setTags(newTags);
  localStorage.setItem('food_tags', JSON.stringify(newTags));
};

const handleAddTag = () => {
  const newTag = prompt('请输入新标签名称');
  if (newTag && newTag.trim() && !tags.includes(newTag.trim())) {
    saveTags([...tags, newTag.trim()]);
  }
};

const handleDeleteTag = (tag: string) => {
  if (confirm(`确定要删除标签 "${tag}" 吗？`)) {
    saveTags(tags.filter(t => t !== tag));
    if (mealType === tag) setMealType(tags[0] || '');
  }
};
```
Change `useState<FoodRecord['mealType']>` to `useState<string>`.

- [ ] **Step 2: Render Tags with Edit Button**
```tsx
// Import X, Plus from lucide-react if needed.
<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>餐时</span>
    <button onClick={() => setIsEditingTags(!isEditingTags)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <Pencil size={14} color="#8A857C" />
    </button>
  </div>
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {tags.map((type) => {
      const isSelected = mealType === type;
      return (
        <button 
          key={type} 
          type="button"
          onClick={() => { if (!isEditingTags) setMealType(type); }}
          style={{
            padding: '6px 12px', borderRadius: '18px', fontSize: '0.75rem',
            border: '1px solid',
            borderColor: isSelected && !isEditingTags ? 'var(--color-green)' : 'var(--color-border)',
            background: isSelected && !isEditingTags ? 'var(--color-green)' : '#FFF',
            color: isSelected && !isEditingTags ? '#FFF' : '#8A857C',
            cursor: 'pointer', fontWeight: isSelected && !isEditingTags ? 'bold' : 'normal',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          {type === '早餐' && <Sun size={10} />}
          {type === '午餐' && <Sun size={10} />}
          {type === '饮品' && <Coffee size={10} />}
          {type === '晚餐' && <Moon size={10} />}
          {type}
          {isEditingTags && (
            <X size={12} color="#8A857C" style={{ marginLeft: '4px' }} onClick={(e) => { e.stopPropagation(); handleDeleteTag(type); }} />
          )}
        </button>
      );
    })}
    {isEditingTags && (
      <button onClick={handleAddTag} type="button" style={{
        padding: '6px 12px', borderRadius: '18px', fontSize: '0.75rem', border: '1px dashed var(--color-border)',
        background: '#FAF6EE', color: '#8A857C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
      }}>
        <Plus size={10} /> 新增
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 3: Update `mealType` rendering in `TodayPage.tsx`**
```tsx
// In TodayPage.tsx where mealType is rendered:
{record.mealType === '早餐' && <><Sun size={12} /> 早餐</>}
{record.mealType === '午餐' && <><Sun size={12} /> 午餐</>}
{record.mealType === '晚餐' && <><Moon size={12} /> 晚餐</>}
{record.mealType === '饮品' && <><Coffee size={12} /> 饮品</>}
{record.mealType === '夜宵' && <><Moon size={12} /> 夜宵</>}
{/* 兜底渲染用户自定义标签 */}
{!['早餐', '午餐', '晚餐', '饮品', '夜宵'].includes(record.mealType) && <>{record.mealType}</>}
```

- [ ] **Step 4: Verify and Commit**
Run: `npm run build`
```bash
git add src/components/RecordModal.tsx src/components/TodayPage.tsx
git commit -m "feat: add dynamic custom tags in RecordModal"
```
