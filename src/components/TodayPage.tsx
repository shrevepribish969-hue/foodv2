import { useState, useEffect } from 'react';
import { Plus, Trash2, Heart, Users, MapPin, Star, Calendar } from 'lucide-react';
import { type FoodRecord, getAllRecords, deleteRecord } from '../db';
import RecordModal from './RecordModal';

interface TodayPageProps {
  activeDate: Date;
  setActiveDate?: (date: Date) => void;
}

export default function TodayPage({ activeDate }: TodayPageProps) {
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
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>还没有任何美食结绳哦～</p>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>点击右下角 “＋” 记录下你的第一顿美味吧！</p>
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
                      background: 'var(--color-yellow)', padding: '4px 14px', borderRadius: '14px',
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
                              // 简约画笔风格小占位图代替 Emoji
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2v20" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            )}
                          </div>

                          {/* 右侧记录详情 */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', background: 'var(--color-yellow)', color: 'var(--color-text)', marginRight: '6px', fontWeight: 'bold' }}>
                                    {record.mealType === 'breakfast' && '早餐'}
                                    {record.mealType === 'lunch' && '午餐'}
                                    {record.mealType === 'dinner' && '晚餐'}
                                    {record.mealType === 'tea' && '下午茶'}
                                    {record.mealType === 'night' && '夜宵'}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: '#999' }}>{timeString}</span>
                                </div>
                                <button onClick={() => handleDelete(record.id)} style={{ background: 'none', border: 'none', color: '#CCC', cursor: 'pointer' }} className="bouncy-hover">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              
                              <h3 style={{ margin: '8px 0 4px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                {record.foodName}
                                {record.isNewFood && <span style={{ fontSize: '0.75rem', color: 'var(--color-pink)', marginLeft: '6px', fontWeight: 'bold' }}>尝鲜</span>}
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
