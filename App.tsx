
import React, { useState, useCallback, useEffect } from 'react';
import { Subject, IEPParentGoal } from './types';
import { generateIEPGoals } from './services/geminiService';
import IEPTable from './components/IEPTable';

const DISABILITIES = [
  '智能障礙', '視覺障礙', '聽覺障礙', '語言障礙', '肢體障礙', 
  '腦性麻痺', '身體病弱', '情緒行為障礙', '學習障礙', '自閉症', 
  '多重障礙', '發展緩慢', '其他障礙', '資賦優異'
];

const LD_SUBTYPES = ['識字型學障', '語文型學障', '理解型學障', '書寫型學障', '數學型學障'];
const GIFTED_SUBTYPES = [
  '一般智能資賦優異', '學術性向資賦優異', '藝術才能資賦優異', 
  '創造能力資賦優異', '領導能力資賦優異', '其他特殊才能資賦優異'
];

const MATH_QUICK_UNITS = ['認識速率', '三角形', '圓周長與扇形', '分數的乘除', '未知數', '比與比值'];

interface IEPArchive {
  id: string;
  timestamp: number;
  label: string;
  data: {
    subject: Subject | null;
    grade: string;
    disability: string;
    subtype: string;
    unit: string;
    level: string;
    expectations: string;
    parentGoals: IEPParentGoal[];
  };
}

