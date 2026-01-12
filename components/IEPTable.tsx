
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

  return (
    <div className="bg-white shadow-2xl border-b-4 border-black overflow-hidden">
      <table className="min-w-full border-collapse border-2 border-black">
        <thead className="bg-white text-black">
          {/* Row 1 */}
          <tr className="border-b-2 border-black">
            <th rowSpan={4} className="border-r-2 border-black px-2 py-4 text-center w-20 font-bold text-xl leading-tight">
              領域/科<br/>目
            </th>
            <th rowSpan={4} className="border-r-2 border-black px-2 py-4 text-center w-36 font-bold text-xl leading-tight">
              學年<br/>教育目標
            </th>
            <th colSpan={4} className="px-4 py-2 text-center font-bold text-xl">
              學期教育目標
            </th>
          </tr>
          {/* Row 2 */}
          <tr className="border-b-2 border-black">
            <th rowSpan={3} className="border-r-2 border-black px-4 py-4 text-center font-bold text-lg min-w-[300px]">
              目標<br/>
              <span className="text-sm font-normal">(內容、評量方式、日期、標準)</span>
            </th>
            <th colSpan={3} className="px-4 py-2 text-center font-bold text-lg">
              評量結果
            </th>
          </tr>
          {/* Row 3 */}
          <tr className="border-b-2 border-black">
            <th colSpan={2} className="border-r-2 border-black px-4 py-2 text-center font-bold text-base">
              形成性評量
            </th>
            <th rowSpan={2} className="px-2 py-2 text-center w-24 font-bold text-lg leading-tight">
              通過<br/>與否
            </th>
          </tr>
          {/* Row 4 */}
          <tr className="border-b-2 border-black">
            <th className="border-r-2 border-black px-2 py-1 text-center font-medium text-red-500 text-sm">
              結果/日期
            </th>
            <th className="border-r-2 border-black px-2 py-1 text-center font-medium text-red-500 text-sm">
              結果/日期
            </th>
          </tr>
        </thead>
        <tbody>
          {parentGoals.map((parent, pIdx) => (
            <React.Fragment key={parent.id}>
              {parent.subGoals.map((sub, sIdx) => (
                <tr key={sub.id} className="border-b-2 border-black hover:bg-slate-50 transition-colors">
                  {pIdx === 0 && sIdx === 0 && (
                    <td 
                      rowSpan={totalSubGoals} 
                      className="border-r-2 border-black px-4 py-6 text-center font-black text-2xl align-middle bg-white w-20"
                    >
                      <div className="vertical-text">{subject}</div>
                    </td>
                  )}
                  
                  {sIdx === 0 && (
                    <td 
                      rowSpan={parent.subGoals.length} 
                      className="border-r-2 border-black px-4 py-6 text-center font-bold text-lg align-middle bg-white relative group w-36"
                    >
                      <textarea
                        className="w-full border-none focus:ring-0 text-center resize-none bg-transparent font-medium"
                        value={parent.title}
                        rows={4}
                        onChange={(e) => onUpdateSubGoal(parent.id, '', 'parentTitle', e.target.value)}
                        placeholder="學年目標..."
                      />
                      <button 
                        onClick={() => onDeleteParent(parent.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 no-print p-1 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  )}

                  <td className="border-r-2 border-black px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                         <input 
                          className="font-bold text-indigo-700 text-base border-none p-0 focus:ring-0 bg-transparent w-12"
                          value={sub.code}
                          onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'code', e.target.value)}
                        />
                      </div>
                      <textarea
                        className="w-full border-none focus:ring-0 text-lg leading-relaxed p-0 resize-none bg-transparent"
                        value={sub.content}
                        rows={2}
                        onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'content', e.target.value)}
                        placeholder="目標內容、標準..."
                      />
                      
                      {sub.strategy !== undefined ? (
                        <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded shadow-sm">
                          <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">學習策略</label>
                          <textarea
                            className="w-full border-none focus:ring-0 text-sm italic text-blue-800 p-0 bg-transparent resize-none leading-tight"
                            value={sub.strategy}
                            rows={2}
                            onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'strategy', e.target.value)}
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => onUpdateSubGoal(parent.id, sub.id, 'strategy', '')}
                          className="mt-1 text-xs font-bold text-blue-500 hover:text-blue-700 no-print self-start"
                        >
                          + 策略
                        </button>
                      )}
                    </div>
                  </td>

                  {[0, 1].map((recordIdx) => (
                    <td key={recordIdx} className="border-r-2 border-black px-1 py-2 text-center w-28">
                      <div className="flex flex-col h-full justify-center items-center gap-2">
                        <input
                          type="text"
                          placeholder="M/D"
                          className="w-full text-center border-none focus:ring-0 text-sm py-0.5 bg-transparent"
                          value={sub.records[recordIdx]?.date || ''}
                          onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'date', e.target.value, recordIdx)}
                        />
                        <div className="flex items-baseline justify-center">
                          <input
                            type="text"
                            placeholder="-"
                            className="w-12 text-center font-bold text-2xl focus:ring-0 border-none bg-transparent p-0"
                            value={sub.records[recordIdx]?.accuracy || ''}
                            onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'accuracy', e.target.value, recordIdx)}
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      </div>
                    </td>
                  ))}

                  <td className="px-2 py-4 text-center align-middle w-24">
                    {(() => {
                      const lastAcc = sub.records.filter(r => r.accuracy !== "" && r.accuracy !== "-").pop()?.accuracy;
                      const isPass = lastAcc && parseInt(lastAcc as string) >= 80;
                      if (!lastAcc) return <span className="text-gray-300">-</span>;
                      return (
                        <span className={`font-black text-xl leading-tight block ${isPass ? 'text-black' : 'text-red-600'}`}>
                          {isPass ? '通過' : '不\n通過'}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="bg-slate-900 p-4 no-print flex justify-center border-t-2 border-black">
        <button onClick={onAddManualParent} className="flex items-center gap-2 text-white hover:text-blue-300 font-bold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
          手動新增目標
        </button>
      </div>
      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: upright;
          letter-spacing: 0.3em;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default IEPTable;
