import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { post } from '../api';
import { useSSE } from '../hooks/useSSE';
import TaskProgress from '../components/TaskProgress';

export default function Publish() {
  const { taskId } = useParams();
  const [publishing, setPublishing] = useState(false);
  const sse = useSSE();

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const data = await post<{ taskId: string }>('/api/publish', { taskId });
      sse.connect(data.taskId);
    } catch (err: any) {
      alert('发布失败: ' + err.message);
      setPublishing(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">发布到小红书</h2>

      {sse.status === 'completed' ? (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-8 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-green-400 font-medium text-lg">发布成功（仅自己可见）</p>
          <p className="text-gray-500 text-sm mt-2">笔记已发布，可在小红书「笔记管理」中查看</p>
          <div className="mt-6 flex gap-4 justify-center">
            <Link to="/upload" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm transition-colors">
              继续上传
            </Link>
            <Link to="/history" className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
              查看历史
            </Link>
          </div>
        </div>
      ) : sse.status !== 'idle' && sse.progress ? (
        <TaskProgress
          step={sse.progress.step}
          total={sse.progress.total}
          message={sse.progress.message}
          status={sse.status as any}
          error={sse.error}
        />
      ) : publishing ? (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 text-center">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">正在启动发布...</p>
        </div>
      ) : (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-8 text-center space-y-4">
          <p className="text-gray-400">笔记将以「仅自己可见」模式发布到小红书</p>
          <p className="text-gray-500 text-xs">发布后可在小红书创作者中心「笔记管理」中查看和编辑可见性</p>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-8 py-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
          >
            确认发布
          </button>
        </div>
      )}
    </div>
  );
}
