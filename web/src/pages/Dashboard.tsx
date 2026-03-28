import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { get } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [authStatus, setAuthStatus] = useState<{ loggedIn: boolean; hoursRemaining?: number; reason?: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    get<{ loggedIn: boolean; hoursRemaining?: number; reason?: string }>('/api/auth/status').then(setAuthStatus).catch(() => setAuthStatus({ loggedIn: false }));
    get<any[]>('/api/history').then(setHistory).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">控制台</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-sm text-gray-500 mb-2">账号状态</h3>
          {authStatus === null ? (
            <p className="text-gray-400">检查中...</p>
          ) : authStatus.loggedIn ? (
            <div>
              <p className="text-green-400 font-medium">已登录</p>
              {authStatus.hoursRemaining != null && (
                <p className="text-xs text-gray-500 mt-1">Cookie 剩余 {authStatus.hoursRemaining} 小时</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-red-400 font-medium mb-1">未登录</p>
              {authStatus.reason && <p className="text-xs text-gray-500 mb-2">{authStatus.reason}</p>}
              <Link to="/auth" className="text-sm text-indigo-400 hover:underline">去登录 →</Link>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-sm text-gray-500 mb-2">发布记录</h3>
          <p className="text-2xl font-bold">{history.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {history.filter((r) => r.status === 'published').length} 已发布
          </p>
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
