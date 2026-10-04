import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import data from '../data/regions.json';
import { mountApp } from './ui/app.js';
import { setupInstall } from './ui/install.js';
import { toast } from './ui/toast.js';

const { actions, applyHash } = mountApp(document.getElementById('app'), data, {
  imageSrc: `${import.meta.env.BASE_URL}map.webp`,
  hash: location.hash,
  onHash: (h) => history.replaceState(null, '', h || location.pathname + location.search),
});

window.addEventListener('hashchange', () => applyHash(location.hash));
setupInstall(actions);

registerSW({
  immediate: true,
  onOfflineReady: () => toast('Saved for offline use. The map now works without a connection.'),
});
