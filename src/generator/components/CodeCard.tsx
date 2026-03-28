import React from 'react';
import type { Theme } from '../themes/index.js';
import { CardShell } from './CardShell.js';

interface CodeCardProps {
  theme: Theme;
  heading: string;
  description: string;
  language: string;
  codeHtml: string;
  pageNum: string;
}

export function CodeCard({ theme, heading, description, language, codeHtml, pageNum }: CodeCardProps) {
  return (
    <CardShell theme={theme} pageNum={pageNum}>
      <div style={{
        fontSize: 44, fontWeight: 700, marginBottom: 36, color: theme.titleColor,
      }}>{heading}</div>
      {description && (
        <div style={{
          fontSize: 30, lineHeight: 1.6, marginBottom: 36, opacity: 0.85,
        }}>{description}</div>
      )}
      <div style={{
        borderRadius: 16, flex: 1, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 16, right: 24, fontSize: 20,
          color: '#888', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          zIndex: 1,
        }}>{language}</div>
        <div
          style={{ height: '100%' }}
          dangerouslySetInnerHTML={{
            __html: codeHtml.replace(
              '<pre',
              '<pre style="padding:40px!important;border-radius:16px!important;font-size:24px!important;line-height:1.6!important;height:100%!important;overflow:hidden!important;font-family:\'JetBrains Mono\',\'Fira Code\',\'SF Mono\',monospace!important"',
            ),
          }}
        />
      </div>
    </CardShell>
  );
}
