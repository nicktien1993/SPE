
import React, { useState, useCallback } from 'react';
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

  const grades = [
    '小一', '小二', '小三', '小四', '小五', '小六', 
    '國一', '國二', '國三', 
    '高一', '高二', '高三'
  ];
  
  const disabilities = [
    '智能障礙', '視覺障礙', '聽覺障礙', '語言障礙', '肢體障礙', 
    '腦性麻痺', '身體病弱', '情緒行為障礙', '學習障礙', '自閉症', 
    '多重障礙', '發展遲緩', '其他障礙'
  ];
  
  const subjects = [
    { label: '國語', value: Subject.CHINESE },
    { label: '數學', value: Subject.MATH },
    { label: '生活管理', value: Subject.LIFE_MGMT },
    { label: '學習策略', value: Subject.LEARNING_STRATEGY },
    { label: '社會技巧', value: Subject.SOCIAL_SKILLS }
  ];

  const handleGenerate = async () => {
    const trimmedUnit = unit.trim();
    const trimmedLevel = level.trim();
    if (!trimmedUnit || !trimmedLevel) {
      setError('請填寫單元名稱與學生程度。');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateIEPGoals({ 
        subject, 
        unit: trimmedUnit, 
        studentLevel: trimmedLevel,
        gradeLevel: grade,
        disabilityType: disability
      });
      const newParentGoals: IEPParentGoal[] = results.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: item.title,
        subGoals: (Array.isArray(item.subGoals) ? item.subGoals : []).map((sub: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          code: sub.code || '1-1',
          content: sub.content || '未命名指標',
          strategy: sub.strategy || '',
          records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }]
        }))
      }));
      setParentGoals(prev => [...prev, ...newParentGoals]);
    } catch (err: any) {
      setError(err.message || '生成失敗。');
    } finally {
      setIsGenerating(false);
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

  const generateTableHTML = () => {
    const totalSubGoals = parentGoals.reduce((sum, p) => sum + p.subGoals.length, 0);
    let rowsHTML = "";
    
    parentGoals.forEach((parent, pIdx) => {
      parent.subGoals.forEach((sub, sIdx) => {
        const lastAcc = sub.records.filter(r => r.accuracy !== "").pop()?.accuracy;
        const isPass = lastAcc && parseInt(lastAcc as string) >= 80;
        const statusText = lastAcc ? (isPass ? "通過" : "不通過") : "-";
        const statusColor = isPass ? "#000000" : "#dc2626";
        const strategyHTML = sub.strategy ? `<br/><i style="font-size: 11px; color: #475569;">策略：${sub.strategy}</i>` : "";

        rowsHTML += `
          <tr>
            ${pIdx === 0 && sIdx === 0 ? `<td rowspan="${totalSubGoals}" style="border: 2px solid black; text-align: center; writing-mode: vertical-rl; padding: 10px; font-weight: bold;">${subject}</td>` : ""}
            ${sIdx === 0 ? `<td rowspan="${parent.subGoals.length}" style="border: 2px solid black; text-align: center; padding: 10px; font-weight: bold;">${parent.title}</td>` : ""}
            <td style="border: 2px solid black; padding: 10px;"><b>${sub.code}</b><br/>${sub.content}${strategyHTML}</td>
            <td style="border: 2px solid black; text-align: center; padding: 5px;">${sub.records[0].date}<br/>${sub.records[0].accuracy}%</td>
            <td style="border: 2px solid black; text-align: center; padding: 5px;">${sub.records[1].date}<br/>${sub.records[1].accuracy}%</td>
            <td style="border: 2px solid black; text-align: center; padding: 10px; font-weight: bold; color: ${statusColor};">${statusText}</td>
          </tr>
        `;
      });
    });

    return `
      <table style="border-collapse: collapse; width: 100%; font-family: 'Noto Sans TC', sans-serif; border: 2px solid black;">
        <thead>
          <tr>
            <th rowspan="4" style="border: 2px solid black; padding: 10px; text-align: center;">領域/科<br/>目</th>
            <th rowspan="4" style="border: 2px solid black; padding: 10px; text-align: center;">學年<br/>教育目標</th>
            <th colspan="4" style="border: 2px solid black; padding: 10px; text-align: center;">學期教育目標</th>
          </tr>
          <tr>
            <th rowspan="3" style="border: 2px solid black; padding: 10px; text-align: center;">目標<br/><small>(內容、評量方式、日期、標準)</small></th>
            <th colspan="3" style="border: 2px solid black; padding: 10px; text-align: center;">評量結果</th>
          </tr>
          <tr>
            <th colspan="2" style="border: 2px solid black; padding: 5px; text-align: center;">形成性評量</th>
            <th rowspan="2" style="border: 2px solid black; padding: 10px; text-align: center;">通過<br/>與否</th>
          </tr>
          <tr>
            <th style="border: 2px solid black; padding: 5px; text-align: center; color: red; font-size: 11px;">結果/日期</th>
            <th style="border: 2px solid black; padding: 5px; text-align: center; color: red; font-size: 11px;">結果/日期</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    `;
  };

  const handleCopyForGoogleDocs = async () => {
    if (parentGoals.length === 0) return;
    const html = generateTableHTML();
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];
      await navigator.clipboard.write(data);
      alert('【報表格式已複製】\n請至 Google 文件按 Ctrl+V 貼上，標頭結構將完美呈現。');
    } catch (err) {
      alert('複製失敗，請使用「列印 / PDF」功能。');
    }
  };

  const handleDownloadCSV = () => {
    if (parentGoals.length === 0) return;
    let csvContent = "\ufeff領域,學年目標,細部編號,細部指標內容,學習策略,評量1日期,評量1正確率,評量2日期,評量2正確率,是否通過\n";
    parentGoals.forEach(p => p.subGoals.forEach(s => {
      const lastAcc = s.records.filter(r => r.accuracy !== "").pop()?.accuracy;
      const status = lastAcc && parseInt(lastAcc as string) >= 80 ? "通過" : (lastAcc ? "未通過" : "-");
      csvContent += [subject, `"${p.title}"`, `"${s.code}"`, `"${s.content}"`, `"${s.strategy}"`, s.records[0].date, s.records[0].accuracy, s.records[1].date, s.records[1].accuracy, status].join(",") + "\n";
    }));
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `IEP_${subject}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen pb-16 bg-slate-50">
      <header className="bg-slate-900 text-white py-8 px-4 shadow-2xl mb-10 no-print border-b-4 border-blue-500 text-center lg:text-left">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
             <div className="bg-blue-600 p-3 rounded-2xl shadow-xl transform rotate-3">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tight">IEP 目標管理助手 <span className="text-blue-400 text-xl font-medium ml-2">v4.6</span></h1>
                <p className="text-slate-400 text-base font-medium mt-1">支援跨領域與多種障礙類別</p>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Input Card */}
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 mb-12 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 領域與年級與障礙類別 */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                  <span className="bg-blue-600 w-2 h-2 rounded-full"></span> 選擇領域
                </label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <button 
                      key={s.value} 
                      onClick={() => setSubject(s.value)} 
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${subject === s.value ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-blue-600 w-2 h-2 rounded-full"></span> 年級
                  </label>
                  <select 
                    className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 bg-slate-50 focus:border-blue-500 outline-none"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-blue-600 w-2 h-2 rounded-full"></span> 障礙類別
                  </label>
                  <select 
                    className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 bg-slate-50 focus:border-blue-500 outline-none"
                    value={disability}
                    onChange={(e) => setDisability(e.target.value)}
                  >
                    {disabilities.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <label className="block text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                 <span className="bg-blue-600 w-2 h-2 rounded-full"></span> 單元名稱
              </label>
              <textarea 
                className="w-full p-5 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-0 text-xl h-48 leading-relaxed shadow-inner" 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)} 
                placeholder="請輸入教學單元，例如：生活中常用的社交禮儀、認識錢幣與購物、情緒控制策略等..." 
              />
            </div>
            <div className="lg:col-span-4">
              <label className="block text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                 <span className="bg-blue-600 w-2 h-2 rounded-full"></span> 學生個別化描述
              </label>
              <textarea 
                className="w-full p-5 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-0 text-xl h-48 leading-relaxed shadow-inner" 
                value={level} 
                onChange={(e) => setLevel(e.target.value)} 
                placeholder="請描述學生的起點行為與限制，AI 會根據此資訊調整指標難度與策略..." 
              />
            </div>
          </div>

          {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold">{error}</div>}

          <button onClick={handleGenerate} disabled={isGenerating} className={`mt-10 w-full py-6 rounded-2xl font-black text-2xl shadow-xl transition-all ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-blue-800 active:scale-[0.99]'}`}>
            {isGenerating ? 'AI 專家正在分析領綱並產出指標...' : '✨ 生成標準教育目標'}
          </button>
        </section>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4 no-print px-2">
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">教學目標預覽</h2>
              <p className="text-slate-500 font-bold mt-2">提示：您可以點擊表格內容直接編輯，或刪除不適用的指標。</p>
           </div>
           <div className="flex flex-wrap gap-3">
              <button onClick={handleCopyForGoogleDocs} className="px-5 py-3 bg-blue-50 border-2 border-blue-600 text-blue-700 font-black rounded-xl hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2zM14 8V3.5L18.5 8H14z"/></svg>
                複製至 Google 文件
              </button>
              <button onClick={handleDownloadCSV} className="px-5 py-3 bg-white border-2 border-emerald-600 text-emerald-700 font-black rounded-xl hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-2">
                匯出 CSV
              </button>
           </div>
        </div>

        <IEPTable 
          subject={subject}
          parentGoals={parentGoals}
          onUpdateSubGoal={updateSubGoal}
          onDeleteParent={(id) => setParentGoals(prev => prev.filter(p => p.id !== id))}
          onAddManualParent={() => {
             const newParent: IEPParentGoal = {
                id: Math.random().toString(36).substr(2, 9),
                title: '手動輸入學年目標',
                subGoals: [{ id: Math.random().toString(36).substr(2, 9), code: '1-1', content: '內容與標準...', strategy: '', records: [{ date: '', accuracy: '' }, { date: '', accuracy: '' }] }]
             };
             setParentGoals(prev => [...prev, newParent]);
          }}
        />

        <footer className="mt-20 text-center text-slate-400 text-xs no-print">
          <p>© 2024 IEP Professional Assistant - 專為特教行政減壓設計</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
