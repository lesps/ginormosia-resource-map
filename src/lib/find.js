// Turns an entry's rank, location, tags and conditions into ordered "how to find" steps.
// Spawn rules come from the guide's mechanics notes (data.mechanics).
import { lowestRank } from './ranks.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const end = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);

// With your unlocked rank known, say what to do with the tower; otherwise describe the rank itself.
function yourRankStep(rank, region, entry, unlocked, tower) {
  const n = lowestRank(rank);
  if (entry.maxRank && unlocked > +entry.maxRank) return `Gone above R${entry.maxRank}: set ${tower} to R${entry.maxRank} or lower to find it.`;
  if (n > unlocked) return `Needs Area Rank ${n} here; you’ve unlocked R${unlocked}. Raise ${region.name} at ${tower}.`;
  if (rank === '1 or 5' && unlocked < 5) return `Sources disagree (R1 or R5). Try it at R${unlocked}; if it doesn’t show, it needs R5.`;
  if (n >= 2) return `You’ve unlocked R${unlocked} here, so set ${tower} to R${n} or higher.`;
  return null;
}

function rankStep(rank, region, entry, category, unlocked) {
  const tower = region.tower ?? 'the region’s tower';
  const yours = unlocked && rank !== '-' && yourRankStep(rank, region, entry, unlocked, tower);
  if (yours) return yours;
  if (/^\d$/.test(rank)) return rank === '1' ? 'Available from Area Rank 1, so no rank change is needed.' : `Raise ${region.name} to Area Rank ${rank} at ${tower}.`;
  if (rank === '3+') return `Set ${tower} to Area Rank 3 or higher.`;
  if (rank === 'any') return 'Spawns at every Area Rank.';
  if (rank === 'top') return 'Top-rank event only.';
  if (rank === '1 or 5') return `Sources disagree on the rank: try Area Rank 1, and if it doesn’t show, raise ${region.name} to Area Rank 5 at ${tower}.`;
  if (category === 'monsters' && entry.type === 'Common') return 'Its Area Rank isn’t recorded; most field monsters are around from Area Rank 1.';
  return 'Its Area Rank isn’t recorded, but it’s known to spawn here.';
}

function splitConditions(text = '') {
  let event = null;
  const extras = [];
  for (const raw of text.split(/;\s*/).map((s) => s.trim()).filter(Boolean)) {
    if (/^(gold-crown|night( only)?|day only|Lv\d+\+?|5-min respawn|gold-crown boss node)$/.test(raw)) continue;
    if (/^legendary challenge/.test(raw)) {
      const rest = raw.replace(/^legendary challenge\s*(\((random)\))?,?\s*/, '');
      if (rest && !/random, solo from Area Rank 3/.test(rest)) extras.push(rest);
      continue;
    }
    if (/^(also|or) /i.test(raw)) extras.push(raw);
    else if (!event && /challenge|event/.test(raw)) event = raw;
    else extras.push(raw);
  }
  return { event, extras };
}

function spawnStep(type, region, possessive, category, event) {
  switch (type) {
    case 'overworld':
      if (category === 'monsters') return `Roams the open field across ${region.name}; no specific spot.`;
      return category === 'fish' ? `Common catch at sea fishing spots along ${possessive} coast.` : `Common across ${region.name}; any regular spot will do.`;
    case 'tier-roll':
      return `Rolls on ${possessive} regular spots; there’s no dedicated spot, and a higher Area Rank raises the odds.`;
    case 'roaming':
      return `Roams the overworld in ${region.name}.`;
    case 'legendary-event':
      return `Appears somewhere in ${region.name} and is marked on the map while active.`;
    case 'area-challenge':
      return `Appears only during ${event ? `the ${challengeName(event)}` : 'the challenge'} and is marked on the map while active.`;
    case 'cave-or-fort':
      return 'Only found inside a cave or fort here.';
    case 'fixed-boss':
      return 'Fixed spawn point. The exact spot isn’t recorded, but it shows on the in-game map with a respawn timer once you’re nearby.';
    default:
      return `The exact spot isn’t recorded; look around ${category === 'fish' ? `${possessive} waters` : region.name}.`;
  }
}

