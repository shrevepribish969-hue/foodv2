import { useState, useEffect } from 'react';
import { Plus, Trash2, Heart, Star, Settings, Sun, Moon, Coffee, Pencil } from 'lucide-react';
import { type FoodRecord, getAllRecords, deleteRecord, toLocalYMD } from '../db';
import RecordModal from './RecordModal';
import QuickNoteModal from './QuickNoteModal';

interface TodayPageProps {
  activeDate: Date;
  setActiveDate?: (date: Date) => void;
}

export default function TodayPage({ activeDate }: TodayPageProps) {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [pressTimer, setPressTimer] = useState<number | null>(null);
  const [selectedRecordToEdit, setSelectedRecordToEdit] = useState<FoodRecord | undefined>(undefined);

  const fetchRecords = async () => {
    const data = await getAllRecords();
    setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [activeDate]);

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    fetchRecords();
  };

  const handlePointerDown = () => {
    const timer = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setIsQuickNoteOpen(true);
    }, 500);
    setPressTimer(timer);
  };

  const handlePointerUp = () => {
    if (pressTimer) clearTimeout(pressTimer);
    setPressTimer(null);
  };

  // 按日期对记录进行分组 (降序)
  const groupRecordsByDate = () => {
    const groups: Record<string, FoodRecord[]> = {};
    records.forEach(r => {
      try {
        const dateStr = toLocalYMD(r.timestamp);
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(r);
      } catch (e) {
        console.warn(e);
      }
    });
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateStr, items]) => [
        dateStr,
        items.sort((a, b) => a.timestamp - b.timestamp)
      ] as [string, FoodRecord[]]);
  };

  const grouped = groupRecordsByDate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 4px' }}>
      {/* MUJI 极简 Header */}
      <header style={{ 
        display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px',
        position: 'sticky',
        top: '-16px',
        marginTop: '-16px',
        paddingTop: '16px',
        paddingBottom: '12px',
        background: 'var(--color-bg)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ 
            fontSize: '2rem', color: 'var(--color-text)', margin: '0', 
            fontWeight: 'bold', letterSpacing: '2px'
          }}>
            吃点好的
          </h1>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', opacity: 0.8 }}>
            <Settings size={22} />
          </button>
        </div>
        <p style={{ margin: '0', fontSize: '0.85rem', color: '#8A857C', letterSpacing: '0.5px' }}>
          用心记录每一餐，每一口都是美好回忆
        </p>
      </header>

      {/* 饮食列表长下滑时间线 */}
      <div style={{ position: 'relative', paddingLeft: '32px', minHeight: '300px' }}>
        {/* 极简原木色时间轴主干线 */}
        <div style={{
          position: 'absolute', left: '16px', top: '15px', bottom: '15px',
          width: '2px', background: 'var(--color-border)', borderRadius: '1px'
        }} />

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#8A857C' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>还没有任何美食结绳哦～</p>
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>点击右下角 “＋” 记录下你的第一顿美味吧！</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {grouped.map(([dateStr, dayRecords]) => {
              const displayDate = new Date(dateStr);
              const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
              const formattedDate = `${displayDate.getMonth() + 1}月${displayDate.getDate()}日 · ${dayNames[displayDate.getDay()]}`;

              return (
                <div key={dateStr} id={`date-node-${dateStr}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 时间线日期展示 */}
                  <div style={{ 
                    position: 'relative', left: '-32px', display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    {/* 时间轴圆圈小扣 */}
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: 'var(--color-green)', border: '2px solid var(--color-bg)',
                      boxShadow: '0 0 0 2px var(--color-border)', zIndex: 10
                    }} />
                    <span style={{ 
                      fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)',
                      background: '#FAF9F5', padding: '3px 12px', borderRadius: '12px',
                      border: '1px solid var(--color-border)'
                    }}>
                      {formattedDate}
                    </span>
                  </div>

                  {/* 该日期下所有的卡片列表 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dayRecords.map((record) => {
                      const recordDate = new Date(record.timestamp);
                      const timeString = recordDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                      const imgUrl = record.imageBlob ? URL.createObjectURL(record.imageBlob) : null;

                      return (
                        record.mealType === '闪念' ? (
                          <div 
                            key={record.id} 
                            onClick={() => { setSelectedRecordToEdit(record); setIsQuickNoteOpen(true); }}
                            style={{ 
                              position: 'relative', 
                              background: '#FFFDF0', 
                              border: '1px dashed #E5D5C5', 
                              borderRadius: '10px',
                              padding: '12px 16px', 
                              boxShadow: '0 2px 6px rgba(62, 58, 54, 0.02)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', color: '#B5A58E', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Pencil size={11} /> 闪念笔记 · {timeString}
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }} 
                                style={{ background: 'none', border: 'none', color: '#CCC', cursor: 'pointer', padding: 0 }} 
                                title="删除"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {record.note}
                            </p>
                          </div>
                        ) : (
                          <div 
                            key={record.id} 
                            onClick={() => { setSelectedRecordToEdit(record); setIsModalOpen(true); }}
                            style={{ 
                              position: 'relative', background: '#FAF9F5', 
                              border: '1px solid var(--color-border)', borderRadius: '12px',
                              padding: '16px', display: 'flex', gap: '16px',
                              boxShadow: '0 4px 12px rgba(62, 58, 54, 0.03)',
                              cursor: 'pointer'
                            }}
                          >
                          {/* 左侧食物贴纸 */}
                          <div style={{ 
                            width: '100px', height: '100px', flexShrink: 0, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            background: 'none', overflow: 'visible' 
                          }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={record.foodName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              // 默认极简饭团占位
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B5A58E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2v20" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            )}
                          </div>

                          {/* 右侧记录详情 */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              {/* 餐种与操作按钮 */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ 
                                  fontSize: '0.75rem', color: '#8A857C', 
                                  display: 'inline-flex', alignItems: 'center', gap: '4px' 
                                }}>
                                  {record.mealType === '早餐' && <><Sun size={12} /> 早餐</>}
                                  {record.mealType === '午餐' && <><Sun size={12} /> 午餐</>}
                                  {record.mealType === '晚餐' && <><Moon size={12} /> 晚餐</>}
                                  {record.mealType === '下午茶' && <><Coffee size={12} /> 下午茶</>}
                                  {record.mealType === '夜宵' && <><Moon size={12} /> 夜宵</>}
                                  {record.mealType === '饮品' && <><Coffee size={12} /> 饮品</>}
                                  {!['早餐', '午餐', '晚餐', '饮品', '夜宵', '下午茶'].includes(record.mealType) && <>{record.mealType}</>}
                                  <span style={{ fontSize: '0.75rem', color: '#B5A58E', marginLeft: '4px' }}>{timeString}</span>
                                </span>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }} 
                                    style={{ background: 'none', border: 'none', color: '#CCC', cursor: 'pointer', padding: 0 }} 
                                    title="删除"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              {/* 食物标题 */}
                              <h3 style={{ margin: '6px 0 3px', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
                                {record.foodName}
                                {record.isNewFood && <span style={{ fontSize: '0.7rem', color: 'var(--color-pink)', marginLeft: '6px', fontWeight: 'bold', border: '1px solid var(--color-pink)', padding: '1px 5px', borderRadius: '4px' }}>尝鲜</span>}
                              </h3>
                              
                              {/* 地点与就餐人标签 */}
                              {(record.diningWith || record.location) && (
                                <div style={{ 
                                  display: 'flex', gap: '6px', fontSize: '0.75rem', color: '#8A857C', margin: '2px 0 5px'
                                }}>
                                  <span>
                                    {record.diningWith || '自己'}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {record.location || '家里'}
                                  </span>
                                </div>
                              )}
                              
                              {/* 笔记正文 */}
                              <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#666', lineHeight: '1.4' }}>{record.note}</p>
                            </div>

                            {/* 底部评分 */}
                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                              <div style={{ display: 'flex' }}>
                                {[1,2,3,4,5].map((s) => (
                                  <Heart key={s} size={12} fill={s <= record.rating ? 'var(--color-pink)' : 'none'} color="var(--color-pink)" style={{ marginRight: '2px' }} />
                                ))}
                                {record.isFavorited && <Star size={12} fill="gold" color="gold" style={{ marginLeft: '6px' }} />}
                              </div>
                            </div>

                          </div>
                        </div>
                      )
                    );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 右下角卡其原木色悬浮添加按钮 */}
      <button 
        onClick={() => { if (!isQuickNoteOpen) setIsModalOpen(true); }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'fixed', right: '24px', bottom: '90px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--color-green)', color: '#FFF', border: 'none',
          boxShadow: '0 4px 15px rgba(139, 125, 108, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 90
        }}
        className="bouncy-hover"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {isQuickNoteOpen && (
        <QuickNoteModal 
          onClose={() => {
            setIsQuickNoteOpen(false);
            setSelectedRecordToEdit(undefined);
          }}
          onSaved={() => {
            fetchRecords();
            setSelectedRecordToEdit(undefined);
          }}
          initialDate={activeDate}
          recordToEdit={selectedRecordToEdit}
        />
      )}

      {isModalOpen && (
        <RecordModal 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRecordToEdit(undefined);
          }} 
          onSaved={() => {
            fetchRecords();
            setSelectedRecordToEdit(undefined);
          }} 
          initialDate={activeDate}
          recordToEdit={selectedRecordToEdit}
        />
      )}
    </div>
  );
}
