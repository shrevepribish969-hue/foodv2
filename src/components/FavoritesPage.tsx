import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { MapPin, Users, Heart, Clock, Search, Utensils, Sparkles, ArrowLeft, RotateCw } from 'lucide-react';

function GashaponMachineSVG({ active }: { active: boolean }) {
  return (
    <svg 
      width="160" 
      height="180" 
      viewBox="0 0 120 130" 
      fill="none" 
      className={active ? "gashapon-active" : ""}
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

      {/* 扭蛋机金线底座 */}
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

export default function FavoritesPage({ onSelectDate, setActiveTab }: FavoritesPageProps) {
  const [favRecords, setFavRecords] = useState<FoodRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFavs = async () => {
      const data = await getAllRecords();
      setFavRecords(data.filter(r => r.isFavorited));
    };
    fetchFavs();
  }, []);

  // 扭蛋机相关状态与数据推荐算法
  const [showGashapon, setShowGashapon] = useState(false);
  const [gashaponState, setGashaponState] = useState<'ready' | 'shaking' | 'revealed' | 'show-all'>('ready');
  const [candidates, setCandidates] = useState<FoodRecord[]>([]);
  const [drawnHistory, setDrawnHistory] = useState<FoodRecord[]>([]);
  const [currentSelection, setCurrentSelection] = useState<FoodRecord | null>(null);

  // 1. 获取近30天内符合推荐标准的食物作为候选池
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

      // 过滤掉最近 5 天内吃过的食物（即最新时间戳距离现在 < 5天）
      let validCandidates = Object.values(foodGroups).filter(r => {
        return (now - r.timestamp) >= fiveDaysMs;
      });

      // 【第一重兜底】：如果在最近 5-30 天内没有评分 >=3 且未吃过的记录
      // 放宽限制，只要求最近 30 天内且评分 >= 3，不排除最近 5 天吃的
      if (validCandidates.length === 0) {
        validCandidates = Object.values(foodGroups);
      }

      // 【第二重兜底】：如果依然为空（说明最近 30 天内没有记录或评分全部 <3）
      // 那么使用全历史记录中所有评分 >=3 且包含抠图贴纸（或整体记录）的记录
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

      // 【第三重兜底】：如果数据库彻底为空（全新账户测试）
      // 采用系统静态默认推荐贴纸池，确保测试和使用 100% 可用且可顺利玩耍
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

  // 2. 触发扭蛋抽取事件
  const triggerDraw = () => {
    if (candidates.length === 0) return;
    setGashaponState('shaking');

    // 过滤掉当前会话中已经抽出来的食物
    let available = candidates.filter(
      c => !drawnHistory.some(h => h.foodName === c.foodName)
    );
    // 兜底逻辑：若候选池抽空了则直接从完整候选池中抽取
    if (available.length === 0) {
      available = candidates;
    }

    // 随机抽选一个
    const randomIndex = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndex];

    // 播放 1.2 秒的扭动与震动动画，然后进入显示页面
    setTimeout(() => {
      setDrawnHistory(prev => [...prev, chosen]);
      setCurrentSelection(chosen);
      setGashaponState('revealed');
    }, 1200);
  };

  // 3. 处理“换一个”点击事件
  const handleNextDraw = () => {
    // 如果已经抽了 3 个（当前在 4/4 状态），再点击“换一个”将自动抽出第 4 个，并跳转到汇总页面
    if (drawnHistory.length === 3) {
      let available = candidates.filter(
        c => !drawnHistory.some(h => h.foodName === c.foodName)
      );
      if (available.length === 0) available = candidates;

      const randomIndex = Math.floor(Math.random() * available.length);
      const chosen = available[randomIndex];

      setDrawnHistory(prev => [...prev, chosen]);
      setGashaponState('show-all');
    } else {
      triggerDraw();
    }
  };

  // 4. 选择完成关闭弹窗
  const handleAccept = () => {
    setShowGashapon(false);
    // 重置抽签状态
    setDrawnHistory([]);
    setCurrentSelection(null);
    setGashaponState('ready');
  };

  // 5. 计算距离上次吃的天数
  const getDaysAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

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
          <p style={{ fontSize: '0.8rem', color: '#8A857C', margin: '0 0 16px 0', maxWidth: '80%' }}>不知道吃什么？摇一摇试试运气吧～</p>
          <button 
            type="button"
            onClick={() => {
              setShowGashapon(true);
              setGashaponState('ready');
              setDrawnHistory([]);
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
            开始抽签
          </button>
        </div>
        <div style={{ zIndex: 1, marginRight: '-10px', transform: 'scale(0.85)' }}>
          <GashaponMachineSVG active={false} />
        </div>
      </div>

      {/* 扭蛋抽签全屏遮罩弹窗 */}
      {showGashapon && (
        <div className="gashapon-overlay">
          <div style={{
            width: '90%',
            maxWidth: '420px',
            background: '#FAF9F5',
            borderRadius: '24px',
            border: '1px solid var(--color-border)',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(62, 58, 54, 0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}>
            {/* 顶部控制栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
              <button 
                onClick={handleAccept}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A857C', display: 'flex', alignItems: 'center', padding: 0 }}
                className="bouncy-hover"
              >
                <ArrowLeft size={20} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#8A857C', background: '#F2EFE7', padding: '3px 10px', borderRadius: '12px' }}>
                {gashaponState === 'show-all' ? '本次推荐' : `${drawnHistory.length + 1}/4`}
              </span>
            </div>

            {/* 1. 准备/晃动状态面 */}
            {(gashaponState === 'ready' || gashaponState === 'shaking') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
                <GashaponMachineSVG active={gashaponState === 'shaking'} />
                
                {/* 扭蛋掉落轨迹 */}
                {gashaponState === 'shaking' && (
                  <div className="egg-falling" style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: ['#E57373', '#8B7D6C', '#FFF'][Math.floor(Math.random() * 3)],
                    border: '2px solid #3E3A36',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    marginTop: '-24px',
                    zIndex: 20
                  }} />
                )}

                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-text)' }}>摇一摇</h3>
                  <p style={{ fontSize: '0.75rem', color: '#8A857C', margin: 0 }}>抽出今天的灵感美食吧✨</p>
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
                      marginTop: '10px'
                    }}
                    className="bouncy-hover"
                  >
                    {candidates.length === 0 ? '无可抽取美味' : '摇动旋钮'}
                  </button>
                )}
                
                <span style={{ fontSize: '0.65rem', color: '#8A857C', marginTop: '10px' }}>
                  今日已推荐 {drawnHistory.length}/4 次
                </span>
              </div>
            )}

            {/* 2. 抽中结果单卡状态面 */}
            {gashaponState === 'revealed' && currentSelection && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '10px 0' }}>
                {/* 贴纸展示 */}
                <div style={{
                  width: '180px', height: '180px',
                  background: '#FFF', border: '2px solid #FFF',
                  borderRadius: '16px',
                  boxShadow: '0 6px 20px rgba(62, 58, 54, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', marginBottom: '24px'
                }}>
                  {/* 好久没吃标记 */}
                  {getDaysAgo(currentSelection.timestamp) >= 20 && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: '#FFF', border: '1px solid #FF9800',
                      color: '#FF9800', fontSize: '0.55rem', fontWeight: 'bold',
                      padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px',
                      boxShadow: '0 1px 3px rgba(255,152,0,0.1)'
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
                          style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.1))' }} 
                        />
                      );
                    })()
                  ) : (
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: '#FAF9F5', border: '1.5px dashed var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A857C'
                    }}>
                      <Utensils size={28} />
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
                  {currentSelection.foodName}
                </h3>

                {/* 评分心心 */}
                <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Heart 
                      key={s} size={14} 
                      fill={s <= currentSelection.rating ? 'var(--color-pink)' : 'none'} 
                      color="var(--color-pink)" 
                    />
                  ))}
                  <span style={{ fontSize: '0.75rem', color: '#8A857C', marginLeft: '6px', fontWeight: 'bold' }}>
                    {currentSelection.rating.toFixed(1)}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#8A857C', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> 距离上次吃：{getDaysAgo(currentSelection.timestamp)} 天前
                </p>

                {/* 控制按钮 */}
                <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
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

            {/* 3. 终极四选一汇总状态面 */}
            {gashaponState === 'show-all' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#E57373', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    ✨ 本次推荐 ✨
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#8A857C', margin: 0 }}>本次推荐已用完啦~ 挑一个你最想吃的吧！</p>
                </div>

                {/* 四个卡片网格排布 */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                  width: '100%', marginBottom: '24px', boxSizing: 'border-box'
                }}>
                  {drawnHistory.map((record) => {
                    const isOld = getDaysAgo(record.timestamp) >= 20;
                    return (
                      <div 
                        key={record.id}
                        onClick={() => {
                          // 点击任意一张完成选择并关闭
                          handleAccept();
                        }}
                        style={{
                          background: '#FAF9F5', border: '1px solid var(--color-border)',
                          borderRadius: '12px', padding: '10px', display: 'flex',
                          flexDirection: 'column', alignItems: 'center', gap: '6px',
                          cursor: 'pointer', position: 'relative', boxShadow: '0 2px 8px rgba(62,58,54,0.02)'
                        }}
                        className="bouncy-hover"
                      >
                        {isOld && (
                          <span style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: '#FFF', border: '1px solid #FF9800',
                            color: '#FF9800', fontSize: '0.45rem', fontWeight: 'bold',
                            padding: '1px 3px', borderRadius: '3px'
                          }}>
                            💡 好久没吃
                          </span>
                        )}
                        <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {record.imageBlob ? (
                            (() => {
                              const imgUrl = URL.createObjectURL(record.imageBlob);
                              return (
                                <img 
                                  src={imgUrl} 
                                  alt={record.foodName} 
                                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }} 
                                />
                              );
                            })()
                          ) : (
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: '#FAF9F5', border: '1px dashed var(--color-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A857C'
                            }}>
                              <Utensils size={18} />
                            </div>
                          )}
                        </div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: '4px 0 2px 0', color: 'var(--color-text)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                          {record.foodName}
                        </h4>
                        <div style={{ display: 'flex', gap: '1px', transform: 'scale(0.85)' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Heart 
                              key={s} size={8} 
                              fill={s <= record.rating ? 'var(--color-pink)' : 'none'} 
                              color="var(--color-pink)" 
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.6rem', color: '#8A857C' }}>
                          {getDaysAgo(record.timestamp)}天前吃过
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 底部跳转全部历史选项 */}
                {setActiveTab && (
                  <button 
                    onClick={() => {
                      handleAccept(); // 关闭弹窗
                      setActiveTab('report'); // 跳转回忆录
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#8A857C',
                      fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px'
                    }}
                    className="bouncy-hover"
                  >
                    查看全部历史记录
                  </button>
                )}
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
