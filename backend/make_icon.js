const sharp = require('sharp');
const fs = require('fs');

async function createIcon() {
  const emblemPath = '../frontend/public/emblem-transparent.png';
  const outPath = '../frontend/public/icon-with-text.png';
  
  // The emblem is let's say a certain size. Let's make a 1024x1024 canvas.
  // The emblem will be in the center, and the text below it.
  
  const emblemBuffer = fs.readFileSync(emblemPath);
  
  // Resize emblem to 600x600 so it has room for text
  const resizedEmblem = await sharp(emblemBuffer)
    .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const svgText = `
    <svg width="1024" height="1024">
      <text x="512" y="850" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="90" fill="white">MetroLens</text>
      <text x="512" y="930" text-anchor="middle" font-family="sans-serif" font-weight="500" font-size="40" fill="rgba(255, 255, 255, 0.7)" letter-spacing="0.1em">LEGAL METROLOGY</text>
    </svg>
  `;

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 30, g: 58, b: 138, alpha: 1 } // #1E3A8A Navy Blue
    }
  })
  .composite([
    { input: resizedEmblem, top: 100, left: 212 },
    { input: Buffer.from(svgText), top: 0, left: 0 }
  ])
  .png()
  .toFile(outPath);
  
  console.log("Icon created at", outPath);
}

createIcon().catch(console.error);
