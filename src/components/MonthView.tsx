import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import DayStickerSelectModal from './DayStickerSelectModal';

interface MonthViewProps {
  onSelectDate: (date: Date) => void;
}

export default function MonthView({ onSelectDate }: MonthViewProps) {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 刷新状态与弹性动画触发 Key
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [randomParams, setRandomParams] = useState<{ rot: number; ox: number; oy: number; scale: number }[]>([]);

  // 长按选封面状态
  const [coverPrefs, setCoverPrefs] = useState<Record<string, string>>({});
  const [selectingDate, setSelectingDate] = useState<Date | null>(null);
  const [pressTimer, setPressTimer] = useState<number | null>(null);

  useEffect(() => {
    try {
      const prefs = localStorage.getItem('food_cover_prefs');
      if (prefs) setCoverPrefs(JSON.parse(prefs));
    } catch { }
  }, []);

  const handleSaveCover = (recordId: string) => {
    if (!selectingDate) return;
    const dateStr = selectingDate.toISOString().split('T')[0];
    const newPrefs = { ...coverPrefs, [dateStr]: recordId };
    setCoverPrefs(newPrefs);
    localStorage.setItem('food_cover_prefs', JSON.stringify(newPrefs));
    setSelectingDate(null);
  };

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

  // 生成周一作为起始日的日历网格
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

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
      oy: Math.floor(Math.random() * 11) - 5,    // -5 到 +5 像素偏移
      scale: 0.85 + Math.random() * 0.3          // 0.85 到 1.15
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
      oy: Math.floor(Math.random() * 11) - 5,
      scale: 0.85 + Math.random() * 0.3
    }));
    setRandomParams(params);
    setRefreshKey(prev => prev + 1);

    setTimeout(() => {
      setIsSpinning(false);
    }, 500);
  };
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  const totalDays = new Date(year, month + 1, 0).getDate();

  const emptyDays = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysArray: (Date | null)[] = [];
  
  // 填充月初空白格子
  for (let i = 0; i < emptyDays; i++) {
    daysArray.push(null);
  }
  // 填充日期
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(new Date(year, month, d));
  }

  const getDayRecords = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return records.filter(r => {
      try {
        return new Date(r.timestamp).toISOString().split('T')[0] === dateStr;
      } catch {
        return false;
      }
    });
  };

  return (
    <div style={{ 
      background: '#FAF9F5', border: '1px solid var(--color-border)', 
      borderRadius: '16px', padding: '20px 6px', 
      boxShadow: '0 4px 12px rgba(62, 58, 54, 0.03)' 
    }}>
      {/* 顶部月份导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)', margin: 0, letterSpacing: '0.5px' }}>
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A857C', padding: 0 }} className="bouncy-hover">
            <ChevronLeft size={22} />
          </button>
          <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A857C', padding: 0 }} className="bouncy-hover">
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* 星期标头 (周一至周日) */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
        textAlign: 'center', fontSize: '0.72rem', fontWeight: 'bold', 
        color: '#8A857C', marginBottom: '12px' 
      }}>
        {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(w => <div key={w}>{w}</div>)}
      </div>

      {/* 垂直长药丸胶囊日历网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 2px' }}>
        {daysArray.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} style={{ height: '68px' }} />;
          
          const dateStr = date.toISOString().split('T')[0];
          const dayRecords = getDayRecords(date);
          const hasRecord = dayRecords.length > 0;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          // 挑选最佳记录，优先使用偏好设置，否则按照评分和时间排序
          let bestRecord = coverPrefs[dateStr] 
            ? dayRecords.find(r => r.id === coverPrefs[dateStr]) 
            : undefined;
            
          if (!bestRecord) {
            bestRecord = [...dayRecords].sort((a, b) => {
              if (b.rating !== a.rating) return b.rating - a.rating;
              const aFav = a.isFavorited ? 1 : 0;
              const bFav = b.isFavorited ? 1 : 0;
              if (bFav !== aFav) return bFav - aFav;
              return b.timestamp - a.timestamp;
            })[0];
          }

          const handlePointerDown = () => {
            const timer = window.setTimeout(() => {
              if (navigator.vibrate) navigator.vibrate(50);
              setSelectingDate(date);
            }, 500);
            setPressTimer(timer);
          };

          const handlePointerUp = () => {
            if (pressTimer) clearTimeout(pressTimer);
            setPressTimer(null);
          };

          return (
            <button 
              key={date.toISOString()}
              type="button"
              onClick={() => { if (!selectingDate) onSelectDate(date); }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                height: '68px', 
                background: isToday ? 'var(--color-green)' : (hasRecord ? '#FAF9F5' : '#F2EFE7'),
                border: hasRecord ? '1px solid var(--color-border)' : '1px dashed rgba(227, 223, 213, 0.6)',
                borderRadius: '15px', // 微圆角
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: '2px', 
                cursor: 'pointer',
                overflow: 'visible',
                position: 'relative'
              }}
              className="bouncy-hover"
            >
              {/* 日期数字 - 绝对定位至左上角，精致排布 */}
              <span style={{ 
                position: 'absolute',
                left: '6px',
                top: '4px',
                fontSize: '0.65rem', 
                fontWeight: 'bold', 
                color: isToday ? '#FFF' : 'rgba(62, 58, 54, 0.55)',
                zIndex: 20
              }}>
                {date.getDate()}
              </span>

              {/* 单张精美美食贴纸展现区 (默认保留高度，无色纯留白，极限放大至 32px) */}
              <div style={{ 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginTop: '10px',
                position: 'relative' // 相对定位供 Badge 贴合
              }}>
                {bestRecord ? (
                  (() => {
                    const imgUrl = bestRecord.imageBlob ? URL.createObjectURL(bestRecord.imageBlob) : null;
                    return (
                      <>
                        <div 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '6px', 
                            overflow: 'visible', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            zIndex: 10
                          }}
                        >
                          {imgUrl ? (
                            <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="best preview" />
                          ) : (
                            <span style={{ fontSize: '1.1rem' }}>🍙</span>
                          )}
                        </div>

                        {/* 多餐数字角标 - 定位在贴纸右上方并遮盖一部分，极具手账悬浮感 */}
                        {dayRecords.length > 1 && (
                          <span style={{
                            position: 'absolute',
                            right: '-3px',
                            top: '-3px',
                            width: '13px',
                            height: '13px',
                            borderRadius: '50%',
                            background: isToday ? '#606A59' : '#FFF',
                            border: isToday ? 'none' : '1px solid var(--color-border)',
                            color: isToday ? '#FAF9F5' : '#8A857C',
                            fontSize: '0.55rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 25,
                            boxShadow: '0 1px 3px rgba(62,58,54,0.15)'
                          }}>
                            {dayRecords.length}
                          </span>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div style={{ width: '40px', height: '40px' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 底部图例 */}
      <div style={{ 
        display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#8A857C', 
        marginTop: '20px', paddingLeft: '4px' 
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(139, 125, 108, 0.2)', border: '1px solid var(--color-border)' }} /> 有记录
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F2EFE7', border: '1px dashed var(--color-border)' }} /> 无记录
        </span>
      </div>

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

              const params = randomParams[index] || { rot: 0, ox: 0, oy: 0, scale: 1 };

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
                    '--scale': `${params.scale}`,
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

      {selectingDate && (
        <DayStickerSelectModal
          date={selectingDate}
          records={getDayRecords(selectingDate)}
          currentCoverId={coverPrefs[selectingDate.toISOString().split('T')[0]]}
          onSelect={handleSaveCover}
          onClose={() => setSelectingDate(null)}
        />
      )}
    </div>
  );
}
