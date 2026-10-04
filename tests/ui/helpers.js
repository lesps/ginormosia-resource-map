import raw from '../../data/regions.json';
import { mountApp } from '../../src/ui/app.js';

let current;

export function mount(data = structuredClone(raw), opts = {}) {
  current?.destroy();
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById('app');
  const app = (current = mountApp(root, data, { imageSrc: 'map.webp', ...opts }));
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const pin = (name) => $$('.pin').find((p) => p.getAttribute('aria-label') === name);
  const panel = () => $('#panel');
  const chip = (label) => $$('.chip').find((c) => c.textContent.trim().startsWith(label));
  const type = (label) => $$('.type-chip').find((c) => c.dataset.type === label);
  const typeQuery = (value) => {
    const q = $('#q');
    q.value = value;
    q.dispatchEvent(new Event('input', { bubbles: true }));
  };
  return { root, app, $, $$, pin, panel, chip, type, typeQuery };
}
