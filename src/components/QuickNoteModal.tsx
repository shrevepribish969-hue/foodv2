import { useState } from 'react';
import { type FoodRecord, addRecord } from '../db';

interface QuickNoteModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialDate?: Date;
}

export default function QuickNoteModal({ onClose, onSaved, initialDate }: QuickNoteModalProps) {
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!note.trim()) {
      alert('请输入内容');
      return;
    }
    const record: FoodRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: initialDate ? initialDate.getTime() : Date.now(),
      foodName: '闪念笔记',
      mealType: '闪念',
      rating: 5,
      isNewFood: false,
      isFavorited: false,
      note: note.trim(),
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
        background: '#FAF9F5', borderRadius: '16px', width: '100%', maxWidth: '320px', padding: '24px',
        boxShadow: '0 8px 30px rgba(62, 58, 54, 0.08)', border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--color-text)', fontSize: '1.05rem' }}>闪念笔记</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8A857C', cursor: 'pointer' }}>取消</button>
        </div>
        <textarea
          placeholder="此刻的想法..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
          style={{
            width: '100%', height: '120px', padding: '12px', background: '#FAF6EE', 
            borderRadius: '12px', border: 'none', resize: 'none', outline: 'none', 
            boxSizing: 'border-box', fontFamily: 'var(--font-cute)', color: 'var(--color-text)',
            fontSize: '0.9rem'
          }}
        />
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '12px', marginTop: '16px', borderRadius: '12px',
            background: 'var(--color-green)', color: '#FFF', border: 'none', fontWeight: 'bold', cursor: 'pointer'
          }}
          className="bouncy-hover"
        >
          保存
        </button>
      </div>
    </div>
  );
}
