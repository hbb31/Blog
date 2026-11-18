// One-off helper that generated the placeholder images in src/assets/images.
// Replace those images with your own; this script is only kept for reference.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const svg = (w, h, a, b, label) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${w * 0.78}" cy="${h * 0.3}" r="${h * 0.22}" fill="#fff" fill-opacity="0.12"/>
  <rect x="${w * 0.08}" y="${h * 0.62}" width="${w * 0.5}" height="${h * 0.05}" rx="${h * 0.02}" fill="#fff" fill-opacity="0.18"/>
  <text x="${w * 0.08}" y="${h * 0.55}" font-family="sans-serif" font-size="${h * 0.07}" fill="#fff" fill-opacity="0.85">${label}</text>
</svg>`;

const images = [
  [
    'src/assets/images/posts/the-quiet-case-for-boring-technology/coverImage.jpg',
    1600,
    900,
    '#3d5a5b',
    '#9db4a8',
    'PLACEHOLDER cover',
  ],
  [
    'src/assets/images/posts/deep-work-without-the-hustle/coverImage.jpg',
    1600,
    900,
    '#6b4f3a',
    '#c9a68a',
    'PLACEHOLDER cover',
  ],
  ['src/assets/images/posts/a-slower-kitchen/coverImage.jpg', 1600, 900, '#5b5340', '#b7ab86', 'PLACEHOLDER cover'],
  [
    'src/assets/images/posts/notes-on-writing-every-day/coverImage.jpg',
    1600,
    900,
    '#40465b',
    '#9aa3c0',
    'PLACEHOLDER cover',
  ],
  [
    'src/assets/images/posts/the-quiet-case-for-boring-technology/diagram.jpg',
    1400,
    700,
    '#2f3e46',
    '#84a98c',
    'PLACEHOLDER figure',
  ],
  ['src/assets/images/author/photo.jpg', 600, 600, '#7a6a58', '#d6c6ad', 'PLACEHOLDER'],
  ['src/assets/images/site/defaultOgImage.jpg', 1200, 630, '#33413e', '#a3b5a6', 'PLACEHOLDER site image'],
];

for (const [file, w, h, a, b, label] of images) {
  mkdirSync(dirname(file), { recursive: true });
  await sharp(Buffer.from(svg(w, h, a, b, label)))
    .jpeg({ quality: 82 })
    .toFile(file);
  console.log('wrote', file);
}
