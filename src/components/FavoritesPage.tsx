import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { Star, MapPin, Users, Heart } from 'lucide-react';

export default function FavoritesPage() {
  const [favRecords, setFavRecords] = useState<FoodRecord[]>([]);

  useEffect(() => {
    const fetchFavs = async () => {
      const data = await getAllRecords();
      setFavRecords(data.filter(r => r.isFavorited));
    };
    fetchFavs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '1.2rem', margin: '0 0 8px', color: 'var(--color-pink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Star fill="var(--color-pink)" color="var(--color-pink)" size={20} />
        我的美食推荐收藏
      </h2>

      {favRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p style={{ margin: 0 }}>还没有收藏任何的美食回忆哦～</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>在记录的时候点击“收藏”按钮即可保存在这里。</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {favRecords.map((record) => {
            const imgUrl = record.imageBlob ? URL.createObjectURL(record.imageBlob) : null;
            return (
              <div key={record.id} style={{ 
                background: '#FFF', border: '2px solid var(--color-border)', borderRadius: '24px',
                padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
                boxShadow: '0 6px 18px rgba(92, 75, 67, 0.04)'
              }}>
                <div style={{ height: '120px', background: '#FAF6F0', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imgUrl ? <img src={imgUrl} alt={record.foodName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '3rem' }}>🍙</span>}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 'bold' }}>{record.foodName}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#888', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.note}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: '#999' }}>
                    {record.diningWith && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Users size={10} /> {record.diningWith}</span>}
                    {record.location && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {record.location}</span>}
                  </div>

                  <div style={{ display: 'flex', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Heart key={s} size={12} fill={s <= record.rating ? 'var(--color-pink)' : 'none'} color="var(--color-pink)" style={{ marginLeft: '1px' }} />
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
