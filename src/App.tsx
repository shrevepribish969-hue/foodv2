import { useState } from 'react';
import './index.css';
import TodayPage from './components/TodayPage';
import MonthView from './components/MonthView';
import ReportPage from './components/ReportPage';
import FavoritesPage from './components/FavoritesPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'report' | 'favorites'>('today');
  const [activeDate, setActiveDate] = useState<Date>(new Date());

  const handleSelectDateFromCalendar = (date: Date) => {
    setActiveDate(date);
    setActiveTab('today');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <header style={{ textAlign: 'center', margin: '12px 0 20px' }}>
        <h1 style={{ 
          fontSize: '2.2rem', color: 'var(--color-pink)', margin: '0', 
          fontWeight: 'bold', letterSpacing: '2px',
          textShadow: '2px 2px 0px #FFF'
        }}>
          吃点好的 ✨
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--color-text)', opacity: 0.7, fontWeight: 500 }}>
          用心记录每一餐，每一口都是美好回忆
        </p>
      </header>

      <main style={{ flex: 1, paddingBottom: '80px' }}>
        {activeTab === 'today' && <TodayPage activeDate={activeDate} setActiveDate={setActiveDate} />}
        {activeTab === 'month' && <MonthView onSelectDate={handleSelectDateFromCalendar} />}
        {activeTab === 'report' && <ReportPage />}
        {activeTab === 'favorites' && <FavoritesPage />}
      </main>

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
        padding: '12px 16px', 
        display: 'flex', 
        justifyContent: 'space-around',
        boxShadow: '0 8px 32px rgba(92, 75, 67, 0.08)',
        border: '2px solid var(--color-border)',
        zIndex: 500
      }}>
        {(['today', 'month', 'report', 'favorites'] as const).map((tab) => (
          <button 
            key={tab} 
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--color-pink)' : 'var(--color-text)',
              fontWeight: activeTab === tab ? 'bold' : '500',
              cursor: 'pointer',
              fontSize: '0.95rem',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease'
            }}
            className="bouncy-hover"
          >
            <span style={{ fontSize: '1.2rem' }}>
              {tab === 'today' && '🌸'}
              {tab === 'month' && '📅'}
              {tab === 'report' && '📝'}
              {tab === 'favorites' && '💖'}
            </span>
            <span>
              {tab === 'today' && '今天'}
              {tab === 'month' && '月视图'}
              {tab === 'report' && '回忆录'}
              {tab === 'favorites' && '推荐收藏'}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
