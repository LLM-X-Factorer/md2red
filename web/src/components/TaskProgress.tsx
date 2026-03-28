import React from 'react';

interface Props {
  step: number;
  total: number;
  message: string;
  status: 'running' | 'completed' | 'failed';
  error?: string | null;
}

export default function TaskProgress({ step, total, message, status, error }: Props) {
  const pct = Math.round((step / total) * 100);

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{message}</span>
        <span className="text-xs text-gray-500">{step}/{total}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            status === 'failed' ? 'bg-red-500' : status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {status === 'completed' && <p className="mt-3 text-sm text-green-400">完成</p>}
    </div>
  );
}
