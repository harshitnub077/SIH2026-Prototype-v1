const sharp = require('sharp');

async function createIcons() {
  try {
    // 1. Create a 512x512 Navy Blue background
    const bg512 = sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 30, g: 58, b: 138, alpha: 1 } // #1E3A8A
      }
    });

    // 2. Load the transparent emblem and resize it to fit well within 512x512 (e.g., 400x400)
    const emblemBuffer = await sharp('frontend/public/emblem-transparent.png')
      .resize(400, 400, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} })
      .toBuffer();

    // 3. Composite the emblem over the background
    await bg512.composite([{ input: emblemBuffer }])
      .png()
      .toFile('frontend/public/icon-512.png');

    console.log("512x512 Icon created");

    // 4. Create 192x192 version
    await sharp('frontend/public/icon-512.png')
      .resize(192, 192)
      .toFile('frontend/public/icon-192.png');

    console.log("192x192 Icon created");
  } catch(e) {
    console.error(e);
  }
}
createIcons();
