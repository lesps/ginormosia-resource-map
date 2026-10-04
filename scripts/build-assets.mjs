import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
// Native size: the source is ~1000px, so upscaling would only add bytes.
const info = await sharp(`${root}assets/ginormosia-map.jpg`)
  .webp({ quality: 82, effort: 6 })
  .toFile(`${root}public/map.webp`);
console.log(`public/map.webp ${info.width}×${info.height} ${(info.size / 1024).toFixed(0)} KB`);
