import React from 'react';

const STYLES: Record<string, string> = {
  generated: 'bg-blue-50 text-blue-600',
  previewed: 'bg-amber-50 text-amber-600',
};

const LABELS: Record<string, string> = {
  generated: '已生成',
  previewed: '已预览',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[status] || 'bg-gray-100 text-gray-500'}`}>
      {LABELS[status] || status}
    </span>
  );
}
