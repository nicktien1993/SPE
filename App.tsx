
import React, { useState, useCallback, useEffect } from 'react';
import { Subject, IEPParentGoal } from './types';
import { generateIEPGoals } from './services/geminiService';
import IEPTable from './components/IEPTable';

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
    if (!subject) { setError('請先選擇「領域與科目」。'); return; }
    if (!grade) { setError('請選擇「年級」。'); return; }
    if (!disability) { setError('請選擇「障礙類別」。'); return; }
    if (!unit.trim()) { setError('請填寫「單元名稱」。'); return; }
    if (!level.trim()) { setError('請描述「學生起點能力」。'); return; }

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
    link.setAttribute("download", `IEP_Adaptive_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyForGoogleDocs = () => {
    const tableElement = document.getElementById('iep-main-table');
    if (!tableElement) return;

    const clone = tableElement.cloneNode(true) as HTMLElement;
    
    const originalTextareas = tableElement.querySelectorAll('textarea');
    const clonedTextareas = clone.querySelectorAll('textarea');
    clonedTextareas.forEach((textarea, i) => {
      const val = (originalTextareas[i] as HTMLTextAreaElement).value;
      const div = document.createElement('div');
      div.style.whiteSpace = 'pre-wrap';
      div.innerText = val;
      textarea.parentNode?.replaceChild(div, textarea);
    });

    const originalInputs = tableElement.querySelectorAll('input');
    const clonedInputs = clone.querySelectorAll('input');
    clonedInputs.forEach((input, i) => {
      const val = (originalInputs[i] as HTMLInputElement).value;
      const span = document.createElement('span');
      span.innerText = val;
      input.parentNode?.replaceChild(span, input);
    });

    clone.querySelectorAll('.no-print, button').forEach(el => el.remove());

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; border: 2px solid black; }
          th, td { border: 1px solid black; padding: 8px; font-family: sans-serif; font-size: 11pt; color: #000; }
          .vertical-text { writing-mode: vertical-rl; text-orientation: upright; display: block; margin: 0 auto; }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/html': blob })];

    navigator.clipboard.write(data).then(() => {
      alert('已成功抓取所有適性目標內容！請在 Google 文件貼上。');
    });
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-4 px-6 no-print sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
             </div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight">IEP 適性目標助手</h1>
          </div>
          <button onClick={handleClear} className="text-xs font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest">
            清空重置
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded-r-lg shadow-sm">
            ⚠️ {error}
          </div>
        )}
        
        <section className="bg-white p-1 rounded-2xl border border-slate-200 mb-10 no-print shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-8 flex flex-col justify-between bg-white space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">01. 領域與科目 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <button 
                      key={s.value} 
                      onClick={() => setSubject(s.value)} 
                      className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-2 ${subject === s.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">02. 學生背景資訊 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <select className={`w-full p-3 border-2 rounded-xl text-xs font-black focus:ring-0 outline-none appearance-none ${grade ? 'border-slate-100 bg-slate-50' : 'border-red-100 bg-red-50'}`} value={grade} onChange={e => setGrade(e.target.value)}>
                    <option value="">選擇年級...</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select className={`w-full p-3 border-2 rounded-xl text-xs font-black focus:ring-0 outline-none appearance-none ${disability ? 'border-slate-100 bg-slate-50' : 'border-red-100 bg-red-50'}`} value={disability} onChange={e => setDisability(e.target.value)}>
                    <option value="">選擇障別...</option>
                    {disabilities.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-4 flex flex-col bg-white">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">03. 單元名稱 <span className="text-red-500">*</span></label>
              <textarea className="w-full flex-grow p-4 border-2 border-slate-50 rounded-xl text-sm font-black bg-slate-50 placeholder-slate-300 focus:border-indigo-500 outline-none resize-none min-h-[160px]" value={unit} onChange={e => setUnit(e.target.value)} placeholder="例如：10000以內的數..." />
            </div>

            <div className="p-8 space-y-4 flex flex-col bg-white">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">04. 學生起點能力描述 <span className="text-red-500">*</span></label>
              <textarea className="w-full flex-grow p-4 border-2 border-slate-50 rounded-xl text-sm font-medium bg-slate-50 placeholder-slate-300 focus:border-indigo-500 outline-none resize-none min-h-[160px]" value={level} onChange={e => setLevel(e.target.value)} placeholder="描述學生目前的先備知識..." />
            </div>
          </div>
          
          <div className="p-8 pt-0 bg-white">
            <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-4 ${isGenerating ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {isGenerating ? <span>AI 正在撰寫適性目標...</span> : <span>生成專業適性特教目標</span>}
            </button>
          </div>
        </section>

        {parentGoals.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print bg-indigo-50 p-4 rounded-xl border border-indigo-100">
             <div className="flex gap-3">
                <button onClick={copyForGoogleDocs} className="px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                  複製至 Google 文件 (含適性標準)
                </button>
                <button onClick={exportCSV} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all shadow-md">
                  匯出適性報表 CSV
                </button>
             </div>
          </div>
        )}

        <div className="space-y-6">
          <IEPTable 
            subject={subject || Subject.CHINESE}
            parentGoals={parentGoals}
            onUpdateSubGoal={updateSubGoal}
            onDeleteParent={(id) => setParentGoals(prev => prev.filter(p => p.id !== id))}
            onAddManualParent={() => {
               const newParent: IEPParentGoal = {
                  id: Math.random().toString(36).substr(2, 9),
                  title: '新學年目標',
                  subGoals: [{ id: Math.random().toString(36).substr(2, 9), code: '1-1', content: '內容...', strategy: '', targetAccuracy: 80, records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }] }]
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
