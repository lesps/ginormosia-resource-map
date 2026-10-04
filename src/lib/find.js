// Turns an entry's rank, location, tags and conditions into ordered "how to find" steps.
// Spawn rules come from the guide's mechanics notes (data.mechanics).
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const end = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);

function rankStep(rank, region) {
  const tower = region.tower ?? 'the region’s tower';
  if (/^\d$/.test(rank)) return rank === '1' ? 'Available from Area Rank 1, so no rank change is needed.' : `Raise ${region.name} to Area Rank ${rank} at ${tower}.`;
  if (rank === '3+') return `Set ${tower} to Area Rank 3 or higher.`;
  if (rank === 'any') return 'Spawns at every Area Rank.';
  if (rank === 'top') return 'Top-rank event only.';
  if (rank === '1 or 5') return `Sources disagree on the rank: try Area Rank 1, and if it doesn’t show, raise ${region.name} to Area Rank 5 at ${tower}.`;
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

export function howToFind(entry, region, category) {
  const tags = entry.tags ?? [];
  const { event, extras } = splitConditions(entry.conditions);
  const verb = category === 'fish' ? 'catch it' : category === 'boss' ? 'defeat it' : 'gather it';
  const steps = [rankStep(entry.minRank, region)];

  const possessive = region.name.endsWith('s') ? `${region.name}’` : `${region.name}’s`;
  steps.push(entry.where
    ? end(`Go to: ${entry.where}`)
    : `The exact spot isn’t recorded; look around ${category === 'fish' ? `${possessive} waters` : region.name}.`);

  if (tags.includes('gold-crown')) steps.push(`Gold-crown: appears from Area Rank 5 and respawns 5 minutes after you ${verb}.`);
  if (tags.includes('silver-crown')) steps.push('Silver-crown: no cooldown. Change any tower’s Area Rank or use the Anywhere Gate to respawn it instantly.');
  if (tags.includes('legendary')) steps.push('Legendary challenge: appears at random once a tower is at Area Rank 3 or higher (solo), or when the multiplayer challenge gauge fills. Changing any tower’s rank rerolls it.');
  const alternative = extras.some((x) => /^(also|or) /i.test(x));
  if (tags.includes('event') && !tags.includes('legendary') && (event || !alternative)) {
    steps.push(event && event !== 'event' ? `Only appears during the ${event.replace(/^(an?|the) /, '')}.` : 'Only appears during an event or area challenge.');
  }
  if (tags.includes('night')) steps.push('Go at night.');
  if (tags.includes('day')) steps.push('Go during the day.');
  if (tags.includes('cave') && (category === 'ore' || category === 'trees') && !/re-enter/.test(entry.where ?? '')) steps.push('Cave nodes respawn when you leave and re-enter the cave.');
  if ((category === 'ore' || category === 'trees') && /^(Great|Superior|Amazing) /.test(entry.name) && !tags.includes('gold-crown')) {
    steps.push('Great, Superior and Amazing tiers roll at random on regular spots; a higher Area Rank raises the odds.');
  }
  const evenAtR1 = extras.findIndex((x) => /^Lv\d+\+? even at Rank 1$/.test(x));
  if (evenAtR1 >= 0) extras.splice(evenAtR1, 1);
  if (entry.level) steps.push(`Recommended level ${entry.level}+${evenAtR1 >= 0 ? ', even at Area Rank 1' : ''}.`);
  for (const x of extras) steps.push(end(cap(x)));
  return steps;
}
