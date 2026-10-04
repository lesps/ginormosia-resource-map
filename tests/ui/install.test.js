// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupInstall } from '../../src/ui/install.js';

let box;
beforeEach(() => {
  document.body.innerHTML = '<div id="a"></div>';
  box = document.getElementById('a');
});

const env = (o = {}) => ({ standalone: false, ios: false, ...o });

describe('install button', () => {
  it('stays hidden until the browser offers an install prompt', () => {
    setupInstall(box, env());
    expect(box.querySelector('.install').hidden).toBe(true);
  });

  it('prompts with the deferred event when tapped', async () => {
    setupInstall(box, env());
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = vi.fn();
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    const btn = box.querySelector('.install');
    expect(btn.hidden).toBe(false);
    btn.click();
    expect(e.prompt).toHaveBeenCalled();
    await e.userChoice;
    await Promise.resolve();
    expect(btn.hidden).toBe(true);
  });

  it('shows Add to Home Screen steps on iOS', () => {
    setupInstall(box, env({ ios: true }));
    const btn = box.querySelector('.install');
    expect(btn.hidden).toBe(false);
    btn.click();
    expect(document.querySelector('.ios-help').textContent).toMatch(/Add to Home Screen/);
  });

  it('does nothing when already installed', () => {
    setupInstall(box, env({ standalone: true, ios: true }));
    expect(box.querySelector('.install')).toBeNull();
  });
});

describe('offline badge', () => {
  it('reflects connectivity events', () => {
    setupInstall(box, env());
    const badge = box.querySelector('.offline');
    window.dispatchEvent(new Event('offline'));
    expect(badge.hidden).toBe(false);
    window.dispatchEvent(new Event('online'));
    expect(badge.hidden).toBe(true);
  });
});
