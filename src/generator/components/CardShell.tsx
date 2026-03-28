import React from 'react';
import type { Theme } from '../themes/index.js';

interface CardShellProps {
  theme: Theme;
  children: React.ReactNode;
  showDecorations?: boolean;
  pageNum?: string;
}

export function CardShell({ theme, children, showDecorations, pageNum }: CardShellProps) {
  return (
    <div style={{
      width: 1080, height: 1440,
      fontFamily: "'Noto Sans SC', 'PingFang SC', 'Helvetica Neue', sans-serif",
      background: theme.backgroundColor,
      color: theme.textColor,
      display: 'flex', flexDirection: 'column',
      padding: '80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {showDecorations && (
        <>
          <div style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: theme.accentColor, opacity: 0.1, top: -100, right: -100,
          }} />
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: theme.accentColor, opacity: 0.1, bottom: -150, left: -100,
          }} />
        </>
      )}
      {pageNum && (
        <div style={{
          position: 'absolute', top: 40, right: 60, fontSize: 22, opacity: 0.3,
        }}>{pageNum}</div>
      )}
      {children}
      <div style={{
        position: 'absolute', bottom: 40, right: 60, fontSize: 20, opacity: 0.3,
      }}>AI 辅助生成</div>
    </div>
  );
}
