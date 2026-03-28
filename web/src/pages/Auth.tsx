import React, { useState, useEffect } from 'react';
import { get, post } from '../api';
import { useSSE } from '../hooks/useSSE';

export default function Auth() {
  const [mode, setMode] = useState<'choose' | 'qr' | 'cookie'>('choose');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cookieText, setCookieText] = useState('');
  const [status, setStatus] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const sse = useSSE();

  useEffect(() => {
    get<{ loggedIn: boolean }>('/api/auth/status').then((d) => setStatus(d.loggedIn)).catch(() => setStatus(false));
  }, []);

  const startQrLogin = async () => {
    setLoading(true);
    try {
      const data = await post<{ taskId: string; qrCode: string }>('/api/auth/login');
      setQrCode(data.qrCode);
      setMode('qr');
      sse.connect(data.taskId);
    } catch (err: any) {
      setMessage('获取二维码失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitCookie = async () => {
    if (!cookieText.trim()) return;
    setLoading(true);
    try {
      const res = await post<{ ok: boolean; error?: string }>('/api/auth/cookie', { cookie: cookieText.trim() });
      if (res.ok) {
        setStatus(true);
        setMessage('');
        setMode('choose');
      } else {
        setMessage(res.error || '导入失败');
      }
    } catch (err: any) {
      setMessage('导入失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // QR login succeeded
  if (sse.status === 'completed') {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-8">小红书登录</h2>
        <SuccessBox />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">小红书登录</h2>

      {/* Current status */}
      {status !== null && (
        <div className={`rounded-xl border p-4 mb-6 ${status ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <p className={status ? 'text-green-400 text-sm' : 'text-yellow-400 text-sm'}>
            {status ? '当前状态：已登录' : '当前状态：未登录'}
          </p>
        </div>
      )}

      {message && <p className="text-red-400 text-sm mb-4">{message}</p>}

      {mode === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1: QR Code */}
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
            <h3 className="font-semibold mb-3">方式一：扫码登录</h3>
            <p className="text-sm text-gray-400 mb-4">弹出小红书登录页面，用 App 扫码。<br />适合本地使用，服务器上可能被检测。</p>
            <button
              onClick={startQrLogin}
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
            >
              {loading ? '获取中...' : '获取二维码'}
            </button>
          </div>

          {/* Option 2: Cookie Import (recommended for server) */}
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
            <h3 className="font-semibold mb-3">方式二：手动导入 Cookie <span className="text-xs text-green-400 ml-2">推荐</span></h3>
            <p className="text-sm text-gray-400 mb-4">在自己浏览器登录小红书，复制 Cookie 粘贴到这里。<br />不受服务器环境限制，100% 可靠。</p>
            <button
              onClick={() => setMode('cookie')}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              导入 Cookie
            </button>
          </div>
        </div>
      )}

      {mode === 'qr' && (
        <div className="flex flex-col items-center gap-6">
          {qrCode && (
            <div className="rounded-xl bg-white p-6">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>
          )}
          <p className="text-gray-400 text-sm">用小红书 App 扫码登录</p>
          {sse.progress && <p className="text-sm text-gray-500">{sse.progress.message}</p>}
          {sse.status === 'failed' && <p className="text-sm text-red-400">{sse.error}</p>}
          <button onClick={() => { setMode('choose'); setQrCode(null); }} className="text-sm text-gray-500 hover:text-gray-300">← 返回选择</button>
        </div>
      )}

      {mode === 'cookie' && (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="font-semibold mb-4">导入 Cookie</h3>
          <div className="rounded-lg bg-gray-800 p-4 mb-4 text-sm text-gray-400 space-y-2">
            <p className="font-medium text-gray-300">操作步骤：</p>
            <p>1. 在电脑浏览器中打开 <a href="https://www.xiaohongshu.com" target="_blank" className="text-indigo-400 hover:underline">www.xiaohongshu.com</a> 并登录</p>
            <p>2. 按 F12 打开开发者工具，切到「Application」或「存储」标签</p>
            <p>3. 在左侧找到「Cookies」→「https://www.xiaohongshu.com」</p>
            <p>4. 全选所有 Cookie 行，右键复制，粘贴到下方</p>
            <p className="text-gray-500">或者用浏览器扩展（如 EditThisCookie）导出 JSON 格式。</p>
          </div>
          <textarea
            value={cookieText}
            onChange={(e) => setCookieText(e.target.value)}
            placeholder="粘贴 Cookie 内容（支持 JSON 格式或 key=value; 格式）"
            className="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono resize-y mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={submitCookie}
              disabled={loading || !cookieText.trim()}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
            >
              {loading ? '导入中...' : '确认导入'}
            </button>
            <button onClick={() => setMode('choose')} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
              返回
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessBox() {
  return (
    <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-8 text-center">
      <p className="text-3xl mb-3">✅</p>
      <p className="text-green-400 font-medium text-lg">登录成功</p>
      <p className="text-gray-500 text-sm mt-2">Cookie 已保存，可以开始使用了</p>
    </div>
  );
}
