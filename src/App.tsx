import { useState } from 'react';
import './index.css';
import TodayPage from './components/TodayPage';
import MonthView from './components/MonthView';
import ReportPage from './components/ReportPage';
import FavoritesPage from './components/FavoritesPage';
import { Calendar, Grid, BarChart3, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'report' | 'favorites'>('today');
  const [activeDate, setActiveDate] = useState<Date>(new Date());

  const handleSelectDateFromCalendar = (date: Date) => {
    setActiveDate(date);
    setActiveTab('today');
    
    // 延迟滚动定位到对应日期的节点
    setTimeout(() => {
      const dateStr = date.toISOString().split('T')[0];
      const element = document.getElementById(`date-node-${dateStr}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* 重新设计的艺术 Logo */}
      <header style={{ 
        textAlign: 'center', margin: '24px 0 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 可爱小饭团 SVG 图标 */}
          <svg width="42" height="42" viewBox="0 0 100 100" style={{ transform: 'rotate(-5deg)' }}>
            <path d="M 50 10 C 75 10, 90 70, 85 85 C 80 95, 20 95, 15 85 C 10 70, 25 10, 50 10 Z" fill="#FFF" stroke="var(--color-border)" strokeWidth="6" />
            {/* 海苔 */}
            <rect x="38" y="65" width="24" height="25" rx="4" fill="var(--color-text)" />
            {/* 可爱表情 */}
            <circle cx="38" cy="45" r="4" fill="var(--color-text)" />
            <circle cx="62" cy="45" r="4" fill="var(--color-text)" />
            <path d="M 46 54 Q 50 58 54 54" fill="none" stroke="var(--color-text)" strokeWidth="4" strokeLinecap="round" />
            {/* 红晕 */}
            <ellipse cx="30" cy="50" rx="5" ry="3" fill="var(--color-pink)" opacity="0.6" />
            <ellipse cx="70" cy="50" rx="5" ry="3" fill="var(--color-pink)" opacity="0.6" />
          </svg>
          <h1 style={{ 
            fontSize: '2.5rem', color: 'var(--color-pink)', margin: '0', 
            fontWeight: 'bold', letterSpacing: '4px',
            textShadow: '3px 3px 0px #FFF'
          }}>
            吃点好的
          </h1>
        </div>
        
        {/* Logo 下方波浪虚线装饰 */}
        <div style={{ 
          width: '180px', height: '6px', 
          borderBottom: '3px dashed var(--color-pink)', opacity: 0.5,
          marginBottom: '4px'
        }} />
        <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--color-text)', opacity: 0.7, fontWeight: 500 }}>
          用心记录每一餐，每一口都是美好回忆
        </p>
      </header>

      <main style={{ flex: 1, paddingBottom: '90px' }}>
        {activeTab === 'today' && <TodayPage activeDate={activeDate} setActiveDate={setActiveDate} />}
        {activeTab === 'month' && <MonthView onSelectDate={handleSelectDateFromCalendar} />}
        {activeTab === 'report' && <ReportPage />}
        {activeTab === 'favorites' && <FavoritesPage />}
      </main>

      {/* 极简底栏导航 (无文字) */}
      <nav style={{ 
        position: 'fixed', 
        bottom: '24px', 
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '568px',
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(12px)',
        borderRadius: '24px', 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-around',
        boxShadow: '0 8px 32px rgba(92, 75, 67, 0.08)',
        border: '2px solid var(--color-border)',
        zIndex: 500
      }}>
        {(['today', 'month', 'report', 'favorites'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button 
              key={tab} 
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--color-pink)' : 'var(--color-text)',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: isActive ? 'scale(1.2)' : 'scale(1)'
              }}
              className="bouncy-hover"
            >
              {tab === 'today' && <Calendar size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'rgba(255, 182, 193, 0.2)' : 'none'} />}
              {tab === 'month' && <Grid size={24} strokeWidth={isActive ? 2.5 : 2} />}
              {tab === 'report' && <BarChart3 size={24} strokeWidth={isActive ? 2.5 : 2} />}
              {tab === 'favorites' && <Heart size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'var(--color-pink)' : 'none'} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
