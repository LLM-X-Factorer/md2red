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
    <div className="flex h-screen bg-gray-950 text-gray-200">
      <nav className="w-56 border-r border-gray-800 flex flex-col p-4 gap-1">
        <h1 className="text-lg font-bold mb-6 px-3">md2red</h1>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-gray-800/50 text-gray-400'
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
