import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const info = await sharp(`${root}assets/ginormosia-map.webp`)
  .resize(1600, 1600)
  .webp({ quality: 78, effort: 6 })
  .toFile(`${root}public/map-1600.webp`);
console.log(`public/map-1600.webp ${info.width}×${info.height} ${(info.size / 1024).toFixed(0)} KB`);
