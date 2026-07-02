import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthViewProps {
  onSelectDate: (date: Date) => void;
}

export default function MonthView({ onSelectDate }: MonthViewProps) {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  // 生成日历格子
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray: (Date | null)[] = [];
  // 填充月初空白
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // 填充正常日期
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
    <div style={{ background: '#FFF', border: '2px solid var(--color-border)', borderRadius: '28px', padding: '16px', boxShadow: '0 6px 18px rgba(92, 75, 67, 0.04)' }}>
      {/* 顶部月份导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft /></button>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </span>
        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight /></button>
      </div>

      {/* 星期标头 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#999', marginBottom: '8px' }}>
        {['日', '一', '二', '三', '四', '五', '六'].map(w => <div key={w}>{w}</div>)}
      </div>

      {/* 日历网格贴纸墙 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {daysArray.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} style={{ height: '70px' }} />;
          
          const dayRecords = getDayRecords(date);
          const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];

          return (
            <button 
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              style={{
                height: '75px', background: isToday ? 'var(--color-yellow)' : '#FFFDF9',
                border: isToday ? '2px solid var(--color-pink)' : '1px solid var(--color-border)',
                borderRadius: '16px', display: 'flex', flexDirection: 'column', 
                justifyContent: 'space-between', padding: '6px', cursor: 'pointer',
                overflow: 'hidden', position: 'relative'
              }}
              className="bouncy-hover"
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isToday ? 'var(--color-pink)' : 'var(--color-text)' }}>
                {date.getDate()}
              </span>

              {/* 贴纸平铺层 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', width: '100%', overflow: 'hidden', height: '36px', alignItems: 'center', justifyContent: 'center' }}>
                {dayRecords.map((r) => {
                  const imgUrl = r.imageBlob ? URL.createObjectURL(r.imageBlob) : null;
                  return (
                    <div key={r.id} style={{ width: '16px', height: '16px', borderRadius: '4px', overflow: 'hidden', background: '#EAEAEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imgUrl ? <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="small preview" /> : <span style={{ fontSize: '0.6rem' }}>🍙</span>}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
