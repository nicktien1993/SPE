
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
    <div className="bg-white shadow-2xl border-b-4 border-black overflow-x-auto">
      <table className="min-w-full border-collapse border-2 border-black">
        <thead className="bg-white text-black">
          <tr className="border-b-2 border-black">
            <th rowSpan={4} className="border-r-2 border-black px-2 py-4 text-center w-20 font-bold">領域</th>
            <th rowSpan={4} className="border-r-2 border-black px-2 py-4 text-center w-36 font-bold">學年目標</th>
            <th colSpan={4} className="px-4 py-2 text-center font-bold">學期教育目標</th>
          </tr>
          <tr className="border-b-2 border-black">
            <th rowSpan={3} className="border-r-2 border-black px-4 py-4 text-center font-bold min-w-[300px]">目標內容</th>
            <th colSpan={3} className="px-4 py-2 text-center font-bold">評量結果</th>
          </tr>
          <tr className="border-b-2 border-black">
            <th colSpan={2} className="border-r-2 border-black px-4 py-2 text-center font-bold">形成性評量</th>
            <th rowSpan={2} className="px-2 py-2 text-center w-24 font-bold">通過</th>
          </tr>
          <tr className="border-b-2 border-black">
            <th className="border-r-2 border-black px-2 py-1 text-center font-medium text-red-500 text-xs">結果/日期</th>
            <th className="border-r-2 border-black px-2 py-1 text-center font-medium text-red-500 text-xs">結果/日期</th>
          </tr>
        </thead>
        <tbody>
          {parentGoals.map((parent, pIdx) => (
            <React.Fragment key={parent.id}>
              {parent.subGoals.map((sub, sIdx) => (
                <tr key={sub.id} className="border-b-2 border-black hover:bg-slate-50">
                  {pIdx === 0 && sIdx === 0 && (
                    <td rowSpan={totalSubGoals} className="border-r-2 border-black px-4 py-6 text-center font-black text-2xl align-middle w-20">
                      <div className="vertical-text">{subject}</div>
                    </td>
                  )}
                  {sIdx === 0 && (
                    <td rowSpan={parent.subGoals.length} className="border-r-2 border-black px-4 py-6 text-center align-middle group w-36">
                      <textarea
                        className="w-full border-none focus:ring-0 text-center resize-none bg-transparent font-bold"
                        value={parent.title}
                        rows={4}
                        onChange={(e) => onUpdateSubGoal(parent.id, '', 'parentTitle', e.target.value)}
                      />
                    </td>
                  )}
                  <td className="border-r-2 border-black px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <input className="font-bold text-indigo-700 border-none p-0 focus:ring-0 bg-transparent w-full" value={sub.code} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'code', e.target.value)} />
                      <textarea className="w-full border-none focus:ring-0 text-lg p-0 resize-none bg-transparent" value={sub.content} rows={2} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'content', e.target.value)} />
                      {sub.strategy !== undefined && (
                        <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <textarea className="w-full border-none focus:ring-0 text-xs italic text-blue-800 p-0 bg-transparent resize-none" value={sub.strategy} rows={2} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'strategy', e.target.value)} />
                        </div>
                      )}
                    </div>
                  </td>
                  {[0, 1].map((idx) => (
                    <td key={idx} className="border-r-2 border-black px-1 py-2 text-center w-28">
                      <input className="w-full text-center border-none focus:ring-0 text-xs bg-transparent" value={sub.records[idx]?.date || ''} placeholder="M/D" onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'date', e.target.value, idx)} />
                      <div className="flex items-baseline justify-center">
                        <input className="w-12 text-center font-bold text-2xl focus:ring-0 border-none bg-transparent p-0" value={sub.records[idx]?.accuracy || ''} onChange={(e) => onUpdateSubGoal(parent.id, sub.id, 'accuracy', e.target.value, idx)} />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-4 text-center align-middle w-24">
                    {(() => {
                      const lastAcc = sub.records.filter(r => r.accuracy !== "" && r.accuracy !== "-").pop()?.accuracy;
                      const isPass = lastAcc && parseInt(lastAcc as string) >= 80;
                      return <span className={`font-black text-xl ${isPass ? 'text-black' : 'text-red-600'}`}>{lastAcc ? (isPass ? '通過' : '不通過') : '-'}</span>;
                    })()}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="bg-slate-900 p-4 no-print flex justify-center">
        <button onClick={onAddManualParent} className="text-white font-bold hover:text-blue-300">+ 新增目標</button>
      </div>
    </div>
  );
};

export default IEPTable;