const challengeName = (event) => event.replace(/^(an?|the) /, '');

export function howToFind(entry, region, category, { unlocked } = {}) {
  const tags = entry.tags ?? [];
  const { event, extras } = splitConditions(entry.conditions);
  const verb = category === 'fish' ? 'catch it' : category === 'monsters' ? 'defeat it' : 'gather it';
  const steps = [rankStep(entry.minRank, region, entry, category, unlocked)];

  const possessive = region.name.endsWith('s') ? `${region.name}’` : `${region.name}’s`;
  const named = entry.spawnType === 'area-challenge' && !entry.where && event && event !== 'event';
  if (entry.where) steps.push(end(entry.spawnType === 'cave-or-fort' ? `Only found inside ${entry.where}` : `Go to: ${entry.where}`));
  else steps.push(spawnStep(entry.spawnType, region, possessive, category, named && event));
  if (entry.shadow) steps.push(`Fish at ${entry.shadow} fish shadows.`);

  if (tags.includes('gold-crown')) steps.push(`Gold-crown: appears from Area Rank 5 and respawns 5 minutes after you ${verb}.`);
  if (tags.includes('silver-crown')) steps.push('Silver-crown: no cooldown. Change any tower’s Area Rank or use the Anywhere Gate to respawn it instantly.');
  if (tags.includes('legendary')) steps.push('Legendary challenge: appears at random once a tower is at Area Rank 3 or higher (solo), or when the multiplayer challenge gauge fills. Changing any tower’s rank rerolls it.');
  const alternative = extras.some((x) => /^(also|or) /i.test(x));
  const challengeSpawn = entry.spawnType === 'area-challenge' && !entry.where; // its spawn step already says so
  if (tags.includes('event') && !tags.includes('legendary') && !named && !challengeSpawn && (event || !alternative)) {
    steps.push(event && event !== 'event' ? `Only appears during the ${challengeName(event)}.` : 'Only appears during an event or area challenge.');
  }
  if (tags.includes('night')) steps.push('Go at night.');
  if (tags.includes('day')) steps.push('Go during the day.');
  if (entry.sleeps) steps.push(entry.sleeps === 'day' ? 'Sleeps during the day; it’s awake at night.' : 'Sleeps at night; it’s awake during the day.');
  if (entry.aggressive !== undefined) steps.push(entry.aggressive ? 'Attacks on sight.' : 'Won’t attack unless you strike first.');
  if (entry.maxRank && !(unlocked > +entry.maxRank)) steps.push(`Only up to Area Rank ${entry.maxRank}; it’s gone from Rank ${+entry.maxRank + 1}.`);
  if (tags.includes('mount')) steps.push('Can drop a mount.');
  if (tags.includes('cave') && (category === 'ore' || category === 'trees') && !/re-enter/.test(entry.where ?? '')) steps.push('Cave nodes respawn when you leave and re-enter the cave.');
  if ((category === 'ore' || category === 'trees') && /^(Great|Superior|Amazing) /.test(entry.name) && !tags.includes('gold-crown') && entry.spawnType !== 'tier-roll') {
    steps.push('Great, Superior and Amazing tiers roll at random on regular spots; a higher Area Rank raises the odds.');
  }
  const evenAtR1 = extras.findIndex((x) => /^Lv\d+\+? even at Rank 1$/.test(x));
  if (evenAtR1 >= 0) extras.splice(evenAtR1, 1);
  if (entry.level) steps.push(`Recommended level ${entry.level}+${evenAtR1 >= 0 ? ', even at Area Rank 1' : ''}.`);
  for (const x of extras) steps.push(end(cap(x)));
  return steps;
}
