export const theme = {
  colors: {
    primary: '#FF5E2B',
    secondary: '#1E1E1E',
    accent: '#3BA9FF',
    success: '#2ECC71',
    error: '#E74C3C',
    textLight: '#FFFFFF',
    textDark: '#0D0D0D',
  },
  radii: { sm: 4, md: 8, lg: 12 },
  spacing: { sm: 8, md: 16, lg: 24 },
  transition: 'all 0.3s ease-in-out',
  font: {
    display: "'Orbitron', sans-serif",
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
} as const;

export type Theme = typeof theme;
