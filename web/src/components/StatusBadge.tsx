import React from 'react';

const STYLES: Record<string, string> = {
  generated: 'bg-blue-500/20 text-blue-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  previewed: 'bg-yellow-500/20 text-yellow-400',
};

const LABELS: Record<string, string> = {
  generated: '已生成',
  published: '已发布',
  failed: '失败',
  previewed: '已预览',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[status] || 'bg-gray-700 text-gray-300'}`}>
      {LABELS[status] || status}
    </span>
  );
}
