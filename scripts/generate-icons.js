import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generate() {
  const iconSvgPath = path.resolve('public', 'icon.svg');
  const maskableSvgPath = path.resolve('public', 'icon-maskable.svg');
  const publicDir = path.resolve('public');

  console.log('Generating PWA and Apple/Android icons...');

  // 1. Apple Touch Icon: 180x180 PNG
  await sharp(iconSvgPath)
    .resize(180, 180)
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png (180x180)');

  // 2. Standard PWA 192x192 PNG
  await sharp(iconSvgPath)
    .resize(192, 192)
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Generated pwa-192x192.png (192x192)');

  // 3. Standard PWA 512x512 PNG
  await sharp(iconSvgPath)
    .resize(512, 512)
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Generated pwa-512x512.png (512x512)');

  // 4. Maskable PWA 512x512 PNG (for Android adaptive icons)
  await sharp(maskableSvgPath)
    .resize(512, 512)
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Generated pwa-maskable-512x512.png (512x512 maskable)');

  // 5. Favicon 32x32 PNG and favicon.ico
  await sharp(iconSvgPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ Generated favicon-32x32.png');

  // Also copy to favicon.ico (most browsers accept PNG-encoded favicon.ico or standard favicon.png)
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));
  console.log('✓ Created favicon.ico');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
