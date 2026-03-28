import React from 'react';
import type { Theme } from '../themes/index.js';
import { CardShell } from './CardShell.js';

interface ContentCardProps {
  theme: Theme;
  heading: string;
  bodyHtml: string;
  pageNum: string;
}

export function ContentCard({ theme, heading, bodyHtml, pageNum }: ContentCardProps) {
  return (
    <CardShell theme={theme} pageNum={pageNum}>
      {heading && (
        <div style={{
          fontSize: 48, fontWeight: 700, marginBottom: 44, lineHeight: 1.3,
          color: theme.titleColor,
          borderLeft: `6px solid ${theme.accentColor}`,
          paddingLeft: 24,
        }}>{heading}</div>
      )}
      <div
        style={{
          fontSize: 32, lineHeight: 1.9, flex: 1, overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </CardShell>
  );
}
