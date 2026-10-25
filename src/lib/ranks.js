// Your unlocked Area Rank per region vs. an entry's rank. Unknown ranks ('-') count as likely available.
export const MAX_RANK = 7; // the Area Point table in data.mechanics goes up to Rank 7

const SPECIAL = { '3+': 3, '1 or 5': 1, any: 1, top: MAX_RANK, '-': null };

export function lowestRank(minRank) {
  if (/^[1-6]$/.test(minRank)) return +minRank;
  if (!Object.hasOwn(SPECIAL, minRank)) throw new Error(`Unknown minRank "${minRank}"`);
  return SPECIAL[minRank];
}

export function availability(entry, unlocked) {
  if (!unlocked) return 'unset';
  const n = lowestRank(entry.minRank);
  if (n == null) return 'likely';
  return n <= unlocked ? 'available' : 'locked';
}

export const isRank = (v) => Number.isInteger(v) && v >= 1 && v <= MAX_RANK;

export function sanitizeRanks(raw, regionIds) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([id, v]) => regionIds.includes(id) && isRank(v)));
}
