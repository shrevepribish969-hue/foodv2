import { useState, useEffect } from 'react';
import { type FoodRecord, getAllRecords } from '../db';
import { Sparkles, Key } from 'lucide-react';

export default function ReportPage() {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

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

  // 5. 调用 Gemini 进行治愈系总结
  const generateAiSummary = async () => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setLoadingAi(true);
    try {
      // 整理本月饮食摘要文本
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      <div style={{ 
        background: '#FFF', border: '3px solid var(--color-border)', borderRadius: '28px',
        padding: '24px', boxShadow: '0 8px 24px rgba(92, 75, 67, 0.05)',
        backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 0)',
        backgroundSize: '24px 24px' // 精美信纸背景
      }}>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--color-pink)', margin: '0 0 16px', textAlign: 'center', fontWeight: 'bold' }}>
          🍽️ “吃点好的” 月度饮食回忆录
        </h2>

        {/* AI 温馨总结版块 */}
        <div style={{ 
          background: 'rgba(255, 182, 193, 0.1)', border: '2px dashed var(--color-pink)', 
          borderRadius: '20px', padding: '16px', marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-pink)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={16} /> AI 治愈手账寄语
            </span>
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', color: '#999' }}
            >
              <Key size={12} /> 配置 Key
            </button>
          </div>

          {showKeyInput && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="password" 
                placeholder="请输入 Gemini API Key"
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '12px', border: '2px solid var(--color-border)', width: '70%' }}
              />
              <button type="button" onClick={() => saveApiKey(apiKey)} style={{ padding: '8px 16px', background: 'var(--color-pink)', color: '#FFF', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>保存</button>
            </div>
          )}

          {loadingAi ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>正在阅读你本月的手账日记，请稍后...</p>
          ) : aiSummary ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: '1.6' }}>{aiSummary}</p>
          ) : (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#888' }}>点击下方按钮，让 AI 读读你这个月的美食日记，为你写下温暖的心情总结～</p>
              <button 
                type="button"
                onClick={generateAiSummary}
                style={{
                  background: 'var(--color-pink)', color: '#FFF', border: 'none',
                  padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                className="bouncy-hover"
              >
                生成我的本月寄语 ✨
              </button>
            </div>
          )}
        </div>

        {/* 趣味统计格子 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🍴 本月聚餐频次</span>
            <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{totalMeals} 顿饭 / {friendGatherCount} 次聚餐</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🥤 享用饮品次数</span>
            <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{drinksCount} 杯饮品</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🆕 尝试新美食</span>
            <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{newFoodsCount} 种新味道</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🌙 最晚深夜食堂</span>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {latestMeal ? `${(latestMeal as FoodRecord).foodName} (${new Date((latestMeal as FoodRecord).timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})` : '无'}
            </p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>🔄 最常享用食物</span>
            <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-pink)' }}>{mostEaten}</p>
          </div>

          <div style={{ background: '#FAF6F0', borderRadius: '16px', padding: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>💖 评分最高最爱</span>
            <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 'bold', color: 'gold' }}>{mostLiked}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
