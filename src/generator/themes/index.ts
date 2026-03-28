import { darkTheme } from './dark.js';
import { lightTheme } from './light.js';

export type Theme = Record<string, string>;

const themes: Record<string, Theme> = { dark: darkTheme, light: lightTheme };

export function getTheme(name: string): Theme {
  return themes[name] || darkTheme;
}
