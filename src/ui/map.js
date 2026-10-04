import { h, reducedMotion, PIN_CATS } from './dom.js';
import { regionHasCategory, search } from '../lib/search.js';

export const ZOOMS = [1, 2, 3];

export function createMap(store, regions, { imageSrc, imageAlt }) {
  const pins = new Map();
  const inner = h('div', { class: 'map-inner' },
    h('img', { src: imageSrc, alt: imageAlt, width: 1600, height: 1600, decoding: 'async', draggable: 'false' }));

  for (const r of regions) {
    const select = () => store.set({ selectedId: r.id, fromResults: false });
    const pin = h('button', {
      class: 'pin', type: 'button', 'aria-label': r.name, 'aria-pressed': 'false',
      dataset: { id: r.id, edge: r.pin.x < 0.15 ? 'l' : r.pin.x > 0.85 ? 'r' : null },
      style: `left:${+(r.pin.x * 100).toFixed(3)}%;top:${+(r.pin.y * 100).toFixed(3)}%`,
      onclick: select,
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
      },
    },
      h('span', { class: 'head', 'aria-hidden': 'true' },
        h('span', { class: 'dots' }, PIN_CATS.filter((c) => r[c].length).map((c) => h('span', { class: 'dot', dataset: { cat: c } })))),
      h('span', { class: 'count', 'aria-hidden': 'true' }),
      h('span', { class: 'label', 'aria-hidden': 'true' }, r.name),
    );
    pins.set(r.id, pin);
    inner.append(pin);
  }

  const scroller = h('div', { class: 'map-scroll', tabindex: '-1' }, inner);
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
    const active = !!(s.query.trim() || s.type);
    const counts = new Map();
    for (const m of search(regions, s.query, s.category, s.type)) counts.set(m.regionId, (counts.get(m.regionId) ?? 0) + 1);
    for (const r of regions) {
      const pin = pins.get(r.id);
      const hit = counts.has(r.id);
      const dim = active ? !hit : !regionHasCategory(r, s.category);
      pin.classList.toggle('hit', hit);
      pin.classList.toggle('dim', dim && r.id !== s.selectedId);
      pin.classList.toggle('sel', r.id === s.selectedId);
      pin.setAttribute('aria-pressed', String(r.id === s.selectedId));
      pin.querySelector('.count').textContent = hit ? String(counts.get(r.id)) : '';
      const n = counts.get(r.id);
      if (hit) pin.setAttribute('aria-description', `${n} match${n === 1 ? '' : 'es'}`);
      else pin.removeAttribute('aria-description');
    }
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
