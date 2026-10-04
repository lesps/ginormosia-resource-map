import { h } from './dom.js';

export function toast(message, ms = 4500) {
  const el = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}