const App: React.FC = () => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [grade, setGrade] = useState('');
  const [disability, setDisability] = useState('');
  const [subtype, setSubtype] = useState('');
  const [unit, setUnit] = useState('');
  const [level, setLevel] = useState('');
  const [expectations, setExpectations] = useState('');
  const [parentGoals, setParentGoals] = useState<IEPParentGoal[]>([]);
  
  const [showHistory, setShowHistory] = useState(false);
  const [archives, setArchives] = useState<IEPArchive[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showLevelGuide, setShowLevelGuide] = useState(false);
  const [showStrategy, setShowStrategy] = useState(true);

  // 初始化載入檔案清單
  useEffect(() => {
    const savedArchives = localStorage.getItem('iep_archives_v1');
    if (savedArchives) {
      try {
        setArchives(JSON.parse(savedArchives));
      } catch (e) {
        console.error("Failed to load archives");
      }
    }
  }, []);

  // 儲存檔案櫃到 LocalStorage
  const syncArchives = (newArchives: IEPArchive[]) => {
    setArchives(newArchives);
    localStorage.setItem('iep_archives_v1', JSON.stringify(newArchives));
  };

  const handleManualSave = useCallback(() => {
    if (!unit && !parentGoals.length) {
      setError("內容為空，無法儲存。");
      return;
    }
    setSaveStatus('saving');
    
    const now = new Date();
    const timeLabel = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const archiveLabel = `[${timeLabel}] ${grade || '未知'} ${subject || '未選'}：${unit || '未命名單元'}`;
    
    const newArchive: IEPArchive = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      label: archiveLabel,
      data: { subject, grade, disability, subtype, expectations, unit, level, parentGoals }
    };

    const updated = [newArchive, ...archives].slice(0, 50); // 最多存 50 筆
    syncArchives(updated);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, [archives, subject, grade, disability, subtype, expectations, unit, level, parentGoals]);

  const loadArchive = (archive: IEPArchive) => {
    const { data } = archive;
    setSubject(data.subject);
    setGrade(data.grade);
    setDisability(data.disability);
    setSubtype(data.subtype);
    setExpectations(data.expectations);
    setUnit(data.unit);
    setLevel(data.level);
    setParentGoals(data.parentGoals);
    setShowHistory(false);
    alert(`已載入檔案：${archive.label}`);
  };

  const deleteArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定刪除此存檔？')) {
      const updated = archives.filter(a => a.id !== id);
      syncArchives(updated);
    }
  };

  const updateSubGoal = useCallback((parentId: string, subGoalId: string, field: string, value: any, recordIndex?: number) => {
    setParentGoals(prev => prev.map(parent => {
      if (parent.id !== parentId) return parent;
      if (field === 'parentTitle') return { ...parent, title: value };
      return {
        ...parent,
        subGoals: parent.subGoals.map(sub => {
          if (sub.id !== subGoalId) return sub;
          if (field === 'date' || field === 'accuracy') {
            const newRecords = [...sub.records];
            if (recordIndex !== undefined) {
              newRecords[recordIndex] = { ...newRecords[recordIndex], [field]: value };
            }
            return { ...sub, records: newRecords };
          }
          return { ...sub, [field as keyof typeof sub]: value };
        })
      };
    }));
  }, []);

  const handleGenerate = async () => {
    if (!subject) { setError('請先選擇領域科目。'); return; }
    if (!grade) { setError('請選擇年級。'); return; }
    if (!disability) { setError('請選擇障礙類別。'); return; }
    if ((disability === '學習障礙' || disability === '資賦優異') && !subtype) { 
      setError(`請選擇${disability}的具体類型。`); return; 
    }
    if (!unit.trim()) { setError('請填寫單元名稱。'); return; }
    if (!level.trim()) { setError('請描述學生起點能力。'); return; }

    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) { await aistudio.openSelectKey(); }
    }

    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateIEPGoals({ 
        subject, unit, studentLevel: level, gradeLevel: grade, disabilityType: disability,
        subtype: (disability === '學習障礙' || disability === '資賦優異') ? subtype : undefined,
        teacherExpectations: expectations
      });
      
      const newParentGoals: IEPParentGoal[] = results.map((item: any, pIdx: number) => {
        const parentNum = pIdx + 1;
        return {
          id: Math.random().toString(36).substr(2, 9),
          title: `${parentNum}. ${item.title.replace(/^\d+\.\s*/, '')}`,
          subGoals: (item.subGoals || []).map((sub: any, sIdx: number) => ({
            id: Math.random().toString(36).substr(2, 9),
            code: `${parentNum}-${sIdx + 1}`,
            content: sub.content || '',
            strategy: sub.strategy || '',
            targetAccuracy: sub.targetAccuracy || 80,
            records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }]
          }))
        };
      });
      setParentGoals(prev => [...prev, ...newParentGoals]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAsText = () => {
    let text = `【${subject} IEP 目標】\n單元：${unit}\n\n`;
    parentGoals.forEach(p => {
      text += `${p.title}\n`;
      p.subGoals.forEach(s => {
        text += `  ${s.code} ${s.content} (標準: ${s.targetAccuracy}%)\n`;
        if (showStrategy && s.strategy) text += `     策略: ${s.strategy}\n`;
      });
      text += `\n`;
    });
    navigator.clipboard.writeText(text).then(() => alert('純文字內容已複製。'));
  };

  return (
    <div className="min-h-screen pb-20 bg-white text-zinc-950 relative overflow-x-hidden">
      {/* 歷史檔案櫃側欄 */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white border-l-2 border-zinc-950 z-[100] transform transition-transform duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] no-print ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black uppercase tracking-tighter">檔案櫃 Archives</h2>
            <button onClick={() => setShowHistory(false)} className="font-black hover:text-orange-600">✕</button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-3">
            {archives.length === 0 ? (
              <p className="text-zinc-300 italic text-xs font-bold text-center mt-20">目前沒有存檔紀錄</p>
            ) : archives.map(arc => (
              <div 
                key={arc.id} 
                onClick={() => loadArchive(arc)}
                className="group p-4 border-2 border-zinc-100 hover:border-zinc-950 cursor-pointer transition-all relative"
              >
                <div className="text-[10px] font-black text-zinc-400 mb-1 group-hover:text-orange-600">{new Date(arc.timestamp).toLocaleString()}</div>
                <div className="text-xs font-black leading-tight break-words">{arc.label}</div>
                <button 
                  onClick={(e) => deleteArchive(arc.id, e)}
                  className="absolute top-2 right-2 text-[10px] text-zinc-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t-2 border-zinc-50">
             <p className="text-[9px] font-bold text-zinc-400 uppercase text-center">存檔存放於此瀏覽器 Local Storage</p>
          </div>
        </div>
      </div>

      <header className="bg-white border-b-2 border-zinc-950 py-6 px-8 no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-zinc-950 p-2 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">IEP Adaptive Planner</h1>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Professional Special Education Assistant</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowHistory(true)} className="text-xs font-black uppercase flex items-center gap-2 text-zinc-950 hover:text-orange-600 transition-colors">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
               Archives
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-green-500' : saveStatus === 'saving' ? 'bg-amber-500 animate-ping' : 'bg-zinc-300'}`}></div>
              <button onClick={handleManualSave} className="text-xs font-black uppercase hover:text-orange-600 transition-colors">
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Save Current'}
              </button>
            </div>
            <button onClick={() => setShowStrategy(!showStrategy)} className={`text-xs font-black uppercase transition-all ${showStrategy ? 'text-orange-600' : 'text-zinc-400'}`}>Strategy {showStrategy ? 'On' : 'Off'}</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-12">
        {error && (
          <div className="mb-8 p-4 bg-white border-2 border-zinc-950 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-bold uppercase tracking-tighter">⚠️ System Alert: {error}</span>
            <button onClick={() => setError(null)} className="font-black hover:text-orange-600 p-2">✕</button>
          </div>
        )}
        
        <section className="bg-white border-2 border-zinc-950 mb-12 no-print shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x-2 divide-zinc-950 min-h-[480px]">
            {/* 01 & 02 Column */}
            <div className="md:col-span-2 p-8 space-y-8 flex flex-col justify-between">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                   <span className="w-1.5 h-3 bg-amber-400"></span> 01. 學生概況 Profile
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full p-4 border-2 border-zinc-950 text-sm font-black bg-white focus:bg-amber-50 outline-none appearance-none cursor-pointer" value={grade} onChange={e => setGrade(e.target.value)}>
                    <option value="">選擇年級...</option>
                    {['小一', '小二', '小三', '小四', '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div className="space-y-2">
                    <select className="w-full p-4 border-2 border-zinc-950 text-sm font-black bg-white focus:bg-amber-50 outline-none appearance-none cursor-pointer" value={disability} onChange={e => { setDisability(e.target.value); setSubtype(''); }}>
                      <option value="">選擇障別...</option>
                      {DISABILITIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {(disability === '學習障礙' || disability === '資賦優異') && (
                      <select className={`w-full p-3 border-2 text-xs font-black outline-none appearance-none animate-pulse ${disability === '學習障礙' ? 'border-orange-600 bg-orange-50' : 'border-blue-600 bg-blue-50'}`} value={subtype} onChange={e => setSubtype(e.target.value)}>
                        <option value="">選擇亞型 Subtype...</option>
                        {(disability === '學習障礙' ? LD_SUBTYPES : GIFTED_SUBTYPES).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                  <span className="w-1.5 h-3 bg-amber-400"></span> 02. 領域科目 Subject
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.values(Subject).map(s => (
                    <button key={s} onClick={() => setSubject(s)} className={`px-3 py-2.5 text-[11px] font-black transition-all border-2 text-center leading-tight ${subject === s ? 'bg-zinc-950 border-zinc-950 text-white shadow-md' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-950 hover:text-zinc-950'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 03 Column */}
            <div className="p-8 flex flex-col bg-white">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">
                <span className="w-1.5 h-3 bg-orange-600"></span> 03. 單元名稱與期待
              </label>
              <div className="flex-grow flex flex-col gap-6">
                <textarea className="w-full flex-grow p-4 border-2 border-zinc-200 focus:border-zinc-950 text-sm font-black bg-white focus:bg-orange-50 outline-none resize-none" value={unit} onChange={e => setUnit(e.target.value)} placeholder="例如：認識速率、三角形..." />
                <div className="flex flex-col flex-grow gap-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
                     <span className="w-1.5 h-2 bg-blue-600"></span> 班導師特別期望
                  </label>
                  <textarea className="w-full flex-grow p-4 border-2 border-blue-100 focus:border-blue-600 text-sm font-medium bg-white focus:bg-blue-50 outline-none resize-none" value={expectations} onChange={e => setExpectations(e.target.value)} placeholder="例如：希望能多與同儕互動..." />
                </div>
              </div>
            </div>

            {/* 04 Column */}
            <div className="p-8 flex flex-col bg-white">
              <div className="flex justify-between items-center mb-4">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                  <span className="w-1.5 h-3 bg-orange-600"></span> 04. 起點能力
                </label>
                <button onClick={() => setShowLevelGuide(!showLevelGuide)} className="text-[10px] font-black bg-zinc-100 px-2 py-0.5 border border-zinc-300 hover:bg-zinc-950 hover:text-white transition-colors uppercase">Guide</button>
              </div>
              <textarea className="w-full flex-grow p-4 border-2 border-zinc-200 focus:border-zinc-950 text-sm font-medium bg-white focus:bg-orange-50 outline-none resize-none" value={level} onChange={e => setLevel(e.target.value)} placeholder="描述學生目前的能力現況..." />
            </div>
          </div>
          
          <div className="p-10 bg-zinc-50 border-t-2 border-zinc-950 flex flex-col items-center">
            <button onClick={handleGenerate} disabled={isGenerating} className={`w-full max-w-2xl py-6 font-black text-2xl tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-4 ${isGenerating ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-zinc-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'}`}>
              {isGenerating ? <span>Tailoring Goals...</span> : <span>Generate IEP Goals</span>}
            </button>
          </div>
        </section>

        {parentGoals.length > 0 && (
          <div className="mb-10 no-print flex flex-wrap gap-4">
            <button onClick={() => {
                const table = document.getElementById('iep-main-table');
                if (!table) return;
                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table { border-collapse: collapse; width: 100%; border: 2px solid black; } th, td { border: 1px solid black; padding: 10px; } .vertical-text { writing-mode: vertical-rl; text-orientation: upright; }</style></head><body>${table.outerHTML}</body></html>`;
                const blob = new Blob([html], { type: 'text/html' });
                navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => alert('已複製表格格式。'));
            }} className="px-8 py-4 bg-zinc-950 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Copy Table (HTML)</button>
            <button onClick={copyAsText} className="px-8 py-4 bg-white border-2 border-zinc-950 text-zinc-950 text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Copy Content (Text)</button>
          </div>
        )}

        <div className="bg-white">
          <IEPTable 
            subject={subject || Subject.CHINESE}
            parentGoals={parentGoals}
            showStrategy={showStrategy}
            onUpdateSubGoal={updateSubGoal}
            onDeleteParent={(id) => setParentGoals(prev => prev.filter(p => p.id !== id))}
            onAddManualParent={() => {
               const nextIdx = parentGoals.length + 1;
               setParentGoals(prev => [...prev, {
                  id: Math.random().toString(36).substr(2, 9),
                  title: `${nextIdx}. 手動新增目標`,
                  subGoals: [{ id: Math.random().toString(36).substr(2, 9), code: `${nextIdx}-1`, content: '內容...', strategy: '', targetAccuracy: 80, records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }] }]
               }]);
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
