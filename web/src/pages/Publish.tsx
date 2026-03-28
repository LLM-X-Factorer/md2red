import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { post } from '../api';
import { useSSE } from '../hooks/useSSE';
import TaskProgress from '../components/TaskProgress';

export default function Publish() {
  const { taskId } = useParams();
  const [publishing, setPublishing] = useState(false);
  const sse = useSSE();

  const handlePublish = async (draft: boolean) => {
    setPublishing(true);
    try {
      const data = await post<{ taskId: string }>('/api/publish', { taskId, draft });
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
          <p className="text-green-400 font-medium text-lg">
            {(sse.result as any)?.draft ? '草稿保存成功' : '发布成功'}
          </p>
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
      ) : (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-8 text-center space-y-6">
          <p className="text-gray-400">确认发布方案后，选择发布方式：</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handlePublish(false)}
              disabled={publishing}
              className="px-6 py-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
            >
              发布（仅自己可见）
            </button>
            <button
              onClick={() => handlePublish(true)}
              disabled={publishing}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
            >
              保存为草稿
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
