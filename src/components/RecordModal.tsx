import { useState, useRef } from 'react';
import { Camera, Star, Heart, Pencil, Sun, Moon, Coffee } from 'lucide-react';
import { type FoodRecord, addRecord } from '../db';
import { removeBackground } from '@imgly/background-removal';


interface RecordModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialDate?: Date;
  recordToEdit?: FoodRecord;
}

export default function RecordModal({ onClose, onSaved, initialDate, recordToEdit }: RecordModalProps) {
  const [foodName, setFoodName] = useState(recordToEdit ? recordToEdit.foodName : '');
  const [mealType, setMealType] = useState<FoodRecord['mealType']>(recordToEdit ? recordToEdit.mealType : 'breakfast');
  const [rating, setRating] = useState(recordToEdit ? recordToEdit.rating : 5);
  const [isNewFood, setIsNewFood] = useState(recordToEdit ? recordToEdit.isNewFood : false);
  const [diningWith, setDiningWith] = useState(recordToEdit ? (recordToEdit.diningWith || '') : '');
  const [location, setLocation] = useState(recordToEdit ? (recordToEdit.location || '') : '');
  const [note, setNote] = useState(recordToEdit ? recordToEdit.note : '');
  const [isFavorited, setIsFavorited] = useState(recordToEdit ? recordToEdit.isFavorited : false);
  
  const [imageBlob, setImageBlob] = useState<Blob | null>(recordToEdit && recordToEdit.imageBlob ? recordToEdit.imageBlob : null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(recordToEdit && recordToEdit.imageBlob ? URL.createObjectURL(recordToEdit.imageBlob) : null);
  const [recordTime, setRecordTime] = useState<number>(recordToEdit ? recordToEdit.timestamp : (initialDate ? initialDate.getTime() : Date.now()));
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    
    try {
      // 1. 尝试调用 AI 去背景 (WASM 算法，使用本地托管资源)
      const processedBlob = await removeBackground(file, {
        publicPath: 'https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/'
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

    if (imgCutout) {
      try {
        const orangeColor = '#FF9800'; // 明丽橘黄色

        // 1. 获取 imgCutout 的真实不透明物体边界包围盒 (Bounding Box)
        const boxCanvas = document.createElement('canvas');
        boxCanvas.width = imgCutout.width;
        boxCanvas.height = imgCutout.height;
        const boxCtx = boxCanvas.getContext('2d');
        if (!boxCtx) return;
        boxCtx.drawImage(imgCutout, 0, 0);

        const boxImgData = boxCtx.getImageData(0, 0, imgCutout.width, imgCutout.height);
        const boxData = boxImgData.data;

        let minX = imgCutout.width;
        let minY = imgCutout.height;
        let maxX = 0;
        let maxY = 0;
        let hasOpaque = false;

        // 遍历整个像素，寻找有效食物及餐具的包围盒
        for (let py = 0; py < imgCutout.height; py++) {
          for (let px = 0; px < imgCutout.width; px++) {
            const idx = (py * imgCutout.width + px) * 4;
            const alpha = boxData[idx + 3];
            if (alpha > 20) {
              hasOpaque = true;
              if (px < minX) minX = px;
              if (px > maxX) maxX = px;
              if (py < minY) minY = py;
              if (py > maxY) maxY = py;
            }
          }
        }

        // 兜底：若全是透明像素，则不进行裁剪
        if (!hasOpaque) {
          minX = 0;
          minY = 0;
          maxX = imgCutout.width - 1;
          maxY = imgCutout.height - 1;
        }

        // 加上少许边缘 Padding 缓冲，防止硬裁剪擦除轮廓极边缘
        const padding = 4;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(imgCutout.width - 1, maxX + padding);
        maxY = Math.min(imgCutout.height - 1, maxY + padding);

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        // 2. 将裁剪内容绘制并执行去噪硬化
        const cleanCanvas = document.createElement('canvas');
        cleanCanvas.width = cropW;
        cleanCanvas.height = cropH;
        const cCtx = cleanCanvas.getContext('2d');
        if (cCtx) {
          cCtx.drawImage(boxCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
          const cleanImgData = cCtx.getImageData(0, 0, cropW, cropH);
          const cleanData = cleanImgData.data;
          // 彻底剔除 Alpha < 40 的模糊残留，硬化其他部分
          for (let i = 0; i < cleanData.length; i += 4) {
            if (cleanData[i + 3] < 40) {
              cleanData[i + 3] = 0;
            } else {
              cleanData[i + 3] = 255;
            }
          }
          cCtx.putImageData(cleanImgData, 0, 0);
        }

        // 3. 计算适配 300x300 画布的最大缩放系数 (使用上限 260px，确保保留描边空间)
        const scale = Math.min(260 / cropW, 260 / cropH);
        const w = cropW * scale;
        const h = cropH * scale;
        const x = (300 - w) / 2;
        const y = (300 - h) / 2;

        // 4. 创建橘黄色剪影离屏 canvas
        const orangeSilhouette = document.createElement('canvas');
        orangeSilhouette.width = 300;
        orangeSilhouette.height = 300;
        const oCtx = orangeSilhouette.getContext('2d');
        if (oCtx) {
          oCtx.drawImage(cleanCanvas, x, y, w, h);
          oCtx.globalCompositeOperation = 'source-in';
          oCtx.fillStyle = orangeColor;
          oCtx.fillRect(0, 0, 300, 300);
        }

        // 5. 创建白色剪影离屏 canvas
        const whiteSilhouette = document.createElement('canvas');
        whiteSilhouette.width = 300;
        whiteSilhouette.height = 300;
        const wCtx = whiteSilhouette.getContext('2d');
        if (wCtx) {
          wCtx.drawImage(cleanCanvas, x, y, w, h);
          wCtx.globalCompositeOperation = 'source-in';
          wCtx.fillStyle = '#FFFFFF';
          wCtx.fillRect(0, 0, 300, 300);
        }

        // 定义描边线宽
        const whiteBorder = 8;
        const orangeBorder = 3;
        const totalBorder = whiteBorder + orangeBorder;

        ctx.save();
        // 6. 朝 16 方向偏移绘制橘黄色线条底色层
        for (let angle = 0; angle < 360; angle += 22.5) {
          const rad = (angle * Math.PI) / 180;
          const ox = Math.cos(rad) * totalBorder;
          const oy = Math.sin(rad) * totalBorder;
          ctx.drawImage(orangeSilhouette, ox, oy);
        }

        // 7. 朝 16 方向偏移绘制白色贴纸底边层
        for (let angle = 0; angle < 360; angle += 22.5) {
          const rad = (angle * Math.PI) / 180;
          const ox = Math.cos(rad) * whiteBorder;
          const oy = Math.sin(rad) * whiteBorder;
          ctx.drawImage(whiteSilhouette, ox, oy);
        }
        ctx.restore();

        // 8. 覆盖彩色剪裁食物本体
        ctx.drawImage(boxCanvas, minX, minY, cropW, cropH, x, y, w, h);
      } catch (e) {
        console.error("双重贴纸描边与包围盒裁剪渲染异常:", e);
        // 兜底绘制未剪裁图
        const scale = Math.min(220 / imgOriginal.width, 220 / imgOriginal.height);
        const w = imgOriginal.width * scale;
        const h = imgOriginal.height * scale;
        const x = (300 - w) / 2;
        const y = (300 - h) / 2;
        ctx.drawImage(imgCutout, x, y, w, h);
      }
    } else {
      // 9. 抠图失败兜底：显示原图并径向压暗
      const scale = Math.min(220 / imgOriginal.width, 220 / imgOriginal.height);
      const w = imgOriginal.width * scale;
      const h = imgOriginal.height * scale;
      const x = (300 - w) / 2;
      const y = (300 - h) / 2;

      ctx.drawImage(imgOriginal, x, y, w, h);
      ctx.save();
      const grad = ctx.createRadialGradient(150, 150, 20, 150, 150, 100);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(92, 75, 67, 0.55)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // 绘制圆形手绘风虚线圈 (使用明丽橘色)
      ctx.beginPath();
      ctx.arc(150, 150, 80, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();
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
      id: recordToEdit ? recordToEdit.id : Math.random().toString(36).substring(2, 9),
      timestamp: recordTime,
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
      background: 'rgba(62, 58, 54, 0.4)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#FAF9F5', border: '1px solid var(--color-border)',
        borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(62, 58, 54, 0.08)'
      }}>
        {/* 顶部标题与取消保存 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: '#8A857C', padding: 0 }}>
            取消
          </button>
          <span style={{ color: 'var(--color-text)', fontSize: '1.05rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            新增记录
          </span>
          <button type="button" onClick={handleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--color-green)', fontWeight: 'bold', padding: 0 }}>
            保存
          </button>
        </div>

        {/* 贴纸卡片展示区 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            background: '#FAF6EE', border: '1px solid var(--color-border)',
            padding: '12px', borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '240px', height: '200px', cursor: 'default',
            position: 'relative',
          }}>
            <div style={{
              height: '100%', width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              overflow: 'visible', position: 'relative'
            }}>
              {processing ? (
                <span style={{ fontSize: '0.85rem', color: '#8A857C' }}>正在抠图中...</span>
              ) : processedUrl ? (
                <img src={processedUrl} alt="food preview" style={{ 
                  height: '100%', width: '100%', objectFit: 'contain'
                }} />
              ) : (
                <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <Camera size={28} color="#B5A58E" />
                  <span style={{ fontSize: '0.75rem', color: '#8A857C', marginTop: '6px' }}>点击拍照/上传食物</span>
                </div>
              )}
            </div>
            
            {/* 铅笔编辑按钮 (重新上传图片) */}
            {processedUrl && !processing && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute', right: '12px', bottom: '12px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#FFF', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  zIndex: 20
                }}
                className="bouncy-hover"
              >
                <Pencil size={14} color="#8B7D6C" />
              </button>
            )}
            
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* 手账式表单输入 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 食物名字 (极简单行) */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' 
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>食物名称</span>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <input 
                type="text" 
                placeholder="请输入美食名称"
                value={foodName} 
                onChange={(e) => setFoodName(e.target.value)}
                style={{ 
                  border: 'none', background: 'transparent', textAlign: 'right',
                  fontFamily: 'var(--font-cute)', fontSize: '0.9rem', color: 'var(--color-text)',
                  outline: 'none', width: '180px'
                }}
              />
            </div>
          </div>

          {/* 餐时分类 (小图标圆形细框按钮) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>餐时</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['breakfast', 'lunch', 'tea', 'dinner', 'night'] as const).map((type) => {
                const isSelected = mealType === type;
                return (
                  <button 
                    key={type} 
                    type="button"
                    onClick={() => setMealType(type)}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: '18px', fontSize: '0.75rem',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--color-green)' : 'var(--color-border)',
                      background: isSelected ? 'var(--color-green)' : '#FFF',
                      color: isSelected ? '#FFF' : '#8A857C',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {type === 'breakfast' && <><Sun size={10} /> 早餐</>}
                    {type === 'lunch' && <><Sun size={10} /> 午餐</>}
                    {type === 'tea' && <><Coffee size={10} /> 下午茶</>}
                    {type === 'dinner' && <><Moon size={10} /> 晚餐</>}
                    {type === 'night' && <><Coffee size={10} /> 夜宵</>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 时间 (极简单行选择器) */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' 
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>时间</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="datetime-local" 
                value={new Date(recordTime - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                onChange={(e) => {
                  if (e.target.value) {
                    setRecordTime(new Date(e.target.value).getTime());
                  }
                }}
                style={{ 
                  border: 'none', background: 'transparent', textAlign: 'right',
                  fontFamily: 'var(--font-cute)', fontSize: '0.9rem', color: 'var(--color-text)',
                  outline: 'none', cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '0.9rem', color: '#CCC' }}>&gt;</span>
            </div>
          </div>

          {/* 聚餐与地点 */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' 
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>和谁吃</span>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <input 
                type="text" 
                placeholder="请填入就餐伙伴 (选填)"
                value={diningWith} 
                onChange={(e) => setDiningWith(e.target.value)}
                style={{ 
                  border: 'none', background: 'transparent', textAlign: 'right',
                  fontFamily: 'var(--font-cute)', fontSize: '0.9rem', color: 'var(--color-text)',
                  outline: 'none', width: '150px'
                }}
              />
            </div>
          </div>

          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' 
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>在哪里吃</span>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <input 
                type="text" 
                placeholder="请填入就餐地点 (选填)"
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                style={{ 
                  border: 'none', background: 'transparent', textAlign: 'right',
                  fontFamily: 'var(--font-cute)', fontSize: '0.9rem', color: 'var(--color-text)',
                  outline: 'none', width: '150px'
                }}
              />
            </div>
          </div>

          {/* 是否第一次吃 (极简原木色 Toggle) */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' 
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>是否第一次吃</span>
            <div 
              onClick={() => setIsNewFood(!isNewFood)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                background: isNewFood ? 'var(--color-green)' : '#E3DFD5',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: '#FFF',
                position: 'absolute', top: '2px',
                left: isNewFood ? '22px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} />
            </div>
          </div>

          {/* 喜爱评分 */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' 
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>喜爱评分</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

          {/* 备注 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>备注</span>
            <textarea 
              placeholder="写下这顿美食的温馨手账备注吧..."
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              style={{ 
                width: '100%', height: '80px', padding: '10px', 
                background: '#FAF6EE', borderRadius: '8px', border: 'none',
                resize: 'none', outline: 'none', fontFamily: 'var(--font-cute)', color: 'var(--color-text)',
                fontSize: '0.9rem', boxSizing: 'border-box', lineHeight: '1.4'
              }}
            />
          </div>

          {/* 保存与收藏双按钮并排 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              type="button"
              onClick={() => setIsFavorited(!isFavorited)}
              style={{
                padding: '12px 20px', borderRadius: '12px', cursor: 'pointer',
                border: '1px solid var(--color-green)',
                background: isFavorited ? 'var(--color-green)' : 'transparent',
                color: isFavorited ? '#FFF' : 'var(--color-green)',
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
                flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
                border: 'none', background: 'var(--color-green)', color: '#FFF',
                fontWeight: 'bold', fontSize: '0.95rem'
              }}
              className="bouncy-hover"
            >
              保存记录
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
