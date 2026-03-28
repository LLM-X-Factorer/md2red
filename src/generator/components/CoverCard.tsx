import React from 'react';
import type { Theme } from '../themes/index.js';
import { CardShell } from './CardShell.js';

interface CoverCardProps {
  theme: Theme;
  title: string;
  subtitle: string;
  tags?: string[];
}

export function CoverCard({ theme, title, subtitle, tags }: CoverCardProps) {
  return (
    <CardShell theme={theme} showDecorations>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        position: 'relative', zIndex: 1, textAlign: 'center',
        maxWidth: 900, margin: '0 auto',
      }}>
        <div style={{
          fontSize: 72, fontWeight: 800, lineHeight: 1.3,
          marginBottom: 40, color: theme.titleColor,
        }}>{title}</div>
        <div style={{
          fontSize: 36, fontWeight: 400, lineHeight: 1.6, opacity: 0.8,
        }}>{subtitle}</div>
        {tags && tags.length > 0 && (
          <div style={{ marginTop: 60 }}>
            {tags.map((t, i) => (
              <span key={i} style={{
                display: 'inline-block', margin: 8, padding: '12px 28px',
                borderRadius: 24, fontSize: 24,
                background: theme.accentColor, color: '#fff', opacity: 0.9,
              }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </CardShell>
  );
}
