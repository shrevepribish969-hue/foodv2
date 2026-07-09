import { useState } from 'react';
import './index.css';
import TodayPage from './components/TodayPage';
import MonthView from './components/MonthView';
import ReportPage from './components/ReportPage';
import FavoritesPage from './components/FavoritesPage';
import { Calendar, Grid, BarChart3, Heart } from 'lucide-react';

import { toLocalYMD } from './db';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'report' | 'favorites'>('today');
  const [activeDate, setActiveDate] = useState<Date>(new Date());

  const handleSelectDateFromCalendar = (date: Date) => {
    setActiveDate(date);
    setActiveTab('today');
    
    // 延迟滚动定位到对应日期的节点
    setTimeout(() => {
      const dateStr = toLocalYMD(date);
      const element = document.getElementById(`date-node-${dateStr}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--color-bg)'
    }}>
      <main style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px 16px 80px 16px', 
        boxSizing: 'border-box' 
      }}>
        {activeTab === 'today' && <TodayPage activeDate={activeDate} setActiveDate={setActiveDate} />}
        {activeTab === 'month' && <MonthView onSelectDate={handleSelectDateFromCalendar} />}
        {activeTab === 'report' && <ReportPage />}
        {activeTab === 'favorites' && (
          <FavoritesPage 
            onSelectDate={handleSelectDateFromCalendar} 
            setActiveTab={setActiveTab} 
          />
        )}
      </main>

      {/* MUJI 极简底栏导航 (带文字) */}
      <nav style={{ 
        position: 'fixed', 
        bottom: '0px', 
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '600px',
        background: 'rgba(250, 249, 245, 0.98)', 
        backdropFilter: 'blur(12px)',
        borderRadius: '0px', 
        padding: '10px 20px env(safe-area-inset-bottom, 12px) 20px', 
        display: 'flex', 
        justifyContent: 'space-around',
        boxShadow: '0 -4px 16px rgba(62, 58, 54, 0.04)',
        borderTop: '1px solid var(--color-border)',
        boxSizing: 'border-box',
        zIndex: 500
      }}>
        {([
          { key: 'today', label: '今天' },
          { key: 'month', label: '月视图' },
          { key: 'report', label: '回忆录' },
          { key: 'favorites', label: '收藏' }
        ] as const).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button 
              key={tab.key} 
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--color-green)' : '#8A857C',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)'
              }}
              className="bouncy-hover"
            >
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {tab.key === 'today' && <Calendar size={20} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'rgba(139, 125, 108, 0.15)' : 'none'} />}
                {tab.key === 'month' && <Grid size={20} strokeWidth={isActive ? 2.5 : 2} />}
                {tab.key === 'report' && <BarChart3 size={20} strokeWidth={isActive ? 2.5 : 2} />}
                {tab.key === 'favorites' && <Heart size={20} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'var(--color-green)' : 'none'} />}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 'bold' : 'normal', letterSpacing: '0.5px' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
