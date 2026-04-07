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
          <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-600">清除全部</button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-gray-500">暂无记录</p>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3">标题</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">卡片数</th>
                <th className="px-5 py-3">时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.slice().reverse().map((r: any) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{r.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-gray-500">{r.imageCount}</td>
                  <td className="px-5 py-3 text-gray-400">{r.createdAt?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/api/export-dir?dir=${encodeURIComponent(r.outputDir)}`}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        导出
                      </a>
                      <a
                        href={`/preview/${encodeURIComponent(r.outputDir)}`}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        查看
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
