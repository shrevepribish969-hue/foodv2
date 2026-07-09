import { type FoodRecord } from '../db';
import { X } from 'lucide-react';

interface DayStickerSelectModalProps {
  date: Date;
  records: FoodRecord[];
  onSelect: (recordId: string) => void;
  onClose: () => void;
  currentCoverId?: string;
}

export default function DayStickerSelectModal({ date, records, onSelect, onClose, currentCoverId }: DayStickerSelectModalProps) {
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(62, 58, 54, 0.4)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#FAF9F5', borderRadius: '16px', width: '100%', maxWidth: '320px', padding: '24px',
        boxShadow: '0 8px 30px rgba(62, 58, 54, 0.08)', border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--color-text)', fontSize: '1.05rem' }}>{dateStr} 贴纸选择</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8A857C', cursor: 'pointer', padding: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', 
          maxHeight: '300px', overflowY: 'auto', padding: '8px 0' 
        }}>
          {records.map(record => {
            const isSelected = record.id === currentCoverId;
            const imgUrl = record.imageBlob ? URL.createObjectURL(record.imageBlob) : null;
            
            return (
              <div 
                key={record.id}
                onClick={() => onSelect(record.id)}
                style={{
                  aspectRatio: '1', borderRadius: '8px', cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-green)' : '1px solid var(--color-border)',
                  background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '4px', position: 'relative'
                }}
                className="bouncy-hover"
                title={record.foodName}
              >
                {imgUrl ? (
                  <img src={imgUrl} alt={record.foodName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '1.5rem' }}>🍙</span>
                )}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    width: '14px', height: '14px', background: 'var(--color-green)',
                    borderRadius: '50%', border: '2px solid #FFF'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
