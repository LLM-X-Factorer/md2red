import { darkTheme } from './dark.js';
import { lightTheme } from './light.js';

export interface Theme {
  backgroundColor: string;
  textColor: string;
  titleColor: string;
  accentColor: string;
}

const themes: Record<string, Theme> = { dark: darkTheme, light: lightTheme };

export function getTheme(name: string): Theme {
  return themes[name] || darkTheme;
}
