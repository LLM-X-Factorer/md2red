import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { uploadFile, post } from '../api';
import { useSSE } from '../hooks/useSSE';
import TaskProgress from '../components/TaskProgress';

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [useStrategy, setUseStrategy] = useState(false);
  const [theme, setTheme] = useState('dark');
  const sse = useSSE();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.md')) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadFile('/api/upload', file) as any;
      setParsed(data);
    } catch (err: any) {
      alert('上传失败: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!parsed) return;
    try {
      const data = await post<{ taskId: string }>('/api/generate', {
        filePath: parsed.filePath,
        useStrategy,
        theme,
      });
      sse.connect(data.taskId);

      // Watch for completion to navigate
      const check = setInterval(async () => {
        const res = await fetch(`/api/tasks/${data.taskId}`);
        const task = await res.json();
        if (task.status === 'completed') {
          clearInterval(check);
          navigate(`/preview/${data.taskId}`);
        }
      }, 1000);
    } catch (err: any) {
      alert('生成失败: ' + err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">上传 Markdown</h2>

      {/* Step 1: Upload */}
      {!parsed && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-xl bg-gray-900 border-2 border-dashed border-gray-700 hover:border-indigo-500/50 p-12 text-center transition-colors"
        >
          <p className="text-4xl mb-4">📄</p>
          <p className="text-gray-400 mb-4">拖拽 .md 文件到这里，或</p>
          <label className="inline-block px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer text-sm transition-colors">
            选择文件
            <input type="file" accept=".md" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {file && (
            <div className="mt-6">
              <p className="text-sm text-gray-300">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-3 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
              >
                {uploading ? '上传中...' : '上传并解析'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Parsed result + generate options */}
      {parsed && sse.status === 'idle' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
            <h3 className="font-semibold mb-4">解析结果</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">标题</span><p className="font-medium mt-1">{parsed.parsed.title}</p></div>
              <div><span className="text-gray-500">字数</span><p className="font-medium mt-1">{parsed.parsed.wordCount}</p></div>
              <div><span className="text-gray-500">内容块</span><p className="font-medium mt-1">{parsed.parsed.blockCount}</p></div>
              <div><span className="text-gray-500">代码块</span><p className="font-medium mt-1">{parsed.parsed.hasCodeBlocks ? '有' : '无'}</p></div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
            <h3 className="font-semibold mb-4">生成选项</h3>
            <div className="flex flex-wrap gap-6 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={useStrategy} onChange={(e) => setUseStrategy(e.target.checked)} className="rounded" />
                使用 LLM 内容策略
              </label>
              <label className="flex items-center gap-2 text-sm">
                主题
                <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-gray-800 rounded px-3 py-1.5 text-sm border border-gray-700">
                  <option value="dark">暗色</option>
                  <option value="light">亮色</option>
                </select>
              </label>
            </div>
            <button
              onClick={handleGenerate}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors"
            >
              开始生成
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Progress */}
      {sse.status !== 'idle' && sse.progress && (
        <TaskProgress
          step={sse.progress.step}
          total={sse.progress.total}
          message={sse.progress.message}
          status={sse.status as any}
          error={sse.error}
        />
      )}
    </div>
  );
}
