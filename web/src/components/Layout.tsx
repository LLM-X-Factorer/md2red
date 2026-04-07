import React from 'react';
import { NavLink } from 'react-router';

const NAV = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/upload', label: '上传生成', icon: '📄' },
  { to: '/history', label: '生成历史', icon: '📋' },
  { to: '/settings', label: '设置', icon: '⚙️' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <nav className="w-56 bg-white border-r border-gray-200 flex flex-col p-4 gap-1">
        <h1 className="text-lg font-bold mb-6 px-3 text-indigo-600">md2red</h1>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'hover:bg-gray-100 text-gray-600'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
