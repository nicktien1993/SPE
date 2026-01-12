
import React, { useState, useCallback, useEffect } from 'react';
import { Subject, IEPParentGoal } from './types';
import { generateIEPGoals } from './services/geminiService';
import IEPTable from './components/IEPTable';

// The global 'aistudio' type is provided by the environment. 
// Removing manual declaration to resolve "All declarations must have identical modifiers" error.

const App: React.FC = () => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [grade, setGrade] = useState('');
  const [disability, setDisability] = useState('');
  const [unit, setUnit] = useState('');
  const [level, setLevel] = useState('');
  const [parentGoals, setParentGoals] = useState<IEPParentGoal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('iep_cache_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.parentGoals) setParentGoals(parsed.parentGoals);
        if (parsed.subject) setSubject(parsed.subject);
        if (parsed.grade) setGrade(parsed.grade);
        if (parsed.disability) setDisability(parsed.disability);
      } catch (e) {
        console.error("Failed to load cache");
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = { parentGoals, subject, grade, disability };
    localStorage.setItem('iep_cache_v4', JSON.stringify(dataToSave));
  }, [parentGoals, subject, grade, disability]);

  const handleGenerate = async () => {
    if (!subject) { setError('請先選擇領域科目。'); return; }
    if (!grade) { setError('請選擇年級。'); return; }
    if (!disability) { setError('請選擇障礙類別。'); return; }
    if (!unit.trim()) { setError('請填寫單元名稱。'); return; }
    if (!level.trim()) { setError('請描述學生起點能力。'); return; }

    // API Key selection check as required for Gemini 3 features
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
        // Proceed as per guidelines: "you MUST assume the key selection was successful after triggering openSelectKey() and proceed to the app."
      }
    }

    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateIEPGoals({ 
        subject, 
        unit, 
        studentLevel: level, 
        gradeLevel: grade, 
        disabilityType: disability 
      });
      
      const newParentGoals: IEPParentGoal[] = results.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: item.title, 
        subGoals: (item.subGoals || []).map((sub: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          code: sub.code || '1-1',
          content: sub.content || '',
          strategy: sub.strategy || '',
          targetAccuracy: sub.targetAccuracy || 80,
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
      setSubject(null);
      setGrade('');
      setDisability('');
      localStorage.removeItem('iep_cache_v4');
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

  const exportCSV = () => {
    if (parentGoals.length === 0) return;
    let csv = "\uFEFF領域,學年目標,序號,學期目標內容,教學策略,目標門檻,評量1日期,評量1正確率,評量2日期,評量2正確率\n";
    parentGoals.forEach(p => {
      p.subGoals.forEach(s => {
        csv += `"${subject}","${p.title.replace(/"/g, '""')}","${s.code}","${s.content.replace(/"/g, '""')}","${(s.strategy || '').replace(/"/g, '""')}","${s.targetAccuracy}%","${s.records[0]?.date}","${s.records[0]?.accuracy}%","${s.records[1]?.date}","${s.records[1]?.accuracy}%"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `IEP_Record_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyForGoogleDocs = () => {
    const tableElement = document.getElementById('iep-main-table');
    if (!tableElement) return;

    const clone = tableElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('textarea').forEach((textarea) => {
      const div = document.createElement('div');
      div.innerText = textarea.value;
      textarea.parentNode?.replaceChild(div, textarea);
    });
    clone.querySelectorAll('input').forEach((input) => {
      const span = document.createElement('span');
      span.innerText = input.value;
      input.parentNode?.replaceChild(span, input);
    });
    clone.querySelectorAll('.no-print, button').forEach(el => el.remove());

    const html = `<!DOCTYPE html><html><body>${clone.outerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => {
      alert('已複製表格內容，可直接貼至 Google 文件。');
    });
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-4 px-6 no-print sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
             </div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight">IEP 適性目標助手</h1>
          </div>
          <button onClick={handleClear} className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">
            清空內容
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded-r-lg shadow-sm flex justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-400">✕</button>
          </div>
        )}
        
        <section className="bg-white p-1 rounded-2xl border border-slate-200 mb-10 no-print shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-8 space-y-8 bg-white">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">01. 領域科目</label>
                <div className="flex flex-wrap gap-2">
                  {[Subject.CHINESE, Subject.MATH, Subject.LIFE_MGMT, Subject.LEARNING_STRATEGY, Subject.SOCIAL_SKILLS].map(s => (
                    <button key={s} onClick={() => setSubject(s)} className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${subject === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">02. 學生概況</label>
                <div className="grid grid-cols-2 gap-3">
                  <select className="w-full p-3 border-2 border-slate-50 rounded-xl text-xs font-black bg-slate-50" value={grade} onChange={e => setGrade(e.target.value)}>
                    <option value="">年級...</option>
                    {['小一', '小二', '小三', '小四', '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select className="w-full p-3 border-2 border-slate-50 rounded-xl text-xs font-black bg-slate-50" value={disability} onChange={e => setDisability(e.target.value)}>
                    <option value="">障別...</option>
                    {['智能障礙', '視覺障礙', '聽覺障礙', '語言障礙', '肢體障礙', '腦性麻痺', '身體病弱', '情緒行為障礙', '學習障礙', '自閉症', '多重障礙', '發展緩慢', '其他障礙'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-4 flex flex-col bg-white">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">03. 單元名稱</label>
              <textarea className="w-full flex-grow p-4 border-2 border-slate-50 rounded-xl text-sm font-black bg-slate-50 placeholder-slate-300 outline-none resize-none min-h-[160px]" value={unit} onChange={e => setUnit(e.target.value)} placeholder="填寫要教什麼內容..." />
            </div>

            <div className="p-8 space-y-4 flex flex-col bg-white">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">04. 學生起點能力</label>
              <textarea className="w-full flex-grow p-4 border-2 border-slate-50 rounded-xl text-sm font-medium bg-slate-50 placeholder-slate-300 outline-none resize-none min-h-[160px]" value={level} onChange={e => setLevel(e.target.value)} placeholder="簡單描述學生目前會什麼..." />
            </div>
          </div>
          
          <div className="p-8 pt-0 bg-white">
            <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-4 ${isGenerating ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>AI 正在構思中...</span>
                </>
              ) : (
                <span>生成特教適性目標</span>
              )}
            </button>
          </div>
        </section>

        {parentGoals.length > 0 && (
          <div className="mb-6 flex gap-3 no-print">
            <button onClick={copyForGoogleDocs} className="px-5 py-2.5 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
              複製到 Google 文件
            </button>
            <button onClick={exportCSV} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md">
              下載 CSV 存檔
            </button>
          </div>
        )}

        <IEPTable 
          subject={subject || Subject.CHINESE}
          parentGoals={parentGoals}
          onUpdateSubGoal={updateSubGoal}
          onDeleteParent={(id) => setParentGoals(prev => prev.filter(p => p.id !== id))}
          onAddManualParent={() => {
             setParentGoals(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                title: '手動新增目標',
                subGoals: [{ id: Math.random().toString(36).substr(2, 9), code: '1-1', content: '內容...', strategy: '', targetAccuracy: 80, records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }] }]
             }]);
          }}
        />
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 py-20 no-print text-center flex flex-col items-center gap-4">
        <div className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.4em]">Designed for Teachers</div>
        <button 
          onClick={async () => {
             const aistudio = (window as any).aistudio;
             if(aistudio) {
               await aistudio.openSelectKey();
             }
          }} 
          className="text-[9px] text-slate-200 hover:text-slate-400 transition-colors"
        >
          [ 系統連線設定 ]
        </button>
        <div className="text-[8px] text-slate-300">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:underline">需使用具備付款能力的 API 金鑰</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
