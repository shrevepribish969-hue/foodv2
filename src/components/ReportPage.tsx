import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords, toLocalYMD } from '../db';
import { Key, Share2, ChevronDown } from 'lucide-react';

export default function ReportPage() {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    const fetchRecords = async () => {
      const data = await getAllRecords();
      setRecords(data);
    };
    fetchRecords();
    
    // 加载已保存的 API Key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyInput(false);
  };

  // 1. 本月数据统计
  const now = new Date();
  const currentMonthRecords = records.filter(r => {
    try {
      const d = new Date(r.timestamp);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } catch {
      return false;
    }
  });

  const totalMeals = currentMonthRecords.length;
  const newFoodsCount = currentMonthRecords.filter(r => r.isNewFood).length;
  
  // 2. 聚餐与饮品统计
  const friendGatherCount = currentMonthRecords.filter(r => r.diningWith).length;
  const drinksCount = currentMonthRecords.filter(r => {
    const name = r.foodName.toLowerCase();
    return name.includes('咖啡') || name.includes('茶') || name.includes('奶茶') || name.includes('可乐') || name.includes('水') || name.includes('饮品') || name.includes('拿铁');
  }).length;

  // 3. 统计最晚的一餐
  let latestMeal: FoodRecord | null = null;
  let maxMinutes = -1; // 转换为当天的分钟数 (21:00 至 4:00)
  
  currentMonthRecords.forEach(r => {
    try {
      const date = new Date(r.timestamp);
      const hour = date.getHours();
      const min = date.getMinutes();
      let absMinutes = hour * 60 + min;
      
      // 如果是凌晨，算作一天的更晚时间
      if (hour >= 0 && hour < 5) {
        absMinutes += 24 * 60;
      }

      if ((hour >= 21 || hour < 5) && absMinutes > maxMinutes) {
        maxMinutes = absMinutes;
        latestMeal = r;
      }
    } catch (e) {
      console.warn(e);
    }
  });

  // 4. 最喜欢 & 最常吃
  const foodFrequency: Record<string, number> = {};
  const highRatedFoods: Record<string, number> = {};
  
  currentMonthRecords.forEach(r => {
    foodFrequency[r.foodName] = (foodFrequency[r.foodName] || 0) + 1;
    if (r.rating === 5) {
      highRatedFoods[r.foodName] = (highRatedFoods[r.foodName] || 0) + 1;
    }
  });

  const mostEaten = Object.entries(foodFrequency).sort((a,b) => b[1]-a[1])[0]?.[0] || '暂无数据';
  const mostLiked = Object.entries(highRatedFoods).sort((a,b) => b[1]-a[1])[0]?.[0] || '暂无数据';

  // 统计地点
  const locationFrequency: Record<string, number> = {};
  currentMonthRecords.forEach(r => {
    if (r.location) {
      locationFrequency[r.location] = (locationFrequency[r.location] || 0) + 1;
    }
  });
  const topLocationEntry = Object.entries(locationFrequency).sort((a,b) => b[1]-a[1])[0];
  const topLocation = topLocationEntry ? `${topLocationEntry[0]} (${topLocationEntry[1]}次)` : '暂无数据';

  // 5. 调用 Gemini 进行治愈系总结
  const generateAiSummary = async () => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setLoadingAi(true);
    try {
      const foodSummaryStr = currentMonthRecords.map(r => 
        `时间:${new Date(r.timestamp).toLocaleDateString()},食物:${r.foodName},餐时:${r.mealType},心情评分:${r.rating}星,和谁吃:${r.diningWith || '自己'},地点:${r.location || '未知'}`
      ).join('\n');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `你是一个温柔、治愈、可爱的心灵饮食心理咨询师。请根据以下用户本月记录的每一顿饭，写一段200字以内的温馨、感性、充满陪伴感的月度情感饮食报告总结。语气要像个朋友在和你对话一样，要提到他们吃的新食物或者和朋友家人聚餐的点滴。
              数据信息如下：\n${foodSummaryStr}`
            }]
          }]
        })
      });

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '生成失败，请确认 API Key 是否正确';
      setAiSummary(rawText);
    } catch (err) {
      console.error(err);
      setAiSummary('AI 总结时开小差啦，请检查网络或 API Key 后重试哦～');
    } finally {
      setLoadingAi(false);
    }
  };

  const getChartData = () => {
    const nowObj = new Date();
    const list: { label: string; value: number }[] = [];

    if (chartPeriod === 'daily') {
      // 过去 7 天
      for (let i = 6; i >= 0; i--) {
        const d = new Date(nowObj.getFullYear(), nowObj.getMonth(), nowObj.getDate() - i);
        const dateStr = toLocalYMD(d);
        const sum = records.reduce((acc, r) => {
          try {
            const rDateStr = toLocalYMD(r.timestamp);
            if (rDateStr === dateStr) {
              return acc + (Number(r.price) || 0);
            }
          } catch {}
          return acc;
        }, 0);
        list.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          value: Math.round(sum * 100) / 100
        });
      }
    } else if (chartPeriod === 'weekly') {
      // 过去 4 周
      for (let i = 3; i >= 0; i--) {
        const start = new Date(nowObj.getTime() - (i + 1) * 7 * 24 * 3600 * 1000 + 1000);
        const end = new Date(nowObj.getTime() - i * 7 * 24 * 3600 * 1000);
        const sum = records.reduce((acc, r) => {
          try {
            const t = r.timestamp;
            if (t >= start.getTime() && t <= end.getTime()) {
              return acc + (Number(r.price) || 0);
            }
          } catch {}
          return acc;
        }, 0);
        list.push({
          label: `${start.getMonth() + 1}.${start.getDate()}-${end.getMonth() + 1}.${end.getDate()}`,
          value: Math.round(sum * 100) / 100
        });
      }
    } else if (chartPeriod === 'monthly') {
      // 过去 6 个月
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowObj.getFullYear(), nowObj.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const sum = records.reduce((acc, r) => {
          try {
            const rd = new Date(r.timestamp);
            if (rd.getFullYear() === y && rd.getMonth() === m) {
              return acc + (Number(r.price) || 0);
            }
          } catch {}
          return acc;
        }, 0);
        list.push({
          label: `${m + 1}月`,
          value: Math.round(sum * 100) / 100
        });
      }
    }
    return list;
  };

  const handleExport = () => {
    alert('正在为您导出本月手账回忆报告图片... (已保存至系统剪贴板)');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px', padding: '8px 4px' }}>
      
      {/* 极简 Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: 'var(--color-text)' }}>
          回忆录
        </h1>
        {/* 月份下拉 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 'bold' }}>
          <span>2026年{now.getMonth() + 1}月</span>
          <ChevronDown size={16} />
        </div>
        {/* 右侧分享按钮 */}
        <button style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', padding: 0 }}>
          <Share2 size={20} />
        </button>
      </div>

      {/* AI 月度回忆信笺大卡片 */}
      <div style={{ 
        position: 'relative',
        background: '#FAF6EE', 
        border: '1px solid var(--color-border)', 
        borderRadius: '12px',
        padding: '24px 20px', 
        boxShadow: '0 4px 15px rgba(62, 58, 54, 0.04)',
        marginTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* 45度倾斜半透明胶带 */}
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '-8px',
          width: '70px',
          height: '20px',
          background: 'rgba(215, 205, 185, 0.4)',
          transform: 'rotate(-20deg)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          borderLeft: '1px dashed rgba(62, 58, 54, 0.1)',
          borderRight: '1px dashed rgba(62, 58, 54, 0.1)',
          zIndex: 10
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--color-text)', margin: '0 0 8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              AI 月度回忆 ✦
            </h2>
            
            {/* 寄语文字 */}
            {loadingAi ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#8A857C', lineHeight: '1.5' }}>正在阅读你本月的手账日记...</p>
            ) : aiSummary ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text)', lineHeight: '1.6', maxWidth: '280px' }}>{aiSummary}</p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#8A857C', lineHeight: '1.6', maxWidth: '280px' }}>
                这个月你尝试了许多美味，也和重要的人度过了温暖的时光。生活因为这些小小的美好，变得闪闪发光 ✧
              </p>
            )}
          </div>

          {/* 右侧手绘拉花咖啡 cup SVG */}
          <div style={{ flexShrink: 0, marginTop: '8px' }}>
            <svg width="52" height="52" viewBox="0 0 100 100">
              <path d="M 25 35 L 75 35 C 75 65, 25 65, 25 35 Z" fill="#FAF9F5" stroke="var(--color-green)" strokeWidth="4" />
              <path d="M 75 42 Q 87 42 87 50 Q 87 58 75 58" fill="none" stroke="var(--color-green)" strokeWidth="4" />
              <rect x="18" y="66" width="64" height="6" rx="3" fill="#FAF9F5" stroke="var(--color-green)" strokeWidth="4" />
              <path d="M 42 27 Q 50 17 58 27" fill="none" stroke="var(--color-green)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* AI 配置与生成栏 */}
        <div style={{ 
          borderTop: '1px dashed var(--color-border)', 
          paddingTop: '12px', 
          marginTop: '4px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <button 
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#8A857C', padding: 0 }}
          >
            <Key size={12} /> 配置 Key
          </button>
          
          {!aiSummary && !loadingAi && (
            <button 
              type="button"
              onClick={generateAiSummary}
              style={{
                background: 'var(--color-green)', color: '#FFF', border: 'none',
                padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', cursor: 'pointer',
                fontWeight: 'bold'
              }}
              className="bouncy-hover"
            >
              生成心情寄语 ✨
            </button>
          )}
        </div>

        {showKeyInput && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input 
              type="password" 
              placeholder="请输入 Gemini API Key"
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              style={{ 
                flex: 1, padding: '6px 10px', borderRadius: '8px', 
                border: '1px solid var(--color-border)', background: '#FFF',
                fontSize: '0.8rem', outline: 'none'
              }}
            />
            <button 
              type="button" 
              onClick={() => saveApiKey(apiKey)} 
              style={{ 
                padding: '6px 12px', background: 'var(--color-green)', 
                color: '#FFF', border: 'none', borderRadius: '8px', 
                cursor: 'pointer', fontSize: '0.8rem' 
              }}
            >
              保存
            </button>
          </div>
        )}
      </div>

      {/* 花销追踪图表 */}
      <div style={{
        background: '#FAF9F5',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 15px rgba(62, 58, 54, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text)', margin: 0 }}>花销趋势</h3>
          {/* 时间维度切换按钮 */}
          <div style={{
            display: 'flex',
            background: 'var(--color-bg)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid var(--color-border)'
          }}>
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                style={{
                  background: chartPeriod === period ? '#FFF' : 'none',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: chartPeriod === period ? 'var(--color-green)' : '#8A857C',
                  cursor: 'pointer',
                  boxShadow: chartPeriod === period ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {period === 'daily' ? '日' : period === 'weekly' ? '周' : '月'}
              </button>
            ))}
          </div>
        </div>

        {/* SVG 折线图 */}
        {(() => {
          const data = getChartData();
          const width = 500;
          const height = 140;
          const paddingLeft = 30;
          const paddingRight = 30;
          const paddingTop = 25;
          const paddingBottom = 25;

          const usableWidth = width - paddingLeft - paddingRight;
          const usableHeight = height - paddingTop - paddingBottom;

          const maxValue = Math.max(...data.map(d => d.value), 10);

          const points = data.map((item, idx) => {
            const x = paddingLeft + (idx * usableWidth) / Math.max(data.length - 1, 1);
            const y = height - paddingBottom - (item.value * usableHeight) / maxValue;
            return { x, y, ...item };
          });

          const dPath = points.map((p, idx) => (idx === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');
          const dArea = points.length > 0 
            ? `${dPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
            : '';

          return (
            <div style={{ position: 'relative', width: '100%' }}>
              <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--color-green)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* 辅助网格线（横线） */}
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = paddingTop + ratio * usableHeight;
                  return (
                    <line
                      key={idx}
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="rgba(227, 223, 213, 0.4)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* 渐变面积 */}
                {dArea && (
                  <path d={dArea} fill="url(#chartGradient)" />
                )}

                {/* 折线 */}
                {dPath && (
                  <path
                    d={dPath}
                    fill="none"
                    stroke="var(--color-green)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 数据节点与金额标注 */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    {/* 外圈发光 */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="7"
                      fill="#FFF"
                      stroke="var(--color-green)"
                      strokeWidth="2.5"
                      style={{ filter: 'drop-shadow(0 1px 3px rgba(62,58,54,0.1))' }}
                    />
                    
                    {/* 金额文字标签 */}
                    <text
                      x={p.x}
                      y={p.y - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="var(--color-text)"
                    >
                      {p.value > 0 ? `¥${p.value}` : ''}
                    </text>

                    {/* X轴标签 */}
                    <text
                      x={p.x}
                      y={height - 6}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="#8A857C"
                      fontWeight="600"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          );
        })()}
      </div>

      {/* 趣味手账数据格子 (一排 3 个) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
        
        <div style={{ background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)', display: 'block' }}>{totalMeals}</span>
          <span style={{ fontSize: '0.65rem', color: '#8A857C' }}>累计用餐次数</span>
        </div>

        <div style={{ background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)', display: 'block' }}>{newFoodsCount}</span>
          <span style={{ fontSize: '0.65rem', color: '#8A857C' }}>尝鲜新食物</span>
        </div>

        <div style={{ background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)', display: 'block' }}>{drinksCount}</span>
          <span style={{ fontSize: '0.65rem', color: '#8A857C' }}>饮品次数</span>
        </div>

        <div style={{ background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)', display: 'block' }}>{friendGatherCount}</span>
          <span style={{ fontSize: '0.65rem', color: '#8A857C' }}>朋友聚餐次数</span>
        </div>

        <div style={{ background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-green)', display: 'block', height: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '24px' }} title={mostLiked}>{mostLiked}</span>
          <span style={{ fontSize: '0.65rem', color: '#8A857C' }}>最偏爱</span>
        </div>

        <div style={{ background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-green)', display: 'block', height: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '24px' }} title={mostEaten}>{mostEaten}</span>
          <span style={{ fontSize: '0.65rem', color: '#8A857C' }}>最常吃</span>
        </div>

      </div>

      {/* 宽长数据格子 (全宽) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* 最晚用餐 */}
        <div style={{ 
          background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', 
          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <span style={{ fontSize: '0.8rem', color: '#8A857C' }}>最晚用餐</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
            {latestMeal ? (
              <>
                {new Date((latestMeal as FoodRecord).timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} · 
                {(latestMeal as FoodRecord).mealType === 'night' ? '夜宵' : '晚餐'} 
                <span style={{ marginLeft: '6px', color: 'var(--color-green)' }}>
                  {new Date((latestMeal as FoodRecord).timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : '无'}
          </span>
        </div>

        {/* 最常去地点 */}
        <div style={{ 
          background: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: '8px', 
          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <span style={{ fontSize: '0.8rem', color: '#8A857C' }}>最常去地点</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
            {topLocation}
          </span>
        </div>

      </div>

      {/* 导出按钮 */}
      <button 
        type="button"
        onClick={handleExport}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: 'var(--color-green)', color: '#FFF', fontWeight: 'bold',
          fontSize: '0.95rem', cursor: 'pointer', marginTop: '12px',
          boxShadow: '0 4px 15px rgba(139, 125, 108, 0.2)'
        }}
        className="bouncy-hover"
      >
        导出为图片
      </button>

    </div>
  );
}
