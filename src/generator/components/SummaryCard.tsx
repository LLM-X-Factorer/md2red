import React from 'react';
import type { Theme } from '../themes/index.js';
import { CardShell } from './CardShell.js';

interface SummaryCardProps {
  theme: Theme;
  heading: string;
  points: string[];
  cta: string;
}

export function SummaryCard({ theme, heading, points, cta }: SummaryCardProps) {
  return (
    <CardShell theme={theme}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 52, fontWeight: 700, marginBottom: 60, color: theme.titleColor,
        }}>{heading}</div>
        <div style={{ textAlign: 'left', maxWidth: 800, marginBottom: 80 }}>
          {points.map((point, i) => (
            <div key={i} style={{
              fontSize: 34, lineHeight: 1.7, marginBottom: 28,
              paddingLeft: 40, position: 'relative',
            }}>
              <span style={{
                position: 'absolute', left: 0, color: theme.accentColor,
              }}>✦</span>
              {point}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 36, opacity: 0.7, marginTop: 20 }}>{cta}</div>
      </div>
    </CardShell>
  );
}
