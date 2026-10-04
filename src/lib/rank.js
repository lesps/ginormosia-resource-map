const LABELS = {
  1: 'R1', 2: 'R2', 3: 'R3', 4: 'R4', 5: 'R5', 6: 'R6',
  any: 'any rank', top: 'top rank', '3+': 'R3+', '-': 'rank n/a', '1 or 5': 'R1 or R5',
};
// Lower = available sooner. Disputed ranks sort by their lowest claim; unknown sorts last.
const ORDER = { any: 0, 1: 1, '1 or 5': 1, 2: 2, 3: 3, '3+': 3, 4: 4, 5: 5, 6: 6, top: 6.5, '-': 7 };

export const RANKS = Object.keys(LABELS);

export function formatRank(minRank) {
  if (!Object.hasOwn(LABELS, minRank)) throw new Error(`Unknown minRank "${minRank}"`);
  return LABELS[minRank];
}

export const rankOrder = (minRank) => ORDER[minRank] ?? 99;

export function rankTitle(minRank) {
  if (minRank === '-') return 'Spawns here, but the rank is not recorded';
  if (minRank === 'any') return 'Spawns at every Area Rank';
  if (minRank === 'top') return 'Top-rank event only';
  if (minRank === '1 or 5') return 'Sources disagree: Area Rank 1 or 5';
  return `First seen from Area Rank ${minRank.replace('+', '')}; higher tiers roll at random`;
}
