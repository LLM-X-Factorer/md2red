import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { get } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    get<any[]>('/api/history').then(setHistory).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">控制台</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-sm text-gray-500 mb-2">生成记录</h3>
          <p className="text-2xl font-bold">{history.length}</p>
        </div>

        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 flex items-center justify-center">
          <Link
            to="/upload"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors"
          >
            上传 Markdown
          </Link>
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">最近记录</h3>
          <div className="space-y-3">
            {history.slice(-5).reverse().map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-900 border border-gray-800 px-5 py-3">
                <div>
                  <p className="font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.createdAt?.slice(0, 10)} · {r.imageCount} 张卡片</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
