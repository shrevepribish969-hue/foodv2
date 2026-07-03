import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { MapPin, Users, Heart, Clock, Search } from 'lucide-react';

export default function FavoritesPage() {
  const [favRecords, setFavRecords] = useState<FoodRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFavs = async () => {
      const data = await getAllRecords();
      setFavRecords(data.filter(r => r.isFavorited));
    };
    fetchFavs();
  }, []);

  // 搜索过滤逻辑
  const filteredFavs = favRecords.filter(r => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return r.foodName.toLowerCase().includes(query) || 
           (r.location && r.location.toLowerCase().includes(query)) ||
           (r.diningWith && r.diningWith.toLowerCase().includes(query)) ||
           r.note.toLowerCase().includes(query);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 4px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 16px', color: 'var(--color-text)', letterSpacing: '2px' }}>
          我的收藏
        </h1>

        {/* 极简无印风搜索框 - 线条图标风格 */}
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#8A857C' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="搜索收藏的美食名称、地点或伙伴..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              background: '#FAF9F5',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
              letterSpacing: '0.5px'
            }}
          />
        </div>
      </div>

      {filteredFavs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A857C' }}>
          {favRecords.length === 0 ? (
            <>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>还没有收藏任何的美食回忆哦～</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>在记录或新增的时候点击“收藏”按钮即可保存在这里。</p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '0.85rem' }}>未检索到符合条件的美食收藏 🍙</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {filteredFavs.map((record) => {
            const imgUrl = record.imageBlob ? URL.createObjectURL(record.imageBlob) : null;
            
            // 格式化时间，如 "5月22日 18:30"
            const dateObj = new Date(record.timestamp);
            const timeString = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;

            return (
              <div key={record.id} style={{ 
                background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '12px',
                padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
                boxShadow: '0 4px 12px rgba(62, 58, 54, 0.03)'
              }}>
                <div style={{ height: '120px', background: 'none', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={record.foodName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '2.5rem' }}>🍙</span>
                  )}
                </div>
                <div>
                  {/* 食物标题 */}
                  <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{record.foodName}</h3>
                  {/* 食物备注 */}
                  <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#666', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>{record.note}</p>
                  
                  {/* 丰富的信息详情：时间、伙伴、地点 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: '#8A857C', borderTop: '1px dashed var(--color-border)', paddingTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      {timeString}
                    </span>
                    {record.diningWith && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={10} />
                        {record.diningWith}
                      </span>
                    )}
                    {record.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={10} />
                        {record.location}
                      </span>
                    )}
                  </div>

                  {/* 评分 */}
                  <div style={{ display: 'flex', marginTop: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Heart key={s} size={11} fill={s <= record.rating ? 'var(--color-pink)' : 'none'} color="var(--color-pink)" style={{ marginRight: '2px' }} />
                    ))}
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
