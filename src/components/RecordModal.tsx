import { useState, useRef } from 'react';
import { Camera, Star, Heart, Pencil, Sun, Moon, Coffee, Image as ImageIcon, X, Plus } from 'lucide-react';
import { type FoodRecord, addRecord } from '../db';
import { removeBackground } from '@imgly/background-removal';


interface RecordModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialDate?: Date;
  recordToEdit?: FoodRecord;
}

const resizeImage = (file: File, maxSide: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          resolve(file);
        }
      }, 'image/png');
    };
    img.onerror = (err) => reject(err);
  });
};

const DEFAULT_TAGS = ['早餐', '午餐', '晚餐', '饮品'];
const loadTags = () => {
  try {
    const stored = localStorage.getItem('food_tags');
    return stored ? JSON.parse(stored) : DEFAULT_TAGS;
  } catch (e) {
    return DEFAULT_TAGS;
  }
};

export default function RecordModal({ onClose, onSaved, initialDate, recordToEdit }: RecordModalProps) {
  const initialTags = loadTags();
  const [foodName, setFoodName] = useState(recordToEdit ? recordToEdit.foodName : '');
  const [mealType, setMealType] = useState<string>(recordToEdit ? recordToEdit.mealType : (initialTags[0] || '早餐'));
  const [price, setPrice] = useState(recordToEdit && recordToEdit.price !== undefined ? String(recordToEdit.price) : '');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isEditingTags, setIsEditingTags] = useState(false);
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
  const [progressPercent, setProgressPercent] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

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
      const newTags = tags.filter(t => t !== tag);
      saveTags(newTags);
      if (mealType === tag) setMealType(newTags[0] || '');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setProgressPercent(0);
    setErrorMsg('');



    let compressedFile: Blob;
    try {
      compressedFile = await resizeImage(file, 640);
    } catch (e) {
      console.warn("图片压缩失败，使用原图进行处理", e);
      compressedFile = file;
    }



    // 启动虚拟进度条更新
    let fakePercent = 0;
    const progressTimer = setInterval(() => {
      if (fakePercent < 30) {
        fakePercent += 1.5;
      } else if (fakePercent < 60) {
        fakePercent += 0.8;
      } else if (fakePercent < 85) {
        fakePercent += 0.4;
      } else if (fakePercent < 95) {
        fakePercent += 0.15;
      }
      setProgressPercent(Math.min(Math.round(fakePercent), 95));
    }, 200);
    
    try {
      // 1. 尝试调用 AI 去背景 (WASM 算法，使用本地托管资源)
      const processedBlob = await removeBackground(compressedFile as File, {
        publicPath: 'https://cdn.npmmirror.com/packages/@imgly/background-removal-data/1.4.5/files/dist/',
        model: 'small'
      });
      
      setProgressPercent(100);
      clearInterval(progressTimer);
      // 2. 绘制原图压暗 + 食物高亮 + 白色虚线
      const originalUrl = URL.createObjectURL(compressedFile);
      const cutoutUrl = URL.createObjectURL(processedBlob);
      drawSpotlightFood(originalUrl, cutoutUrl);
    } catch (err: any) {
      clearInterval(progressTimer);
      setErrorMsg(err?.message || String(err));
      console.warn("WASM去背景加载失败或超时，自动切换至形状裁剪贴纸:", err);
      // 兜底方案：使用原始大图，做聚光灯模糊兜底
      const originalUrl = URL.createObjectURL(compressedFile);
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

        // Removed orangeSilhouette logic

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
        const whiteBorder = 12;

        // 创建组合白边的离屏 Canvas
        const borderCanvas = document.createElement('canvas');
        borderCanvas.width = 300;
        borderCanvas.height = 300;
        const bCtx = borderCanvas.getContext('2d');
        if (bCtx) {
          // 朝 16 方向偏移绘制白色贴纸底边层
          for (let angle = 0; angle < 360; angle += 22.5) {
            const rad = (angle * Math.PI) / 180;
            const ox = Math.cos(rad) * whiteBorder;
            const oy = Math.sin(rad) * whiteBorder;
            bCtx.drawImage(whiteSilhouette, ox, oy);
          }
        }

        // 在主画布上绘制带有阴影的边框
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.shadowOffsetX = 0;
        ctx.drawImage(borderCanvas, 0, 0);
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
      price: price ? parseFloat(price) : undefined,
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
            background: '#EFE9DF', border: '1px solid var(--color-border)',
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '0 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#8A857C', fontWeight: 'bold' }}>
                    图片处理中... {progressPercent}%
                  </span>
                  <div style={{ width: '160px', height: '6px', background: '#EAE6DF', borderRadius: '4px', overflow: 'hidden', margin: '4px 0' }}>
                    <div style={{ 
                      width: `${progressPercent}%`, height: '100%', 
                      background: 'var(--color-green)', borderRadius: '4px',
                      transition: 'width 0.2s ease-out'
                    }} />
                  </div>
                  {errorMsg && (
                    <div style={{ color: '#FF5722', fontSize: '0.62rem', fontWeight: 'bold', marginTop: '2px' }}>
                      ❌ 错误: {errorMsg}
                    </div>
                  )}
                </div>
              ) : processedUrl ? (
                <img src={processedUrl} alt="food preview" style={{ 
                  height: '100%', width: '100%', objectFit: 'contain'
                }} />
              ) : (
                <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <Camera size={28} color="#B5A58E" />
                  <span style={{ fontSize: '0.75rem', color: '#8A857C', marginTop: '6px' }}>点击拍照记录食物</span>
                </div>
              )}
            </div>
            
            {!processedUrl && !processing && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); albumInputRef.current?.click(); }}
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
                <ImageIcon size={16} color="#8B7D6C" />
              </button>
            )}

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
            
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
            <input ref={albumInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {errorMsg && (
            <div style={{
              background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px',
              padding: '8px 12px', marginTop: '12px', width: '240px',
              fontSize: '0.7rem', color: '#C62828', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10
            }}>
              <div style={{ fontWeight: 'bold' }}>⚠️ 抠图算法异常:</div>
              <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: '1.3' }}>{errorMsg}</div>
            </div>
          )}
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
                      flex: 1, padding: '6px 10px', borderRadius: '18px', fontSize: '0.75rem',
                      border: '1px solid',
                      borderColor: isSelected && !isEditingTags ? 'var(--color-green)' : 'var(--color-border)',
                      background: isSelected && !isEditingTags ? 'var(--color-green)' : '#FFF',
                      color: isSelected && !isEditingTags ? '#FFF' : '#8A857C',
                      cursor: 'pointer',
                      fontWeight: isSelected && !isEditingTags ? 'bold' : 'normal',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      transition: 'all 0.15s ease',
                      minWidth: 'max-content'
                    }}
                  >
                    {type === '早餐' && <Sun size={10} />}
                    {type === '午餐' && <Sun size={10} />}
                    {type === '下午茶' && <Coffee size={10} />}
                    {type === '晚餐' && <Moon size={10} />}
                    {type === '夜宵' && <Coffee size={10} />}
                    {type === '饮品' && <Coffee size={10} />}
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
                  background: '#FAF6EE', color: '#8A857C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  minWidth: 'max-content'
                }}>
                  <Plus size={10} /> 新增
                </button>
              )}
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
