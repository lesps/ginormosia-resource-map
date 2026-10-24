import { h, reducedMotion, PIN_CATS } from './dom.js';
import { regionHasCategory, search, searchPlaces } from '../lib/search.js';
import { availability } from '../lib/ranks.js';

export const ZOOMS = [1, 2, 3];

export function createMap(store, regions, { imageSrc, imageAlt, width, height }) {
  const pins = new Map();
  const inner = h('div', { class: 'map-inner' },
    h('img', { src: imageSrc, alt: imageAlt, width, height, decoding: 'async', draggable: 'false' }));

  for (const r of regions) {
    const select = () => {
      const s = store.get();
      if (s.selectedId !== r.id || s.mine) store.set({ selectedId: r.id, fromResults: false, openKey: null, mine: false });
    };
    const pin = h('button', {
      class: 'pin', type: 'button', 'aria-label': r.name, 'aria-pressed': 'false', dataset: { id: r.id },
      style: `left:${+(r.pin.x * 100).toFixed(3)}%;top:${+(r.pin.y * 100).toFixed(3)}%`,
      onclick: select,
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
      },
    },
      h('span', { class: 'head', 'aria-hidden': 'true' },
        h('span', { class: 'dots' }, PIN_CATS.filter((c) => r[c].length).map((c) => h('span', { class: 'dot', dataset: { cat: c } })))),
      h('span', { class: 'count', 'aria-hidden': 'true' }),
    );
    pins.set(r.id, pin);
    inner.append(pin);
  }

  const scroller = h('div', { class: 'map-scroll', tabindex: '-1', style: `aspect-ratio: ${width} / ${height}` }, inner);
  const zoomBtns = ZOOMS.map((z) => h('button', { type: 'button', onclick: () => store.set({ zoom: z }) }, `${z}×`));
  const el = h('section', { class: 'mapcard', 'aria-label': 'Map' },
    h('div', { class: 'mapbar' },
      h('div', { class: 'zoom', role: 'group', 'aria-label': 'Zoom' }, zoomBtns),
      h('p', { class: 'legend' },
        h('span', { class: 'lg' }, h('span', { class: 'swatch hit' }), 'match'),
        h('span', { class: 'lg' }, h('span', { class: 'swatch sel' }), 'selected'))),
    scroller);

  function centerOn(fx, fy, smooth) {
    const left = fx * inner.offsetWidth - scroller.clientWidth / 2;
    const top = fy * inner.offsetHeight - scroller.clientHeight / 2;
    scroller.scrollTo?.({ left, top, behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });
  }

  function render(s, prev) {
    const active = !!(s.query.trim() || s.type || s.tag);
    const counts = new Map();
    const above = new Map(); // matches that need a higher rank than yours
    const places = new Set(searchPlaces(regions, s.query).map((p) => p.regionId));
    for (const m of search(regions, { query: s.query, category: s.category, type: s.type, tag: s.tag })) {
      counts.set(m.regionId, (counts.get(m.regionId) ?? 0) + 1);
      if (availability(m.entry, s.ranks?.[m.regionId]) === 'locked') above.set(m.regionId, (above.get(m.regionId) ?? 0) + 1);
    }
    for (const r of regions) {
      const pin = pins.get(r.id);
      const hit = counts.has(r.id) || places.has(r.id);
      const dim = active ? !hit : !regionHasCategory(r, { category: s.category });
      const n = counts.get(r.id) ?? 0;
      const locked = n > 0 && above.get(r.id) === n;
      pin.classList.toggle('hit', hit);
      pin.classList.toggle('locked', locked);
      pin.classList.toggle('dim', dim && r.id !== s.selectedId);
      pin.classList.toggle('sel', r.id === s.selectedId);
      pin.setAttribute('aria-pressed', String(r.id === s.selectedId));
      pin.querySelector('.count').textContent = !hit ? '' : n ? `${locked ? '🔒' : ''}${n}` : '•';
      if (hit) pin.setAttribute('aria-description', n ? `${n} match${n === 1 ? '' : 'es'}${locked ? ', all need a higher rank' : ''}` : 'Matches a place here');
      else pin.removeAttribute('aria-description');
    }
    inner.dataset.zoom = String(s.zoom);
    zoomBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(ZOOMS[i] === s.zoom)));

    if (prev && prev.zoom !== s.zoom) {
      const fx = (scroller.scrollLeft + scroller.clientWidth / 2) / (inner.offsetWidth || 1);
      const fy = (scroller.scrollTop + scroller.clientHeight / 2) / (inner.offsetHeight || 1);
      inner.style.width = `${s.zoom * 100}%`;
      const r = regions.find((x) => x.id === s.selectedId);
      r ? centerOn(r.pin.x, r.pin.y, false) : centerOn(fx || 0.5, fy || 0.5, false);
    } else inner.style.width = `${s.zoom * 100}%`;

    if (s.selectedId && s.selectedId !== prev?.selectedId && s.zoom > 1) {
      const r = regions.find((x) => x.id === s.selectedId);
      centerOn(r.pin.x, r.pin.y, true);
    }
  }

  return { el, pins, render };
}
