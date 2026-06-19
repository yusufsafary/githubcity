export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  default: '#8b949e',
};

export const NIGHT_PALETTE = {
  skyBase: '#3B0855',
  skyGradient: '#852467',
  sunGlow: '#FD8083',
  neonPink: '#EE227D',
  slateTeal: '#498099',
  turquoise: '#30C0B7',
};

export function getLanguageColor(language: string | null): string {
  if (!language) return LANGUAGE_COLORS.default;
  return LANGUAGE_COLORS[language] ?? LANGUAGE_COLORS.default;
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getBuildingShape(repoName: string): 'box' | 'podium' | 'lshape' {
  const h = hashString(repoName) % 3;
  if (h === 0) return 'box';
  if (h === 1) return 'podium';
  return 'lshape';
}
