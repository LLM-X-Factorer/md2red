import React, { useEffect, useState } from 'react';
import { get, del } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function History() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    get<any[]>('/api/history').then(setRecords).catch(() => {});
  }, []);

  const clearAll = async () => {
    if (!confirm('确定清除所有历史记录？')) return;
    await del('/api/history');
    setRecords([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">生成历史</h2>
        {records.length > 0 && (
          <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-300">清除全部</button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-gray-500">暂无记录</p>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3">标题</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">卡片数</th>
                <th className="px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody>
              {records.slice().reverse().map((r: any) => (
                <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-900/50">
                  <td className="px-5 py-3 font-medium">{r.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-gray-400">{r.imageCount}</td>
                  <td className="px-5 py-3 text-gray-500">{r.createdAt?.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
