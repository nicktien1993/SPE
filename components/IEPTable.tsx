
import React from 'react';
import { IEPParentGoal, Subject } from '../types';

interface IEPTableProps {
  subject: Subject;
  parentGoals: IEPParentGoal[];
  onUpdateSubGoal: (parentId: string, subGoalId: string, field: string, value: any, recordIndex?: number) => void;
  onDeleteParent: (id: string) => void;
  onAddManualParent: () => void;
}

const IEPTable: React.FC<IEPTableProps> = ({ subject, parentGoals, onUpdateSubGoal, onDeleteParent, onAddManualParent }) => {
  const totalSubGoals = parentGoals.reduce((sum, p) => sum + p.subGoals.length, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const feedback = document.createElement('div');
    feedback.innerText = '已複製內容';
    feedback.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-black z-[9999] shadow-2xl animate-bounce';
    document.body.appendChild(feedback);
    setTimeout(() => document.body.removeChild(feedback), 1200);
  };

  return (
    <div className="bg-white shadow-2xl shadow-slate-200/50 border border-slate-900 rounded-none overflow-hidden mb-20">
      <table id="iep-main-table" className="min-w-full border-collapse table-fixed border-2 border-black">
        <thead className="bg-white text-black text-base font-black uppercase">
          <tr className="border-b-2 border-black">
            <th rowSpan={4} className="border-r-2 border-black px-2 py-4 text-center w-16">領域</th>
            <th rowSpan={4} className="border-r-2 border-black px-2 py-4 text-center w-48">學年目標</th>
            <th colSpan={5} className="px-4 py-3 text-center border-b-2 border-black">學期教育目標</th>
          </tr>
          <tr className="border-b-2 border-black">
            <th rowSpan={3} className="border-r-2 border-black px-6 py-4 text-center min-w-[350px]">目標內容與標準</th>
            <th rowSpan={3} className="border-r-2 border-black px-2 py-4 text-center w-24 bg-slate-50">目標值</th>
            <th colSpan={3} className="px-4 py-2 text-center border-b-2 border-black">評量結果</th>
          </tr>
          <tr className="border-b-2 border-black text-center">
            <th colSpan={2} className="border-r-2 border-black px-4 py-2">形成性評量</th>
            <th rowSpan={2} className="px-2 py-2 w-20">通過</th>
          </tr>
          <tr className="border-b-2 border-black">
            <th className="border-r-2 border-black px-2 py-1 text-center font-bold text-red-500 text-[10px]">結果/日期</th>
            <th className="border-r-2 border-black px-2 py-1 text-center font-bold text-red-500 text-[10px]">結果/日期</th>
          </tr>
        </thead>
        <tbody>
          {parentGoals.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-32 text-center text-slate-500 font-bold italic">
                尚未生成內容，請填寫上方資訊並點擊生成。
              </td>
            </tr>
          ) : parentGoals.map((parent, pIdx) => (
            <React.Fragment key={parent.id}>
              {parent.subGoals.map((sub, sIdx) => (
                <tr key={sub.id} className="border-b-2 border-black group hover:bg-slate-50/50 transition-all">
                  {pIdx === 0 && sIdx === 0 && (
                    <td rowSpan={totalSubGoals} className="border-r-2 border-black px-2 py-6 text-center font-black text-xl align-middle w-16 text-black">
                      <div className="vertical-text">{subject}</div>
                    </td>
                  )}
                  {sIdx === 0 && (
                    <td rowSpan={parent.subGoals.length} className="border-r-2 border-black px-4 py-6 align-top w-48 relative">
                      <textarea
                        className="w-full border-none focus:ring-0 text-sm font-black resize-none bg-transparent leading-relaxed text-black"
                        value={parent.title}
                        rows={6}
                        onChange={(e) => onUpdateSubGoal(parent.id, '', 'parentTitle', e.target.value)}
                      />
                    </td>
                  )}
                  <td className="border-r-2 border-black px-6 py-6 relative">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                         <div className="text-blue-900 font-black text-base">
                            <input className="border-none p-0 focus:ring-0 bg-transparent w-12" value={sub.code} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'code', e.target.value)} />
                         </div>
                      </div>
                      <textarea className="w-full border-none focus:ring-0 text-sm p-0 resize-none bg-transparent leading-relaxed font-bold text-slate-900" value={sub.content} rows={3} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'content', e.target.value)} />
                      {sub.strategy && (
                        <div className="mt-1 p-2 bg-blue-50/50 rounded-sm text-[11px] text-blue-900 italic border-l-4 border-blue-400">
                          <textarea className="w-full border-none focus:ring-0 p-0 bg-transparent resize-none leading-relaxed font-medium" value={sub.strategy} rows={2} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'strategy', e.target.value)} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border-r-2 border-black px-2 py-6 text-center w-24 bg-slate-50/50">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">目標值</span>
                      <div className="flex items-end">
                        <input 
                          type="number"
                          className="w-10 text-center font-black text-indigo-600 border-b-2 border-indigo-200 focus:border-indigo-500 focus:ring-0 bg-transparent p-0 text-lg"
                          value={sub.targetAccuracy}
                          onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'targetAccuracy', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-xs font-bold text-indigo-400 mb-1 ml-0.5">%</span>
                      </div>
                    </div>
                  </td>
                  {[0, 1].map((idx) => (
                    <td key={idx} className="border-r-2 border-black px-1 py-4 text-center w-24">
                      <div className="flex flex-col items-center gap-1">
                        <input className="w-full text-center border-none focus:ring-0 text-[10px] text-slate-600 bg-transparent font-bold" value={sub.records[idx]?.date || ''} placeholder="M/D" onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'date', e.target.value, idx)} />
                        <div className="flex items-end justify-center">
                          <input className="w-8 text-center font-bold text-lg focus:ring-0 border-none bg-transparent p-0 text-black" value={sub.records[idx]?.accuracy || ''} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'accuracy', e.target.value, idx)} />
                          <span className="text-[10px] text-slate-500 font-bold mb-1 ml-0.5">%</span>
                        </div>
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-4 text-center align-middle w-20">
                    {(() => {
                      const lastAcc = sub.records.filter(r => r.accuracy !== "").pop()?.accuracy;
                      const val = parseInt(lastAcc as string);
                      const isPass = !isNaN(val) && val >= (sub.targetAccuracy || 80);
                      return (
                        <div className={`font-black text-xl ${isPass ? 'text-green-600' : 'text-red-500'}`}>
                          {lastAcc ? (isPass ? 'OK' : 'X') : '-'}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="bg-slate-50/50 p-4 no-print flex justify-center border-t-2 border-black">
        <button onClick={onAddManualParent} className="text-xs font-black text-slate-900 hover:text-indigo-600 transition-colors">
          [ + ] 手動新增一行學年目標
        </button>
      </div>
    </div>
  );
};

export default IEPTable;
