import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Heart, Users, MapPin, Star } from 'lucide-react';
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

  // 格式化日期为 YYYY-MM-DD
  const formatDateString = (d: Date) => d.toISOString().split('T')[0];

  const currentDayRecords = records.filter(r => {
    try {
      return formatDateString(new Date(r.timestamp)) === formatDateString(activeDate);
    } catch {
      return false;
    }
  });

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
        <button onClick={() => changeDate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={24} />
        </button>
        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
          {activeDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </span>
        <button onClick={() => changeDate(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
