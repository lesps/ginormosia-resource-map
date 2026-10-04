import { h } from './dom.js';

export function detectEnv(win = window) {
  const nav = win.navigator;
  const standalone = win.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  return { standalone, ios };
}

export function setupInstall(container, { standalone, ios } = detectEnv()) {
  const offline = h('span', { class: 'offline', role: 'status', hidden: navigator.onLine !== false }, 'Offline');
  window.addEventListener('offline', () => { offline.hidden = false; });
  window.addEventListener('online', () => { offline.hidden = true; });
  container.append(offline);
  if (standalone) return;

  let deferred = null;
  const btn = h('button', { class: 'install', type: 'button', hidden: !ios }, 'Install app');
  container.append(btn);

  btn.addEventListener('click', async () => {
    if (deferred) {
      const e = deferred;
      deferred = null;
      e.prompt();
      const { outcome } = await e.userChoice;
      if (outcome === 'accepted') btn.hidden = true;
    } else if (ios) showIosHelp();
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; });
}

function showIosHelp() {
  document.querySelector('.ios-help')?.remove();
  const dlg = h('dialog', { class: 'ios-help', 'aria-labelledby': 'ios-help-title' },
    h('h2', { id: 'ios-help-title' }, 'Install on iPhone or iPad'),
    h('ol', {},
      h('li', {}, 'Tap the Share button (square with an arrow) in Safari.'),
      h('li', {}, 'Choose “Add to Home Screen”.'),
      h('li', {}, 'Tap Add. The map then opens full-screen and works offline.')),
    h('form', { method: 'dialog' }, h('button', { class: 'chip', type: 'submit' }, 'Got it')));
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
}
