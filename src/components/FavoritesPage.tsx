import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { MapPin, Users, Heart, Clock, Search, Utensils, Sparkles, ArrowLeft } from 'lucide-react';
function GashaponMachineSVG({ active }: { active: boolean }) {
  return (
    <svg 
      width="160" 
      height="180" 
      viewBox="0 0 120 130" 
      fill="none" 
      className={active ? "gashapon-shake-active" : ""}
      style={{ overflow: 'visible', transition: 'transform 0.3s ease' }}
    >
      {/* 闪烁的小星星 (背景装饰) */}
      <path d="M12 25 L13 28 L16 29 L13 30 L12 33 L11 30 L8 29 L11 28 Z" fill="#F5C77E" opacity="0.8" className="sparkle-animate" />
      <path d="M108 55 L109 58 L112 59 L109 60 L108 63 L107 60 L104 59 L107 58 Z" fill="#F5C77E" opacity="0.8" className="sparkle-animate" />
      <path d="M15 90 L16 93 L19 94 L16 95 L15 98 L14 95 L11 94 L14 93 Z" fill="#F5C77E" opacity="0.6" />

      {/* 扭蛋机玻璃球 */}
      <circle cx="60" cy="45" r="32" fill="#FFFFFF" stroke="#3E3A36" strokeWidth="2.5" />
      <path d="M32 30 A 32 32 0 0 1 88 30 Z" fill="rgba(62,58,54,0.03)" />
      
      {/* 顶部盖子 */}
      <path d="M32 23 C 32 23, 38 14, 60 14 C 82 14, 88 23, 88 23 L91 26 L29 26 Z" fill="#E57373" stroke="#3E3A36" strokeWidth="2.5" />
      <circle cx="60" cy="12" r="3.5" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="2.5" />

      {/* 扭蛋机内的彩色小球 */}
      <circle cx="42" cy="55" r="5" fill="#E57373" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="53" cy="58" r="5" fill="#F5C77E" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="64" cy="56" r="5" fill="#81C784" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="75" cy="53" r="5" fill="#64B5F6" stroke="#3E3A36" strokeWidth="1.5" />
      
      <circle cx="48" cy="49" r="5" fill="#8B7D6C" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="59" cy="51" r="5" fill="#E57373" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="70" cy="48" r="5" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="1.5" />
      
      <circle cx="39" cy="44" r="5" fill="#64B5F6" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="50" cy="42" r="5" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="61" cy="43" r="5" fill="#F5C77E" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="72" cy="41" r="5" fill="#81C784" stroke="#3E3A36" strokeWidth="1.5" />

      {/* 问号小牌子 */}
      <circle cx="60" cy="41" r="10" fill="#FFFFFF" stroke="#3E3A36" strokeWidth="2" />
      <text x="60" y="45" fontSize="11" fontWeight="bold" fill="#FF9800" textAnchor="middle">?</text>

      {/* 扭蛋机金线底部 */}
      <path d="M30 73 L90 73 C93 73, 95 75, 95 78 L91 106 C91 109, 88 111, 85 111 L35 111 C32 111, 29 109, 29 106 L25 78 C25 75, 27 73, 30 73 Z" fill="#F5C77E" stroke="#3E3A36" strokeWidth="2.5" />
      <path d="M27 73 L93 73 L91 79 L29 79 Z" fill="#E57373" stroke="#3E3A36" strokeWidth="2" />
      
      {/* 旋钮和出蛋口 */}
      <circle cx="43" cy="91" r="7" fill="#FFFFFF" stroke="#3E3A36" strokeWidth="2" />
      <text x="43" y="94" fontSize="8" fontWeight="bold" fill="#3E3A36" textAnchor="middle">?</text>

      <circle cx="60" cy="91" r="8" fill="#3E3A36" />
      <circle cx="60" cy="91" r="3" fill="#FFFFFF" />
      <path d="M60 85 L60 97" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      <rect x="74" y="86" width="12" height="14" rx="2" fill="#3E3A36" />
      <rect x="73" y="85" width="14" height="16" rx="3" fill="none" stroke="#3E3A36" strokeWidth="1.5" />
      <circle cx="80" cy="96" r="4.5" fill="#FAF9F5" stroke="#3E3A36" strokeWidth="1" />
      
      <rect x="25" y="111" width="70" height="4" rx="2" fill="#E57373" stroke="#3E3A36" strokeWidth="2" />
    </svg>
  );
}

