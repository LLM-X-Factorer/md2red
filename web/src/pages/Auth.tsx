import React, { useState } from 'react';
import { post } from '../api';
import { useSSE } from '../hooks/useSSE';

export default function Auth() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sse = useSSE();

  const startLogin = async () => {
    setLoading(true);
    try {
      const data = await post<{ taskId: string; qrCode: string }>('/api/auth/login');
      setQrCode(data.qrCode);
      sse.connect(data.taskId);
    } catch (err: any) {
      alert('获取二维码失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">小红书登录</h2>

      {sse.status === 'completed' ? (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-8 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-green-400 font-medium text-lg">登录成功</p>
          <p className="text-gray-500 text-sm mt-2">Cookie 已保存，可以开始使用了</p>
        </div>
      ) : qrCode ? (
        <div className="flex flex-col items-center gap-6">
          <div className="rounded-xl bg-white p-6">
            <img src={qrCode} alt="QR Code" className="w-64 h-64" />
          </div>
          <p className="text-gray-400 text-sm">用小红书 App 扫码登录</p>
          {sse.progress && (
            <p className="text-sm text-gray-500">{sse.progress.message}</p>
          )}
          {sse.status === 'failed' && (
            <p className="text-sm text-red-400">{sse.error}</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-8 text-center">
          <p className="text-gray-400 mb-6">点击下方按钮，弹出小红书登录二维码</p>
          <button
            onClick={startLogin}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
          >
            {loading ? '获取中...' : '获取登录二维码'}
          </button>
        </div>
      )}
    </div>
  );
}
