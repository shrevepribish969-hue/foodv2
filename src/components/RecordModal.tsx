import { useState, useRef } from 'react';
import { X, Camera, Star, Heart } from 'lucide-react';
import { type FoodRecord, addRecord } from '../db';
import { removeBackground } from '@imgly/background-removal';

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
      const processedBlob = await removeBackground(file);
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
            height: '180px', background: '#F8F1EB',
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
                <span style={{ fontSize: '0.85rem', color: '#999', marginTop: '8px', padding: '0 12px' }}>拍照或上传实物照片 (自动生成手账贴纸)</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* 表单输入域 */}
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
                type="button"
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
              style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '2px solid var(--color-border)', width: '50%' }}
            />
            <input 
              type="text" 
              placeholder="在哪里吃？" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '2px solid var(--color-border)', width: '50%' }}
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
              type="button"
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
              type="button"
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