interface FavoritesPageProps {
  onSelectDate?: (date: Date) => void;
  setActiveTab?: (tab: 'today' | 'month' | 'report' | 'favorites') => void;
}

export default function FavoritesPage({ onSelectDate: _onSelectDate, setActiveTab: _setActiveTab }: FavoritesPageProps) {
  const [favRecords, setFavRecords] = useState<FoodRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFavs = async () => {
      const data = await getAllRecords();
      setFavRecords(data.filter(r => r.isFavorited));
    };
    fetchFavs();
  }, []);

  // 扭蛋机相关状态
  const [showGashapon, setShowGashapon] = useState(false);
  const [gashaponState, setGashaponState] = useState<'ready' | 'shaking' | 'revealed'>('ready');
  const [candidates, setCandidates] = useState<FoodRecord[]>([]);
  const [drawnHistory, setDrawnHistory] = useState<FoodRecord[]>([]);
  const [currentSelection, setCurrentSelection] = useState<FoodRecord | null>(null);

  // 1. 获取近30天内符合推荐标准的食物候选池
  useEffect(() => {
    const fetchCandidates = async () => {
      const allRecords = await getAllRecords();
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

      // 过滤出最近 30 天且评分 >= 3 的记录
      const recentRecords = allRecords.filter(r => {
        return (now - r.timestamp) <= thirtyDaysMs && r.rating >= 3;
      });

      // 按食物名称分组，找出每种食物的最新用餐时间
      const foodGroups: { [name: string]: FoodRecord } = {};
      recentRecords.forEach(r => {
        const name = r.foodName.trim();
        if (!foodGroups[name] || r.timestamp > foodGroups[name].timestamp) {
          foodGroups[name] = r;
        }
      });

      // 过滤掉最近 5 天内吃过的食物
      let validCandidates = Object.values(foodGroups).filter(r => {
        return (now - r.timestamp) >= fiveDaysMs;
      });

      // 第一重错开最近5天的兜底
      if (validCandidates.length === 0) {
        validCandidates = Object.values(foodGroups);
      }

      // 第二重所有历史高分兜底
      if (validCandidates.length === 0) {
        const allFoodGroups: { [name: string]: FoodRecord } = {};
        allRecords.filter(r => r.rating >= 3).forEach(r => {
          const name = r.foodName.trim();
          if (!allFoodGroups[name] || r.timestamp > allFoodGroups[name].timestamp) {
            allFoodGroups[name] = r;
          }
        });
        validCandidates = Object.values(allFoodGroups);
      }

      // 第三重内置贴纸兜底
      if (validCandidates.length === 0) {
        const mockStickers = [
          {
            id: 'mock-1',
            timestamp: now - 27 * 24 * 60 * 60 * 1000,
            foodName: '重庆小面',
            mealType: 'lunch',
            rating: 5,
            isNewFood: false,
            isFavorited: true,
            note: '麻辣鲜香，面条筋道，绝美午餐！',
            imageBlob: undefined
          },
          {
            id: 'mock-2',
            timestamp: now - 15 * 24 * 60 * 60 * 1000,
            foodName: '奶油培根意面',
            mealType: 'dinner',
            rating: 4,
            isNewFood: false,
            isFavorited: true,
            note: '浓郁奶油香，意面软硬适中，配培根超赞。',
            imageBlob: undefined
          },
          {
            id: 'mock-3',
            timestamp: now - 10 * 24 * 60 * 60 * 1000,
            foodName: '麻辣火锅',
            mealType: 'dinner',
            rating: 5,
            isNewFood: false,
            isFavorited: true,
            note: '跟朋友一起吃的麻辣火锅，热气腾腾，满足！',
            imageBlob: undefined
          },
          {
            id: 'mock-4',
            timestamp: now - 30 * 24 * 60 * 60 * 1000,
            foodName: '提拉米苏',
            mealType: 'tea',
            rating: 5,
            isNewFood: false,
            isFavorited: true,
            note: '甜而不腻，带着一点咖啡的苦香。',
            imageBlob: undefined
          }
        ];
        validCandidates = mockStickers as FoodRecord[];
      }

      setCandidates(validCandidates);
    };

    if (showGashapon) {
      fetchCandidates();
    }
  }, [showGashapon]);

  // 2. 摇一摇抽签逻辑
  const triggerDraw = () => {
    if (candidates.length === 0) return;
    setGashaponState('shaking');

    setTimeout(() => {
      const drawnNames = drawnHistory.map(r => r.foodName.trim());
      let available = candidates.filter(c => !drawnNames.includes(c.foodName.trim()));

      if (available.length === 0) {
        available = candidates;
      }

      const selected = available[Math.floor(Math.random() * available.length)];
      setDrawnHistory(prev => [...prev, selected]);
      setCurrentSelection(selected);
      setGashaponState('revealed');
    }, 1200);
  };

  const handleNextDraw = () => {
    if (drawnHistory.length < 4) {
      triggerDraw();
    }
  };

  const handleAccept = () => {
    setShowGashapon(false);
    setGashaponState('ready');
    setDrawnHistory([]);
    setCurrentSelection(null);
  };

  const getDaysAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

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
      <header style={{ 
        position: 'sticky',
        top: '-16px',
        marginTop: '-16px',
        paddingTop: '16px',
        paddingBottom: '12px',
        background: 'var(--color-bg)',
        zIndex: 100
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 16px', color: 'var(--color-text)', letterSpacing: '2px' }}>
          我的收藏
        </h1>

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
      </header>

      {/* 扭蛋机“今天吃什么”卡片入口 */}
      <div style={{
        background: 'linear-gradient(135deg, #F2EFE7 0%, #FAF9F5 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(62, 58, 54, 0.03)',
        marginTop: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ flex: 1, zIndex: 2 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            今天吃什么？ <Sparkles size={16} className="sparkle-animate" style={{ color: '#E57373' }} />
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8A857C', margin: '0 0 16px 0', maxWidth: '80%' }}>不知道吃什么？摇一摇扭蛋机试试运气吧～</p>
          <button 
            type="button"
            onClick={() => {
              setShowGashapon(true);
              setGashaponState('ready');
              setDrawnHistory([]);
              setCurrentSelection(null);
            }}
            style={{ 
              background: 'var(--color-green)', 
              border: 'none', 
              borderRadius: '20px', 
              padding: '8px 24px', 
              color: '#FFF', 
              fontSize: '0.8rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(139, 125, 108, 0.2)'
            }} 
            className="bouncy-hover"
          >
            开始扭蛋
          </button>
        </div>
        <div style={{ zIndex: 1, marginRight: '-15px', transform: 'scale(0.85)' }}>
          <GashaponMachineSVG active={false} />
        </div>
      </div>

      {/* 扭蛋抽签全屏遮罩弹窗 */}
      {showGashapon && (
        <div className="gashapon-overlay">
          <div style={{
            width: '95%',
            maxWidth: '360px',
            background: '#FAF6F0',
            borderRadius: '24px',
            border: '1px solid var(--color-border)',
            padding: '24px 20px',
            boxShadow: '0 10px 30px rgba(62, 58, 54, 0.12)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}>
            {/* 顶部控制栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px' }}>
              <button 
                onClick={handleAccept}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A857C', display: 'flex', alignItems: 'center', padding: 0 }}
                className="bouncy-hover"
              >
                <ArrowLeft size={20} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#8A857C', background: '#F2EFE7', padding: '3px 10px', borderRadius: '12px' }}>
                {gashaponState === 'revealed' ? '推荐结果' : '扭蛋中'}
              </span>
            </div>

            {/* 1. 准备/晃动状态 */}
            {(gashaponState === 'ready' || gashaponState === 'shaking') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    今天吃什么？
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#8A857C', margin: 0 }}>摇一摇，扭出今日美味灵感 🎁</p>
                </div>

                <div style={{ position: 'relative', width: '200px', height: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <GashaponMachineSVG active={gashaponState === 'shaking'} />
                  
                  {/* 扭蛋球下坠动效 */}
                  {gashaponState === 'shaking' && (
                    <div className="egg-falling-active" style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFF 0%, #E57373 100%)',
                      border: '2.5px solid #3E3A36',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      marginTop: '-15px',
                      zIndex: 20
                    }} />
                  )}
                </div>

                {gashaponState === 'ready' && (
                  <button 
                    onClick={triggerDraw}
                    disabled={candidates.length === 0}
                    style={{
                      background: candidates.length === 0 ? '#E3DFD5' : 'var(--color-green)',
                      color: '#FFF', border: 'none', borderRadius: '20px',
                      padding: '10px 32px', fontSize: '0.85rem', fontWeight: 'bold',
                      cursor: candidates.length === 0 ? 'not-allowed' : 'pointer',
                      marginTop: '12px',
                      boxShadow: '0 2px 6px rgba(139, 125, 108, 0.2)'
                    }}
                    className="bouncy-hover"
                  >
                    {candidates.length === 0 ? '无可推荐美味' : '摇动旋钮'}
                  </button>
                )}
              </div>
            )}

            {/* 2. 单个推荐卡片状态 (Transparent style) */}
            {gashaponState === 'revealed' && currentSelection && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '10px 0' }}>
                <div style={{
                  width: '180px', height: '180px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', marginBottom: '16px'
                }}>
                  {getDaysAgo(currentSelection.timestamp) >= 20 && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: '#FFF', border: '1px solid #FF9800',
                      color: '#FF9800', fontSize: '0.55rem', fontWeight: 'bold',
                      padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px',
                      boxShadow: '0 1px 3px rgba(255,152,0,0.1)',
                      zIndex: 10
                    }}>
                      🔥 好久没吃了
                    </span>
                  )}
                  {currentSelection.imageBlob ? (
                    (() => {
                      const imgUrl = URL.createObjectURL(currentSelection.imageBlob);
                      return (
                        <img 
                          src={imgUrl} 
                          alt={currentSelection.foodName} 
                          style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }} 
                        />
                      );
                    })()
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFF9E6 0%, #FFECB3 100%)',
                      border: '3.5px solid #FFF',
                      boxShadow: '0 4px 10px rgba(62,58,54,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4E3629',
                      gap: '2px'
                    }}>
                      <Utensils size={24} style={{ opacity: 0.8 }} />
                      <span style={{ fontSize: '0.45rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>DELICIOUS</span>
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#4E3629', textShadow: '1px 1px 0px #FAF6F0' }}>
                  {currentSelection.foodName}
                </h3>

                <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Heart 
                      key={s} size={14} 
                      fill={s <= currentSelection.rating ? 'var(--color-pink)' : 'none'} 
                      color="var(--color-pink)" 
                    />
                  ))}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#8A857C', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> 距离上次吃：{getDaysAgo(currentSelection.timestamp)} 天前
                </p>

                {/* 底部按键 */}
                <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                  {drawnHistory.length < 4 && (
                    <button 
                      onClick={handleNextDraw}
                      style={{
                        flex: 1, background: '#FAF9F5', border: '1px solid var(--color-border)',
                        borderRadius: '20px', padding: '10px 0', fontSize: '0.85rem',
                        fontWeight: 'bold', color: 'var(--color-text)', cursor: 'pointer'
                      }}
                      className="bouncy-hover"
                    >
                      换一个
                    </button>
                  )}
                  <button 
                    onClick={handleAccept}
                    style={{
                      flex: 1, background: 'var(--color-green)', border: 'none',
                      borderRadius: '20px', padding: '10px 0', fontSize: '0.85rem',
                      fontWeight: 'bold', color: '#FFF', cursor: 'pointer'
                    }}
                    className="bouncy-hover"
                  >
                    就它了
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              <div 
                key={record.id} 
                onClick={() => {
                  if (_onSelectDate) {
                    _onSelectDate(new Date(record.timestamp));
                  }
                }}
                style={{ 
                  background: '#FAF9F5', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '12px',
                  padding: '12px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(62, 58, 54, 0.03)',
                  cursor: _onSelectDate ? 'pointer' : 'default'
                }}
                className="bouncy-hover"
              >
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
