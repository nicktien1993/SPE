import React, { useState, useCallback, useEffect } from 'react';
import { Subject, IEPParentGoal } from './types';
import { generateIEPGoals } from './services/geminiService';
import IEPTable from './components/IEPTable';

const App: React.FC = () => {
  const [subject, setSubject] = useState<Subject>(Subject.CHINESE);
  const [grade, setGrade] = useState('小一');
  const [disability, setDisability] = useState('智能障礙');
  const [unit, setUnit] = useState('');
  const [level, setLevel] = useState('');
  const [parentGoals, setParentGoals] = useState<IEPParentGoal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('iep_cache_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setParentGoals(parsed.parentGoals || []);
        setSubject(parsed.subject || Subject.CHINESE);
        setGrade(parsed.grade || '小一');
        setDisability(parsed.disability || '智能障礙');
      } catch (e) {
        console.error("Failed to load cache");
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = { parentGoals, subject, grade, disability };
    localStorage.setItem('iep_cache_v1', JSON.stringify(dataToSave));
  }, [parentGoals, subject, grade, disability]);

  const grades = ['小一', '小二', '小三', '小四', '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三'];
  const disabilities = ['智能障礙', '視覺障礙', '聽覺障礙', '語言障礙', '肢體障礙', '腦性麻痺', '身體病弱', '情緒行為障礙', '學習障礙', '自閉症', '多重障礙', '發展緩慢', '其他障礙'];
  const subjects = [
    { label: '國語', value: Subject.CHINESE },
    { label: '數學', value: Subject.MATH },
    { label: '生活管理', value: Subject.LIFE_MGMT },
    { label: '學習策略', value: Subject.LEARNING_STRATEGY },
    { label: '社會技巧', value: Subject.SOCIAL_SKILLS }
  ];

  const handleGenerate = async () => {
    if (!unit.trim() || !level.trim()) {
      setError('請填寫單元名稱與學生程度。');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateIEPGoals({ subject, unit, studentLevel: level, gradeLevel: grade, disabilityType: disability });
      
      const newParentGoals: IEPParentGoal[] = results.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: item.title, 
        subGoals: (item.subGoals || []).map((sub: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          code: sub.code || '1-1',
          content: sub.content || '',
          strategy: sub.strategy || '',
          records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }]
        }))
      }));
      
      setParentGoals(prev => [...prev, ...newParentGoals]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('確定要清空目前所有內容嗎？')) {
      setParentGoals([]);
      setUnit('');
      setLevel('');
      localStorage.removeItem('iep_cache_v1');
    }
  };

  const updateSubGoal = useCallback((parentId: string, subGoalId: string, field: string, value: any, recordIdx?: number) => {
    setParentGoals(prev => prev.map(p => {
      if (p.id !== parentId) return p;
      if (field === 'parentTitle') return { ...p, title: value };
      return {
        ...p,
        subGoals: p.subGoals.map(s => {
          if (s.id !== subGoalId) return s;
          if (recordIdx !== undefined) {
            const newRecords = [...s.records];
            if (field === 'date') newRecords[recordIdx].date = value;
            if (field === 'accuracy') newRecords[recordIdx].accuracy = value;
            return { ...s, records: newRecords };
          }
          return { ...s, [field]: value };
        })
      };
    }));
  }, []);

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-4 px-6 no-print sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
             </div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight">IEP 目標管理助手</h1>
          </div>
          <button onClick={handleClear} className="text-xs font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest">
            清空工作區
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded-r-lg shadow-sm">
            {error}
          </div>
        )}
        
        <section className="bg-white p-1 rounded-2xl border border-slate-200 mb-10 no-print shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-slate-100">
            {/* Column 1: Selection */}
            <div className="p-8 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">01. 領域與科目</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <button 
                      key={s.value} 
                      onClick={() => setSubject(s.value)} 
                      className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${subject === s.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-slate-50 border-slate-100 text-slate-900 hover:border-slate-300'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">02. 學生背景</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <select className="w-full pl-3 pr-8 py-2.5 border-2 border-slate-100 rounded-xl text-xs bg-slate-50 font-black text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none appearance-none transition-all cursor-pointer" value={grade} onChange={e => setGrade(e.target.value)}>
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg></div>
                  </div>
                  <div className="relative">
                    <select className="w-full pl-3 pr-8 py-2.5 border-2 border-slate-100 rounded-xl text-xs bg-slate-50 font-black text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none appearance-none transition-all cursor-pointer" value={disability} onChange={e => setDisability(e.target.value)}>
                      {disabilities.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Unit */}
            <div className="p-8 space-y-4 flex flex-col">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">03. 單元名稱 (可貼上多個主題)</label>
              <textarea 
                className="w-full flex-grow p-4 border-2 border-slate-100 rounded-xl text-sm font-black bg-slate-50 text-slate-900 placeholder-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none resize-none min-h-[160px] transition-all" 
                value={unit} 
                onChange={e => setUnit(e.target.value)} 
                placeholder="例如：認識10000以內的數、四位數加減、面積、乘法..." 
              />
            </div>

            {/* Column 3: Level */}
            <div className="p-8 space-y-4 flex flex-col">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">04. 學生起點能力描述</label>
              <textarea 
                className="w-full flex-grow p-4 border-2 border-slate-100 rounded-xl text-sm font-medium bg-slate-50 text-slate-900 placeholder-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none resize-none min-h-[160px] transition-all" 
                value={level} 
                onChange={e => setLevel(e.target.value)} 
                placeholder="描述學生目前的先備知識、優弱勢現況..." 
              />
            </div>
          </div>
          
          <div className="p-8 pt-0">
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating} 
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${isGenerating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.99]'}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>正在拆解並生成目標...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🚀</span>
                  <span>生成專業教育目標報表</span>
                </>
              )}
            </button>
          </div>
        </section>

        <div className="space-y-6">
          <div className="flex items-center justify-between no-print">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
              IEP 目標紀錄表 (預覽)
            </h2>
          </div>
          <IEPTable 
            subject={subject}
            parentGoals={parentGoals}
            onUpdateSubGoal={updateSubGoal}
            onDeleteParent={(id) => setParentGoals(prev => prev.filter(p => p.id !== id))}
            onAddManualParent={() => {
               const newParent: IEPParentGoal = {
                  id: Math.random().toString(36).substr(2, 9),
                  title: '請輸入新的學年目標',
                  subGoals: [{ id: Math.random().toString(36).substr(2, 9), code: '1-1', content: '內容與標準...', strategy: '', records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }] }]
               };
               setParentGoals(prev => [...prev, newParent]);
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default App;