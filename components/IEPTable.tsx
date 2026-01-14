
import React from 'react';
import { IEPParentGoal, Subject } from '../types';

interface IEPTableProps {
  subject: Subject;
  parentGoals: IEPParentGoal[];
  showStrategy: boolean;
  onUpdateSubGoal: (parentId: string, subGoalId: string, field: string, value: any, recordIndex?: number) => void;
  onDeleteParent: (id: string) => void;
  onAddManualParent: () => void;
}

const IEPTable: React.FC<IEPTableProps> = ({ subject, parentGoals, showStrategy, onUpdateSubGoal, onDeleteParent, onAddManualParent }) => {
  const totalSubGoals = parentGoals.reduce((sum, p) => sum + p.subGoals.length, 0);

  return (
    <div className="bg-white border-2 border-zinc-950 rounded-none overflow-x-auto mb-20 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)]">
      <table id="iep-main-table" className="min-w-full border-collapse table-fixed">
        <thead className="bg-white text-zinc-950 text-sm font-black uppercase border-b-2 border-zinc-950">
          <tr className="border-b-2 border-zinc-950">
            <th rowSpan={4} className="border-r-2 border-zinc-950 px-4 py-6 text-center w-28 text-lg">領域/科<br/>目</th>
            <th rowSpan={4} className="border-r-2 border-zinc-950 px-4 py-6 text-center w-56 bg-zinc-50 text-lg">學年<br/>教育目標</th>
            <th colSpan={4} className="px-4 py-4 text-center text-xl tracking-[0.5em]">學期教育目標</th>
          </tr>
          <tr className="border-b-2 border-zinc-950">
            <th rowSpan={3} className="border-r-2 border-zinc-950 px-6 py-4 text-center min-w-[450px]">
              <span className="text-xl">目標</span><br/>
              <span className="text-[11px] font-bold text-zinc-500">(目標編號、內容、評量方式、標準)</span>
            </th>
            <th colSpan={3} className="px-4 py-3 text-center bg-zinc-50 tracking-widest text-lg">評量結果</th>
          </tr>
          <tr className="border-b-2 border-zinc-950">
            <th colSpan={2} className="border-r-2 border-zinc-950 px-4 py-2 text-center text-base">形成性評量</th>
            <th rowSpan={2} className="px-2 py-2 w-28 text-center align-middle bg-zinc-50 text-base">通過<br/>與否</th>
          </tr>
          <tr className="text-[12px] font-black">
            <th className="border-r-2 border-zinc-950 px-2 py-3 text-center text-red-600 uppercase">結果/日期</th>
            <th className="border-r-2 border-zinc-950 px-2 py-3 text-center text-red-600 uppercase">結果/日期</th>
          </tr>
        </thead>
        <tbody className="text-zinc-900">
          {parentGoals.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-40 text-center text-zinc-300 font-bold italic text-lg uppercase tracking-widest">
                Please input Unit Name to Generate Objectives.
              </td>
            </tr>
          ) : parentGoals.map((parent, pIdx) => (
            <React.Fragment key={parent.id}>
              {parent.subGoals.map((sub, sIdx) => (
                <tr key={sub.id} className="border-b-2 border-zinc-950 group hover:bg-zinc-50 transition-colors">
                  {pIdx === 0 && sIdx === 0 && (
                    <td rowSpan={totalSubGoals} className="border-r-2 border-zinc-950 px-2 py-6 text-center font-black text-2xl align-middle w-28 bg-zinc-950 text-white">
                      <div className="vertical-text">{subject}</div>
                    </td>
                  )}
                  {sIdx === 0 && (
                    <td rowSpan={parent.subGoals.length} className="border-r-2 border-zinc-950 px-5 py-8 align-top w-56 bg-zinc-50/50">
                      <div className="flex flex-col h-full">
                        <textarea
                          className="w-full border-none focus:ring-0 text-base font-black resize-none bg-transparent leading-relaxed text-zinc-900 flex-grow min-h-[100px]"
                          value={parent.title}
                          onChange={(e) => onUpdateSubGoal(parent.id, '', 'parentTitle', e.target.value)}
                        />
                        <button onClick={() => onDeleteParent(parent.id)} className="no-print mt-2 text-[10px] text-zinc-300 hover:text-red-500 text-left font-black uppercase">Delete Group</button>
                      </div>
                    </td>
                  )}
                  <td className="border-r-2 border-zinc-950 px-8 py-8">
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-4">
                         <input 
                           title="目標編號 (例如: 1-1)"
                           className="w-20 border-b-2 border-zinc-200 focus:border-zinc-950 p-0 focus:ring-0 bg-transparent font-black text-xl text-orange-600" 
                           value={sub.code} 
                           onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'code', e.target.value)} 
                         />
                         <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded border border-amber-200">
                            <span className="text-[11px] font-black text-amber-600 uppercase">標準:</span>
                            <input 
                              type="number"
                              className="w-10 text-center font-black text-sm text-zinc-950 border-none focus:ring-0 bg-transparent p-0"
                              value={sub.targetAccuracy}
                              onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'targetAccuracy', parseInt(e.target.value) || 0)}
                            />
                            <span className="text-[11px] font-black text-amber-600">%</span>
                         </div>
                      </div>
                      <textarea className="w-full border-none focus:ring-0 text-lg p-0 resize-none bg-transparent leading-relaxed font-bold text-zinc-900" value={sub.content} rows={3} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'content', e.target.value)} />
                      {sub.strategy && showStrategy && (
                        <div className="strategy-container mt-2 p-4 bg-zinc-50 border-l-4 border-zinc-950">
                          <textarea className="w-full border-none focus:ring-0 p-0 bg-transparent resize-none leading-relaxed text-[13px] font-medium text-zinc-500 italic" value={sub.strategy} rows={2} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'strategy', e.target.value)} />
                        </div>
                      )}
                    </div>
                  </td>
                  {[0, 1].map((idx) => (
                    <td key={idx} className="border-r-2 border-zinc-950 px-3 py-8 text-center w-32">
                      <div className="flex flex-col items-center gap-4">
                        <input className="w-full text-center border-none focus:ring-0 text-[13px] text-zinc-400 bg-transparent font-black tracking-tight" value={sub.records[idx]?.date || ''} placeholder="日期(M/D)" onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'date', e.target.value, idx)} />
                        <div className="flex items-end justify-center border-b-2 border-zinc-200 pb-1">
                          <input className="w-14 text-center font-black text-3xl focus:ring-0 border-none bg-transparent p-0 text-zinc-950" value={sub.records[idx]?.accuracy || ''} placeholder="-" onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'accuracy', e.target.value, idx)} />
                          <span className="text-xs text-zinc-400 font-bold mb-1 ml-1">%</span>
                        </div>
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-8 text-center align-middle w-28 bg-zinc-50/30">
                    {(() => {
                      const lastAcc = sub.records.filter(r => r.accuracy !== "" && r.accuracy !== null).pop()?.accuracy;
                      const val = parseInt(lastAcc as string);
                      const isPass = !isNaN(val) && val >= (sub.targetAccuracy || 80);
                      return (
                        <div className={`font-black text-4xl ${lastAcc ? (isPass ? 'text-zinc-950' : 'text-orange-600') : 'text-zinc-200'}`}>
                          {lastAcc ? (isPass ? '○' : '×') : '—'}
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
      <div className="bg-zinc-50 p-6 no-print border-t-2 border-zinc-950 flex justify-center">
        <button onClick={onAddManualParent} className="text-xs font-black text-zinc-950 hover:bg-orange-600 hover:text-white px-8 py-3 transition-all uppercase tracking-widest border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">[ Add Manual Year Goal Row ]</button>
      </div>
    </div>
  );
};

export default IEPTable;
