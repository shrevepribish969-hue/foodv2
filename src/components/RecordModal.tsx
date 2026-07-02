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
      // 1. 尝试调用 AI 去背景 (WASM 算法，使用本地托管资源)
      const processedBlob = await removeBackground(file, {
        publicPath: `${window.location.origin}/background-removal/`
      });
      
      // 2. 绘制原图压暗 + 食物高亮 + 白色虚线
      const originalUrl = URL.createObjectURL(file);
      const cutoutUrl = URL.createObjectURL(processedBlob);
      drawSpotlightFood(originalUrl, cutoutUrl);
    } catch (err) {
      console.warn("WASM去背景加载失败或超时，自动切换至形状裁剪贴纸:", err);
      // 兜底方案：使用原始大图，做聚光灯模糊兜底
      const originalUrl = URL.createObjectURL(file);
      drawSpotlightFood(originalUrl, null);
    }
  };

  const drawSpotlightFood = (originalSrc: string, cutoutSrc: string | null) => {
    const imgOriginal = new Image();
    imgOriginal.src = originalSrc;
    imgOriginal.onload = () => {
      if (cutoutSrc) {
        const imgCutout = new Image();
        imgCutout.src = cutoutSrc;
        imgCutout.onload = () => {
          renderCanvas(imgOriginal, imgCutout);
        };
      } else {
        renderCanvas(imgOriginal, null);
      }
    };
  };

  const renderCanvas = (imgOriginal: HTMLImageElement, imgCutout: HTMLImageElement | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      // 1. 提取不规则轮廓的前置步骤：计算平均主体色
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(imgCutout, x, y, w, h);
          const tempImgData = tempCtx.getImageData(0, 0, 300, 300);
          const tempData = tempImgData.data;

          // 统计食物主体色平均 RGB
          let totalR = 0, totalG = 0, totalB = 0, count = 0;
          for (let i = 0; i < tempData.length; i += 4) {
            const r = tempData[i];
            const g = tempData[i + 1];
            const b = tempData[i + 2];
            const a = tempData[i + 3];
            if (a > 40) {
              totalR += r;
              totalG += g;
              totalB += b;
              count++;
            }
          }

          let strokeColor = '#5C4B43'; // 默认暖深褐兜底
          if (count > 0) {
            const avgR = totalR / count;
            const avgG = totalG / count;
            const avgB = totalB / count;
            // 线性等比例加深（乘以 0.4）
            const darkR = Math.round(avgR * 0.4);
            const darkG = Math.round(avgG * 0.4);
            const darkB = Math.round(avgB * 0.4);
            strokeColor = `rgb(${darkR}, ${darkG}, ${darkB})`;
          }

          // 2. 创建纯色剪影离屏 canvas
          const silhouetteCanvas = document.createElement('canvas');
          silhouetteCanvas.width = 300;
          silhouetteCanvas.height = 300;
          const sCtx = silhouetteCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(imgCutout, x, y, w, h);
            sCtx.globalCompositeOperation = 'source-in';
            sCtx.fillStyle = strokeColor;
            sCtx.fillRect(0, 0, 300, 300);
          }

          // 3. 在主 canvas 上朝 8 个偏移方向绘制剪影，形成 3px 宽的紧贴轮廓线
          const strokeWidth = 3;
          ctx.save();
          for (let angle = 0; angle < 360; angle += 45) {
            const rad = (angle * Math.PI) / 180;
            const ox = Math.cos(rad) * strokeWidth;
            const oy = Math.sin(rad) * strokeWidth;
            ctx.drawImage(silhouetteCanvas, ox, oy);
          }
          ctx.restore();

          // 4. 正中心绘制彩色的食物本体，遮盖并呈现完美的描边边缘
          ctx.drawImage(imgCutout, x, y, w, h);
        }
      } catch (e) {
        console.error("偏移剪影描边渲染异常:", e);
        // 发生异常时，直接绘制原彩色食物作为最低保障
        ctx.drawImage(imgCutout, x, y, w, h);
      }
    } else {
      // 5. 抠图失败兜底方案：显示原图并叠加径向压暗
      ctx.drawImage(imgOriginal, x, y, w, h);
      ctx.save();
      const grad = ctx.createRadialGradient(150, 150, 20, 150, 150, 100);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); // 中心明亮
      grad.addColorStop(1, 'rgba(92, 75, 67, 0.55)'); // 四周压暗
      
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // 绘制圆形手绘风虚线圈 (使用暖深褐描边)
      ctx.beginPath();
      ctx.arc(150, 150, 80, 0, Math.PI * 2);
      ctx.strokeStyle = '#5C4B43';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();
      
      setUseFallback(true);
    }

    canvas.toBlob((b) => {
      if (b) {
        setImageBlob(b);
        setProcessedUrl(URL.createObjectURL(b));
      }
      setProcessing(false);
    }, 'image/png');
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
      background: 'rgba(92, 75, 67, 0.4)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--color-bg)', border: '2px solid var(--color-border)',
        borderRadius: '28px', width: '100%', maxWidth: '440px', padding: '24px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(92, 75, 67, 0.12)'
      }}>
        {/* 顶部标题与关闭 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--color-pink)', margin: 0, fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '1px' }}>记录这顿美味 ✨</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#999' }} className="bouncy-hover">
            <X size={20} />
          </button>
        </div>

        {/* 拍立得照片上传区 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <label style={{
            background: '#FFF', border: '1px solid var(--color-border)',
            padding: '12px 12px 28px 12px', borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(92, 75, 67, 0.05)',
            display: 'block', width: '220px', cursor: 'pointer',
            textAlign: 'center', position: 'relative',
            transition: 'transform 0.2s',
          }} className="bouncy-hover">
            <div style={{
              height: '180px', width: '100%', background: '#FDFBFA',
              border: '1px dashed var(--color-border)', borderRadius: '8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative'
            }}>
              {processing ? (
                <span style={{ fontSize: '0.85rem', color: '#888' }}>正在抠图中...</span>
              ) : processedUrl ? (
                <img src={processedUrl} alt="food preview" style={{ 
                  height: '100%', width: '100%', objectFit: 'contain',
                  borderRadius: useFallback ? '50%' : '0px',
                  border: useFallback ? '2px dashed var(--color-pink)' : 'none'
                }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Camera size={28} color="#AAA" />
                  <span style={{ fontSize: '0.75rem', color: '#AAA', marginTop: '6px', padding: '0 8px' }}>点此拍照/上传</span>
                </div>
              )}
            </div>
            
            {/* 拍立得下方写字区效果 */}
            <div style={{ height: '14px', marginTop: '8px', borderBottom: '1px dashed #DDD' }}></div>
            
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* 手账式表单输入 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 食物名字 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input 
              type="text" 
              placeholder="这顿饭吃什么呢？"
              value={foodName} 
              onChange={(e) => setFoodName(e.target.value)}
              style={{ 
                width: '100%', padding: '8px 4px', border: 'none', 
                borderBottom: '2px dashed var(--color-border)', background: 'transparent',
                fontFamily: 'var(--font-cute)', fontSize: '1.2rem', color: 'var(--color-text)',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 餐时分类 */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['breakfast', 'lunch', 'dinner', 'tea', 'night'] as const).map((type) => {
              const isSelected = mealType === type;
              return (
                <button 
                  key={type} 
                  type="button"
                  onClick={() => setMealType(type)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: '20px', fontSize: '0.8rem',
                    border: '2px solid',
                    borderColor: isSelected ? 'var(--color-pink)' : 'var(--color-border)',
                    background: isSelected ? 'var(--color-pink)' : 'transparent',
                    color: isSelected ? '#FFF' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {type === 'breakfast' && '早餐'}
                  {type === 'lunch' && '午餐'}
                  {type === 'dinner' && '晚餐'}
                  {type === 'tea' && '下午茶'}
                  {type === 'night' && '夜宵'}
                </button>
              );
            })}
          </div>

          {/* 聚餐与地点 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                placeholder="和谁一起吃？" 
                value={diningWith} 
                onChange={(e) => setDiningWith(e.target.value)}
                style={{ 
                  width: '100%', padding: '6px 4px', border: 'none', 
                  borderBottom: '2px dashed var(--color-border)', background: 'transparent',
                  fontFamily: 'var(--font-cute)', fontSize: '0.95rem', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                placeholder="在哪里享用？" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                style={{ 
                  width: '100%', padding: '6px 4px', border: 'none', 
                  borderBottom: '2px dashed var(--color-border)', background: 'transparent',
                  fontFamily: 'var(--font-cute)', fontSize: '0.95rem', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* 评分与尝鲜 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            {/* 尝鲜切换按钮 */}
            <button 
              type="button"
              onClick={() => setIsNewFood(!isNewFood)}
              style={{
                padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer',
                border: '2px solid',
                borderColor: isNewFood ? 'var(--color-pink)' : 'var(--color-border)',
                background: isNewFood ? 'rgba(255,182,193,0.1)' : 'transparent',
                color: isNewFood ? 'var(--color-pink)' : 'var(--color-text)',
                display: 'flex', alignItems: 'center', gap: '4px', fontWeight: isNewFood ? 'bold' : 'normal',
                transition: 'all 0.15s ease'
              }}
            >
              {isNewFood ? '✓ 第一次吃这美食！' : '第一次吃这美食？'}
            </button>

            {/* 心心打分 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Heart 
                  key={s} 
                  size={16} 
                  fill={s <= rating ? 'var(--color-pink)' : 'none'} 
                  color="var(--color-pink)" 
                  onClick={() => setRating(s)}
                  style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                  className="bouncy-hover"
                />
              ))}
            </div>
          </div>

          {/* 手写日记纸质笔记本备注 */}
          <textarea 
            placeholder="写下这顿美食的温馨手账备注吧..."
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            style={{ 
              width: '100%', height: '96px', padding: '6px 4px', 
              background: 'repeating-linear-gradient(transparent, transparent 23px, var(--color-border) 23px, var(--color-border) 24px)', 
              lineHeight: '24px', border: 'none', borderBottom: '2px dashed var(--color-border)',
              resize: 'none', outline: 'none', fontFamily: 'var(--font-cute)', color: 'var(--color-text)',
              fontSize: '0.95rem', boxSizing: 'border-box'
            }}
          />

          {/* 保存与收藏 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              type="button"
              onClick={() => setIsFavorited(!isFavorited)}
              style={{
                padding: '12px 18px', borderRadius: '18px', cursor: 'pointer',
                border: '2px solid var(--color-pink)',
                background: isFavorited ? 'var(--color-pink)' : 'transparent',
                color: isFavorited ? '#FFF' : 'var(--color-pink)',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontWeight: 'bold', fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              className="bouncy-hover"
            >
              <Star size={16} fill={isFavorited ? '#FFF' : 'none'} />
              {isFavorited ? '已收藏' : '收藏'}
            </button>

            <button 
              type="button"
              onClick={handleSave}
              style={{
                flex: 1, padding: '12px', borderRadius: '18px', cursor: 'pointer',
                border: 'none', background: 'var(--color-green)', color: 'var(--color-text)',
                fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(168,230,207,0.3)'
              }}
              className="bouncy-hover"
            >
              画好了，记录！
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
